// src/constants/bass.ts
import { BassPattern, BassStyle } from '../types/bassTypes';

export const bassPatterns = {
  basic: [
    {
      name: "Root-Fifth",
      pattern: (root: number) => [
        { note: root, time: 0, duration: 1, velocity: 100 },
        { note: root + 7, time: 2, duration: 1, velocity: 90 }
      ]
    },
    {
      name: "Walking",
      pattern: (root: number) => [
        { note: root, time: 0, duration: 0.5, velocity: 100 },
        { note: root + 4, time: 1, duration: 0.5, velocity: 85 },
        { note: root + 7, time: 2, duration: 0.5, velocity: 90 },
        { note: root + 10, time: 3, duration: 0.5, velocity: 85 }
      ]
    },
    {
      name: "Octave",
      pattern: (root: number) => [
        { note: root, time: 0, duration: 1, velocity: 100 },
        { note: root + 12, time: 2, duration: 1, velocity: 90 }
      ]
    },
    {
      name: "Arpeggio",
      pattern: (root: number) => [
        { note: root, time: 0, duration: 0.5, velocity: 100 },
        { note: root + 4, time: 0.5, duration: 0.5, velocity: 85 },
        { note: root + 7, time: 1, duration: 0.5, velocity: 90 },
        { note: root + 12, time: 1.5, duration: 0.5, velocity: 95 },
        { note: root + 7, time: 2, duration: 0.5, velocity: 85 },
        { note: root + 4, time: 2.5, duration: 0.5, velocity: 80 },
        { note: root, time: 3, duration: 1, velocity: 90 }
      ]
    }
  ] as BassPattern[],

  fills: [
    {
      name: "Chromatic Run Up",
      pattern: (root: number) => [
        { note: root, time: 0, duration: 0.25, velocity: 90 },
        { note: root + 1, time: 0.25, duration: 0.25, velocity: 95 },
        { note: root + 2, time: 0.5, duration: 0.25, velocity: 100 },
        { note: root + 3, time: 0.75, duration: 0.25, velocity: 105 }
      ]
    },
    {
      name: "Scale Run Down",
      pattern: (root: number) => [
        { note: root + 12, time: 0, duration: 0.25, velocity: 105 },
        { note: root + 10, time: 0.25, duration: 0.25, velocity: 100 },
        { note: root + 7, time: 0.5, duration: 0.25, velocity: 95 },
        { note: root, time: 0.75, duration: 0.25, velocity: 90 }
      ]
    },
    {
      name: "Triplet Fill",
      pattern: (root: number) => [
        { note: root, time: 0, duration: 0.33, velocity: 95 },
        { note: root + 4, time: 0.33, duration: 0.33, velocity: 90 },
        { note: root + 7, time: 0.66, duration: 0.34, velocity: 85 }
      ]
    },
    {
      name: "Octave Jump Fill",
      pattern: (root: number) => [
        { note: root, time: 0, duration: 0.25, velocity: 100 },
        { note: root + 12, time: 0.25, duration: 0.25, velocity: 95 },
        { note: root + 24, time: 0.5, duration: 0.25, velocity: 90 },
        { note: root + 12, time: 0.75, duration: 0.25, velocity: 85 }
      ]
    }
  ] as BassPattern[],

  accents: [
    {
      name: "Octave Jump",
      pattern: (root: number) => [
        { note: root, time: 0, duration: 0.25, velocity: 110 },
        { note: root + 12, time: 0.25, duration: 0.25, velocity: 100 }
      ]
    },
    {
      name: "Double Note",
      pattern: (root: number) => [
        { note: root, time: 0, duration: 0.125, velocity: 110 },
        { note: root, time: 0.125, duration: 0.125, velocity: 90 }
      ]
    },
    {
      name: "Fifth Accent",
      pattern: (root: number) => [
        { note: root, time: 0, duration: 0.25, velocity: 110 },
        { note: root + 7, time: 0.25, duration: 0.25, velocity: 95 }
      ]
    }
  ] as BassPattern[]
};

export const bassStyles: BassStyle[] = [
  {
    name: "Simple",
    description: "Basic root-fifth pattern with occasional fills",
    mainPatternProbability: 0.9,
    fillProbability: 0.2,
    accentProbability: 0.1,
    syncWithDrum: true,
    velocityRange: [85, 110],
    preferredPatterns: ["Root-Fifth", "Octave"],
    allowedFills: ["Chromatic Run Up", "Scale Run Down"]
  },
  {
    name: "Busy",
    description: "Complex walking patterns with frequent fills",
    mainPatternProbability: 0.8,
    fillProbability: 0.4,
    accentProbability: 0.3,
    syncWithDrum: true,
    velocityRange: [80, 115],
    preferredPatterns: ["Walking", "Arpeggio"],
    allowedFills: ["Triplet Fill", "Octave Jump Fill"]
  },
  {
    name: "Groovy",
    description: "Syncopated patterns with drum-sync accents",
    mainPatternProbability: 0.85,
    fillProbability: 0.3,
    accentProbability: 0.4,
    syncWithDrum: true,
    velocityRange: [90, 120],
    preferredPatterns: ["Walking", "Root-Fifth"],
    allowedFills: ["Chromatic Run Up", "Triplet Fill"]
  }
];