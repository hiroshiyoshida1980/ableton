import { Note, Scale } from "tonal";
import { ProgressionStyle } from "../types/interfaces";
import { modes, rhythmPatterns } from "../constants/music";
import { getRandomElement, getDiatonicChordsWithTensions, repeatPatternToLength } from "../utils/patterns";

type ModeType = 'ionian' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'aeolian' | 'locrian';
type FunctionType = 'tonic' | 'subdominant' | 'dominant';

interface ChordCollection {
    [degree: string]: string[];
}

interface ParallelModes {
    ionian: ChordCollection;
    dorian: ChordCollection;
    phrygian: ChordCollection;
    lydian: ChordCollection;
    mixolydian: ChordCollection;
    aeolian: ChordCollection;
    locrian: ChordCollection;
}

interface ChordFunction {
    type: FunctionType;
    weight: number;
}

export const enhancedModalInterchange: ProgressionStyle = {
    name: "Enhanced Modal Interchange",
    description: "Advanced modal interchange with functional harmony and mode borrowing",
    generator: (key: string, targetLength: number) => {
        // パラレルモードのコード集を作成
        const parallelModes: ParallelModes = {
            ionian: getDiatonicChordsWithTensions(key),
            dorian: getDiatonicChordsWithTensions(Note.transpose(key, "0P") + "dorian"),
            phrygian: getDiatonicChordsWithTensions(Note.transpose(key, "0P") + "phrygian"),
            lydian: getDiatonicChordsWithTensions(Note.transpose(key, "0P") + "lydian"),
            mixolydian: getDiatonicChordsWithTensions(Note.transpose(key, "0P") + "mixolydian"),
            aeolian: getDiatonicChordsWithTensions(key + "m"),
            locrian: getDiatonicChordsWithTensions(Note.transpose(key, "0P") + "locrian")
        };

        const chordFunctions: { [key: string]: ChordFunction } = {
            I: { type: 'tonic', weight: 0.4 },
            ii: { type: 'subdominant', weight: 0.15 },
            iii: { type: 'tonic', weight: 0.05 },
            IV: { type: 'subdominant', weight: 0.15 },
            V: { type: 'dominant', weight: 0.3 },
            vi: { type: 'tonic', weight: 0.1 },
            vii: { type: 'dominant', weight: 0.05 }
        };

        const transitionMatrix: { [key in FunctionType]: { [key in FunctionType]: number } } = {
            tonic: { tonic: 0.1, subdominant: 0.4, dominant: 0.5 },
            subdominant: { tonic: 0.2, subdominant: 0.2, dominant: 0.6 },
            dominant: { tonic: 0.8, subdominant: 0.1, dominant: 0.1 }
        };

        const modeBorrowingWeights: { [key in ModeType]: number } = {
            ionian: 0.4,
            dorian: 0.1,
            phrygian: 0.05,
            lydian: 0.1,
            mixolydian: 0.15,
            aeolian: 0.15,
            locrian: 0.05
        };

        let currentFunction: FunctionType = 'tonic';
        const changes = [];
        let currentTime = 0;
        const randomRhythm = getRandomElement(rhythmPatterns);
        const extendedRhythm: number[] = repeatPatternToLength(randomRhythm, targetLength);

        while (currentTime < targetLength) {
            const nextFunction = selectWithProbability(transitionMatrix[currentFunction]) as FunctionType;
            const selectedMode = selectWithProbability(modeBorrowingWeights) as ModeType;
            const availableChords = parallelModes[selectedMode];

            const functionalChords = Object.entries(chordFunctions)
                .filter(([_, func]) => func.type === nextFunction)
                .map(([degree]) => availableChords[degree])
                .flat();

            const selectedChord = functionalChords[Math.floor(Math.random() * functionalChords.length)];

            const rhythmIndex: number = changes.length % extendedRhythm.length;
            const duration: number = extendedRhythm[rhythmIndex];

            if (currentTime + duration <= targetLength) {
                changes.push({
                    chord_name: selectedChord,
                    start_time: currentTime,
                    duration: duration
                });

                currentTime += duration;
                currentFunction = nextFunction;
            }
        }

        return {
            title: `Enhanced Modal Interchange in ${key}`,
            key: key,
            change: changes,
            length: targetLength
        };
    }
};

