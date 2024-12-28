import { AbletonLive, Note as AbletonNote } from "ableton-live";
import { Chord, Note, Scale, Key } from "tonal";
import WebSocket from "ws";
import fs from "fs";

if (process) {
  (global as any).WebSocket = WebSocket;
}

interface ChordChange {
  chord_name: string;
  start_time: number;
  duration: number;
}

interface ChordPart {
  title: string;
  change: ChordChange[];
  length: number;
  key: string;
}

interface ChordInfo {
  clip_name: string;
  ableton_notelist: AbletonNote[];
  length: number;
}

let chordList: ChordPart[] = JSON.parse(
  fs.readFileSync("chordList2.json", "utf-8")
);

function analyzeKeyAndChords(chords: any, baseKey: string) {
  const isMinor = baseKey.endsWith("m");
  const processedBaseKey = isMinor ? baseKey.slice(0, -1) : baseKey;

  let minorKey: Key.MinorKey, majorKey: Key.MajorKey;

  if (isMinor) {
    minorKey = Key.minorKey(processedBaseKey);
    majorKey = Key.majorKey(minorKey.relativeMajor);
  } else {
    majorKey = Key.majorKey(processedBaseKey);
    minorKey = Key.minorKey(majorKey.minorRelative);
  }

  const combinedKey = { minorKey, majorKey };
  const chordNames = chords.change.map((c: any) => c.chord_name.split("/")[0]);

  let naturalMinorScore = 0;
  let harmonicMinorScore = 0;
  let melodicMinorScore = 0;
  let majorScore = 0;

  const countChords = (scale: string[], chords: string[]) => {
    return chords.filter((chord) => scale.includes(chord)).length;
  };

  const countNotesInChords = (scale: string[], chords: string[]) => {
    return chords.filter((chord) => scale.some((note) => chord.includes(note)))
      .length;
  };

  majorScore += countChords(
    combinedKey.majorKey.triads as string[],
    chordNames
  );
  majorScore += countNotesInChords(
    combinedKey.majorKey.scale as string[],
    chordNames
  );

  naturalMinorScore += countChords(
    combinedKey.minorKey.natural.triads as string[],
    chordNames
  );
  naturalMinorScore += countNotesInChords(
    combinedKey.minorKey.natural.scale as string[],
    chordNames
  );

  harmonicMinorScore += countChords(
    combinedKey.minorKey.harmonic.triads as string[],
    chordNames
  );
  harmonicMinorScore += countNotesInChords(
    combinedKey.minorKey.harmonic.scale as string[],
    chordNames
  );
  harmonicMinorScore +=
    chordNames.filter(
      (chord: string) => chord === combinedKey.minorKey.harmonic.triads[4]
    ).length * 2; // V度（メジャー）に重み付け

  melodicMinorScore += countChords(
    combinedKey.minorKey.melodic.triads as string[],
    chordNames
  );
  melodicMinorScore += countNotesInChords(
    combinedKey.minorKey.melodic.scale as string[],
    chordNames
  );
  melodicMinorScore +=
    chordNames.filter((chord: string) =>
      [
        combinedKey.minorKey.melodic.triads[3],
        combinedKey.minorKey.melodic.triads[5],
      ].includes(chord)
    ).length * 2; // IV度とVI度（メジャー）に重み付け

  const scores = [
    { type: "Major", score: majorScore },
    { type: "Natural Minor", score: naturalMinorScore },
    { type: "Harmonic Minor", score: harmonicMinorScore },
    { type: "Melodic Minor", score: melodicMinorScore },
  ];

  scores.sort((a, b) => b.score - a.score);

  let primaryType = scores[0].type;
  let secondaryType = scores[1].type;

  if (
    (isMinor && primaryType === "Major") ||
    (!isMinor && primaryType !== "Major")
  ) {
    console.warn(
      `警告: 指定されたキータイプ (${
        isMinor ? "Minor" : "Major"
      }) と分析結果 (${primaryType}) が一致しません。`
    );
  }

  return {
    primaryType,
    secondaryType,
    scores,
    isConsistentWithSpecifiedKey:
      (isMinor && primaryType !== "Major") ||
      (!isMinor && primaryType === "Major"),
  };
}

