// game/removeGem.js
import { gameState } from './gameState.js';
import { checkAdjacentIce, isIceGem, removeIceGem } from './iceGems.js';
import { isGiftGem, isGiftAtBottom, removeGiftGem, giftGems } from './gifts.js';

export function removeGem(gem) {
  if (!gem) return;
  
  const scene = gameState.game.scene.scenes[0];
  const row = gem.getData('row');
  const col = gem.getData('col');
  const type = gem.getData('type');
  const isIce = gem.getData('isIce');
  const frozen = gem.getData('frozen');
  const isGift = gem.getData('isGift');
  
  
  
  // ЗАМОРОЖЕННЫЙ ЛЕД - НЕ УДАЛЯЕМ!
  if (isIce && frozen) {
    
    return;
  }
  
  // ПОДАРКИ - НЕ УДАЛЯЕМ ОБЫЧНЫМ СПОСОБОМ!
  if (isGift) {
    
    return;
  }
  
  // РАЗМОРОЖЕННЫЙ ЛЕД - МОЖНО УДАЛЯТЬ
  if (isIce && !frozen) {
    
  }
  
  // Проверяем соседние ледяные гемы ПЕРЕД удалением
  const unfrozen = checkAdjacentIce(row, col);
  
  if (unfrozen) {
    
  }
  
  // Анимация удаления
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
}

// Функция для принудительного удаления гема (для бустеров)
export function forceRemoveGem(gem) {
  if (!gem) return;
  
  const scene = gameState.game.scene.scenes[0]; // 👈 ПОЛУЧАЕМ SCENE ЗДЕСЬ!
  const row = gem.getData('row');
  const col = gem.getData('col');
  const isIce = gem.getData('isIce');
  const frozen = gem.getData('frozen');
  const isGift = gem.getData('isGift');
  
  
  
  // Бустеры могут удалить любой лед
  if (isIce) {
    
    removeIceGem(gem);
    return;
  }
  
  // 👇 БУСТЕРЫ МОГУТ УДАЛИТЬ ПОДАРОК В ЛЮБОМ МЕСТЕ!
  if (isGift) {
    
    
    // Удаляем с анимацией
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
    giftGems.delete(`${row},${col}`);
    
    // 👇 ЗАСЧИТЫВАЕМ В ПРОГРЕСС!
    import('./levelGoals.js').then(module => {
      module.levelProgress.giftsDelivered++;
      
      module.updateProgressDisplay();
    });
    
    return;
  }
  
  // Обычное удаление для не-ледяных
  removeGem(gem);
}