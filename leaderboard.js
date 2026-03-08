// leaderboard.js
import { getTopPlayers } from './supabase.js';
import { auth } from './supabase.js';

const UI_ELEMENTS = {
  leaderboardBtn: 'leaderboard-btn',
  leaderboardModal: 'leaderboard-modal',
  topList: 'top-list',
  closeLeaderboard: 'close-leaderboard'
};

export function initLeaderboard() {
  const btn = document.getElementById(UI_ELEMENTS.leaderboardBtn);
  if (!btn) return;

  // Клонируем кнопку для удаления старых обработчиков
  const newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);
  
  const handleLeaderboardClick = (e) => {
    e.preventDefault();
    showLeaderboard();
  };
  
  newBtn.addEventListener('click', handleLeaderboardClick);
  newBtn.addEventListener('touchstart', handleLeaderboardClick, { passive: false });

  // Закрытие модалки
  const closeBtn = document.getElementById(UI_ELEMENTS.closeLeaderboard);
  if (closeBtn) {
    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    
    const handleCloseClick = (e) => {
      e.preventDefault();
      document.getElementById(UI_ELEMENTS.leaderboardModal).style.display = 'none';
    };
    
    newCloseBtn.addEventListener('click', handleCloseClick);
    newCloseBtn.addEventListener('touchstart', handleCloseClick, { passive: false });
  }
}

async function showLeaderboard() {
  const modal = document.getElementById(UI_ELEMENTS.leaderboardModal);
  const list = document.getElementById(UI_ELEMENTS.topList);

  list.innerHTML = '<li>Загрузка рейтинга...</li>';
  modal.style.display = 'block';

  try {
    const topPlayers = await getTopPlayers(10);

    list.innerHTML = '';

    if (topPlayers.length === 0) {
      list.innerHTML = '<li>Пока нет рекордов</li>';
      return;
    }

    const { data: { session } } = await auth.getSession();
    const currentUserId = session?.user?.id;

    topPlayers.forEach((player, i) => {
      const li = document.createElement('li');
      li.style.margin = '12px 0';
      li.style.fontSize = '18px';
      li.style.padding = '8px';
      li.style.borderRadius = '5px';
      li.style.transition = 'all 0.2s';
      
      const score = player.lifetime_score || 0;
      const username = player.username || 'Аноним';
      const level = player.level || 1;
      
      let text = `<strong>#${i + 1}</strong> ${username} — ${score} очков (ур. ${level})`;

      if (currentUserId && player.user_id === currentUserId) {
        li.style.backgroundColor = 'rgba(255, 215, 0, 0.2)';
        li.style.color = '#FFD700';
        li.style.fontWeight = 'bold';
        li.style.border = '2px solid #FFD700';
        li.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.3)';
      }

      li.innerHTML = text;
      list.appendChild(li);
    });
    
  } catch (error) {
    console.error('Ошибка загрузки рейтинга:', error);
    list.innerHTML = '<li>Ошибка загрузки рейтинга</li>';
  }
}