function determineChordScales(
  chords: ChordChange[],
  analyzedKey: ReturnType<typeof analyzeKeyAndChords>,
  baseKey: string
) {
  const isMinor = baseKey.endsWith("m");
  const rootKey = isMinor ? baseKey.slice(0, -1) : baseKey;

  let primaryScale: string[];
  switch (analyzedKey.primaryType) {
    case "Major":
      primaryScale = Scale.get(`${rootKey} major`).notes;
      break;
    case "Natural Minor":
      primaryScale = Scale.get(`${rootKey} minor`).notes;
      break;
    case "Harmonic Minor":
      primaryScale = Scale.get(`${rootKey} harmonic minor`).notes;
      break;
    case "Melodic Minor":
      primaryScale = Scale.get(`${rootKey} melodic minor`).notes;
      break;
    default:
      primaryScale = Scale.get(`${rootKey} major`).notes;
  }

  const diatonicChords = Key.majorKey(rootKey).chords;

  return chords.map((chord) => {
    const [chordRoot] = Chord.tokenize(chord.chord_name);
    const chordType = Chord.get(chord.chord_name).type;

    if (diatonicChords.includes(chord.chord_name)) {
      // ダイアトニックコードの場合
      return {
        ...chord,
        suggestedScale: primaryScale.join(" "),
      };
    } else {
      // 非ダイアトニックコードの場合
      switch (chordType) {
        case "major":
          return {
            ...chord,
            suggestedScale: Scale.get(`${chordRoot} lydian`).notes.join(" "),
          };
        case "minor":
          return {
            ...chord,
            suggestedScale: Scale.get(`${chordRoot} dorian`).notes.join(" "),
          };
        case "dominant":
          return {
            ...chord,
            suggestedScale: Scale.get(`${chordRoot} mixolydian`).notes.join(
              " "
            ),
          };
        case "diminished":
          return {
            ...chord,
            suggestedScale: Scale.get(`${chordRoot} whole tone`).notes.join(
              " "
            ),
          };
        case "augmented":
          return {
            ...chord,
            suggestedScale: Scale.get(`${chordRoot} whole tone`).notes.join(
              " "
            ),
          };
        default:
          // その他の場合は、コードトーンを含むスケールを提案
          const chordNotes = Chord.get(chord.chord_name).notes;
          const suggestedScale =
            Scale.detect(chordNotes)[0] || `${chordRoot} chromatic`;
          return {
            ...chord,
            suggestedScale: Scale.get(suggestedScale).notes.join(" "),
          };
      }
    }
  });
}

