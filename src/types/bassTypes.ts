// src/types/bassTypes.ts
export interface BassNote {
    note: number;
    time: number;
    duration: number;
    velocity?: number;
}

export interface BassPattern {
    name: string;
    pattern: (root: number) => BassNote[];
}

export interface BassStyle {
    name: string;
    description: string;
    mainPatternProbability: number;
    fillProbability: number;
    accentProbability: number;
    syncWithDrum: boolean;
    velocityRange: [number, number];
    preferredPatterns: string[];
    allowedFills: string[];
}