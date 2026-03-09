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
  
  // НЕ создаем здесь обработчики, они будут в ui.js
  // Просто убеждаемся что кнопки видимы
  const nextBtn = document.getElementById('next-level-btn');
  const restartBtn = document.getElementById('restart-win-btn');
  
  if (nextBtn) {
    nextBtn.style.pointerEvents = 'auto';
    nextBtn.style.cursor = 'pointer';
  }
  if (restartBtn) {
    restartBtn.style.pointerEvents = 'auto';
    restartBtn.style.cursor = 'pointer';
  }
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

// Функция для получения текущего пользователя
async function getCurrentUser() {
  const { data: { session } } = await auth.getSession();
  return session?.user || null;
}

// Рестарт уровня
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