function chordselecter(title: string): ChordInfo | null {
  const chords = chordList.find((val) => val.title.includes(title));
  if (!chords) {
    console.log("No part found with the given title");
    return null;
  }

  const ableton_notelist: AbletonNote[] = [];
  let chordcount = 0;
  let length = chords.length;
  let clip_name = "";
  let cleanChordName: string;
  let baseKey = chords.key;
  chordcount = chords.change.length;
  const result = analyzeKeyAndChords(chords, baseKey);
  const chordsWithScales = determineChordScales(chords.change, result, baseKey);

  chordsWithScales.forEach((element, key) => {
    if (key == 0 && element.start_time > 0) {
      clip_name = element.start_time.toString();
    }

    clip_name += "|" + element.chord_name;
    const [ChordName, bassNote] = splitChordAndBass(element.chord_name);

    let chordtone: string[];
    let basstone: string[] | undefined;
    try {
      cleanChordName = cleanChordNameForTonal(ChordName);
      chordtone = Chord.get(cleanChordName).notes;

      const root = chordtone[0];
      chordtone.push(root);

      if (bassNote) {
        basstone = [bassNote];
      }
    } catch (error) {
      console.warn(
        `Failed to get notes for chord: ${element.chord_name}. Using root note only.`
      );
      chordtone = [element.chord_name.charAt(0)];
      if (bassNote) {
        basstone = [bassNote];
      }
    }

    const start_time = element.start_time;
    const velocity = 120;
    const duration = element.duration;

    if (chords.change[key + 1]) {
      const next = chords.change[key + 1].start_time;
      if (next > element.start_time + element.duration) {
        const rest = next - (element.start_time + element.duration);
        clip_name += rest.toString();
      }
    }

    if (key == chordcount - 1) {
      const time = element.start_time + element.duration;
      const rest = length - time;

      if (rest > 0) {
        clip_name += rest.toString();
      }
    }

    // chordtone.forEach((e, index) => {
    //   const octave = index === chordtone.length - 1 ? "2" : "3";
    //   const midi_note_number = Note.midi(e + octave);
    //   if (midi_note_number) {
    //     const ableton_note = new AbletonNote(
    //       midi_note_number,
    //       start_time,
    //       duration,
    //       velocity
    //     );
    //     ableton_notelist.push(ableton_note);
    //   }
    // });

    // if (basstone) {
    //   const midi_note_number = Note.midi(basstone[0] + "2");
    //   if (midi_note_number) {
    //     const ableton_note = new AbletonNote(
    //       midi_note_number,
    //       start_time,
    //       duration,
    //       velocity
    //     );
    //     ableton_notelist.push(ableton_note);
    //   }
    // }

    try {
      if (element.suggestedScale) {
        const scaleNotes = element.suggestedScale.split(" ");
        const arrpegioNoteDuration = 0.25;

        scaleNotes.forEach((note, index) => {
          const midi_note_number = Note.midi(note + "4");
          const arrpegioStart = start_time + index * arrpegioNoteDuration;
          if (midi_note_number && arrpegioStart < start_time + duration) {
            const arpeggioNote = new AbletonNote(
              midi_note_number,
              arrpegioStart,
              arrpegioNoteDuration,
              velocity - 20
            );
            ableton_notelist.push(arpeggioNote);
          }
        });
      }
    } catch (error) {
      console.error("Error adding arpeggio notes:", error);
    }
  });

  return {
    clip_name: clip_name,
    ableton_notelist: ableton_notelist,
    length: length,
  };
}

function splitChordAndBass(chordName: string): [string, string | null] {
  const parts = chordName.split("/");
  if (parts.length > 1) {
    return [parts[0], parts[1]];
  }
  return [chordName, null];
}

function removeChordTensions(chordName: string): string {
  return chordName.replace(/\(([^)]*)\)/g, "$1");
}

function cleanChordNameForTonal(chordName: string): string {
  let cleanName = removeChordTensions(chordName);

  if (cleanName.endsWith("sus4")) {
    cleanName = cleanName.replace("sus4", "sus");
  }
  if (cleanName === "7sus" || cleanName === "7") {
    cleanName = cleanName.replace("7", "");
  }

  return cleanName;
}

interface ClipData {
  live: AbletonLive;
  ableton_notelist: AbletonNote[];
  track_number: number;
  clipslot_number: number;
  clip_length: number;
  clip_name: string;
  overwrite: boolean;
}

async function makeclip(data: ClipData): Promise<any> {
  try {
    await data.live.connect();
    const tracks = await data.live.song.children("tracks");
    const clipslot = await tracks[data.track_number].children("clip_slots");
    let num = data.clipslot_number;
    if (clipslot[num].hasClip && data.overwrite == true) {
      clipslot[num].deleteClip();
    } else if (clipslot[num].hasClip && data.overwrite == false) {
      num += 1;
    }
    const clip = await clipslot[num].createClip(data.clip_length);
    clip.set("name", data.clip_name);
    clip.addNewNotes(data.ableton_notelist);
    return clip;
  } catch (error) {
    console.error(error);
  }
}

function abletonlive(): void {
  const live = new AbletonLive();
  const info = chordselecter(
    "Never Dreamed You'd Leave In Summer | Wonder-Wright | Part 3"
  );
  if (info) {
    const data: ClipData = {
      live: live,
      ableton_notelist: info.ableton_notelist,
      track_number: 0,
      clipslot_number: 0,
      clip_length: info.length,
      clip_name: info.clip_name,
      overwrite: true,
    };

    makeclip(data)
      .then((r) => {
        r?.fire();
      })
      .catch((e) => {
        console.log(e);
      });
  }
}

abletonlive();
