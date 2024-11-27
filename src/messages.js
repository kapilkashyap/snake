import config from "../assets/config.js";

export const initMessages = (isPortableMode) => {
  return {
    START: isPortableMode ? 'Press play button to start.' : 'Press space bar to start.',
    RESET: isPortableMode ? 'Press reset button.' : "Press 'R' to reset.",
    PAUSE: isPortableMode ? '' : 'Press space bar to pause.',
    RESUME: isPortableMode ? 'Press play button to resume.' : 'Press space bar to resume.',
    LIVES_REMAINING: 'lives remaining!',
    LIFE_REMAINING: 'life remaining!',
    GAME_OVER: 'Game over!',
    CONGRATULATIONS: 'Congratulations',
    LEVEL_UNLOCKED: 'level unlocked!',
    AMAZING: 'Amazing',
    ALL_LEVELS_COMPLETED: 'all levels completed!',
    TOP_N_SCORES: `Your top ${config.topScoreLimit} scores will appear here...`,
    PLAY_BUTTON_LABEL: 'Play',
    PAUSE_BUTTON_LABEL: 'Pause',
    DISCLAIMER: 'Works best on desktop.',
    EXCLAMATION: '!',
    COMMA: ', ',
    SPACE: ' ',
    WELL_DONE: 'Congratulations & well done! :)',
  };
};
