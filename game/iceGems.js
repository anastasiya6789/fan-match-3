// game/iceGems.js
import { gameState } from './gameState.js';
import { levelProgress, updateProgressDisplay } from './levelGoals.js';

// Хранилище для ледяных гемов (их позиций)
export const iceGems = new Set(); // Храним строку "row,col"

// Добавить ледяной гем в сетку
export function addIceGem(scene, row, col) {
  const type = 6; // Тип для ледяных гемов
  
  const container = scene.add.container(
    col * (gameState.GEM_SIZE + gameState.GRID_PADDING) + (gameState.GEM_SIZE + gameState.GRID_PADDING) / 2,
    row * (gameState.GEM_SIZE + gameState.GRID_PADDING) + (gameState.GEM_SIZE + gameState.GRID_PADDING) / 2 + 20
  );

  container.setSize(gameState.GEM_SIZE, gameState.GEM_SIZE);
  container.setInteractive(new Phaser.Geom.Rectangle(0, 0, gameState.GEM_SIZE, gameState.GEM_SIZE), Phaser.Geom.Rectangle.Contains);
  container.setData({ 
    row, col, 
    type, 
    isIce: true, 
    frozen: true, 
    iceId: `${row}-${col}-${Date.now()}`,
    processed: false // 👈 Флаг для отслеживания уже обработанных
  });

  // Голубой фон
  const bg = scene.add.graphics();
  bg.fillStyle(gameState.BG_COLORS[type - 1], 1);
  bg.fillRoundedRect(-gameState.GEM_SIZE/2, -gameState.GEM_SIZE/2, gameState.GEM_SIZE, gameState.GEM_SIZE, 12);
  container.add(bg);

  // Картинка гема
  const img = scene.add.image(0, 0, `gem${type}`);
  const scaleFactor = Math.min(
    (gameState.GEM_SIZE * 0.9) / img.width,
    (gameState.GEM_SIZE * 0.9) / img.height
  );
  img.setScale(scaleFactor);
  container.add(img);

  // Добавляем легкое свечение для льда
  const glow = scene.add.graphics();
  glow.lineStyle(4, 0x88ccff, 0.8);
  glow.strokeRoundedRect(-gameState.GEM_SIZE/2 - 2, -gameState.GEM_SIZE/2 - 2, gameState.GEM_SIZE + 4, gameState.GEM_SIZE + 4, 12);
  container.add(glow);
  container.setData('glow', glow);

  container.on('pointerdown', () => onIceGemClick(container));

  gameState.gems.add(container);
  gameState.grid[row][col] = container;
  
  // Сохраняем в Set
  iceGems.add(`${row},${col}`);
  
  
  return container;
}

// Обработчик клика по ледяному гему
function onIceGemClick(iceGem) {
  if (!iceGem.getData('frozen')) {
    
    import('./gemActions.js').then(module => {
      module.onGemClick(iceGem);
    });
    return;
  }
  
  
  
  iceGem.list[1].setTint(0x666666);
  setTimeout(() => {
    iceGem.list[1].clearTint();
  }, 200);
}

// Разморозить ледяной гем
export function unfreezeIceGem(gem) {
  if (!gem || !gem.getData('isIce')) return;
  if (!gem.getData('frozen')) return;
  
  // 👇 Проверяем, не был ли уже обработан этот лед
  if (gem.getData('processed')) {
    
    return;
  }
  
  
  
  gem.setData('frozen', false);
  gem.setData('processed', true); // 👈 Отмечаем как обработанный
  
  const glow = gem.getData('glow');
  if (glow) {
    glow.destroy();
    gem.setData('glow', null);
  }
  
  // 👇 УВЕЛИЧИВАЕМ СЧЕТЧИК ТОЛЬКО ОДИН РАЗ!
  levelProgress.iceBlocksBroken++;
  
  
  updateProgressDisplay();
  
  const scene = gameState.game.scene.scenes[0];
  scene.tweens.add({
    targets: gem,
    scale: 1.1,
    duration: 150,
    yoyo: true,
    ease: 'Power2'
  });
  
  
}

// Проверить, является ли гем ледяным
export function isIceGem(gem) {
  return gem?.getData('isIce') === true;
}

// Проверить, является ли гем ледяным и замороженным
export function isFrozenIceGem(gem) {
  return gem?.getData('isIce') === true && gem?.getData('frozen') === true;
}

// Обработать удаление соседних гемов (разморозка)
export function checkAdjacentIce(row, col) {
  const adjacentPositions = [
    [row-1, col], [row+1, col], [row, col-1], [row, col+1]
  ];
  
  let unfrozen = false;
  const processedIce = new Set(); // 👈 Множество для отслеживания уже обработанных
  
  adjacentPositions.forEach(([r, c]) => {
    if (r >= 0 && r < gameState.GRID_SIZE && c >= 0 && c < gameState.GRID_SIZE) {
      const gem = gameState.grid[r]?.[c];
      if (gem && gem.getData('isIce') && gem.getData('frozen')) {
        const iceId = gem.getData('iceId');
        // 👇 Проверяем, не обрабатывали ли уже этот лед
        if (!processedIce.has(iceId) && !gem.getData('processed')) {
          processedIce.add(iceId);
         
          unfreezeIceGem(gem);
          unfrozen = true;
        }
      }
    }
  });
  
  return unfrozen;
}

// Инициализация ледяных гемов на уровне
export function initIceGems(scene, count = 5) {
  
  
  iceGems.clear();
  
  const totalGems = gameState.GRID_SIZE * gameState.GRID_SIZE;
  const maxPossible = Math.floor(totalGems * 0.2);
  const iceCount = Math.min(count, maxPossible);
  
  
  
  let placed = 0;
  let attempts = 0;
  const maxAttempts = 2000;
  
  while (placed < iceCount && attempts < maxAttempts) {
    attempts++;
    
    const row = Math.floor(Math.random() * gameState.GRID_SIZE);
    const col = Math.floor(Math.random() * gameState.GRID_SIZE);
    
    if (!gameState.grid[row]?.[col]) {
      addIceGem(scene, row, col);
      placed++;
      
    }
  }
  
  
  return placed;
}

// Удалить ледяной гем (для бустеров)
export function removeIceGem(gem) {
  if (!gem || !gem.getData('isIce')) return;
  
  // 👇 Проверяем, не был ли уже обработан
  if (gem.getData('processed')) {
    
    return;
  }
  
  const row = gem.getData('row');
  const col = gem.getData('col');
  const key = `${row},${col}`;
  
  const scene = gameState.game.scene.scenes[0];
  
  
  
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
  iceGems.delete(key);
  
  // 👇 УНИЧТОЖЕНИЕ ТОЖЕ СЧИТАЕТСЯ В ПРОГРЕСС (но только один раз)
  gem.setData('processed', true);
  levelProgress.iceBlocksBroken++;
  
  
  updateProgressDisplay();
}