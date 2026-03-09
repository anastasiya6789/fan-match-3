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
  
  // Пытаемся запустить музыку
  if (gameState.song) {
    // Пробуем сразу запустить
    gameState.song.play().catch(error => {
      console.log('⚠️ Автовоспроизведение заблокировано');
      
      // Создаем большую заметную кнопку для включения музыки
      const musicBtn = document.createElement('button');
      musicBtn.textContent = '🔊 Включить музыку';
      musicBtn.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: #FFD700;
        color: black;
        padding: 15px 30px;
        border-radius: 50px;
        font-size: 18px;
        font-weight: bold;
        border: none;
        z-index: 10001;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        animation: pulse 2s infinite;
      `;
      document.body.appendChild(musicBtn);
      
      musicBtn.addEventListener('click', () => {
        gameState.song.play();
        musicBtn.remove();
      });
      
      musicBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        gameState.song.play();
        musicBtn.remove();
      });
    });
  }

  clearInterval(gameState.timerInterval);
  
  // Устанавливаем обработчики напрямую, без cloneNode
  setupWinModalButtons();
}

function setupWinModalButtons() {
  const winModal = document.getElementById('win-modal');
  const nextBtn = document.getElementById('next-level-btn');
  const restartBtn = document.getElementById('restart-win-btn');

  if (!nextBtn || !restartBtn) {
    console.error('❌ Кнопки в модалке победы не найдены');
    return;
  }

  // Удаляем все старые обработчики
  nextBtn.onclick = null;
  nextBtn.ontouchstart = null;
  restartBtn.onclick = null;
  restartBtn.ontouchstart = null;

  // Устанавливаем новые обработчики напрямую
  nextBtn.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('➡️ Нажата кнопка "Следующий уровень"');
    
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

    document.getElementById('level').textContent = gameState.currentLevel;
    document.getElementById('score').textContent = gameState.levelScore;
    
    resetLevelProgress();
    await saveGameProgress();
    
    window._levelCompleted = false;
    setLevelCompleted(false);
    
    restartLevel(true);
  };

  // Добавляем touch-обработчик для мобильных
  nextBtn.ontouchstart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('👆 Нажата кнопка "Следующий уровень" (touch)');
    
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

    document.getElementById('level').textContent = gameState.currentLevel;
    document.getElementById('score').textContent = gameState.levelScore;
    
    resetLevelProgress();
    await saveGameProgress();
    
    window._levelCompleted = false;
    setLevelCompleted(false);
    
    restartLevel(true);
  };

  // Обработчик для кнопки "Заново"
  restartBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔄 Нажата кнопка "Заново"');
    
    winModal.style.display = 'none';
    if (gameState.song) gameState.song.stop();

    gameState.levelScore = 0;
    document.getElementById('score').textContent = gameState.levelScore;
    
    resetLevelProgress();
    
    window._levelCompleted = false;
    setLevelCompleted(false);
    
    restartLevel(false);
  };

  // Touch-обработчик для кнопки "Заново"
  restartBtn.ontouchstart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('👆 Нажата кнопка "Заново" (touch)');
    
    winModal.style.display = 'none';
    if (gameState.song) gameState.song.stop();

    gameState.levelScore = 0;
    document.getElementById('score').textContent = gameState.levelScore;
    
    resetLevelProgress();
    
    window._levelCompleted = false;
    setLevelCompleted(false);
    
    restartLevel(false);
  };

  // Добавляем визуальную обратную связь
  [nextBtn, restartBtn].forEach(btn => {
    btn.style.cursor = 'pointer';
    btn.style.pointerEvents = 'auto';
    btn.style.position = 'relative';
    btn.style.zIndex = '10001';
  });
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