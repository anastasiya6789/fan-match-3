// leaderboard.js
import { getTopPlayers } from './supabase.js';
import { auth } from './supabase.js';

const UI_ELEMENTS = {
  leaderboardBtn: 'leaderboard-btn',
  leaderboardModal: 'leaderboard-modal',
  topList: 'top-list',
  closeLeaderboard: 'close-leaderboard'
};

// Инициализация рейтинга (вызывается один раз)
export function initLeaderboard() {
  const btn = document.getElementById(UI_ELEMENTS.leaderboardBtn);
  if (!btn) return;

  // Удаляем предыдущие обработчики, чтобы не было дублирования
  btn.removeEventListener('click', showLeaderboard);
  btn.addEventListener('click', showLeaderboard);

  // Закрытие модалки
  const closeBtn = document.getElementById(UI_ELEMENTS.closeLeaderboard);
  closeBtn.removeEventListener('click', closeLeaderboard);
  closeBtn.addEventListener('click', closeLeaderboard);
}

// Функция закрытия
function closeLeaderboard() {
  document.getElementById(UI_ELEMENTS.leaderboardModal).style.display = 'none';
}

// Показ рейтинга
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

    // Получаем текущего пользователя (более надежный способ)
    const { data: { session } } = await auth.getSession();
    const currentUserId = session?.user?.id;
    

    topPlayers.forEach((player, i) => {
      const li = document.createElement('li');
      li.style.margin = '12px 0';
      li.style.fontSize = '18px';
      li.style.padding = '8px';
      li.style.borderRadius = '5px';
      li.style.transition = 'all 0.2s';
      
      // ВАЖНО: Используем player.lifetime_score, а не player.score!
      const score = player.lifetime_score || 0;
      const username = player.username || 'Аноним';
      const level = player.level || 1;
      
      // Формируем текст с правильным полем score
      let text = `<strong>#${i + 1}</strong> ${username} — ${score} очков (ур. ${level})`;

      // Подсветка текущего игрока
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
    
    list.innerHTML = '<li>Ошибка загрузки рейтинга</li>';
  }
}