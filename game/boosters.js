// game/boosters.js
import { gameState } from './gameState.js';
import { removeGem } from './removeGem.js';
import { shuffleGrid } from './shuffleGrid.js';
import { dropGemsAndFill } from './dropGems.js';
import { checkMatches } from './matchDetection.js';
import { forceRemoveGem } from './removeGem.js';
import { updateGemProgress } from './levelGoals.js';

export function useBooster(clickedGem, forcedBooster = null) {
  const booster = forcedBooster || gameState.activeBooster;
  
  

  if (!booster) {
    
    return;
  }

  if (!clickedGem) {
   
    gameState.activeBooster = null;
    return;
  }

  const scene = gameState.game?.scene?.scenes[0];
  if (!scene) {
    
    gameState.activeBooster = null;
    return;
  }

  let used = false;

  if (booster === 'bomb') {
    const row = clickedGem.getData('row');
    const col = clickedGem.getData('col');
    
    
    const gemsToRemove = [];
    
    for (let r = Math.max(0, row - 1); r <= Math.min(gameState.GRID_SIZE - 1, row + 1); r++) {
      for (let c = Math.max(0, col - 1); c <= Math.min(gameState.GRID_SIZE - 1, col + 1); c++) {
        if (gameState.grid[r]?.[c]) {
          gemsToRemove.push(gameState.grid[r][c]);
        }
      }
    }
    
    gemsToRemove.forEach(gem => {
      const type = gem.getData('type');
      if (type >= 1 && type <= 5) {
        updateGemProgress(type, 1);
        
      }
    });
    
    gemsToRemove.forEach(gem => {
      
      forceRemoveGem(gem);
    });
    
    gameState.boosters.bomb--;
    used = true;
    
  } else if (booster === 'extramoves') {
   
    gameState.movesLeft += 5;
    document.getElementById('moves').textContent = gameState.movesLeft;
    gameState.boosters.extramoves--;
    used = true;
    
  } else if (booster === 'shuffle') {
   
    shuffleGrid();
    gameState.boosters.shuffle--;
    used = true;
    
  } else if (booster === '52') {
    const row = clickedGem.getData('row');
    const col = clickedGem.getData('col');
    
    
    const gemsToRemove = [];
    
    for (let c = Math.max(0, col - 2); c < Math.min(gameState.GRID_SIZE, col + 3); c++) {
      for (let r = Math.max(0, row - 1); r < Math.min(gameState.GRID_SIZE, row + 1); r++) {
        if (gameState.grid[r]?.[c]) {
          gemsToRemove.push(gameState.grid[r][c]);
        }
      }
    }
    
    gemsToRemove.forEach(gem => {
      const type = gem.getData('type');
      if (type >= 1 && type <= 5) {
        updateGemProgress(type, 1);
        
      }
    });
    
    gemsToRemove.forEach(gem => {
      
      forceRemoveGem(gem);
    });
    
    gameState.boosters['52']--;
    used = true;
  }

  if (used) {
    
    
    const countElement = document.getElementById(`${booster}-count`);
    if (countElement) {
      countElement.textContent = gameState.boosters[booster];
    }
    
    const activeElement = document.querySelector(`[data-booster="${booster}"]`);
    if (activeElement) {
      activeElement.classList.remove('active');
    }
    
    // 👇 СОХРАНЯЕМ В БД ПОСЛЕ ИСПОЛЬЗОВАНИЯ
    import('../supabase.js').then(async ({ getCurrentUser, saveProgress }) => {
      const user = await getCurrentUser();
      if (user) {
        await saveProgress(
          user.id,
          gameState.currentLevel,
          gameState.lifetimeScore,
          gameState.coins,
          gameState.boosters
        );
       
      }
    });
    
    gameState.activeBooster = null;
    window._boosterCache.value = null;
    window._lastSetBooster = null;
   

    scene.time.delayedCall(400, () => dropGemsAndFill(), [], scene);
    scene.time.delayedCall(600, () => checkMatches(), [], scene);
    
  } else {
    
    gameState.activeBooster = null;
    window._boosterCache.value = null;
    window._lastSetBooster = null;
  }
}