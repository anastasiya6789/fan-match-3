// script.js — точка входа и запуск игры
import { supabaseClient, auth, getOrCreateProfile, saveScore, getTopPlayers, subscribeToScores, loadProgress, saveProgress, getCurrentUser } from './supabase.js';
import { create, initGameLogic, gameState, resetGameState } from './game/index.js';
import { updateUI, updateShopDisplay, initUIListeners } from './ui.js';
import { initLeaderboard } from './leaderboard.js';
import { initPiggy, unsubscribeFromPiggy } from './piggy.js';
import { initLevels } from './game/levelGoals.js';
import { updateProgressDisplay } from './game/levelGoals.js';

// Глобальная функция для предотвращения проблем с касаниями
function setupMobileHandlers() {
  // Разрешаем скролл, но предотвращаем zoom только на кнопках
  document.addEventListener('touchstart', (e) => {
    // Проверяем, является ли элемент кнопкой или внутри модалки
    if (e.target.closest('.booster-item') || 
        e.target.closest('.sidebar-btn') ||
        e.target.closest('.buy-btn') ||
        e.target.closest('.piggy-amount') ||
        e.target.closest('#restart-btn') ||
        e.target.closest('#logout-btn')) {
      // Для кнопок предотвращаем зум
      e.preventDefault();
    }
    // Для модалок и остальных элементов разрешаем стандартное поведение
  }, { passive: false });
  
  // Добавляем обработчик для скролла в модалках
  setTimeout(() => {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('touchmove', (e) => {
        e.stopPropagation(); // Позволяем скролл внутри модалки
      }, { passive: true });
    });
  }, 1000);
}

// Вызываем при загрузке
setupMobileHandlers();

// Сохраняем состояние игры перед поворотом
window.addEventListener('orientationchange', () => {
  console.log('📱 Изменение ориентации экрана');
  
  // Сохраняем текущее состояние
  const currentState = {
    level: gameState.currentLevel,
    score: gameState.levelScore,
    coins: gameState.coins,
    lifetimeScore: gameState.lifetimeScore,
    boosters: { ...gameState.boosters }
  };
  
  // Небольшая задержка для завершения анимации поворота
  setTimeout(() => {
    // Восстанавливаем состояние после поворота
    gameState.currentLevel = currentState.level;
    gameState.levelScore = currentState.score;
    gameState.coins = currentState.coins;
    gameState.lifetimeScore = currentState.lifetimeScore;
    gameState.boosters = { ...currentState.boosters };
    
    // Обновляем UI
    updateUI();
    updateShopDisplay();
    updateProgressDisplay();
    
    // Обновляем canvas
    const container = document.getElementById('phaser-container');
    if (container && window._currentPhaserGame) {
      const canvas = container.querySelector('canvas');
      if (canvas) {
        canvas.style.width = '100%';
        canvas.style.height = '100%';
      }
    }
  }, 300);
});

// Инициализация уровней при запуске
initLevels(20);

// Глобальные флаги
window._levelCompleted = false;
window._authListenerInitialized = false;
window._gameInitialized = false;
window._isRestarting = false;
window._restartTimeout = null;
window._currentPhaserGame = null;
window._resizeTimeout = null;
window._lastContainerSize = { width: 0, height: 0 };

// Вспомогательная функция для обновления текста цели
async function updateGoalText() {
  try {
    const module = await import('./game/levelGoals.js');
    const text = module.getLevelText();
    document.getElementById('goal-text').textContent = text;
  } catch (error) {
    document.getElementById('goal-text').textContent = "Пройди уровень";
  }
}

// Восстанавливаем сессию (один раз)
if (!window._authListenerInitialized) {
  window._authListenerInitialized = true;
  
  auth.onAuthStateChange((event, session) => {
    if (session) {
      console.log('✅ Сессия восстановлена, user ID:', session.user.id);
    } else {
      console.log('ℹ️ Нет активной сессии');
    }
  });
}

// Логин
document.getElementById('login-btn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('login-error');

  const { data, error } = await auth.signInWithPassword({ email, password });

  if (error) {
    errorEl.textContent = error.message;
    console.error('❌ Ошибка логина:', error.message);
  } else {
    errorEl.textContent = '✅ Успех! Загружаем игру...';
    const user = await getCurrentUser();
    if (user) showGameScreen(user);
    else errorEl.textContent = '❌ Ошибка: пользователь не найден после логина';
  }
});

