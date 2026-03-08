// game/gemActions.js
import { gameState } from './gameState.js';
import { areNeighbors } from './gridUtils.js';
import { swapGems } from './swapGems.js';
import { useBooster } from './boosters.js';
import { isFrozenIceGem } from './iceGems.js'; // 👈 ИМПОРТ ДЛЯ ПРОВЕРКИ ЛЬДА

// Глобальный кэш бустера
window._boosterCache = {
  value: null,
  timestamp: 0
};

export function onGemClick(clickedGem) {
  // ВОССТАНАВЛИВАЕМ из кэша если нужно
  if (!gameState.activeBooster && window._boosterCache.value) {
    
    gameState.activeBooster = window._boosterCache.value;
  }


  
  if (gameState.isSwapping || !clickedGem || !clickedGem.list || !clickedGem.list[1]) {
    
    return;
  }
  
  if (!clickedGem.active) {
    
    return;
  }

  //  если гем ледяной и заморожен - нельзя кликать
  if (isFrozenIceGem(clickedGem)) {
    
    
    // Визуальный эффект - мигание красным
    clickedGem.list[1].setTint(0xff6666);
    setTimeout(() => {
      clickedGem.list[1].clearTint();
    }, 200);
    return;
  }

 

  // Используем ЛЮБОЙ доступный бустер
  const boosterToUse = gameState.activeBooster || window._boosterCache.value;
  
  if (boosterToUse) {
    
    useBooster(clickedGem, boosterToUse);
    return;
  }

  // Обычный выбор гема
  if (gameState.selectedGem === null) {
    selectGem(clickedGem);
  } else {
    handleSecondGemClick(clickedGem);
  }
}

function selectGem(gem) {
  gameState.selectedGem = gem;
  if (gem.list[1]) gem.list[1].setTint(0xffff00);
  
}

function handleSecondGemClick(clickedGem) {
  if (gameState.selectedGem === clickedGem) {
    
    deselectGem();
  } else if (areNeighbors(gameState.selectedGem, clickedGem)) {
    
    swapGems(gameState.selectedGem, clickedGem);
    deselectGem();
  } else {
    
    deselectGem();
    selectGem(clickedGem);
  }
}

function deselectGem() {
  if (gameState.selectedGem?.list[1]) {
    gameState.selectedGem.list[1].clearTint();
  }
  gameState.selectedGem = null;
}