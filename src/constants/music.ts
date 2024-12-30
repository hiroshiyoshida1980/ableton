import { VoicingStrategy } from "../types/interfaces";
import { Scale } from "tonal";

export const voicingStrategies: { [key: string]: VoicingStrategy } = {
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

export const rhythmPatterns = {
  straight: [1, 1, 1, 1],
  syncopated: [1.5, 0.5, 1.5, 0.5],
  latin: [0.75, 0.75, 0.5],
};

export const modes = {
  ionian: (key: string) => Scale.get(`${key} major`),
  dorian: (key: string) => Scale.get(`${key} dorian`),
  phrygian: (key: string) => Scale.get(`${key} phrygian`),
  lydian: (key: string) => Scale.get(`${key} lydian`),
  mixolydian: (key: string) => Scale.get(`${key} mixolydian`),
  aeolian: (key: string) => Scale.get(`${key} minor`),
  locrian: (key: string) => Scale.get(`${key} locrian`),
};

export const clipLengths = {
  short: 4,
  medium: 8,
  long: 16
};

export const keys = [
  "C", 
  "F", "Bb", "Eb", "Ab", "Db",
  "Gb", "B", "E", "A", "D", "G"
];

export const tensions = {
  I: ["maj7", "maj9", "maj13", "6/9"],
  ii: ["m7", "m9", "m11"],
  iii: ["m7", "m9", "m11"],
  IV: ["maj7", "maj9", "6/9", "maj13"],
  V: ["7", "9", "13", "7(b13)", "7(#11)"],
  vi: ["m7", "m9", "m11"],
  vii: ["m7b5", "m9b5"],
};