// Step definitions for Shambhavi Mahamudra Kriya
// Audio files are in public/audio/

export const STEP_TYPES = {
  TIMED: 'timed',        // Fixed or custom duration countdown
  AUM: 'aum',            // Special AUM step with 21 repetitions
};

export const DEFAULT_SETTINGS = {
  aumVariant: 5,              // 5, 6, or 7
  catStretchDuration: 270,    // 4:30 in seconds
  bandhaDuration: 150,        // 2:30 in seconds
};

// Build steps array with custom settings
export function buildSteps(settings = {}) {
  const {
    aumVariant = DEFAULT_SETTINGS.aumVariant,
    catStretchDuration = DEFAULT_SETTINGS.catStretchDuration,
    bandhaDuration = DEFAULT_SETTINGS.bandhaDuration,
  } = settings;

  return [
    {
      id: 1,
      name: 'Vẫy cánh bướm',
      duration: 135, // 2:15
      type: STEP_TYPES.TIMED,
      audioIntro: '/audio/01_vaycanhbuom.m4a',
      section: 'warmup',
    },
    {
      id: 2,
      name: 'Ru em – chân phải',
      duration: 135, // 2:15
      type: STEP_TYPES.TIMED,
      audioIntro: '/audio/02_ruemchanphai.m4a',
      section: 'warmup',
    },
    {
      id: 3,
      name: 'Ru em – chân trái',
      duration: 135, // 2:15
      type: STEP_TYPES.TIMED,
      audioIntro: '/audio/03_ruemchantrai.m4a',
      section: 'warmup',
    },
    {
      id: 4,
      name: 'Mèo duỗi',
      duration: catStretchDuration,
      type: STEP_TYPES.TIMED,
      audioIntro: '/audio/04_meoduoi.m4a',
      section: 'warmup',
      customizable: true,
    },
    {
      id: 5,
      name: 'Thở luân phiên',
      duration: 420, // 7:00
      type: STEP_TYPES.TIMED,
      audioIntro: '/audio/06_tholuanphien.m4a',
      section: 'main',
    },
    {
      id: 6,
      name: 'Phát âm AUM',
      type: STEP_TYPES.AUM,
      audioIntro: '/audio/07_phatamaum.m4a',
      aumAudio: `/audio/phatamaum_${aumVariant}.m4a`,
      aumRepetitions: 21,
      aumSilenceGap: 4, // 4 seconds silence between repetitions
      section: 'main',
    },
    {
      id: 7,
      name: 'Thở rung động',
      duration: 240, // 4:00
      type: STEP_TYPES.TIMED,
      audioIntro: '/audio/08_thorungdong.m4a',
      section: 'main',
    },
    {
      id: 8,
      name: 'Khóa Bandhas',
      duration: bandhaDuration,
      type: STEP_TYPES.TIMED,
      audioIntro: '/audio/09_khoabandha.m4a',
      section: 'main',
      customizable: true,
    },
    {
      id: 9,
      name: 'Thả lỏng, quan sát hơi thở',
      duration: 360, // 6:00
      type: STEP_TYPES.TIMED,
      audioIntro: '/audio/10_thalongquansathoitho.m4a',
      section: 'main',
    },
  ];
}

export const COMPLETION_AUDIO = '/audio/11_kethucbaitap.m4a';