// Регистрация
document.getElementById('signup-btn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('login-error');

  const { data, error } = await auth.signUp({ email, password });

  if (error) {
    errorEl.textContent = error.message;
    console.error('❌ Детали ошибки регистрации:', {
      message: error.message,
      status: error.status,
      code: error.code,
      name: error.name
    });
  } else {
    errorEl.textContent = '✅ Регистрация прошла! Автологин...';

    const { data: loginData, error: loginError } = await auth.signInWithPassword({ email, password });

    if (loginError) {
      errorEl.textContent = loginError.message;
      console.error('❌ Ошибка автологина:', loginError);
    } else {
      const user = await getCurrentUser();
      if (user) showGameScreen(user);
      else errorEl.textContent = '❌ Ошибка автологина после регистрации';
    }
  }
});

// Запуск игры
async function showGameScreen(user) {
  console.log('🎮 Запуск игры для пользователя:', user.email);
  
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'block';

  await getOrCreateProfile(user);
  await loadOrCreateProfile(user);
  
  if (window._currentPhaserGame) {
    console.log('🧹 Очищаем предыдущую игру Phaser');
    window._currentPhaserGame.destroy(true);
    window._currentPhaserGame = null;
  }
  
  const container = document.getElementById('phaser-container');
  container.innerHTML = '';
  
  setTimeout(() => {
    startPhaser();
  }, 100);

  gameState.elapsedTime = 0;
  
  updateUI();
  updateGoalText();
  updateProgressDisplay();

  if (gameState.timerInterval) {
    clearInterval(gameState.timerInterval);
  }
  
  gameState.timerInterval = setInterval(() => {
    gameState.elapsedTime++;
    document.getElementById('timer').textContent = gameState.elapsedTime;
  }, 1000);

  subscribeToScores((payload) => {
    console.log('📊 Realtime scores:', payload);
  });

  if (window.autoSaveInterval) {
    clearInterval(window.autoSaveInterval);
  }
  
  window.autoSaveInterval = setInterval(async () => {
    const currentUser = await getCurrentUser();
    if (currentUser) {
      console.log('⏰ Автосохранение:', {
        level: gameState.currentLevel,
        lifetimeScore: gameState.lifetimeScore,
        coins: gameState.coins,
        boosters: gameState.boosters
      });
      await saveProgress(
        currentUser.id, 
        gameState.currentLevel, 
        gameState.lifetimeScore, 
        gameState.coins,
        gameState.boosters
      );
    }
  }, 30000);

  window.removeEventListener('beforeunload', window.beforeUnloadHandler);
  
  window.beforeUnloadHandler = () => {
    console.log('🧹 Очистка перед выгрузкой');
    clearInterval(gameState.timerInterval);
    clearInterval(window.autoSaveInterval);
    if (window._restartTimeout) clearTimeout(window._restartTimeout);
    if (typeof unsubscribeFromPiggy === 'function') unsubscribeFromPiggy();
    if (window._currentPhaserGame) {
      window._currentPhaserGame.destroy(true);
    }
  };
  
  window.addEventListener('beforeunload', window.beforeUnloadHandler);

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    const newLogoutBtn = logoutBtn.cloneNode(true);
    logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
    
    newLogoutBtn.addEventListener('click', async () => {
      console.log('🚪 Выход из игры');
      clearInterval(gameState.timerInterval);
      clearInterval(window.autoSaveInterval);
      if (window._restartTimeout) clearTimeout(window._restartTimeout);
      if (typeof unsubscribeFromPiggy === 'function') unsubscribeFromPiggy();
      
      if (window._currentPhaserGame) {
        window._currentPhaserGame.destroy(true);
        window._currentPhaserGame = null;
      }
      
      await auth.signOut();
      
      document.getElementById('game-screen').style.display = 'none';
      document.getElementById('login-screen').style.display = 'block';
      document.getElementById('email').value = '';
      document.getElementById('password').value = '';
      document.getElementById('login-error').textContent = '';
      
      window._levelCompleted = false;
      window._gameInitialized = false;
      window._isRestarting = false;
    });
  }
}

// Загрузка профиля
async function loadOrCreateProfile(user) {
  const progress = await loadProgress(user.id);
  
  console.log('📥 Загружен прогресс из БД:', progress);

  gameState.currentLevel = progress.level;
  gameState.lifetimeScore = progress.lifetime_score;
  gameState.coins = progress.coins;
  gameState.boosters = progress.boosters;
  gameState.levelScore = 0;
  gameState.movesLeft = 30 + (gameState.currentLevel * 5);

  console.log('🎮 gameState после загрузки:', {
    level: gameState.currentLevel,
    coins: gameState.coins,
    lifetimeScore: gameState.lifetimeScore,
    boosters: gameState.boosters
  });
  
  updateUI();
  updateShopDisplay();
  await updateGoalText();
  updateProgressDisplay();
  
  if (!window._gameInitialized) {
    window._gameInitialized = true;
    initUIListeners();
    initLeaderboard();
    initPiggy();
  }

  const restartBtn = document.getElementById('restart-btn');
  const newRestartBtn = restartBtn.cloneNode(true);
  restartBtn.parentNode.replaceChild(newRestartBtn, restartBtn);
  newRestartBtn.addEventListener('click', () => {
    console.log('🔄 Нажата кнопка рестарта в боковой панели');
    handleRestart(true);
  });

  setupWinModalListeners();
}

