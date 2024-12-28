import * as xml2js from "xml2js";
import * as fs from "fs";

const xmlData = fs.readFileSync(
  "./xml/Never Dreamed You_d Leave In Summer.musicxml",
  "utf-8"
);

interface Root {
  "root-step": string[];
  "root-alter"?: string[];
}

interface Bass {
  "bass-step": string[];
  "bass-alter"?: string[];
}

interface Degree {
  "degree-value": string[];
  "degree-alter"?: string[];
  "degree-type": string[];
}

interface Kind {
  $: { text?: string };
  _?: string;
}

interface Harmony {
  root: Root[];
  kind: Kind;
  degree?: Degree[];
  bass?: Bass[];
}

interface Measure {
  note?: any[];
  harmony?: Harmony[];
  attributes?: any[];
  barline?: any[];
}

interface ParsedXml {
  "score-partwise": {
    work: { "work-title": string[] }[];
    identification: { creator: { $: { type: string }; _: string }[] }[];
    part: { measure: Measure[] }[];
  };
}

interface ChordChange {
  chord_name: string;
  start_time: number;
  duration: number;
}

interface MusicData {
  title: string;
  key: string;
  change: ChordChange[];
  length: number;
}

function parseXML(xmlData: string): Promise<ParsedXml> {
  return new Promise((resolve, reject) => {
    xml2js.parseString(xmlData, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

function getChordRoot(root: Root): string {
  const step = root["root-step"][0];
  const alter = root["root-alter"] ? parseInt(root["root-alter"][0]) : 0;

  if (alter === 0) return step;
  if (alter === 1) return step + "#";
  if (alter === -1) return step + "b";
  return step + (alter > 0 ? "#".repeat(alter) : "b".repeat(-alter));
}

function getChordKind(kind: Kind, degrees?: Degree[]): string {
  let kindText = "";

  if (kind && typeof kind === "object") {
    if (
      "$" in kind &&
      kind.$ &&
      typeof kind.$ === "object" &&
      "text" in kind.$
    ) {
      kindText = kind.$.text || "";
    } else if ("_" in kind && typeof kind._ === "string") {
      kindText = kind._;
    }
  }

  switch (kindText) {
    case "major":
      kindText = "";
      break;
    case "minor":
      kindText = "m";
      break;
    case "augmented":
      kindText = "aug";
      break;
    case "diminished":
      kindText = "dim";
      break;
    case "dominant":
      kindText = "7";
      break;
    case "half-diminished":
      kindText = "m7b5";
      break;
    case "major-seventh":
      kindText = "maj7";
      break;
    case "minor-seventh":
      kindText = "m7";
      break;
    case "diminished-seventh":
      kindText = "dim7";
      break;
    case "augmented-seventh":
      kindText = "aug7";
      break;
    case "suspended-fourth":
      kindText = "sus4";
      break;
    case "suspended-second":
      kindText = "sus2";
      break;
  }

  if (degrees) {
    degrees.forEach((degree) => {
      const value = degree["degree-value"][0];
      const alter = degree["degree-alter"]
        ? parseInt(degree["degree-alter"][0])
        : 0;
      const type = degree["degree-type"][0];

      let alterSymbol = "";
      if (alter === -1) {
        alterSymbol = "b";
      } else if (alter === 1) {
        alterSymbol = "#";
      } else if (alter < -1) {
        alterSymbol = "b".repeat(-alter);
      } else if (alter > 1) {
        alterSymbol = "#".repeat(alter);
      }

      if (type === "add") {
        kindText += `(${alterSymbol}${value})`;
      } else if (type === "alter") {
        if (value === "5" && alter === -1) {
          kindText = kindText.replace("7", "7(b5)");
        } else {
          kindText += `(${alterSymbol}${value})`;
        }
      } else if (type === "subtract") {
        kindText += `(no${value})`;
      }
    });
  }

  return kindText;
}

function getBassNote(bass: Bass): string | null {
  if (!bass) return null;
  const step = bass["bass-step"][0];
  const alter = bass["bass-alter"] ? parseInt(bass["bass-alter"][0]) : 0;

  if (alter === 0) return step;
  if (alter === 1) return step + "#";
  if (alter === -1) return step + "b";
  return step + (alter > 0 ? "#".repeat(alter) : "b".repeat(-alter));
}

function getFullChordName(
  root: string,
  kind: string,
  bass: string | null
): string {
  let chordName = `${root}${kind}`;
  if (bass) {
    chordName += `/${bass}`;
  }
  return chordName;
}

function extractMusicData(parsedXml: ParsedXml): MusicData[] {
  const score = parsedXml["score-partwise"];
  const measures = score.part[0].measure;
  const divisions = parseInt(
    measures[0]?.attributes?.[0]?.divisions?.[0] ?? "768"
  );

  const workTitle = score.work?.[0]?.["work-title"]?.[0] ?? "Unknown Work";
  const composer =
    score.identification?.[0]?.creator?.find((c) => c.$.type === "composer")
      ?._ ?? "Unknown Composer";
  const baseTitle = `${workTitle} | ${composer}`;

  // キー情報の取得
  let key = "C";
  if (measures[0]?.attributes?.[0]?.key) {
    const fifths = parseInt(measures[0].attributes[0].key[0].fifths[0]);
    const mode = measures[0].attributes[0].key[0].mode?.[0] ?? "major";
    key = getKeyFromFifths(fifths, mode);
  }

  let currentTime = 0;
  let parts: MusicData[] = [];
  let currentPart: MusicData = {
    title: `${baseTitle} | Part 1`,
    key: key,
    change: [],
    length: 0,
  };

  measures.forEach((measure, measureIndex) => {
    const measureDuration = getMeasureDuration(measure, divisions);

    if (measure.barline) {
      const barline = measure.barline[0];
      if (
        barline.$ &&
        barline.$.location === "left" &&
        barline["bar-style"] &&
        barline["bar-style"][0] === "light-light"
      ) {
        if (currentPart.change.length > 0) {
          currentPart.length = currentTime;
          parts.push(currentPart);
        }
        currentPart = {
          title: `${baseTitle} | Part ${parts.length + 1}`,
          key: key,
          change: [],
          length: 0,
        };
        currentTime = 0;
      }
    }

    if (measure.harmony) {
      measure.harmony.forEach((harmony) => {
        const root = getChordRoot(harmony.root[0]);
        const kind = getChordKind(harmony.kind, harmony.degree);
        const bass = harmony.bass ? getBassNote(harmony.bass[0]) : null;
        const fullChordName = getFullChordName(root, kind, bass);

        const duration = getHarmonyDuration(harmony, measure, divisions);

        currentPart.change.push({
          chord_name: fullChordName,
          start_time: currentTime,
          duration: duration,
        });

        currentTime += duration;
      });
    } else {
      currentTime += measureDuration;
    }

    currentPart.length = currentTime;
  });

  if (currentPart.change.length > 0) {
    parts.push(currentPart);
  }

  return parts;
}

function getMeasureDuration(measure: Measure, divisions: number): number {
  if (measure.note) {
    return measure.note.reduce((total, note) => {
      return total + parseInt(note.duration[0]) / divisions;
    }, 0);
  }
  return 4;
}

function getHarmonyDuration(
  harmony: Harmony,
  measure: Measure,
  divisions: number
): number {
  if (measure.note) {
    const harmonyIndex = measure.harmony!.indexOf(harmony);
    const correspondingNote = measure.note[harmonyIndex];

    if (correspondingNote && correspondingNote.duration) {
      return parseInt(correspondingNote.duration[0]) / divisions;
    }
  }
  return 4;
}

function getKeyFromFifths(fifths: number, mode: string): string {
  const sharpKeys = ["C", "G", "D", "A", "E", "B", "F#", "C#"];
  const flatKeys = ["C", "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb"];

  let key =
    fifths >= 0 ? sharpKeys[fifths % 7] : flatKeys[Math.abs(fifths) % 7];

  if (mode === "minor") {
    key += "m";
  }

  return key;
}

async function main() {
  try {
    const parsedXml = await parseXML(xmlData);
    const newMusicData = extractMusicData(parsedXml);

    let chordList: MusicData[] = [];
    const chordListPath = "chordList2.json";

    if (fs.existsSync(chordListPath)) {
      const existingData = fs.readFileSync(chordListPath, "utf-8");
      chordList = JSON.parse(existingData);
    }

    chordList = [...chordList, ...newMusicData];

    fs.writeFileSync(chordListPath, JSON.stringify(chordList, null, 2));
    console.log("chordList2.json has been updated successfully.");
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
