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
  
  // Убеждаемся что модалка и кнопки кликабельны
  winModal.style.pointerEvents = 'auto';
  winModal.style.zIndex = '10000';
  
  // Пытаемся запустить музыку с учетом мобильных ограничений
  if (gameState.song) {
    // Для мобильных устройств нужно запускать аудио в ответ на действие пользователя
    gameState.song.play().catch(error => {
      console.log('⚠️ Автовоспроизведение заблокировано браузером:', error);
      // Создаем подсказку для включения музыки
      const musicHint = document.createElement('div');
      musicHint.className = 'music-hint';
      musicHint.textContent = '🔊 Нажмите для включения музыки';
      musicHint.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 30px;
        font-size: 14px;
        z-index: 10001;
        cursor: pointer;
        pointer-events: auto;
      `;
      document.body.appendChild(musicHint);
      
      // Обработчики для подсказки
      musicHint.addEventListener('click', () => {
        gameState.song.play();
        musicHint.remove();
      });
      
      musicHint.addEventListener('touchstart', (e) => {
        e.preventDefault();
        gameState.song.play();
        musicHint.remove();
      }, { passive: false });
    });
  }

  clearInterval(gameState.timerInterval);
  setupWinModalListeners();
}

function setupWinModalListeners() {
  const winModal = document.getElementById('win-modal');
  const nextBtn = document.getElementById('next-level-btn');
  const restartBtn = document.getElementById('restart-win-btn');

  // Удаляем старые обработчики через cloneNode
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

  // Обработчик для "Следующий уровень"
  newNextBtn.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('➡️ Нажата кнопка "Следующий уровень"');
    
    setLevelCompleted(false);
    winModal.style.display = 'none';
    if (gameState.song) gameState.song.stop();

    gameState.lifetimeScore += gameState.levelScore;
    gameState.levelScore = 0;
    gameState.currentLevel++;
    
    console.log(`📈 Переход на уровень ${gameState.currentLevel}`);
    
    if (gameState.currentLevel > 20) {
      alert('🎉 Поздравляем! Вы прошли все уровни! Генерируем новые...');
      gameState.currentLevel = 1;
      initLevels(20);
    }

    resetLevelProgress();
    await saveGameProgress();
    
    window._levelCompleted = false;
    
    restartLevel(true);
  };

  // Добавляем touch-обработчик для мобильных
  newNextBtn.addEventListener('touchstart', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('👆 Нажата кнопка "Следующий уровень" (touch)');
    
    setLevelCompleted(false);
    winModal.style.display = 'none';
    if (gameState.song) gameState.song.stop();

    gameState.lifetimeScore += gameState.levelScore;
    gameState.levelScore = 0;
    gameState.currentLevel++;
    
    if (gameState.currentLevel > 20) {
      alert('🎉 Поздравляем! Вы прошли все уровни! Генерируем новые...');
      gameState.currentLevel = 1;
      initLevels(20);
    }

    resetLevelProgress();
    await saveGameProgress();
    
    window._levelCompleted = false;
    
    restartLevel(true);
  }, { passive: false });

  // Обработчик для "Заново"
  newRestartBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔄 Нажата кнопка "Заново" в модалке');
    
    setLevelCompleted(false);
    winModal.style.display = 'none';
    if (gameState.song) gameState.song.stop();
    gameState.levelScore = 0;
    
    resetLevelProgress();
    
    window._levelCompleted = false;
    
    restartLevel(false);
  };

  // Добавляем touch-обработчик для мобильных
  newRestartBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('👆 Нажата кнопка "Заново" в модалке (touch)');
    
    setLevelCompleted(false);
    winModal.style.display = 'none';
    if (gameState.song) gameState.song.stop();
    gameState.levelScore = 0;
    
    resetLevelProgress();
    
    window._levelCompleted = false;
    
    restartLevel(false);
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