// Универсальная функция для рестарта с защитой
function handleRestart(resetFromDB = true) {
  if (window._isRestarting) {
    console.log('⚠️ Рестарт уже выполняется, пропускаем');
    return;
  }
  
  window._isRestarting = true;
  console.log('🎯 handleRestart вызван с resetFromDB =', resetFromDB);
  restartLevel(resetFromDB);
  
  if (window._restartTimeout) clearTimeout(window._restartTimeout);
  window._restartTimeout = setTimeout(() => {
    window._isRestarting = false;
    console.log('🔄 Флаг рестарта сброшен');
    window._restartTimeout = null;
  }, 2000);
}

// Делаем функцию глобальной для доступа из ui.js
window.handleRestart = handleRestart;

// Модалка победы
function setupWinModalListeners() {
  const winModal = document.getElementById('win-modal');
  const nextBtn = document.getElementById('next-level-btn');
  const restartWinBtn = document.getElementById('restart-win-btn');

  const newNextBtn = nextBtn.cloneNode(true);
  const newRestartWinBtn = restartWinBtn.cloneNode(true);
  
  nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
  restartWinBtn.parentNode.replaceChild(newRestartWinBtn, restartWinBtn);

  newNextBtn.onclick = async () => {
    console.log('🎯 Следующий уровень');
    
    winModal.style.display = 'none';
    if (gameState.song) gameState.song.stop();

    const VISUAL_REWARD = 2000;
    const ACTUAL_REWARD = 1000;
    
    if (!window._levelCompleted) {
      window._levelCompleted = true;
      
      alert(`🎉 Уровень пройден! +${VISUAL_REWARD} монеток!`);
      
      gameState.coins += ACTUAL_REWARD;
      gameState.lifetimeScore = (gameState.lifetimeScore || 0) + (gameState.levelScore || 0);
      
      console.log(`💰 Визуально: +${VISUAL_REWARD}, Реально: +${ACTUAL_REWARD}`);
    }
    
    gameState.levelScore = 0;
    gameState.currentLevel++;
    
    if (gameState.currentLevel > 5) {
      alert('🎉 Игра полностью пройдена! Возвращаемся на уровень 1.');
      gameState.currentLevel = 1;
    }

    document.getElementById('level').textContent = gameState.currentLevel;
    document.getElementById('score').textContent = gameState.levelScore;
    await updateGoalText();

    const user = await getCurrentUser();
    if (user) {
      try {
        await saveProgress(
          user.id, 
          gameState.currentLevel, 
          gameState.lifetimeScore, 
          gameState.coins,
          gameState.boosters
        );
        
        setTimeout(() => {
          window._levelCompleted = false;
        }, 1000);
        
      } catch (err) {
        console.error('❌ Ошибка сохранения:', err);
      }
    }

    handleRestart(false);
  };

  newRestartWinBtn.onclick = () => {
    console.log('🔄 Заново в модалке');
    
    winModal.style.display = 'none';
    if (gameState.song) gameState.song.stop();

    gameState.levelScore = 0;
    document.getElementById('score').textContent = gameState.levelScore;

    handleRestart(false);
  };
}

