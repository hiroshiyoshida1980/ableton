import { AbletonLive, Note as AbletonNote } from "ableton-live";
import { Chord, Scale, Note } from "tonal";
import WebSocket from "ws";

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
  key: string;
  change: ChordChange[];
  length: number;
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

interface ProgressionStyle {
  name: string;
  description: string;
  generator: (key: string) => ChordPart;
}

interface ChordTransition {
  from: string;
  to: string;
  weight: number;
}

type DegreeType = "I" | "ii" | "iii" | "IV" | "V" | "vi" | "vii";
type TensionsType = { [K in DegreeType]: string[] };

const voicingStrategies = {
  close: (notes: number[]): number[] => {
    return notes.sort((a, b) => a - b);
  },

  spread: (notes: number[]): number[] => {
    const sorted = notes.sort((a, b) => a - b);
    const result: number[] = [];
    for (let i = 0; i < sorted.length; i += 2) {
      result.push(sorted[i]);
    }
    for (let i = 1; i < sorted.length; i += 2) {
      result.push(sorted[i]);
    }
    return result;
  },

  dropTwo: (notes: number[]): number[] => {
    const sorted = notes.sort((a, b) => a - b);
    if (sorted.length < 4) return sorted;
    const result = [...sorted];
    const secondNote = result[1];
    result.splice(1, 1);
    result.push(secondNote + 12);
    return result;
  },
};

const rhythmPatterns = {
  straight: [1, 1, 1, 1],
  syncopated: [1.5, 0.5, 1.5, 0.5],
  latin: [0.75, 0.75, 0.5],
};

const modes = {
  ionian: (key: string) => Scale.get(`${key} major`),
  dorian: (key: string) => Scale.get(`${key} dorian`),
  phrygian: (key: string) => Scale.get(`${key} phrygian`),
  lydian: (key: string) => Scale.get(`${key} lydian`),
  mixolydian: (key: string) => Scale.get(`${key} mixolydian`),
  aeolian: (key: string) => Scale.get(`${key} minor`),
  locrian: (key: string) => Scale.get(`${key} locrian`),
};

function getDiatonicChordsWithTensions(key: string): {
  [degree: string]: string[];
} {
  const scale = Scale.get(`${key} major`).notes;
  const diatonicChords: { [degree: string]: string[] } = {};

  const tensions: TensionsType = {
    I: ["maj7", "maj9", "maj13", "6/9"],
    ii: ["m7", "m9", "m11"],
    iii: ["m7", "m9", "m11"],
    IV: ["maj7", "maj9", "6/9", "maj13"],
    V: ["7", "9", "13", "7(b13)", "7(#11)"],
    vi: ["m7", "m9", "m11"],
    vii: ["m7b5", "m9b5"],
  };

  (Object.keys(tensions) as DegreeType[]).forEach((degree, index) => {
    const root = scale[index];
    diatonicChords[degree] = tensions[degree].map(
      (tension: string) => `${root}${tension}`
    );
  });

  return diatonicChords;
}

const progressionStyles: ProgressionStyle[] = [
  {
    name: "Modal Interchange",
    description: "Borrowing chords from parallel modes",
    generator: (key: string) => {
      const parallelMinor = `${key}m`;
      const diatonicMajor = getDiatonicChordsWithTensions(key);
      const diatonicMinor = getDiatonicChordsWithTensions(parallelMinor);

      const changes: ChordChange[] = [];
      for (let i = 0; i < 8; i++) {
        const useMinor = Math.random() > 0.7;
        const chords = useMinor ? diatonicMinor : diatonicMajor;
        const degrees = Object.keys(chords);
        const randomDegree =
          degrees[Math.floor(Math.random() * degrees.length)];
        const chordOptions = chords[randomDegree];
        const randomChord =
          chordOptions[Math.floor(Math.random() * chordOptions.length)];

        changes.push({
          chord_name: randomChord,
          start_time: i * 2,
          duration: 2,
        });
      }

      return {
        title: `Modal Interchange in ${key}`,
        key: key,
        change: changes,
        length: 16,
      };
    },
  },
  {
    name: "Constant Structure",
    description: "Same chord structure moving chromatically",
    generator: (key: string) => {
      const baseChord = "maj7";
      const chromaticScale = Scale.get(`${key} chromatic`).notes;
      const changes: ChordChange[] = [];

      for (let i = 0; i < 8; i++) {
        const rootNote = chromaticScale[i % chromaticScale.length];
        changes.push({
          chord_name: `${rootNote}${baseChord}`,
          start_time: i * 2,
          duration: 2,
        });
      }

      return {
        title: `Constant Structure in ${key}`,
        key: key,
        change: changes,
        length: 16,
      };
    },
  },
  {
    name: "Chromatic Mediant",
    description: "Third-related progressions",
    generator: (key: string) => {
      const scale = Scale.get(`${key} major`).notes;
      const thirdUp = Note.transpose(key, "3M");
      const thirdDown = Note.transpose(key, "-3M");
      const changes: ChordChange[] = [];

      const possibleChords = [
        `${key}maj7`,
        `${thirdUp}maj7`,
        `${thirdDown}maj7`,
      ];

      for (let i = 0; i < 8; i++) {
        const randomChord =
          possibleChords[Math.floor(Math.random() * possibleChords.length)];
        changes.push({
          chord_name: randomChord,
          start_time: i * 2,
          duration: 2,
        });
      }

      return {
        title: `Chromatic Mediant in ${key}`,
        key: key,
        change: changes,
        length: 16,
      };
    },
  },
];

