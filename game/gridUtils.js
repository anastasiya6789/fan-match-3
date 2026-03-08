// game/gridUtils.js
import { gameState } from './gameState.js';
import { onGemClick } from './gemActions.js';

export function createGem(scene, row, col, type) {
  // Проверяем, что тип в допустимом диапазоне
  if (type < 1 || type > gameState.GEM_TYPES) {
    type = 1;
  }

  const container = scene.add.container(
    col * (gameState.GEM_SIZE + gameState.GRID_PADDING) + (gameState.GEM_SIZE + gameState.GRID_PADDING) / 2,
    row * (gameState.GEM_SIZE + gameState.GRID_PADDING) + (gameState.GEM_SIZE + gameState.GRID_PADDING) / 2 + 20
  );

  container.setSize(gameState.GEM_SIZE, gameState.GEM_SIZE);
  container.setInteractive(new Phaser.Geom.Rectangle(0, 0, gameState.GEM_SIZE, gameState.GEM_SIZE), Phaser.Geom.Rectangle.Contains);
  container.setData({ row, col, type });

  // Фон гема
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

  // Добавляем специальные визуальные эффекты для особых типов
  if (type === 6) { // Ледяной гем
    const glow = scene.add.graphics();
    glow.lineStyle(4, 0x88ccff, 0.8);
    glow.strokeRoundedRect(-gameState.GEM_SIZE/2 - 2, -gameState.GEM_SIZE/2 - 2, gameState.GEM_SIZE + 4, gameState.GEM_SIZE + 4, 12);
    container.add(glow);
    container.setData('glow', glow);
    container.setData('isIce', true);
    container.setData('frozen', true);
  } 
  else if (type === 7) { // Подарок
    container.setData('isGift', true);
  }

  container.on('pointerdown', () => onGemClick(container));

  return container;
}

export function hasMatchAtStart(row, col, type) {
  // Проверка горизонтальных совпадений
  if (col >= 2 && 
      gameState.grid[row]?.[col-1]?.getData('type') === type && 
      gameState.grid[row]?.[col-2]?.getData('type') === type) {
    return true;
  }
  
  // Проверка вертикальных совпадений
  if (row >= 2 && 
      gameState.grid[row-1]?.[col]?.getData('type') === type && 
      gameState.grid[row-2]?.[col]?.getData('type') === type) {
    return true;
  }
  
  return false;
}

export function areNeighbors(gem1, gem2) {
  if (!gem1 || !gem2) return false;
  
  const r1 = gem1.getData('row');
  const c1 = gem1.getData('col');
  const r2 = gem2.getData('row');
  const c2 = gem2.getData('col');
  
  return (Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1);
}

// Вспомогательная функция для обновления визуала гема (если тип меняется)
export function updateGemVisual(gem, newType) {
  if (!gem) return;
  
  const oldType = gem.getData('type');
  if (oldType === newType) return;
  
  gem.setData('type', newType);
  
  // Обновляем фон
  gem.list[0].clear();
  gem.list[0].fillStyle(gameState.BG_COLORS[newType - 1], 1);
  gem.list[0].fillRoundedRect(-gameState.GEM_SIZE/2, -gameState.GEM_SIZE/2, gameState.GEM_SIZE, gameState.GEM_SIZE, 12);
  
  // Обновляем картинку
  gem.list[1].setTexture(`gem${newType}`);
  
  // Обновляем специальные эффекты
  if (oldType === 6) {
    const glow = gem.getData('glow');
    if (glow) glow.destroy();
    gem.setData('isIce', false);
    gem.setData('frozen', false);
  }
  
  if (newType === 6) {
    const scene = gem.scene;
    const glow = scene.add.graphics();
    glow.lineStyle(4, 0x88ccff, 0.8);
    glow.strokeRoundedRect(-gameState.GEM_SIZE/2 - 2, -gameState.GEM_SIZE/2 - 2, gameState.GEM_SIZE + 4, gameState.GEM_SIZE + 4, 12);
    gem.add(glow);
    gem.setData('glow', glow);
    gem.setData('isIce', true);
    gem.setData('frozen', true);
  }
  
  if (newType === 7) {
    gem.setData('isGift', true);
  }
}