// Запуск Phaser
function startPhaser() {
  console.log('🎮 ===== ЗАПУСК PHASER =====');
  
  const container = document.getElementById('phaser-container');
  if (!container) {
    console.error('❌ Контейнер phaser-container не найден!');
    return;
  }
  
  const containerRect = container.getBoundingClientRect();
  const containerWidth = containerRect.width;
  const containerHeight = containerRect.height;
  
  if (containerWidth === 0 || containerHeight === 0) {
    console.warn('⚠️ Контейнер имеет нулевые размеры, ждем...');
    setTimeout(() => startPhaser(), 100);
    return;
  }
  
  const gridSize = gameState.GRID_SIZE;
  const basePadding = 8;
  const availableHeight = containerHeight - 40;
  
  const gemSizeByWidth = Math.floor((containerWidth - basePadding * (gridSize - 1)) / gridSize);
  const gemSizeByHeight = Math.floor((availableHeight - basePadding * (gridSize - 1)) / gridSize);
  
  let gemSize = Math.min(gemSizeByWidth, gemSizeByHeight, 80);
  gemSize = Math.max(gemSize, 35);
  
  const padding = Math.max(4, Math.floor(basePadding * (gemSize / 80)));
  
  gameState.GEM_SIZE = gemSize;
  gameState.GRID_PADDING = padding;
  
  const canvasWidth = gridSize * (gemSize + padding) - padding;
  const canvasHeight = canvasWidth + 40;

  const config = {
    type: Phaser.AUTO,
    width: canvasWidth,
    height: canvasHeight,
    parent: 'phaser-container',
    scene: {
      preload: preload,
      create: create,
      update: update
    },
    scale: {
      mode: Phaser.Scale.NONE,
      parent: 'phaser-container',
      width: canvasWidth,
      height: canvasHeight
    },
    backgroundColor: '#222222'
  };

  if (window._currentPhaserGame) {
    window._currentPhaserGame.destroy(true);
    window._currentPhaserGame = null;
  }

  window._currentPhaserGame = new Phaser.Game(config);
  initGameLogic(window._currentPhaserGame);
  
  setTimeout(() => {
    if (window._currentPhaserGame) {
      const canvas = container.querySelector('canvas');
      if (canvas) {
        canvas.style.width = '100%';
        canvas.style.height = '100%';
      }
    }
  }, 100);
}

// Обработчик изменения размера окна
window.addEventListener('resize', () => {
  console.log('📱 Изменение размера окна');
  
  if (window._resizeTimeout) {
    clearTimeout(window._resizeTimeout);
  }
  
  window._resizeTimeout = setTimeout(() => {
    const container = document.getElementById('phaser-container');
    if (!container) return;
    
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;
    
    if (Math.abs(newWidth - window._lastContainerSize.width) > 20 || 
        Math.abs(newHeight - window._lastContainerSize.height) > 20) {
      
      console.log('📱 Размеры изменились существенно, обновляем canvas');
      window._lastContainerSize = { width: newWidth, height: newHeight };
      
      if (window._currentPhaserGame) {
        const canvas = container.querySelector('canvas');
        if (canvas) {
          canvas.style.width = '100%';
          canvas.style.height = '100%';
        }
      }
    }
    
    window._resizeTimeout = null;
  }, 300);
});

function preload() {
  console.log('📦 preload: загрузка ресурсов');
  for (let i = 1; i <= gameState.GEM_TYPES; i++) {
    this.load.image(`gem${i}`, `assets/gem${i}.png`);
  }
  this.load.audio('victory', 'assets/song.mp3');
}

// Рестарт уровня
async function restartLevel(resetFromDB = true) {
  console.log('🔄 Рестарт уровня, resetFromDB =', resetFromDB);
  
  window._levelCompleted = false;
  
  if (resetFromDB) {
    const user = await getCurrentUser();
    if (user) {
      const progress = await loadProgress(user.id);
      gameState.currentLevel = progress.level;
      gameState.lifetimeScore = progress.lifetime_score;
      gameState.coins = progress.coins;
      gameState.boosters = progress.boosters;
      console.log('📥 Загружено из БД:', progress);
    }
  }

  gameState.selectedGem = null;
  gameState.isSwapping = false;
  gameState.grid = Array.from({ length: gameState.GRID_SIZE }, () => Array(gameState.GRID_SIZE).fill(null));
  
  if (window._currentPhaserGame && window._currentPhaserGame.scene.scenes[0]) {
    window._currentPhaserGame.scene.scenes[0].scene.restart();
  }

  gameState.movesLeft = 30 + (gameState.currentLevel * 5);
  gameState.levelScore = 0;
  gameState.elapsedTime = 0;

  updateUI();
  updateShopDisplay();
  await updateGoalText();
  
  const { resetLevelProgress } = await import('./game/levelGoals.js');
  resetLevelProgress();
  
  clearInterval(gameState.timerInterval);
  gameState.timerInterval = setInterval(() => {
    gameState.elapsedTime++;
    document.getElementById('timer').textContent = gameState.elapsedTime;
  }, 1000);

  document.getElementById('win-modal').style.display = 'none';
  document.getElementById('modal').style.display = 'none';

  if (gameState.song && gameState.song.isPlaying) gameState.song.stop();
  
  console.log('✅ Рестарт завершен, текущий уровень:', gameState.currentLevel);
}

function update() {}