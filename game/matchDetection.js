// game/matchDetection.js
import { gameState } from './gameState.js';
import { removeGem } from './removeGem.js';
import { dropGemsAndFill } from './dropGems.js';
import { checkLevelComplete, updateGemProgress, getCurrentLevel, GOAL_TYPES, levelProgress } from './levelGoals.js';
import { showWinModal } from './levelComplete.js';
import { isGiftGem } from './gifts.js';
import { isIceGem, isFrozenIceGem } from './iceGems.js';

// Функция для отладки прогресса
function debugProgress() {
  
}

// Проверить, есть ли подарки в линии
function hasGiftInLine(gems) {
  for (let gem of gems) {
    if (gem && isGiftGem(gem)) {
      return true;
    }
  }
  return false;
}

// Проверить, есть ли замороженный лед в линии
function hasFrozenIceInLine(gems) {
  for (let gem of gems) {
    if (gem && isFrozenIceGem(gem)) {
      return true;
    }
  }
  return false;
}

// Проверить, все ли гемы в линии разморожены (для льда)
function allIceUnfrozen(gems) {
  for (let gem of gems) {
    // Если это лед и он заморожен - нельзя удалять
    if (gem && gem.getData('isIce') && gem.getData('frozen')) {
      return false;
    }
  }
  return true;
}