function generateChordNotes(chordName: string): number[] {
  const match = chordName.match(/([A-G][b#]?)(.*)/);
  if (!match) return [60];

  const [_, root, quality] = match;
  let notes: string[] = [];

  const basicChord = Chord.get(chordName);
  notes = basicChord.notes;

  if (quality.includes("9")) {
    const scaleNotes = Scale.get(`${root} major`).notes;
    if (scaleNotes.length > 1) notes.push(scaleNotes[1]);
  }
  if (quality.includes("11")) {
    const scaleNotes = Scale.get(`${root} major`).notes;
    if (scaleNotes.length > 3) notes.push(scaleNotes[3]);
  }
  if (quality.includes("13")) {
    const scaleNotes = Scale.get(`${root} major`).notes;
    if (scaleNotes.length > 5) notes.push(scaleNotes[5]);
  }

  return notes.map((note) => {
    const midiNote = Note.midi(note + "3");
    return midiNote !== null ? midiNote : 60;
  });
}

async function makeClip(data: ClipData): Promise<any> {
  try {
    await data.live.connect();
    const tracks = await data.live.song.children("tracks");
    const clipslot = await tracks[data.track_number].children("clip_slots");

    let num = data.clipslot_number;
    if (clipslot[num].hasClip && data.overwrite) {
      await clipslot[num].deleteClip();
    } else if (clipslot[num].hasClip && !data.overwrite) {
      num += 1;
    }

    const clip = await clipslot[num].createClip(data.clip_length);
    await clip.set("name", data.clip_name);
    await clip.addNewNotes(data.ableton_notelist);
    return clip;
  } catch (error) {
    console.error("Error creating clip:", error);
    throw error;
  }
}

let currentClipslotNumber = 0;

async function createProgressionClip(progression: ChordPart): Promise<void> {
  const live = new AbletonLive();
  const ableton_notelist: AbletonNote[] = [];

  const chordNames = progression.change
    .map((change) => change.chord_name)
    .join(" → ");

  progression.change.forEach((change) => {
    const midiNotes = generateChordNotes(change.chord_name);
    const voicedNotes = voicingStrategies.dropTwo(midiNotes);

    voicedNotes.forEach((midiNote) => {
      const note = new AbletonNote(
        midiNote,
        change.start_time,
        change.duration,
        100
      );
      ableton_notelist.push(note);
    });
  });

  const clipData: ClipData = {
    live: live,
    ableton_notelist: ableton_notelist,
    track_number: 0,
    clipslot_number: currentClipslotNumber,
    clip_length: progression.length,
    clip_name: `${progression.title} (${chordNames})`,
    overwrite: true,
  };

  try {
    const clip = await makeClip(clipData);
    if (clip) {
      await clip.fire();
    }
    // クリップ作成成功後にインクリメント
    currentClipslotNumber++;
  } catch (error) {
    console.error("Error in createProgressionClip:", error);
  }
}
async function runMusicalExperiment() {
  let currentSceneIndex = 0;

  setInterval(async () => {
    const style =
      progressionStyles[currentSceneIndex % progressionStyles.length];
    const keys = [
      "C",
      "F",
      "Bb",
      "Eb",
      "Ab",
      "Db",
      "Gb",
      "B",
      "E",
      "A",
      "D",
      "G",
    ];
    const randomKey = keys[Math.floor(Math.random() * keys.length)];

    console.log(`Generating new progression: ${style.name} in ${randomKey}`);

    const progression = style.generator(randomKey);
    await createProgressionClip(progression);

    currentSceneIndex++;
  }, 20000);
}

async function main() {
  const live = new AbletonLive();

  try {
    await live.connect();
    console.log("Connected to Ableton Live");

    const keys = [
      "C",
      "F",
      "Bb",
      "Eb",
      "Ab",
      "Db",
      "Gb",
      "B",
      "E",
      "A",
      "D",
      "G",
    ];
    const randomKey = keys[Math.floor(Math.random() * keys.length)];

    // まずModal Interchangeスタイルで試してみる
    const style = progressionStyles[0];
    console.log(`Generating new progression: ${style.name} in ${randomKey}`);

    const progression = style.generator(randomKey);
    await createProgressionClip(progression);

    // 成功したら3分ごとの自動生成を開始
    runMusicalExperiment();
  } catch (error) {
    console.error("Error:", error);
  }
}

main().catch(console.error);