export const progressionStyles: ProgressionStyle[] = [
    {
        name: "Modal Interchange",
        description: "Borrowing chords from parallel modes with random rhythms and modes",
        generator: (key: string, targetLength: number) => {
            const parallelMinor = `${key}m`;
            const diatonicMajor = getDiatonicChordsWithTensions(key);
            const diatonicMinor = getDiatonicChordsWithTensions(parallelMinor);

            const randomMode = getRandomElement(modes);
            const randomRhythm = getRandomElement(rhythmPatterns);
            const extendedRhythm: number[] = repeatPatternToLength(randomRhythm, targetLength);

            const changes = [];
            let currentTime = 0;

            while (currentTime < targetLength) {
                const rhythmIndex: number = changes.length % extendedRhythm.length;
                const duration: number = extendedRhythm[rhythmIndex];

                const useMinor = Math.random() > 0.7;
                const chords = useMinor ? diatonicMinor : diatonicMajor;
                const degrees = Object.keys(chords);
                const randomDegree = degrees[Math.floor(Math.random() * degrees.length)];
                const chordOptions = chords[randomDegree];
                const randomChord = chordOptions[Math.floor(Math.random() * chordOptions.length)];

                if (currentTime + duration <= targetLength) {
                    changes.push({
                        chord_name: randomChord,
                        start_time: currentTime,
                        duration: duration
                    });
                    currentTime += duration;
                }
            }

            return {
                title: `Modal Interchange in ${key}`,
                key: key,
                change: changes,
                length: targetLength
            };
        }
    },
    {
        name: "Constant Structure",
        description: "Same chord structure moving chromatically",
        generator: (key: string, targetLength: number) => {
            const baseChord = "maj7";
            const chromaticScale = Scale.get(`${key} chromatic`).notes;
            const randomRhythm = getRandomElement(rhythmPatterns);
            const extendedRhythm: number[] = repeatPatternToLength(randomRhythm, targetLength);

            const changes = [];
            let currentTime = 0;

            while (currentTime < targetLength) {
                const rhythmIndex: number = changes.length % extendedRhythm.length;
                const duration: number = extendedRhythm[rhythmIndex];
                const rootNote: string = chromaticScale[changes.length % chromaticScale.length];

                if (currentTime + duration <= targetLength) {
                    changes.push({
                        chord_name: `${rootNote}${baseChord}`,
                        start_time: currentTime,
                        duration: duration
                    });
                    currentTime += duration;
                }
            }

            return {
                title: `Constant Structure in ${key}`,
                key: key,
                change: changes,
                length: targetLength
            };
        }
    },
    {
        name: "Chromatic Mediant",
        description: "Third-related progressions",
        generator: (key: string, targetLength: number) => {
            const thirdUp = Note.transpose(key, "3M");
            const thirdDown = Note.transpose(key, "-3M");
            const randomRhythm = getRandomElement(rhythmPatterns);
            const extendedRhythm: number[] = repeatPatternToLength(randomRhythm, targetLength);

            const possibleChords = [`${key}maj7`, `${thirdUp}maj7`, `${thirdDown}maj7`];
            const changes = [];
            let currentTime = 0;

            while (currentTime < targetLength) {
                const rhythmIndex: number = changes.length % extendedRhythm.length;
                const duration: number = extendedRhythm[rhythmIndex];
                const randomChord = possibleChords[Math.floor(Math.random() * possibleChords.length)];

                if (currentTime + duration <= targetLength) {
                    changes.push({
                        chord_name: randomChord,
                        start_time: currentTime,
                        duration: duration
                    });
                    currentTime += duration;
                }
            }

            return {
                title: `Chromatic Mediant in ${key}`,
                key: key,
                change: changes,
                length: targetLength
            };
        }
    },
];

interface ChordFunction {
    type: 'tonic' | 'subdominant' | 'dominant';
    weight: number;
}

function selectWithProbability(probabilities: { [key: string]: number }): string {
    const rand = Math.random();
    let cumulative = 0;

    for (const [key, prob] of Object.entries(probabilities)) {
        cumulative += prob;
        if (rand <= cumulative) return key;
    }

    return Object.keys(probabilities)[0];
}
