// game/dropGems.js
import { gameState } from './gameState.js';
import { createGem } from './gridUtils.js';
import { checkMatches } from './matchDetection.js';
import { cascadeGiftRemoval, giftGems } from './gifts.js'; // 👈 ИМПОРТИРУЕМ giftGems

export function dropGemsAndFill() {
  const scene = gameState.game.scene.scenes[0];
  let hasNewMatches = false;

  for (let col = 0; col < gameState.GRID_SIZE; col++) {
    let emptySlots = 0;

    // Сдвигаем существующие гемы вниз
    for (let row = gameState.GRID_SIZE - 1; row >= 0; row--) {
      if (!gameState.grid[row][col]) {
        emptySlots++;
      } else if (emptySlots > 0) {
        const gem = gameState.grid[row][col];
        const targetRow = row + emptySlots;

        gameState.grid[row][col] = null;
        gameState.grid[targetRow][col] = gem;
        gem.setData('row', targetRow);

        scene.tweens.add({
          targets: gem,
          y: targetRow * (gameState.GEM_SIZE + gameState.GRID_PADDING) + (gameState.GEM_SIZE + gameState.GRID_PADDING) / 2 + 20,
          duration: 400,
          ease: 'Bounce.easeOut'
        });
      }
    }

    // Создаем новые гемы сверху
    for (let i = 0; i < emptySlots; i++) {
      const type = Phaser.Math.Between(1, 5);
      const startY = - (gameState.GEM_SIZE + gameState.GRID_PADDING) * (emptySlots - i);
      const targetRow = i;

      const container = createGem(scene, targetRow, col, type);
      container.y = startY;
      
      gameState.gems.add(container);
      gameState.grid[targetRow][col] = container;

      scene.tweens.add({
        targets: container,
        y: targetRow * (gameState.GEM_SIZE + gameState.GRID_PADDING) + (gameState.GEM_SIZE + gameState.GRID_PADDING) / 2 + 20,
        duration: 500 + i * 80,
        ease: 'Bounce.easeOut',
        onComplete: () => {
          if (i === emptySlots - 1) {
            scene.time.delayedCall(200, () => {
              // 👇 ПРОВЕРЯЕМ, ЕСТЬ ЛИ ПОДАРКИ ВООБЩЕ
              if (giftGems.size > 0) {
                cascadeGiftRemoval().then((removed) => {
                  if (removed > 0) {
                    
                    scene.time.delayedCall(300, checkMatches, [], scene);
                  } else {
                    checkMatches();
                  }
                });
              } else {
                checkMatches();
              }
            });
          }
        }
      });
    }
  }
}