// game/index.js
import { gameState, resetGameState, setLevelCompleted } from './gameState.js';
import { LEVEL_CONFIG, GOAL_TYPES, levelProgress, checkLevelComplete, getLevelText, getCurrentLevel, resetLevelProgress } from './levelGoals.js';
import { createGem, hasMatchAtStart, areNeighbors } from './gridUtils.js';
import { onGemClick } from './gemActions.js';
import { swapGems } from './swapGems.js';
import { checkMatches } from './matchDetection.js';
import { removeGem, forceRemoveGem } from './removeGem.js';
import { dropGemsAndFill } from './dropGems.js';
import { useBooster } from './boosters.js';
import { shuffleGrid } from './shuffleGrid.js';
import { showWinModal } from './levelComplete.js';
import { initIceGems, isIceGem, isFrozenIceGem, iceGems } from './iceGems.js';
import { initGiftGems, isGiftGem, giftGems } from './gifts.js';

// Экспортируем всё
export { 
  gameState, 
  resetGameState, 
  setLevelCompleted,
  LEVEL_CONFIG,
  GOAL_TYPES,
  levelProgress,
  checkLevelComplete,
  getLevelText,
  createGem,
  hasMatchAtStart,
  areNeighbors,
  onGemClick,
  swapGems,
  checkMatches,
  removeGem,
  forceRemoveGem,
  dropGemsAndFill,
  useBooster,
  shuffleGrid,
  showWinModal,
  initIceGems,
  isIceGem,
  isFrozenIceGem,
  iceGems,
  initGiftGems,
  isGiftGem,
  giftGems
};

// Функция create для Phaser
export function create() {
  
  
  gameState.gems = this.add.group();
  gameState.grid = Array.from({ length: gameState.GRID_SIZE }, () => Array(gameState.GRID_SIZE).fill(null));
  gameState.song = this.sound.add('victory');

  // Создаем пустую сетку
  for (let row = 0; row < gameState.GRID_SIZE; row++) {
    for (let col = 0; col < gameState.GRID_SIZE; col++) {
      gameState.grid[row][col] = null;
    }
  }

  const currentLevel = getCurrentLevel();
  
  // 1. СНАЧАЛА добавляем ледяные гемы (тип 6)
  let iceCount = 0;
  if (currentLevel && currentLevel.type === GOAL_TYPES.ICE_BLOCKS) {
    iceCount = 8 + gameState.currentLevel * 2;
    
  } else {
    iceCount = 3;
    
  }
  const placedIce = initIceGems(this, iceCount);
  

  // 2. ПОТОМ добавляем подарки (тип 7) - ТОЛЬКО на уровнях с подарками!
  let giftCount = 0;
  if (currentLevel && currentLevel.type === GOAL_TYPES.GIFTS) {
    // Логика количества подарков в зависимости от уровня
    if (gameState.currentLevel <= 5) {
      giftCount = 3;
    } else if (gameState.currentLevel <= 10) {
      giftCount = 5;
    } else {
      giftCount = 8;
    }
    
    
    const placedGifts = initGiftGems(this, giftCount);
    
  } else {
    
  }

  // 3. ПОТОМ заполняем оставшиеся места обычными гемами (типы 1-5)
  for (let row = 0; row < gameState.GRID_SIZE; row++) {
    for (let col = 0; col < gameState.GRID_SIZE; col++) {
      // Если место уже занято ледяным гемом или подарком - пропускаем
      if (gameState.grid[row][col] !== null) continue;
      
      // Генерируем только типы 1-5 для обычных гемов
      let type = Phaser.Math.Between(1, 5);
      let attempts = 0;
      while (hasMatchAtStart(row, col, type) && attempts < 50) {
        type = Phaser.Math.Between(1, 5);
        attempts++;
      }
      
      const container = createGem(this, row, col, type);
      gameState.gems.add(container);
      gameState.grid[row][col] = container;
    }
  }
  
  // СБРАСЫВАЕМ ПРОГРЕСС ПРИ СОЗДАНИИ НОВОГО УРОВНЯ
  resetLevelProgress();
  
  
  // Обновляем текст цели
  const goalText = getLevelText();
  document.getElementById('goal-text').textContent = goalText;
}

export function initGameLogic(phaserGame) {
  
  gameState.game = phaserGame;
}