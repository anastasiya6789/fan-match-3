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

// Функция для обработки кликов на мобильных
function handleTouchClick(element, handler) {
  if (!element) return null;
  
  // Удаляем старые обработчики
  const newElement = element.cloneNode(true);
  element.parentNode.replaceChild(newElement, element);
  
  // Добавляем обработчики
  newElement.addEventListener('click', handler);
  newElement.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handler(e);
  }, { passive: false });
  
  return newElement;
}

export function initUIListeners() {
  console.log('🎯 Инициализация UI слушателей');
  
  // Бустеры
  document.querySelectorAll('.booster-item').forEach(item => {
    handleTouchClick(item, (event) => {
      event.preventDefault();
      event.stopPropagation();
      
      const booster = event.currentTarget.dataset.booster;
      
      if (gameState.boosters[booster] <= 0) {
        return alert('У тебя нет этого бустера!');
      }

      if (gameState.activeBooster) {
        const prevActive = document.querySelector(`[data-booster="${gameState.activeBooster}"]`);
        if (prevActive) prevActive.classList.remove('active');
      }

      gameState.activeBooster = booster;
      event.currentTarget.classList.add('active');
      
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
        event.currentTarget.classList.remove('active');
        gameState.activeBooster = null;
        window._boosterCache.value = null;
      }
      
      updateProgressDisplay();
    });
  });

  // Кнопка магазина
  const shopBtn = document.getElementById('shop-btn');
  handleTouchClick(shopBtn, (e) => {
    e.preventDefault();
    updateShopDisplay();
    document.getElementById('shop-modal').style.display = 'block';
  });

  // Закрытие магазина
  const closeShop = document.getElementById('close-shop');
  handleTouchClick(closeShop, (e) => {
    e.preventDefault();
    document.getElementById('shop-modal').style.display = 'none';
  });

  // Кнопки покупки
  document.querySelectorAll('.buy-btn').forEach(btn => {
    handleTouchClick(btn, async (e) => {
      e.preventDefault();
      const booster = e.currentTarget.dataset.booster;
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
    });
  });

  // Кнопка рестарта в боковой панели
  const restartBtn = document.getElementById('restart-btn');
  if (restartBtn) {
    handleTouchClick(restartBtn, (e) => {
      e.preventDefault();
      console.log('🔄 Нажата кнопка рестарта');
      if (typeof window.handleRestart === 'function') {
        window.handleRestart(true);
      }
    });
  }

  // Кнопка выхода
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    handleTouchClick(logoutBtn, async (e) => {
      e.preventDefault();
      console.log('🚪 Выход из игры');
      
      if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
      }
      if (window.autoSaveInterval) {
        clearInterval(window.autoSaveInterval);
      }
      
      const { auth } = await import('./supabase.js');
      await auth.signOut();
      
      document.getElementById('game-screen').style.display = 'none';
      document.getElementById('login-screen').style.display = 'block';
      
      document.getElementById('email').value = '';
      document.getElementById('password').value = '';
      document.getElementById('login-error').textContent = '';
    });
  }

  // Кнопки в модалке 0 шагов
  const addMovesBtn = document.getElementById('add-moves');
  if (addMovesBtn) {
    handleTouchClick(addMovesBtn, (e) => {
      e.preventDefault();
      gameState.movesLeft += 10;
      document.getElementById('moves').textContent = gameState.movesLeft;
      document.getElementById('modal').style.display = 'none';
    });
  }

  const restartModalBtn = document.getElementById('restart-modal');
  if (restartModalBtn) {
    handleTouchClick(restartModalBtn, (e) => {
      e.preventDefault();
      document.getElementById('modal').style.display = 'none';
      if (typeof window.handleRestart === 'function') {
        window.handleRestart(true);
      }
    });
  }

  // Кнопки закрытия для всех модалок
  const closeButtons = {
    'close-leaderboard': 'leaderboard-modal',
    'close-piggy': 'piggy-modal',
    'close-shop': 'shop-modal'
  };

  Object.entries(closeButtons).forEach(([btnId, modalId]) => {
    const btn = document.getElementById(btnId);
    if (btn) {
      handleTouchClick(btn, (e) => {
        e.preventDefault();
        document.getElementById(modalId).style.display = 'none';
      });
    }
  });

  // Закрытие модалок при клике вне их области + скролл
  const modals = ['shop-modal', 'leaderboard-modal', 'piggy-modal', 'win-modal', 'modal'];
  modals.forEach(modalId => {
    const modal = document.getElementById(modalId);
    if (modal) {
      // Разрешаем скролл внутри модалки
      modal.style.overflowY = 'auto';
      modal.style.webkitOverflowScrolling = 'touch';
      
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
        }
      });
      
      modal.addEventListener('touchstart', (e) => {
        if (e.target === modal) {
          e.preventDefault();
          modal.style.display = 'none';
        }
      }, { passive: false });
    }
  });
}