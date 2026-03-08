// game/swapGems.js
import { gameState } from './gameState.js';
import { checkMatches } from './matchDetection.js';

export function swapGems(gem1, gem2, reverse = false) {
  if (!gem1 || !gem2 || !gem1.active || !gem2.active) {
    gameState.isSwapping = false;
    return;
  }

  gameState.isSwapping = true;
  const scene = gameState.game.scene.scenes[0];

  scene.tweens.add({
    targets: gem1,
    x: gem2.x,
    y: gem2.y,
    duration: 200,
    ease: 'Power1'
  });

  scene.tweens.add({
    targets: gem2,
    x: gem1.x,
    y: gem1.y,
    duration: 200,
    ease: 'Power1',
    onComplete: () => {
      if (!gem1.active || !gem2.active) {
        gameState.isSwapping = false;
        return;
      }

      const r1 = gem1.getData('row'), c1 = gem1.getData('col');
      const r2 = gem2.getData('row'), c2 = gem2.getData('col');

      gameState.grid[r1][c1] = gem2;
      gameState.grid[r2][c2] = gem1;

      gem1.setData({ row: r2, col: c2 });
      gem2.setData({ row: r1, col: c1 });

      if (!reverse) {
        scene.time.delayedCall(100, async () => {
          const matched = await checkMatches();

          if (!matched) {
            swapGems(gem1, gem2, true);
          } else {
            gameState.movesLeft--;
            document.getElementById('moves').textContent = gameState.movesLeft;
          }
          gameState.isSwapping = false;
        });
      } else {
        gameState.isSwapping = false;
      }
    }
  });
}