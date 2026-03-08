// ui.js
import { gameState } from './game/index.js';
import { getTopPlayers, supabaseClient } from './supabase.js';
import { updateProgressDisplay } from './game/levelGoals.js';

const UI_ELEMENTS = {
  level: 'level',
  score: 'score',
  moves: 'moves',
  timer: 'timer',
  coins: 'coins',
  goalText: 'goal-text',
  bombCount: 'bomb-count',
  shuffleCount: 'shuffle-count',
  extramovesCount: 'extramoves-count',
  '52Count': '52-count',
  shopBombCount: 'shop-bomb-count',
  shopShuffleCount: 'shop-shuffle-count',
  shopExtramovesCount: 'shop-extramoves-count',
  shop52Count: 'shop-52-count',
  shopCoins: 'shop-coins',
  winModal: 'win-modal',
  modal: 'modal',
  leaderboardModal: 'leaderboard-modal',
  topList: 'top-list'
};

export function updateUI() {
  document.getElementById(UI_ELEMENTS.level).textContent = gameState.currentLevel;
  document.getElementById(UI_ELEMENTS.score).textContent = gameState.levelScore;
  document.getElementById(UI_ELEMENTS.moves).textContent = gameState.movesLeft;
  document.getElementById(UI_ELEMENTS.timer).textContent = gameState.elapsedTime;
  document.getElementById(UI_ELEMENTS.coins).textContent = gameState.coins;
}

export function updateShopDisplay() {
  const counts = [
    { id: UI_ELEMENTS.bombCount, value: gameState.boosters.bomb },
    { id: UI_ELEMENTS.shuffleCount, value: gameState.boosters.shuffle },
    { id: UI_ELEMENTS.extramovesCount, value: gameState.boosters.extramoves },
    { id: UI_ELEMENTS['52Count'], value: gameState.boosters['52'] },
    { id: UI_ELEMENTS.shopBombCount, value: gameState.boosters.bomb },
    { id: UI_ELEMENTS.shopShuffleCount, value: gameState.boosters.shuffle },
    { id: UI_ELEMENTS.shopExtramovesCount, value: gameState.boosters.extramoves },
    { id: UI_ELEMENTS.shop52Count, value: gameState.boosters['52'] },
    { id: UI_ELEMENTS.shopCoins, value: gameState.coins }
  ];

  counts.forEach(({ id, value }) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });
}

