// src/generators/bassPatterns.ts
import { AbletonLive, Note as AbletonNote } from "ableton-live";
import { Note, Scale } from "tonal";
import { BassNote, BassPattern, BassStyle } from "../types/bassTypes";
import { bassPatterns, bassStyles } from "../constants/bass";
import { clipSlotCounter } from "../constants/drums";
import { DrumPattern } from "../types/interfaces";
import { makeClip } from "../utils/clipManagement";

function getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

function selectBassPattern(style: BassStyle, isMainPattern: boolean = true): BassPattern {
    const patternArray = isMainPattern ? bassPatterns.basic : bassPatterns.fills;
    const allowedPatterns = isMainPattern ? style.preferredPatterns : style.allowedFills;

    const validPatterns = patternArray.filter(pattern =>
        allowedPatterns.includes(pattern.name)
    );

    return getRandomElement(validPatterns);
}

function adjustVelocity(velocity: number, style: BassStyle): number {
    const [min, max] = style.velocityRange;
    return Math.max(min, Math.min(max, velocity));
}

function generateBassFill(
    root: number,
    style: BassStyle,
    startTime: number
): BassNote[] {
    const fillPattern = selectBassPattern(style, false);
    return fillPattern.pattern(root).map(note => ({
        ...note,
        time: note.time + startTime,
        velocity: adjustVelocity(note.velocity || 90, style)
    }));
}

export function generateBassline(
    chordChanges: Array<{ chord_name: string; start_time: number; duration: number }>,
    clipLength: number,
    drumPattern?: DrumPattern
): AbletonNote[] {
    const bassNoteList: AbletonNote[] = [];
    const selectedStyle = getRandomElement(bassStyles);
    console.log(`Selected bass style: ${selectedStyle.name}`);

    chordChanges.forEach((change, index) => {
        const root = change.chord_name.match(/([A-G][b#]?)/)?.[1] || "C";
        const rootMidi = Note.midi(root + "1") || 36;
        let bassNotes: BassNote[] = [];

        // メインパターンの生成
        if (Math.random() < selectedStyle.mainPatternProbability) {
            const mainPattern = selectBassPattern(selectedStyle, true);
            bassNotes.push(...mainPattern.pattern(rootMidi));
        }

        // フィルの追加
        const isLastInPhrase = (index + 1) % 4 === 0;
        if (isLastInPhrase && Math.random() < selectedStyle.fillProbability) {
            bassNotes.push(...generateBassFill(rootMidi, selectedStyle, change.duration - 1));
        }

        // ドラムパターンと連動したアクセント
        if (selectedStyle.syncWithDrum && drumPattern && drumPattern.pattern.kickDrum) {
            drumPattern.pattern.kickDrum.forEach(kickTime => {
                const relativeKickTime = kickTime % 16; // 16は1小節の16分音符の数
                const isOnBeat = relativeKickTime % 4 === 0;

                if (isOnBeat && Math.random() < selectedStyle.accentProbability) {
                    const accent = getRandomElement(bassPatterns.accents);
                    const accentNotes = accent.pattern(rootMidi).map(note => ({
                        ...note,
                        time: note.time + (relativeKickTime * 0.25),
                        velocity: adjustVelocity(note.velocity || 100, selectedStyle)
                    }));
                    bassNotes.push(...accentNotes);
                }
            });
        }

        // ベースノートをAbletonNoteに変換
        bassNotes.forEach(note => {
            if (note.time < change.duration) {
                bassNoteList.push(new AbletonNote(
                    note.note,
                    change.start_time + note.time,
                    note.duration,
                    note.velocity || 90
                ));
            }
        });
    });

    return bassNoteList;
}

export async function createBassClip(
    bassNoteList: AbletonNote[],
    clipLength: number,
    styleName: string
): Promise<void> {
    const live = new AbletonLive();

    const clipData = {
        live,
        ableton_notelist: bassNoteList,
        track_number: 2,
        clipslot_number: clipSlotCounter.bass,
        clip_length: clipLength,
        clip_name: `Bass Pattern - ${styleName}`,
        overwrite: true
    };

    try {
        await makeClip(clipData);
        clipSlotCounter.bass++;
    } catch (error) {
        console.error("Error creating bass clip:", error);
    }
}

export async function generateAndCreateBassClip(
    chordChanges: Array<{ chord_name: string; start_time: number; duration: number }>,
    clipLength: number,
    drumPattern?: DrumPattern
): Promise<void> {
    const bassNoteList = generateBassline(chordChanges, clipLength, drumPattern);
    await createBassClip(bassNoteList, clipLength, "Generated Bass");
}