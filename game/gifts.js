// game/gifts.js
import { gameState } from './gameState.js';
import { levelProgress, updateProgressDisplay, getCurrentLevel, GOAL_TYPES } from './levelGoals.js';
import { createGem } from './gridUtils.js';

// Хранилище для подарков (их позиций)
export const giftGems = new Set(); // Храним строку "row,col"

// Добавить подарок в сетку
export function addGiftGem(scene, row, col) {
  const type = 7; // Тип для подарков
  
  const container = scene.add.container(
    col * (gameState.GEM_SIZE + gameState.GRID_PADDING) + (gameState.GEM_SIZE + gameState.GRID_PADDING) / 2,
    row * (gameState.GEM_SIZE + gameState.GRID_PADDING) + (gameState.GEM_SIZE + gameState.GRID_PADDING) / 2 + 20
  );

  container.setSize(gameState.GEM_SIZE, gameState.GEM_SIZE);
  container.setInteractive(new Phaser.Geom.Rectangle(0, 0, gameState.GEM_SIZE, gameState.GEM_SIZE), Phaser.Geom.Rectangle.Contains);
  container.setData({ 
    row, col, 
    type, 
    isGift: true, 
    canMove: true,
    giftId: `${row}-${col}-${Date.now()}`
  });

  // Нежно-розовый фон
  const bg = scene.add.graphics();
  bg.fillStyle(gameState.BG_COLORS[type - 1], 1);
  bg.fillRoundedRect(-gameState.GEM_SIZE/2, -gameState.GEM_SIZE/2, gameState.GEM_SIZE, gameState.GEM_SIZE, 12);
  container.add(bg);

  // Картинка подарка (gem7.png)
  const img = scene.add.image(0, 0, `gem${type}`);
  const scaleFactor = Math.min(
    (gameState.GEM_SIZE * 0.9) / img.width,
    (gameState.GEM_SIZE * 0.9) / img.height
  );
  img.setScale(scaleFactor);
  container.add(img);

  // 👇 ЗВЕЗДОЧКА УДАЛЕНА!

  container.on('pointerdown', () => onGiftGemClick(container));

  gameState.gems.add(container);
  gameState.grid[row][col] = container;
  
  // Сохраняем в Set
  giftGems.add(`${row},${col}`);
  
  
  return container;
}

// Обработчик клика по подарку
function onGiftGemClick(giftGem) {
  
  import('./gemActions.js').then(module => {
    module.onGemClick(giftGem);
  });
}

// Проверить, является ли гем подарком
export function isGiftGem(gem) {
  return gem?.getData('isGift') === true;
}

// Проверить, находится ли подарок внизу
export function isGiftAtBottom(gem) {
  if (!gem || !gem.getData('isGift')) return false;
  return gem.getData('row') === gameState.GRID_SIZE - 1;
}

// Удалить подарок (только бустером или когда внизу)
export function removeGiftGem(gem, fromBooster = false) {
  if (!gem || !gem.getData('isGift')) {
   
    return false;
  }
  
  const row = gem.getData('row');
  const col = gem.getData('col');
  const key = `${row},${col}`;
  const scene = gameState.game.scene.scenes[0];
  
  // Если не бустер и не внизу - нельзя удалить
  if (!fromBooster && row !== gameState.GRID_SIZE - 1) {
    
    return false;
  }
  
  
  
  scene.tweens.add({
    targets: gem,
    scale: 0,
    alpha: 0,
    duration: 250,
    ease: 'Power2',
    onComplete: () => {
      gem.destroy();
    }
  });
  
  gameState.grid[row][col] = null;
  giftGems.delete(key);
  
  levelProgress.giftsDelivered++;
  
  
  updateProgressDisplay();
  
  return true;
}

// Функция для заполнения пустот новыми гемами
function fillEmptySlots(scene) {
  let filled = false;
  
  for (let col = 0; col < gameState.GRID_SIZE; col++) {
    for (let row = 0; row < gameState.GRID_SIZE; row++) {
      if (!gameState.grid[row][col]) {
        // Создаем новый обычный гем (тип 1-5)
        const type = Phaser.Math.Between(1, 5);
        const container = createGem(scene, row, col, type);
        
        // Устанавливаем начальную позицию сверху для анимации падения
        container.y = - (gameState.GEM_SIZE + gameState.GRID_PADDING);
        
        gameState.gems.add(container);
        gameState.grid[row][col] = container;
        
        // Анимация падения
        scene.tweens.add({
          targets: container,
          y: row * (gameState.GEM_SIZE + gameState.GRID_PADDING) + (gameState.GEM_SIZE + gameState.GRID_PADDING) / 2 + 20,
          duration: 400,
          ease: 'Bounce.easeOut'
        });
        
        filled = true;
      }
    }
  }
  
  return filled;
}

