import { AbletonLive } from "ableton-live";
import { ClipData } from "../types/interfaces";

export async function makeClip(data: ClipData): Promise<any> {
    try {
        await data.live.connect();
        const tracks = await data.live.song.children("tracks");
        const clipslot = await tracks[data.track_number].children("clip_slots");

        let num = data.clipslot_number;
        if (clipslot[num].hasClip && data.overwrite) {
            await clipslot[num].deleteClip();
        } else if (clipslot[num].hasClip && !data.overwrite) {
            num += 1;
        }

        const clip = await clipslot[num].createClip(data.clip_length);
        await clip.set("name", data.clip_name);
        await clip.addNewNotes(data.ableton_notelist);

        if (clip) {
            await clip.fire();
        }

        return clip;
    } catch (error) {
        console.error("Error creating clip:", error);
        throw error;
    }
}