export async function checkMatches() {
  let matched = false;
  const scene = gameState.game.scene.scenes[0];
  const currentLevel = getCurrentLevel();

  // Проверка горизонтальных совпадений
  for (let row = 0; row < gameState.GRID_SIZE; row++) {
    let count = 1;
    let startCol = 0;
    for (let col = 1; col <= gameState.GRID_SIZE; col++) {
      if (col < gameState.GRID_SIZE && 
          gameState.grid[row][col] && 
          gameState.grid[row][col-1] && 
          gameState.grid[row][col].getData('type') === gameState.grid[row][col-1].getData('type')) {
        count++;
      } else {
        if (count >= 3) {
          // Собираем гемы в линии
          const lineGems = [];
          for (let i = 0; i < count; i++) {
            lineGems.push(gameState.grid[row][startCol + i]);
          }
          
          // Проверяем условия для удаления
          const hasGift = hasGiftInLine(lineGems);
          const hasFrozenIce = hasFrozenIceInLine(lineGems);
          
          if (hasFrozenIce) {
            
          }
          else if (hasGift) {
            
          }
          else {
            // Можно удалять
            matched = true;
            const points = count * 10;
            gameState.levelScore += points;
            
            // Определяем тип гема для прогресса (только если это не лед)
            const gemType = gameState.grid[row][startCol]?.getData('type');
            
            // 👇 Обновляем прогресс ТОЛЬКО для обычных гемов (не лед)
            if (gemType !== 6) {
              updateGemProgress(gemType, count);
              
            }
            
            // Удаляем гемы
            for (let i = 0; i < count; i++) {
              removeGem(gameState.grid[row][startCol + i]);
            }
          }
        }
        if (col < gameState.GRID_SIZE) {
          count = 1;
          startCol = col;
        }
      }
    }
  }

  // Проверка вертикальных совпадений
  for (let col = 0; col < gameState.GRID_SIZE; col++) {
    let count = 1;
    let startRow = 0;
    for (let row = 1; row <= gameState.GRID_SIZE; row++) {
      if (row < gameState.GRID_SIZE && 
          gameState.grid[row][col] && 
          gameState.grid[row-1][col] && 
          gameState.grid[row][col].getData('type') === gameState.grid[row-1][col].getData('type')) {
        count++;
      } else {
        if (count >= 3) {
          // Собираем гемы в линии
          const lineGems = [];
          for (let i = 0; i < count; i++) {
            lineGems.push(gameState.grid[startRow + i][col]);
          }
          
          // Проверяем условия для удаления
          const hasGift = hasGiftInLine(lineGems);
          const hasFrozenIce = hasFrozenIceInLine(lineGems);
          
          if (hasFrozenIce) {
            
          }
          else if (hasGift) {
            
          }
          else {
            // Можно удалять
            matched = true;
            const points = count * 10;
            gameState.levelScore += points;
            
            // Определяем тип гема для прогресса
            const gemType = gameState.grid[startRow][col]?.getData('type');
            
            // 👇 Обновляем прогресс ТОЛЬКО для обычных гемов (не лед)
            if (gemType !== 6) {
              updateGemProgress(gemType, count);
              
            }
            
            // Удаляем гемы
            for (let i = 0; i < count; i++) {
              removeGem(gameState.grid[startRow + i][col]);
            }
          }
        }
        if (row < gameState.GRID_SIZE) {
          count = 1;
          startRow = row;
        }
      }
    }
  }

  // Проверка квадратов 2x2
  for (let row = 0; row < gameState.GRID_SIZE - 1; row++) {
    for (let col = 0; col < gameState.GRID_SIZE - 1; col++) {
      const type = gameState.grid[row][col]?.getData('type');
      if (type && 
          gameState.grid[row][col+1]?.getData('type') === type &&
          gameState.grid[row+1][col]?.getData('type') === type &&
          gameState.grid[row+1][col+1]?.getData('type') === type) {
        
        // Собираем все 4 гема квадрата
        const squareGems = [
          gameState.grid[row][col],
          gameState.grid[row][col+1],
          gameState.grid[row+1][col],
          gameState.grid[row+1][col+1]
        ];
        
        // Проверяем условия для удаления
        const hasGift = hasGiftInLine(squareGems);
        const hasFrozenIce = hasFrozenIceInLine(squareGems);
        
        if (hasFrozenIce) {
          
        }
        else if (hasGift) {
          
        }
        else {
          // Можно удалять
          matched = true;
          gameState.levelScore += 40;
          
          // 👇 Обновляем прогресс ТОЛЬКО для обычных гемов (не лед)
          if (type !== 6) {
            updateGemProgress(type, 4);
            
          }
          
          // Удаляем гемы
          removeGem(gameState.grid[row][col]);
          removeGem(gameState.grid[row][col+1]);
          removeGem(gameState.grid[row+1][col]);
          removeGem(gameState.grid[row+1][col+1]);
        }
      }
    }
  }

  document.getElementById('score').textContent = gameState.levelScore;

  // Отладочный вывод прогресса
  debugProgress();

  // Проверка завершения уровня
  if (checkLevelComplete()) {
    if (!window._levelCompleted) {
      
      window._levelCompleted = true;
      showWinModal(scene);
    } else {
      
    }
  }

  if (matched) {
    scene.time.delayedCall(500, dropGemsAndFill, [], scene);
  }

  checkGameOver();
  return matched;
}

function checkGameOver() {
  if (gameState.movesLeft <= 0 && !window._levelCompleted) {
    const modal = document.getElementById('modal');
    modal.style.display = 'block';
    
    setupGameOverModal();
  }
}

function setupGameOverModal() {
  const addMovesBtn = document.getElementById('add-moves');
  const restartModalBtn = document.getElementById('restart-modal');
  
  const newAddBtn = addMovesBtn.cloneNode(true);
  const newRestartBtn = restartModalBtn.cloneNode(true);
  
  addMovesBtn.parentNode.replaceChild(newAddBtn, addMovesBtn);
  restartModalBtn.parentNode.replaceChild(newRestartBtn, restartModalBtn);
  
  newAddBtn.addEventListener('click', () => {
    gameState.movesLeft += 10;
    document.getElementById('moves').textContent = gameState.movesLeft;
    document.getElementById('modal').style.display = 'none';
  }, { once: true });
  
  newRestartBtn.addEventListener('click', () => {
    document.getElementById('modal').style.display = 'none';
    import('./levelComplete.js').then(module => {
      module.restartLevel();
    });
  }, { once: true });
}