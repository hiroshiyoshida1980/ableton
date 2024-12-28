import { AbletonLive, Note, Clip } from 'ableton-live';
import fs from 'fs';
import * as WS from 'ws';

if (process) {
  (global as any).WebSocket = WS.WebSocket;
}

const live = new AbletonLive();

async function getMidiNotesAndExportToJson(): Promise<void> {
  try {
    await live.connect();

    const tracks = await live.song.children('tracks');
    if (tracks.length < 2) {
      console.log("トラック2が存在しません。");
      return;
    }

    const track = tracks[1]; // トラック2（0から数えて1）

    const clips = await track.getClips();
    if (clips.length === 0) {
      console.log("指定されたトラックにクリップがありません。");
      return;
    }

    const clip: Clip | null = clips[0]; // 最初のクリップ
    if (!clip) {
      console.log("クリップが見つかりません。");
      return;
    }

    const notes: Note[] = await clip.getNotes();

    const serializedNotes = notes.map(note => ({
      pitch: note.pitch,
      start_time: note.start,
      duration: note.duration,
      velocity: note.velocity,
      muted: note.muted,
      probability: note.probability,
      velocityDeviation: note.velocityDeviation,
      releaseVelocity: note.releaseVelocity,
      id: note.id
    }));

    const jsonData = JSON.stringify(serializedNotes, null, 2);
    fs.writeFileSync("midi_notes.json", jsonData);

    console.log("MIDIノート情報がmidi_notes.jsonに書き出されました。");

  } catch (error) {
    console.error("エラーが発生しました:");
    console.error(error);
  } finally {
    await live.disconnect();
  }
}

getMidiNotesAndExportToJson();
