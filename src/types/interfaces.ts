import { AbletonLive, Note as AbletonNote } from "ableton-live";

export interface ChordChange {
  chord_name: string;
  start_time: number;
  duration: number;
}

export interface ChordPart {
  title: string;
  key: string;
  change: ChordChange[];
  length: number;
}

export interface ClipData {
  live: AbletonLive;
  ableton_notelist: AbletonNote[];
  track_number: number;
  clipslot_number: number;
  clip_length: number;
  clip_name: string;
  overwrite: boolean;
}

export interface ProgressionStyle {
  name: string;
  description: string;
  generator: (key: string, targetLength: number) => ChordPart;
}

export interface ChordTransition {
  from: string;
  to: string;
  weight: number;
}

export type DegreeType = "I" | "ii" | "iii" | "IV" | "V" | "vi" | "vii";
export type TensionsType = { [K in DegreeType]: string[] };

export interface DrumPattern {
  name: string;
  pattern: {
    [key: string]: number[];
  };
}

export interface VoicingStrategy {
  (notes: number[]): number[];
}