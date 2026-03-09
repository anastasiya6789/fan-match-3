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
  
  // Принудительно убираем все возможные блокировки
  winModal.style.pointerEvents = 'auto';
  winModal.style.zIndex = '999999';
  
  // Музыка
  if (gameState.song) {
    gameState.song.play().catch(() => {
      const musicBtn = document.createElement('button');
      musicBtn.textContent = '🔊 Музыка';
      musicBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #FFD700;
        color: black;
        padding: 15px 30px;
        border-radius: 50px;
        font-size: 18px;
        border: none;
        z-index: 999999;
        cursor: pointer;
      `;
      document.body.appendChild(musicBtn);
      musicBtn.onclick = () => {
        gameState.song.play();
        musicBtn.remove();
      };
      musicBtn.ontouchstart = (e) => {
        e.preventDefault();
        gameState.song.play();
        musicBtn.remove();
      };
    });
  }

  clearInterval(gameState.timerInterval);
  
  // Устанавливаем обработчики максимально просто
  setupButtons();
}

function setupButtons() {
  const winModal = document.getElementById('win-modal');
  const nextBtn = document.getElementById('next-level-btn');
  const restartBtn = document.getElementById('restart-win-btn');

  if (!nextBtn || !restartBtn) return;

  // Убираем все возможные атрибуты, которые могут мешать
  [nextBtn, restartBtn].forEach(btn => {
    btn.removeAttribute('disabled');
    btn.style.pointerEvents = 'auto';
    btn.style.cursor = 'pointer';
    btn.style.opacity = '1';
    btn.style.zIndex = '999999';
    btn.style.position = 'relative';
  });

  // Функция для обработки клика
  const handleNextClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('➡️ НАЖАТА КНОПКА NEXT');
    
    winModal.style.display = 'none';
    if (gameState.song) gameState.song.stop();

    gameState.lifetimeScore += gameState.levelScore;
    gameState.levelScore = 0;
    gameState.currentLevel++;
    
    if (gameState.currentLevel > 20) {
      gameState.currentLevel = 1;
      initLevels(20);
    }

    document.getElementById('level').textContent = gameState.currentLevel;
    document.getElementById('score').textContent = gameState.levelScore;
    
    resetLevelProgress();
    saveGameProgress().then(() => {
      window._levelCompleted = false;
      setLevelCompleted(false);
      restartLevel(true);
    });
  };

  const handleRestartClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('🔄 НАЖАТА КНОПКА RESTART');
    
    winModal.style.display = 'none';
    if (gameState.song) gameState.song.stop();

    gameState.levelScore = 0;
    document.getElementById('score').textContent = gameState.levelScore;
    
    resetLevelProgress();
    
    window._levelCompleted = false;
    setLevelCompleted(false);
    restartLevel(false);
  };

  // Удаляем все старые обработчики
  nextBtn.onclick = null;
  nextBtn.ontouchstart = null;
  nextBtn.onmousedown = null;
  
  restartBtn.onclick = null;
  restartBtn.ontouchstart = null;
  restartBtn.onmousedown = null;

  // Добавляем новые обработчики ВСЕХ типов
  nextBtn.addEventListener('click', handleNextClick);
  nextBtn.addEventListener('touchstart', handleNextClick, { passive: false });
  nextBtn.addEventListener('mousedown', handleNextClick);
  
  restartBtn.addEventListener('click', handleRestartClick);
  restartBtn.addEventListener('touchstart', handleRestartClick, { passive: false });
  restartBtn.addEventListener('mousedown', handleRestartClick);

  // Дополнительная защита - вешаем обработчики на родителя
  winModal.addEventListener('click', (e) => {
    if (e.target === nextBtn) handleNextClick(e);
    if (e.target === restartBtn) handleRestartClick(e);
  });
  
  winModal.addEventListener('touchstart', (e) => {
    if (e.target === nextBtn) {
      e.preventDefault();
      handleNextClick(e);
    }
    if (e.target === restartBtn) {
      e.preventDefault();
      handleRestartClick(e);
    }
  }, { passive: false });

  console.log('✅ Обработчики кнопок установлены');
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

function restartLevel(resetFromDB = false) {
  console.log('🔄 Рестарт уровня');
  
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