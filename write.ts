import { AbletonLive, Note as AbletonNote } from 'ableton-live';
import fs from 'fs';
import * as WS from 'ws';

if (process) {
  (global as any).WebSocket = WS.WebSocket;
}

const live = new AbletonLive();

async function importJsonAndCreateMidiClip(): Promise<void> {
  try {
    await live.connect();

    const jsonData = fs.readFileSync("midi_notes.json", "utf8");
    console.log("JSONデータ:", jsonData);

    const rawMidiData = JSON.parse(jsonData);
    console.log("パースされたデータ:", rawMidiData);

    const midiData = rawMidiData.map((note:any) => new AbletonNote(
      note.pitch,
      note.start_time,
      note.duration,
      note.velocity,
      note.muted
    ));

    const tracks = await live.song.children('tracks');
    if (tracks.length === 0) {
      console.log("トラックが見つかりません。");
      return;
    }

    const track = tracks[0];

    const clipSlots = await track.children('clip_slots');
    if (clipSlots.length === 0) {
      console.log("クリップスロットが見つかりません。");
      return;
    }

    const clipSlot = clipSlots[0];

    console.log("新しいクリップを作成します...");
    const clip = await clipSlot.createClip(4);
    console.log("クリップが作成されました。");

    await clip.set('name', 'Imported MIDI Clip');

    const clipName = await clip.get('name');
    const clipLength = await clip.get('length');
    console.log(`作成されたクリップ: 名前 = ${clipName}, 長さ = ${clipLength}`);

    console.log("ノートを追加します...");
    try {
      await clip.addNewNotes(midiData);
      console.log(`${midiData.length}個のノートを追加しました。`);
    } catch (noteError) {
      console.error(`ノートの追加中にエラーが発生しました:`, noteError);
    }

    console.log("MIDIノートがクリップに挿入されました。");

  } catch (error) {
    console.error("エラーが発生しました:", error);
  } finally {
    await live.disconnect();
  }
}

importJsonAndCreateMidiClip();
