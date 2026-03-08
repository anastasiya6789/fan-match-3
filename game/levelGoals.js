// game/levelGoals.js
import { gameState } from './gameState.js';

export const GOAL_TYPES = {
  SCORE: 'score',
  RED_GEMS: 'red_gems',
  BLUE_GEMS: 'blue_gems',
  GREEN_GEMS: 'green_gems',
  YELLOW_GEMS: 'yellow_gems',
  PURPLE_GEMS: 'purple_gems',
  ICE_BLOCKS: 'ice_blocks',
  GIFTS: 'gifts'
};

// 👇 Соответствие цветов типам гемов
export const GEM_COLORS = {
  1: GOAL_TYPES.BLUE_GEMS,    // тип 1 - синий
  2: GOAL_TYPES.YELLOW_GEMS,  // тип 2 - желтый
  3: GOAL_TYPES.RED_GEMS,     // тип 3 - красный
  4: GOAL_TYPES.GREEN_GEMS,   // тип 4 - зеленый
  5: GOAL_TYPES.PURPLE_GEMS,  // тип 5 - фиолетовый
  6: GOAL_TYPES.ICE_BLOCKS,   // тип 6 - лед
  7: GOAL_TYPES.GIFTS         // тип 7 - подарки
};

// 👇 Фиксированные значения для разных типов целей
const SCORE_TARGETS = [500, 800, 1000, 1200, 1500];
const GEM_TARGETS = [15, 30, 45, 60, 75, 90, 105, 120, 135, 150];
const GIFT_TARGETS = [3, 5, 7, 9, 11];
const ICE_TARGETS = [5, 8, 10, 15];

export let LEVEL_CONFIG = [];

export const levelProgress = {
  redGemsCollected: 0,
  blueGemsCollected: 0,
  greenGemsCollected: 0,
  yellowGemsCollected: 0,
  purpleGemsCollected: 0,
  iceBlocksBroken: 0,
  giftsDelivered: 0
};

// Функция для обновления отображения прогресса
export function updateProgressDisplay() {
  const level = getCurrentLevel();
  if (!level) return;
  
  const progressContainer = document.getElementById('progress-container');
  const progressBar = document.getElementById('progress-bar');
  const progressCurrent = document.getElementById('progress-current');
  const progressTarget = document.getElementById('progress-target');
  
  if (!progressContainer || !progressBar || !progressCurrent || !progressTarget) {
    
    return;
  }
  
  if (level.type === GOAL_TYPES.SCORE) {
    progressContainer.style.display = 'none';
    return;
  }
  
  progressContainer.style.display = 'block';
  
  let current = 0;
  let target = level.target;
  
  switch(level.type) {
    case GOAL_TYPES.RED_GEMS:
      current = levelProgress.redGemsCollected;
      
      break;
    case GOAL_TYPES.BLUE_GEMS:
      current = levelProgress.blueGemsCollected;
      
      break;
    case GOAL_TYPES.GREEN_GEMS:
      current = levelProgress.greenGemsCollected;
      
      break;
    case GOAL_TYPES.YELLOW_GEMS:
      current = levelProgress.yellowGemsCollected;
      
      break;
    case GOAL_TYPES.PURPLE_GEMS:
      current = levelProgress.purpleGemsCollected;
      
      break;
    case GOAL_TYPES.ICE_BLOCKS:
      current = levelProgress.iceBlocksBroken;
      
      break;
    case GOAL_TYPES.GIFTS:
      current = levelProgress.giftsDelivered;
      
      break;
  }
  
  progressCurrent.textContent = current;
  progressTarget.textContent = target;
  progressBar.value = current;
  progressBar.max = target;
  
  if (current >= target) {
    progressBar.style.accentColor = '#4CAF50';
  } else if (current > target * 0.7) {
    progressBar.style.accentColor = '#FFD700';
  } else {
    progressBar.style.accentColor = '#FF6B6B';
  }
}

