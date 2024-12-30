import { Note as AbletonNote } from "ableton-live";
import { AbletonLive } from "ableton-live";
import { DrumPattern } from "../types/interfaces";
import { drumNotes, drumRules, drumStyles, DrumRule } from "../constants/drums";
import { clipSlotCounter } from "../constants/drums";
import { repeatPatternToLength } from "../utils/patterns";
import { makeClip } from "../utils/clipManagement";

function getVelocity(rule: DrumRule, isAccent: boolean, isGhost: boolean): number {
    const [min, max] = rule.velocityRange;
    let baseVelocity = Math.floor(min + Math.random() * (max - min));

    if (isAccent) {
        baseVelocity = Math.min(127, baseVelocity * 1.2);
    } else if (isGhost) {
        baseVelocity = Math.max(1, baseVelocity * 0.7);
    }

    return baseVelocity;
}

function selectDrumStyle(): typeof drumStyles[0] {
    return drumStyles[Math.floor(Math.random() * drumStyles.length)];
}

export function generateDrumPattern(rhythmPattern: number[], targetLength: number): DrumPattern {
    const selectedStyle = selectDrumStyle();
    console.log(`Selected drum style: ${selectedStyle.name}`);

    const pattern: DrumPattern = {
        name: selectedStyle.name,
        pattern: {}
    };

    const extendedRhythm = repeatPatternToLength(rhythmPattern, targetLength);
    let currentStep = 0;

    extendedRhythm.forEach((duration, i) => {
        const steps = Math.floor(duration * 4);
        const isLastBar = i % 4 === 3;
        const isEighthBar = i % 8 === 7;

        selectedStyle.activeInstruments.forEach(instrumentName => {
            const rule = drumRules[instrumentName];
            const styleProbability = selectedStyle.probabilities[instrumentName] || 0.5;

            if (!rule || Math.random() > styleProbability) return;

            pattern.pattern[instrumentName] = pattern.pattern[instrumentName] || [];

            // メインビートの生成
            rule.mainBeats.forEach(beat => {
                if (Math.random() < rule.probability * styleProbability) {
                    pattern.pattern[instrumentName].push(currentStep + beat);
                }
            });

            // フィルインの生成
            if (isLastBar || isEighthBar) {
                rule.fillBeats.forEach(beat => {
                    if (Math.random() < rule.probability * styleProbability * (isEighthBar ? 0.7 : 0.4)) {
                        pattern.pattern[instrumentName].push(currentStep + beat);
                    }
                });
            }

            // ゴーストノートの生成
            if (rule.ghostNotes) {
                rule.ghostNotes.forEach(beat => {
                    if (Math.random() < rule.probability * styleProbability * 0.3) {
                        pattern.pattern[instrumentName].push(currentStep + beat);
                    }
                });
            }
        });

        // 追加のアクセントやフィル
        if (isEighthBar) {
            const accentInstruments = ['crash', 'splash', 'rideBell'].filter(
                inst => !selectedStyle.activeInstruments.includes(inst)
            );

            if (accentInstruments.length > 0) {
                const randomAccent = accentInstruments[Math.floor(Math.random() * accentInstruments.length)];
                pattern.pattern[randomAccent] = pattern.pattern[randomAccent] || [];
                pattern.pattern[randomAccent].push(currentStep);
            }
        }

        currentStep += steps;
    });

    return pattern;
}

export async function createDrumClip(
    drumPattern: DrumPattern,
    clipLength: number,
    startTime: number = 0
): Promise<void> {
    const live = new AbletonLive();
    const drumNoteList: AbletonNote[] = [];

    Object.entries(drumPattern.pattern).forEach(([drumName, positions]) => {
        const midiNote = drumNotes[drumName as keyof typeof drumNotes];
        const rule = drumRules[drumName];

        if (!rule) return;

        positions.forEach(pos => {
            const isAccent = rule.accentBeats.includes(pos % 16);
            const isGhost = rule.ghostNotes?.includes(pos % 16) || false;
            const velocity = getVelocity(rule, isAccent, isGhost);
            const noteTime = startTime + (pos * 0.25);

            // ノートの長さをわずかにランダム化
            const noteDuration = 0.25 * (0.95 + Math.random() * 0.1);

            drumNoteList.push(new AbletonNote(midiNote, noteTime, noteDuration, velocity));
        });
    });

    const clipData = {
        live,
        ableton_notelist: drumNoteList,
        track_number: 1,
        clipslot_number: clipSlotCounter.drums,
        clip_length: clipLength,
        clip_name: `Drum Pattern - ${drumPattern.name}`,
        overwrite: true
    };

    try {
        await makeClip(clipData);
        clipSlotCounter.drums++;
    } catch (error) {
        console.error("Error creating drum clip:", error);
    }
}