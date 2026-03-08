// game/levelComplete.js
import { gameState, setLevelCompleted } from './gameState.js';
import { auth, saveProgress } from '../supabase.js';
import { resetLevelProgress, getCurrentLevel, initLevels } from './levelGoals.js';

export function showWinModal(scene) {
  const winModal = document.getElementById('win-modal');
  if (winModal.style.display === 'block') return;
  
  
  
  gameState.coins += 1000;
  document.getElementById('coins').textContent = gameState.coins;

  document.getElementById('win-time').textContent = gameState.elapsedTime;
  document.getElementById('win-moves').textContent = gameState.movesLeft;
  document.getElementById('win-score').textContent = gameState.levelScore;

  winModal.style.display = 'block';

  scene.time.delayedCall(500, () => {
    if (gameState.song && !gameState.song.isPlaying) {
      gameState.song.play();
    }
  });

  clearInterval(gameState.timerInterval);
  setupWinModalListeners();
}

function setupWinModalListeners() {
  const nextBtn = document.getElementById('next-level-btn');
  const restartBtn = document.getElementById('restart-win-btn');

  const newNextBtn = nextBtn.cloneNode(true);
  const newRestartBtn = restartBtn.cloneNode(true);
  nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
  restartBtn.parentNode.replaceChild(newRestartBtn, restartBtn);

  newNextBtn.onclick = async () => {
    
    
    setLevelCompleted(false);
    document.getElementById('win-modal').style.display = 'none';
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
  };

  newRestartBtn.onclick = () => {
    
    
    setLevelCompleted(false);
    document.getElementById('win-modal').style.display = 'none';
    if (gameState.song) gameState.song.stop();
    gameState.levelScore = 0;
    
    resetLevelProgress();
    
    
    window._levelCompleted = false;
    
    restartLevel(false);
  };
}

async function saveGameProgress() {
  if (auth.currentUser) {
    try {
      await saveProgress(
        auth.currentUser.id,
        gameState.currentLevel,
        gameState.lifetimeScore,
        gameState.coins,
        gameState.boosters // 👈 ДОБАВЛЕНО
      );
    } catch (err) {
      
    }
  }
}

function restartLevel(resetFromDB = false) {
  
  
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