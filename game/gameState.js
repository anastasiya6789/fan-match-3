// game/gameState.js
export const gameState = {
  levelScore: 0,
  coins: 10000,
  currentLevel: 1,
  lifetimeScore: 0,
  movesLeft: 30,
  elapsedTime: 0,
  timerInterval: null,
  sharedPiggy: 12345,
  boosters: { bomb: 3, shuffle: 2, extramoves: 5, '52': 1 },
  isSwapping: false,
  activeBooster: null,
  selectedGem: null,
  game: null,
  gems: null,
  grid: [],
  song: null,
  
  GRID_SIZE: 8,
    GEM_SIZE: 80, // Будет изменяться при масштабировании
  GEM_SIZE_MIN: 40, // Минимальный размер
  GEM_SIZE_MAX: 80, // Максимальный размер
  GRID_PADDING: 8,
  GEM_TYPES: 7,
  BG_COLORS: [0x3498db, 0xf1c40f, 0xe74c3c, 0x2ecc71, 0x9b59b6, 0xf7f7f7, 0xffb7c5],
};

// Флаг для предотвращения множественного начисления
export let levelCompletedFlag = false;

export function setLevelCompleted(value) {
  levelCompletedFlag = value;
}

export function resetGameState() {
  gameState.selectedGem = null;
  gameState.isSwapping = false;
  gameState.grid = [];
  gameState.gems = null;
  gameState.song = null;
  gameState.activeBooster = null; // Важно сбрасывать!
}

// Добавьте эту функцию в gameState.js
export function updateGoalText() {
  import('./levelGoals.js').then(module => {
    document.getElementById('goal-text').textContent = module.getLevelText();
  });
}

// В gameState.js, замените наблюдатель на этот:

let lastActiveBooster = null;
let lastChangeTime = null;
let changeCount = 0;

setInterval(() => {
  if (gameState.activeBooster !== lastActiveBooster) {
    changeCount++;
    const timeSinceLastChange = lastChangeTime ? Date.now() - lastChangeTime : 0;
    
    
    
    lastActiveBooster = gameState.activeBooster;
    lastChangeTime = Date.now();
  }
}, 100);