// game/shuffleGrid.js
import { gameState } from './gameState.js';
import { checkMatches } from './matchDetection.js';

export function shuffleGrid() {
  const scene = gameState.game.scene.scenes[0];
  const types = [];
  
  for (let row = 0; row < gameState.GRID_SIZE; row++) {
    for (let col = 0; col < gameState.GRID_SIZE; col++) {
      if (gameState.grid[row][col]) {
        types.push(gameState.grid[row][col].getData('type'));
      }
    }
  }
  
  Phaser.Utils.Array.Shuffle(types);

  let idx = 0;
  for (let row = 0; row < gameState.GRID_SIZE; row++) {
    for (let col = 0; col < gameState.GRID_SIZE; col++) {
      if (gameState.grid[row][col]) {
        const gem = gameState.grid[row][col];
        const newType = types[idx];
        gem.setData('type', newType);

        gem.list[0].clear();
        gem.list[0].fillStyle(gameState.BG_COLORS[newType - 1], 1);
        gem.list[0].fillRoundedRect(-gameState.GEM_SIZE/2, -gameState.GEM_SIZE/2, gameState.GEM_SIZE, gameState.GEM_SIZE, 12);

        gem.list[1].setTexture(`gem${newType}`);
        const scaleFactor = Math.min(
          (gameState.GEM_SIZE * 0.9) / gem.list[1].width,
          (gameState.GEM_SIZE * 0.9) / gem.list[1].height
        );
        gem.list[1].setScale(scaleFactor);

        idx++;
      }
    }
  }
  
  scene.time.delayedCall(300, checkMatches, [], scene);
}