// 👇 Функция для получения случайного значения из массива
function getRandomTarget(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomLevel(levelNumber) {
  const types = [
    GOAL_TYPES.SCORE,
    GOAL_TYPES.RED_GEMS,
    GOAL_TYPES.BLUE_GEMS,
    GOAL_TYPES.GREEN_GEMS,
    GOAL_TYPES.YELLOW_GEMS,
    GOAL_TYPES.PURPLE_GEMS,
    GOAL_TYPES.ICE_BLOCKS,
    GOAL_TYPES.GIFTS
  ];
  
  // Максимальное количество льда, которое можно разместить (20% от сетки)
  const maxIcePossible = Math.floor(gameState.GRID_SIZE * gameState.GRID_SIZE * 0.2);
  
  if (levelNumber === 1) {
    return {
      type: GOAL_TYPES.SCORE,
      target: 500,
      text: "Набери 500 очков"
    };
  }
  
  const randomType = types[Math.floor(Math.random() * types.length)];
  
  switch(randomType) {
    case GOAL_TYPES.SCORE:
      const scoreTarget = getRandomTarget(SCORE_TARGETS);
      return {
        type: GOAL_TYPES.SCORE,
        target: scoreTarget,
        text: `Набери ${scoreTarget} очков`
      };
      
    case GOAL_TYPES.RED_GEMS:
      const redTarget = getRandomTarget(GEM_TARGETS);
      return {
        type: GOAL_TYPES.RED_GEMS,
        target: redTarget,
        text: `Собери ${redTarget} красных гемов`
      };
      
    case GOAL_TYPES.BLUE_GEMS:
      const blueTarget = getRandomTarget(GEM_TARGETS);
      return {
        type: GOAL_TYPES.BLUE_GEMS,
        target: blueTarget,
        text: `Собери ${blueTarget} синих гемов`
      };
      
    case GOAL_TYPES.GREEN_GEMS:
      const greenTarget = getRandomTarget(GEM_TARGETS);
      return {
        type: GOAL_TYPES.GREEN_GEMS,
        target: greenTarget,
        text: `Собери ${greenTarget} зеленых гемов`
      };
      
    case GOAL_TYPES.YELLOW_GEMS:
      const yellowTarget = getRandomTarget(GEM_TARGETS);
      return {
        type: GOAL_TYPES.YELLOW_GEMS,
        target: yellowTarget,
        text: `Собери ${yellowTarget} желтых гемов`
      };
      
    case GOAL_TYPES.PURPLE_GEMS:
      const purpleTarget = getRandomTarget(GEM_TARGETS);
      return {
        type: GOAL_TYPES.PURPLE_GEMS,
        target: purpleTarget,
        text: `Собери ${purpleTarget} фиолетовых гемов`
      };
      
    case GOAL_TYPES.ICE_BLOCKS:
      let iceTarget = getRandomTarget(ICE_TARGETS);
      // Проверяем, что target не превышает максимальное количество льда
      const adjustedIceTarget = Math.min(iceTarget, maxIcePossible);
      
      if (adjustedIceTarget < iceTarget) {
        
      }
      
      return {
        type: GOAL_TYPES.ICE_BLOCKS,
        target: adjustedIceTarget,
        text: `Разбей ледяную оболочку зетника ${adjustedIceTarget} раз`
      };
      
    case GOAL_TYPES.GIFTS:
      const giftTarget = getRandomTarget(GIFT_TARGETS);
      return {
        type: GOAL_TYPES.GIFTS,
        target: giftTarget,
        text: `Опусти Лешика ${giftTarget} раз`
      };
      
    default:
      return {
        type: GOAL_TYPES.SCORE,
        target: 500,
        text: "Набери 500 очков"
      };
  }
}

export function initLevels(maxLevel = 20) {
  LEVEL_CONFIG = [];
  for (let i = 1; i <= maxLevel; i++) {
    LEVEL_CONFIG.push(generateRandomLevel(i));
  }
  
}

export function getCurrentLevel() {
  return LEVEL_CONFIG[gameState.currentLevel - 1] || LEVEL_CONFIG[0];
}

export function getLevelText() {
  const level = getCurrentLevel();
  return level ? level.text : "Пройди уровень";
}

export function checkLevelComplete() {
  const level = getCurrentLevel();
  if (!level) return false;

  let completed = false;
  
  switch (level.type) {
    case GOAL_TYPES.SCORE:
      completed = gameState.levelScore >= level.target;
      
      break;
      
    case GOAL_TYPES.RED_GEMS:
      completed = levelProgress.redGemsCollected >= level.target;
      
      break;
      
    case GOAL_TYPES.BLUE_GEMS:
      completed = levelProgress.blueGemsCollected >= level.target;
      
      break;
      
    case GOAL_TYPES.GREEN_GEMS:
      completed = levelProgress.greenGemsCollected >= level.target;
      
      break;
      
    case GOAL_TYPES.YELLOW_GEMS:
      completed = levelProgress.yellowGemsCollected >= level.target;
      
      break;
      
    case GOAL_TYPES.PURPLE_GEMS:
      completed = levelProgress.purpleGemsCollected >= level.target;
      
      break;
      
    case GOAL_TYPES.ICE_BLOCKS:
      completed = levelProgress.iceBlocksBroken >= level.target;
      
      break;
      
    case GOAL_TYPES.GIFTS:
      completed = levelProgress.giftsDelivered >= level.target;
      
      break;
  }
  
  if (completed) {
    
  }
  
  return completed;
}

export function resetLevelProgress() {
  
  levelProgress.redGemsCollected = 0;
  levelProgress.blueGemsCollected = 0;
  levelProgress.greenGemsCollected = 0;
  levelProgress.yellowGemsCollected = 0;
  levelProgress.purpleGemsCollected = 0;
  levelProgress.iceBlocksBroken = 0;
  levelProgress.giftsDelivered = 0;
  updateProgressDisplay();
}

export function updateGemProgress(gemType, count = 1) {
  
  
  const color = GEM_COLORS[gemType];
  if (!color) {
    
    return;
  }
  
  
  
  // Для льда (тип 6) не обновляем прогресс здесь
  if (gemType === 6) {
    
    return;
  }
  
  switch(color) {
    case GOAL_TYPES.RED_GEMS:
      levelProgress.redGemsCollected += count;
      
      break;
    case GOAL_TYPES.BLUE_GEMS:
      levelProgress.blueGemsCollected += count;
      
      break;
    case GOAL_TYPES.GREEN_GEMS:
      levelProgress.greenGemsCollected += count;
      
      break;
    case GOAL_TYPES.YELLOW_GEMS:
      levelProgress.yellowGemsCollected += count;
      
      break;
    case GOAL_TYPES.PURPLE_GEMS:
      levelProgress.purpleGemsCollected += count;
      
      break;
    case GOAL_TYPES.GIFTS:
      levelProgress.giftsDelivered += count;
      
      break;
    default:
      
  }
  
  updateProgressDisplay();
}