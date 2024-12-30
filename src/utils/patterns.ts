import { Scale, Note, Chord } from "tonal";
import { DegreeType, TensionsType } from "../types/interfaces";
import { tensions } from "../constants/music";

export function getRandomElement<T>(obj: { [key: string]: T }): T {
    const keys = Object.keys(obj);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return obj[randomKey];
}

export function repeatPatternToLength(pattern: number[], targetLength: number): number[] {
    const result: number[] = [];
    let currentSum = 0;

    while (currentSum < targetLength) {
        pattern.forEach(duration => {
            if (currentSum + duration <= targetLength) {
                result.push(duration);
                currentSum += duration;
            }
        });
    }

    return result;
}

export function getDiatonicChordsWithTensions(key: string): {
    [degree: string]: string[];
} {
    const scale = Scale.get(`${key} major`).notes;
    const diatonicChords: { [degree: string]: string[] } = {};

    (Object.keys(tensions) as DegreeType[]).forEach((degree, index) => {
        const root = scale[index];
        diatonicChords[degree] = tensions[degree].map(
            (tension: string) => `${root}${tension}`
        );
    });

    return diatonicChords;
}

export function generateChordNotes(chordName: string): number[] {
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