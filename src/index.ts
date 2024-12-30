import { AbletonLive, Note as AbletonNote } from "ableton-live";
import WebSocket from "ws";
import { progressionStyles, enhancedModalInterchange } from "./generators/progressionStyles";
import { generateDrumPattern, createDrumClip } from "./generators/drumPatterns";
import { generateBassline, createBassClip } from "./generators/bassPatterns";
import { clipSlotCounter } from "./constants/drums";
import { keys, clipLengths, voicingStrategies, rhythmPatterns } from "./constants/music";
import { generateChordNotes } from "./utils/patterns";
import { makeClip } from "./utils/clipManagement";
import { ChordPart } from "./types/interfaces";

if (process) {
    (global as any).WebSocket = WebSocket;
}

async function createProgressionClip(progression: ChordPart): Promise<void> {
    const live = new AbletonLive();
    const ableton_notelist: AbletonNote[] = [];

    const chordNames = progression.change
        .map((change: { chord_name: string }) => change.chord_name)
        .join(" → ");

    progression.change.forEach((change: { chord_name: string; start_time: number; duration: number }) => {
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

    const clipData = {
        live: live,
        ableton_notelist: ableton_notelist,
        track_number: 0,
        clipslot_number: clipSlotCounter.harmony,
        clip_length: progression.length,
        clip_name: `${progression.title} (${chordNames})`,
        overwrite: true,
    };

    try {
        await makeClip(clipData);
        clipSlotCounter.harmony++;
    } catch (error) {
        console.error("Error in createProgressionClip:", error);
    }
}

async function runMusicalExperiment() {
    let currentSceneIndex = 0;

    async function generateNewScene() {
        const style = enhancedModalInterchange;
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        const clipLengthValues = Object.values(clipLengths);
        const clipLength = clipLengthValues[Math.floor(Math.random() * clipLengthValues.length)];

        console.log(`Generating new progression: ${style.name} in ${randomKey} (Length: ${clipLength} bars)`);

        const progression = style.generator(randomKey, clipLength);
        await createProgressionClip(progression);

        // ベースラインを生成
        const bassNoteList = generateBassline(progression.change, clipLength);
        await createBassClip(bassNoteList, clipLength, progression.title);

        // ドラムパターンを生成
        const selectedRhythm = Object.values(rhythmPatterns)[Math.floor(Math.random() * Object.keys(rhythmPatterns).length)];
        const drumPattern = generateDrumPattern(selectedRhythm, clipLength);
        await createDrumClip(drumPattern, clipLength);

        currentSceneIndex++;
    }

    await generateNewScene();

    setInterval(generateNewScene, 20000);
}
async function main() {
    const live = new AbletonLive();

    try {
        await live.connect();
        console.log("Connected to Ableton Live");
        await runMusicalExperiment();
    } catch (error) {
        console.error("Error:", error);
    }
}

main().catch(console.error);