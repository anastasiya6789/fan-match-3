// game/levelComplete.js
import { gameState, setLevelCompleted } from './gameState.js';
import { auth, saveProgress } from '../supabase.js';
import { resetLevelProgress, getCurrentLevel, initLevels } from './levelGoals.js';

export function showWinModal(scene) {
  const winModal = document.getElementById('win-modal');
  if (winModal.style.display === 'block') return;
  
  console.log('🏆 Открываем модалку победы');
  
  gameState.coins += 1000;
  document.getElementById('coins').textContent = gameState.coins;

  document.getElementById('win-time').textContent = gameState.elapsedTime;
  document.getElementById('win-moves').textContent = gameState.movesLeft;
  document.getElementById('win-score').textContent = gameState.levelScore;

  winModal.style.display = 'block';
  
  // Убеждаемся что модалка видна и кликабельна
  winModal.style.pointerEvents = 'auto';
  winModal.style.zIndex = '999999';
  
  // Пытаемся запустить музыку
  if (gameState.song) {
    gameState.song.play().catch(error => {
      console.log('⚠️ Автовоспроизведение заблокировано');
    });
  }

  clearInterval(gameState.timerInterval);
  
  // Используем ТОТ ЖЕ подход что и в других модалках
  setupWinModalListeners();
}

function setupWinModalListeners() {
  const winModal = document.getElementById('win-modal');
  const nextBtn = document.getElementById('next-level-btn');
  const restartBtn = document.getElementById('restart-win-btn');

  // Клонируем кнопки как в других модалках (как в piggy.js, leaderboard.js)
  const newNextBtn = nextBtn.cloneNode(true);
  const newRestartBtn = restartBtn.cloneNode(true);
  
  nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
  restartBtn.parentNode.replaceChild(newRestartBtn, restartBtn);

  // Убеждаемся что кнопки кликабельны
  newNextBtn.style.pointerEvents = 'auto';
  newNextBtn.style.cursor = 'pointer';
  newNextBtn.style.zIndex = '10001';
  
  newRestartBtn.style.pointerEvents = 'auto';
  newRestartBtn.style.cursor = 'pointer';
  newRestartBtn.style.zIndex = '10001';

  // Обработчик для "Следующий уровень" (как в других модалках)
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
    
    // Обновляем текст цели
    const { getLevelText } = await import('./levelGoals.js');
    document.getElementById('goal-text').textContent = getLevelText();

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

    // Используем handleRestart как в других модалках
    if (typeof window.handleRestart === 'function') {
      window.handleRestart(false);
    }
  };

  // Обработчик для "Заново" (как в других модалках)
  newRestartBtn.onclick = () => {
    console.log('🔄 Заново в модалке');
    
    winModal.style.display = 'none';
    if (gameState.song) gameState.song.stop();

    gameState.levelScore = 0;
    document.getElementById('score').textContent = gameState.levelScore;

    if (typeof window.handleRestart === 'function') {
      window.handleRestart(false);
    }
  };

  // Добавляем touch-обработчики как в piggy.js и leaderboard.js
  newNextBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    newNextBtn.onclick();
  }, { passive: false });

  newRestartBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    newRestartBtn.onclick();
  }, { passive: false });
}

async function saveGameProgress() {
  if (auth.currentUser) {
    try {
      await saveProgress(
        auth.currentUser.id,
        gameState.currentLevel,
        gameState.lifetimeScore,
        gameState.coins,
        gameState.boosters
      );
    } catch (err) {
      console.error('Ошибка сохранения:', err);
    }
  }
}

// Функция для получения текущего пользователя (дублируем из supabase.js чтобы избежать циклических зависимостей)
async function getCurrentUser() {
  const { data: { session } } = await auth.getSession();
  return session?.user || null;
}

// Рестарт уровня (оставляем для совместимости)
function restartLevel(resetFromDB = false) {
  console.log('🔄 Рестарт уровня из levelComplete, resetFromDB =', resetFromDB);
  
  const currentLevel = gameState.currentLevel;
  
  gameState.selectedGem = null;
  gameState.isSwapping = false;
  gameState.grid = Array.from({ length: gameState.GRID_SIZE }, () => Array(gameState.GRID_SIZE).fill(null));
  
  if (gameState.game && gameState.game.scene.scenes[0]) {
    gameState.game.scene.scenes[0].scene.restart();
  }

  gameState.movesLeft = 30 + (currentLevel * 5);
  gameState.levelScore = 0;
  gameState.elapsedTime = 0;

  updateUI();
  
  clearInterval(gameState.timerInterval);
  gameState.timerInterval = setInterval(() => {
    gameState.elapsedTime++;
    document.getElementById('timer').textContent = gameState.elapsedTime;
  }, 1000);
}

function updateUI() {
  document.getElementById('level').textContent = gameState.currentLevel;
  document.getElementById('score').textContent = gameState.levelScore;
  document.getElementById('moves').textContent = gameState.movesLeft;
  document.getElementById('timer').textContent = gameState.elapsedTime;
  document.getElementById('coins').textContent = gameState.coins;
  
  import('./levelGoals.js').then(module => {
    document.getElementById('goal-text').textContent = module.getLevelText();
    module.updateProgressDisplay();
  });
}

export { restartLevel };