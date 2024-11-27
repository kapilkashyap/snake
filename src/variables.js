import { DefaultDirection, Modes } from "./constants.js";
import predefinedMazeCoordinates from "../assets/data/predefined-maze-coordinates.js";

// DEFAULT SETTINGS
export const DefaultSettings = {
  snakeLength: 3,
  snakeLife: 3,
  direction: DefaultDirection,
  selectedMode: Modes.availableModes[0],
  coordinates: predefinedMazeCoordinates['12x12'],
  swipeThreshold: 25, // required minimum distance traveled to be considered swipe
  defaultSwipeAngleMinThreshold: 27, // minimum restraint for a right-angled movement
  defaultSwipeAngleMaxThreshold: 63, // maximum restraint for a right-angled movement
  allowedTime: 300 // maximum time allowed to travel that distance
};

export const Locals = {
  row: undefined,
  column: undefined,
  prevDirection: undefined,
  prevSnakeLength: 0,
  rowsCount: undefined,
  columnsCount: undefined,
  totalRectsCount: undefined,
  totalRectsCountChallengeMode: undefined,
  speed: undefined,
};

// THRESHOLDS
export const Thresholds = {
  baseThresholds: [],
  northThreshold: undefined,
  westThreshold: undefined,
  eastThreshold: undefined,
  southThreshold: undefined,
};

// TOUCH EVENT VARIABLES
export const TouchEventVariables = {
  isGesture: false,
  startX: undefined,
  startY: undefined,
  endX: undefined,
  endY: undefined,
  deltaX: undefined,
  deltaY: undefined,
  startTime: undefined,
  elapsedTime: undefined,
  swipeDirection: undefined,
  swipeAngle: undefined,
  swipeAngleMinThreshold: undefined,
  swipeAngleMaxThreshold: undefined,
  thresholdPassed: false,
};

// GAME CONFIG
export const GameConfig = {
  interval: undefined,
  timerInterval: undefined,
  scoreInterval: undefined,
  flickerInterval: undefined,
  selectedCoordinates: undefined,
  nodes: [],
  removeNodes: [],
  meals: [],
  dangers: [],
  movesQueue: [],
  gameState: undefined,
  levelUpPeriod: undefined,
  maxLevel: undefined,
  mazePathTraversed: 0,
  gameProgressFactor: undefined,
  gameProgressBar: undefined,
  level: 1,
  levelNode: undefined,
  incrementLevel: false,
  score: 0,
  scoreNode: undefined
  // time=0.0,
  // timerNode=document.querySelector(".time>.value"),
};