// Простое падение без создания новых гемов (только сдвиг)
function simpleDropGems(scene) {
  let anyGemsMoved = false;
  
  for (let col = 0; col < gameState.GRID_SIZE; col++) {
    let emptySlots = 0;

    for (let row = gameState.GRID_SIZE - 1; row >= 0; row--) {
      if (!gameState.grid[row][col]) {
        emptySlots++;
      } else if (emptySlots > 0) {
        const gem = gameState.grid[row][col];
        const targetRow = row + emptySlots;

        gameState.grid[row][col] = null;
        gameState.grid[targetRow][col] = gem;
        gem.setData('row', targetRow);
        anyGemsMoved = true;

        scene.tweens.add({
          targets: gem,
          y: targetRow * (gameState.GEM_SIZE + gameState.GRID_PADDING) + (gameState.GEM_SIZE + gameState.GRID_PADDING) / 2 + 20,
          duration: 300,
          ease: 'Bounce.easeOut'
        });
      }
    }
  }
  
  return anyGemsMoved;
}

// Каскадное удаление подарков (всегда возвращает Promise)
export function cascadeGiftRemoval() {
  return new Promise((resolve) => {
    let totalRemoved = 0;
    const scene = gameState.game.scene.scenes[0];
    
    
    
    function processIteration() {
      // Сначала удаляем подарки внизу
      let removed = 0;
      const processedGifts = new Set();
      
      for (let col = 0; col < gameState.GRID_SIZE; col++) {
        const bottomGem = gameState.grid[gameState.GRID_SIZE - 1][col];
        if (bottomGem && bottomGem.getData('isGift')) {
          const giftId = bottomGem.getData('giftId');
          if (!processedGifts.has(giftId)) {
            processedGifts.add(giftId);
            if (removeGiftGem(bottomGem, false)) {
              removed++;
            }
          }
        }
      }
      
      if (removed > 0) {
        totalRemoved += removed;
        
        
        // Сдвигаем оставшиеся гемы вниз
        const gemsMoved = simpleDropGems(scene);
        
        // Заполняем пустоты новыми гемами
        const filled = fillEmptySlots(scene);
        
        if (gemsMoved || filled) {
          // Ждем завершения анимации и проверяем снова
          scene.time.delayedCall(400, processIteration);
        } else {
          // Если ничего не двигалось и не заполнялось, но были удалены - проверяем еще раз
          scene.time.delayedCall(200, processIteration);
        }
      } else {
        // Больше нет подарков внизу - завершаем
        if (totalRemoved > 0) {
          
        }
        resolve(totalRemoved);
      }
    }
    
    // Запускаем первую итерацию
    processIteration();
  });
}

// Проверить и удалить подарки внизу (старая функция, теперь используется внутри каскада)
export function checkAndRemoveBottomGifts() {
  let removed = 0;
  const processedGifts = new Set();
  
  for (let col = 0; col < gameState.GRID_SIZE; col++) {
    const bottomGem = gameState.grid[gameState.GRID_SIZE - 1][col];
    if (bottomGem && bottomGem.getData('isGift')) {
      const giftId = bottomGem.getData('giftId');
      if (!processedGifts.has(giftId)) {
        processedGifts.add(giftId);
        if (removeGiftGem(bottomGem, false)) {
          removed++;
        }
      }
    }
  }
  
  if (removed > 0) {
   
  }
  
  return removed;
}

// Инициализация подарков на уровне
export function initGiftGems(scene, count = 3) {
  
  
  const currentLevel = getCurrentLevel();
  
  if (!currentLevel || currentLevel.type !== GOAL_TYPES.GIFTS) {
   
    return 0;
  }
  
  const giftCount = currentLevel.target;
  
  
  giftGems.clear();
  
  const totalGems = gameState.GRID_SIZE * gameState.GRID_SIZE;
  const maxGifts = Math.floor(totalGems * 0.3);
  const finalGiftCount = Math.min(giftCount, maxGifts);
  
  if (finalGiftCount < giftCount) {
    
  }
  
  
  
  let placed = 0;
  let attempts = 0;
  const maxAttempts = 2000;
  
  while (placed < finalGiftCount && attempts < maxAttempts) {
    attempts++;
    
    const row = Math.floor(Math.random() * (gameState.GRID_SIZE - 1));
    const col = Math.floor(Math.random() * gameState.GRID_SIZE);
    
    if (!gameState.grid[row]?.[col]) {
      addGiftGem(scene, row, col);
      placed++;
      
    }
  }
  
  
  
  if (placed < finalGiftCount) {
    
  }
  
  return placed;
}