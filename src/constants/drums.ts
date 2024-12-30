// src/constants/drums.ts
export const drumNotes = {
    // キック系
    kickDrum: 36,      // C1
    kickDrumSub: 35,   // B0
  
    // スネア系
    snare: 38,         // D1
    snareSub: 40,      // E1
    rimShot: 37,       // C#1
    clap: 39,          // D#1
  
    // ハイハット系
    closedHihat: 42,   // F#1
    openHihat: 46,     // A#1
    pedalHihat: 44,    // G#1
  
    // シンバル系
    ride: 51,          // D#2
    rideBell: 53,      // F2
    crash: 49,         // C#2
    splash: 55,        // G2
  
    // パーカッション系
    cowbell: 56,       // G#2
    tambourine: 54,    // F#2
    shaker: 70,        // A#3
    conga: 63,         // D#3
    bongo: 60,         // C3
    timbale: 65,       // F3
    agogo: 67,         // G3
    woodBlock: 76,     // E4
  };
  
  export interface DrumRule {
    mainBeats: number[];      // メインのビート位置
    fillBeats: number[];      // フィルイン可能な位置
    accentBeats: number[];    // アクセントを付ける位置
    probability: number;      // 音が鳴る確率
    velocityRange: [number, number]; // ベロシティの範囲
    ghostNotes?: number[];    // ゴーストノートの位置
  }
  
  export const drumRules: { [key: string]: DrumRule } = {
    kickDrum: {
      mainBeats: [0, 8],
      fillBeats: [6, 10, 14],
      accentBeats: [0],
      probability: 0.9,
      velocityRange: [90, 127]
    },
    kickDrumSub: {
      mainBeats: [4, 12],
      fillBeats: [2, 7, 11],
      accentBeats: [4],
      probability: 0.4,
      velocityRange: [80, 110]
    },
    snare: {
      mainBeats: [4, 12],
      fillBeats: [2, 6, 10, 14],
      accentBeats: [4, 12],
      probability: 0.85,
      velocityRange: [85, 120],
      ghostNotes: [3, 7, 11, 15]
    },
    snareSub: {
      mainBeats: [],
      fillBeats: [2, 6, 10, 14],
      accentBeats: [],
      probability: 0.3,
      velocityRange: [70, 90]
    },
    rimShot: {
      mainBeats: [],
      fillBeats: [3, 7, 11, 15],
      accentBeats: [],
      probability: 0.2,
      velocityRange: [60, 90]
    },
    clap: {
      mainBeats: [4, 12],
      fillBeats: [],
      accentBeats: [4, 12],
      probability: 0.4,
      velocityRange: [90, 120]
    },
    closedHihat: {
      mainBeats: [0, 2, 4, 6, 8, 10, 12, 14],
      fillBeats: [1, 3, 5, 7, 9, 11, 13, 15],
      accentBeats: [0, 4, 8, 12],
      probability: 0.95,
      velocityRange: [70, 110]
    },
    openHihat: {
      mainBeats: [],
      fillBeats: [7, 15],
      accentBeats: [],
      probability: 0.4,
      velocityRange: [80, 110]
    },
    pedalHihat: {
      mainBeats: [2, 6, 10, 14],
      fillBeats: [],
      accentBeats: [],
      probability: 0.3,
      velocityRange: [60, 90]
    },
    ride: {
      mainBeats: [0, 2, 4, 6, 8, 10, 12, 14],
      fillBeats: [1, 3, 5, 7, 9, 11, 13, 15],
      accentBeats: [0, 8],
      probability: 0.7,
      velocityRange: [70, 100]
    },
    rideBell: {
      mainBeats: [0, 8],
      fillBeats: [],
      accentBeats: [0],
      probability: 0.3,
      velocityRange: [80, 110]
    },
    crash: {
      mainBeats: [0],
      fillBeats: [8],
      accentBeats: [0],
      probability: 0.4,
      velocityRange: [90, 127]
    },
    splash: {
      mainBeats: [],
      fillBeats: [7, 15],
      accentBeats: [],
      probability: 0.2,
      velocityRange: [70, 100]
    },
    cowbell: {
      mainBeats: [4, 12],
      fillBeats: [],
      accentBeats: [],
      probability: 0.15,
      velocityRange: [60, 90]
    },
    tambourine: {
      mainBeats: [0, 4, 8, 12],
      fillBeats: [2, 6, 10, 14],
      accentBeats: [0, 8],
      probability: 0.4,
      velocityRange: [50, 80]
    },
    shaker: {
      mainBeats: [2, 6, 10, 14],
      fillBeats: [0, 4, 8, 12],
      accentBeats: [],
      probability: 0.5,
      velocityRange: [40, 70]
    },
    conga: {
      mainBeats: [0, 4, 8, 12],
      fillBeats: [2, 6, 10, 14],
      accentBeats: [0, 8],
      probability: 0.3,
      velocityRange: [60, 90]
    },
    bongo: {
      mainBeats: [],
      fillBeats: [1, 3, 5, 7],
      accentBeats: [],
      probability: 0.2,
      velocityRange: [50, 80]
    },
    timbale: {
      mainBeats: [],
      fillBeats: [12, 13, 14, 15],
      accentBeats: [15],
      probability: 0.15,
      velocityRange: [70, 100]
    },
    agogo: {
      mainBeats: [0, 8],
      fillBeats: [4, 12],
      accentBeats: [0],
      probability: 0.2,
      velocityRange: [60, 90]
    },
    woodBlock: {
      mainBeats: [],
      fillBeats: [3, 7, 11, 15],
      accentBeats: [],
      probability: 0.15,
      velocityRange: [50, 80]
    }
  };
  
  export const clipSlotCounter = {
    harmony: 0,
    drums: 0,
    bass: 0
  };
  
  // ドラムスタイルの定義
  export interface DrumStyle {
    name: string;
    activeInstruments: string[];
    probabilities: { [key: string]: number };
  }
  
  export const drumStyles: DrumStyle[] = [
    {
      name: "Basic Rock",
      activeInstruments: ["kickDrum", "snare", "closedHihat", "crash"],
      probabilities: {
        kickDrum: 0.9,
        snare: 0.85,
        closedHihat: 0.95,
        crash: 0.4
      }
    },
    {
      name: "Funk",
      activeInstruments: [
        "kickDrum", "snare", "closedHihat", "openHihat",
        "rimShot", "cowbell", "tambourine"
      ],
      probabilities: {
        kickDrum: 0.8,
        snare: 0.9,
        closedHihat: 0.9,
        openHihat: 0.4,
        rimShot: 0.3,
        cowbell: 0.2,
        tambourine: 0.4
      }
    },
    {
      name: "Jazz",
      activeInstruments: ["kickDrum", "snare", "ride", "rideBell", "crash"],
      probabilities: {
        kickDrum: 0.7,
        snare: 0.8,
        ride: 0.95,
        rideBell: 0.3,
        crash: 0.2
      }
    },
    {
      name: "Latin",
      activeInstruments: [
        "kickDrum", "snare", "conga", "bongo",
        "timbale", "cowbell", "shaker"
      ],
      probabilities: {
        kickDrum: 0.7,
        snare: 0.6,
        conga: 0.8,
        bongo: 0.4,
        timbale: 0.3,
        cowbell: 0.5,
        shaker: 0.9
      }
    },
    {
      name: "Electronic",
      activeInstruments: [
        "kickDrum", "snare", "closedHihat",
        "openHihat", "clap", "rimShot"
      ],
      probabilities: {
        kickDrum: 0.95,
        snare: 0.8,
        closedHihat: 0.9,
        openHihat: 0.3,
        clap: 0.4,
        rimShot: 0.2
      }
    }
  ];