export function initUIListeners() {
  // Бустеры - добавляем поддержку touch
  document.querySelectorAll('.booster-item').forEach(item => {
    const newItem = item.cloneNode(true);
    item.parentNode.replaceChild(newItem, item);
    
    const handleBoosterClick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      
      const booster = newItem.dataset.booster;
      
      if (gameState.boosters[booster] <= 0) {
        return alert('У тебя нет этого бустера!');
      }

      if (gameState.activeBooster) {
        const prevActive = document.querySelector(`[data-booster="${gameState.activeBooster}"]`);
        if (prevActive) prevActive.classList.remove('active');
      }

      gameState.activeBooster = booster;
      newItem.classList.add('active');
      
      window._lastSetBooster = booster;
      window._lastSetTime = Date.now();
      window._boosterCache = {
        value: booster,
        timestamp: Date.now()
      };

      if (booster === 'extramoves') {
        gameState.movesLeft += 5;
        document.getElementById('moves').textContent = gameState.movesLeft;
        gameState.boosters.extramoves--;
        document.getElementById('extramoves-count').textContent = gameState.boosters.extramoves;
        newItem.classList.remove('active');
        gameState.activeBooster = null;
        window._boosterCache.value = null;
      }
      
      updateProgressDisplay();
    };
    
    // Добавляем оба типа событий
    newItem.addEventListener('click', handleBoosterClick);
    newItem.addEventListener('touchstart', handleBoosterClick, { passive: false });
  });

  // Кнопка магазина
  const shopBtn = document.getElementById('shop-btn');
  if (shopBtn) {
    const handleShopClick = (e) => {
      e.preventDefault();
      updateShopDisplay();
      document.getElementById('shop-modal').style.display = 'block';
    };
    shopBtn.addEventListener('click', handleShopClick);
    shopBtn.addEventListener('touchstart', handleShopClick, { passive: false });
  }

  // Закрытие магазина (удаляем старый обработчик и создаем новый с cloneNode)
  const closeShop = document.getElementById('close-shop');
  if (closeShop) {
    const newCloseShop = closeShop.cloneNode(true);
    closeShop.parentNode.replaceChild(newCloseShop, closeShop);
    
    const handleCloseShop = (e) => {
      e.preventDefault();
      document.getElementById('shop-modal').style.display = 'none';
    };
    
    newCloseShop.addEventListener('click', handleCloseShop);
    newCloseShop.addEventListener('touchstart', handleCloseShop, { passive: false });
  }

  // Кнопки покупки
  document.querySelectorAll('.buy-btn').forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    const handleBuyClick = async (e) => {
      e.preventDefault();
      const booster = newBtn.dataset.booster;
      const prices = { bomb: 200, shuffle: 300, extramoves: 150, '52': 500 };
      const price = prices[booster];

      if (gameState.coins >= price) {
        gameState.coins -= price;
        gameState.boosters[booster]++;
        document.getElementById(UI_ELEMENTS.coins).textContent = gameState.coins;
        updateShopDisplay();
        
        const { getCurrentUser, saveProgress } = await import('./supabase.js');
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
        
        updateProgressDisplay();
      } else {
        alert('Недостаточно монеток!');
      }
    };
    
    newBtn.addEventListener('click', handleBuyClick);
    newBtn.addEventListener('touchstart', handleBuyClick, { passive: false });
  });

  // Закрытие модалок при клике вне их области
  const modals = ['shop-modal', 'leaderboard-modal', 'piggy-modal', 'win-modal', 'modal'];
  modals.forEach(modalId => {
    const modal = document.getElementById(modalId);
    if (modal) {
      // Удаляем старые обработчики
      const newModal = modal.cloneNode(true);
      modal.parentNode.replaceChild(newModal, modal);
      
      newModal.addEventListener('click', (e) => {
        if (e.target === newModal) {
          newModal.style.display = 'none';
        }
      });
      
      newModal.addEventListener('touchstart', (e) => {
        if (e.target === newModal) {
          e.preventDefault();
          newModal.style.display = 'none';
        }
      }, { passive: false });
    }
  });

  // Кнопка рестарта в модалке (добавляем touch)
  const restartModalBtn = document.getElementById('restart-modal');
  if (restartModalBtn) {
    const newRestartModalBtn = restartModalBtn.cloneNode(true);
    restartModalBtn.parentNode.replaceChild(newRestartModalBtn, restartModalBtn);
    
    newRestartModalBtn.addEventListener('click', () => {
      document.getElementById('modal').style.display = 'none';
      window.location.reload(); // или ваш метод рестарта
    });
    
    newRestartModalBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      document.getElementById('modal').style.display = 'none';
      window.location.reload();
    }, { passive: false });
  }

  // Кнопка добавления ходов
  const addMovesBtn = document.getElementById('add-moves');
  if (addMovesBtn) {
    const newAddMovesBtn = addMovesBtn.cloneNode(true);
    addMovesBtn.parentNode.replaceChild(newAddMovesBtn, addMovesBtn);
    
    newAddMovesBtn.addEventListener('click', () => {
      gameState.movesLeft += 10;
      document.getElementById('moves').textContent = gameState.movesLeft;
      document.getElementById('modal').style.display = 'none';
    });
    
    newAddMovesBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      gameState.movesLeft += 10;
      document.getElementById('moves').textContent = gameState.movesLeft;
      document.getElementById('modal').style.display = 'none';
    }, { passive: false });
  }
}