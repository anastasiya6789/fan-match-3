// piggy.js
import { gameState } from './game/index.js'; // ← ИСПРАВЛЕНО
import { supabaseClient } from './supabase.js';

const UI_ELEMENTS = {
  piggyBtn: 'piggy-btn',
  piggyModal: 'piggy-modal',
  closePiggy: 'close-piggy',
  piggyTotal: 'piggy-total',
  piggyBar: 'piggy-bar',
  piggyCustom: 'piggy-custom',
  addToPiggy: 'add-to-piggy',
  coins: 'coins'
};

const PIGGY_CONFIG = {
  MIN_AMOUNT: 10,
  GOAL: 100000,
  AMOUNTS: [200, 500, 1000]
};

let sharedPiggy = 0;
let piggyChannel = null; // для отписки при необходимости

export function initPiggy() {
  
  
  // Загружаем из БД
  loadPiggyFromDB();
  
  // Подписываемся на реальные обновления
  subscribeToPiggyChanges();
  
  // Кнопка открытия
  const piggyBtn = document.getElementById(UI_ELEMENTS.piggyBtn);
  if (piggyBtn) {
    piggyBtn.addEventListener('click', showPiggyModal);
  }
  
  // Закрытие
  const closeBtn = document.getElementById(UI_ELEMENTS.closePiggy);
  if (closeBtn) {
    closeBtn.addEventListener('click', closePiggyModal);
  }
  
  // Предустановленные суммы
  document.querySelectorAll('.piggy-amount').forEach(btn => {
    btn.addEventListener('click', () => addToPiggy(parseInt(btn.dataset.amount)));
  });
  
  // Кастомная сумма
  const addBtn = document.getElementById(UI_ELEMENTS.addToPiggy);
  if (addBtn) {
    addBtn.addEventListener('click', handleCustomAdd);
  }
}

// Подписка на изменения в реальном времени
function subscribeToPiggyChanges() {
  // Отписываемся от предыдущей подписки если есть
  if (piggyChannel) {
    supabaseClient.removeChannel(piggyChannel);
  }

  piggyChannel = supabaseClient
    .channel('piggy-realtime')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'piggy_bank',
        filter: 'id=eq.1'
      },
      (payload) => {
        
        const newTotal = payload.new.total;
        
        // Обновляем локальное значение
        sharedPiggy = newTotal;
        
        // Обновляем UI если модалка открыта
        updatePiggyDisplay();
        
        // Можно показать уведомление
        showFloatingNotification('💰 Кто-то пополнил копилку!');
      }
    )
    .subscribe((status) => {
      
    });
}

// Показать плавающее уведомление
function showFloatingNotification(message) {
  // Создаем элемент уведомления
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(255, 215, 0, 0.9);
    color: black;
    padding: 12px 24px;
    border-radius: 50px;
    font-weight: bold;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    z-index: 9999;
    animation: slideIn 0.3s ease;
  `;

  // Добавляем анимацию
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(notification);

  // Убираем через 3 секунды
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    style.textContent += `
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

function showPiggyModal() {
  updatePiggyDisplay();
  document.getElementById(UI_ELEMENTS.piggyModal).style.display = 'block';
}

function closePiggyModal() {
  document.getElementById(UI_ELEMENTS.piggyModal).style.display = 'none';
}

function updatePiggyDisplay() {
  document.getElementById(UI_ELEMENTS.piggyTotal).textContent = sharedPiggy;
  const piggyBar = document.getElementById(UI_ELEMENTS.piggyBar);
  piggyBar.value = sharedPiggy;
  piggyBar.max = PIGGY_CONFIG.GOAL;
}

function handleCustomAdd() {
  const custom = parseInt(document.getElementById(UI_ELEMENTS.piggyCustom).value);
  if (!isNaN(custom) && custom >= PIGGY_CONFIG.MIN_AMOUNT) {
    addToPiggy(custom);
    document.getElementById(UI_ELEMENTS.piggyCustom).value = '';
  } else {
    alert(`Минимум ${PIGGY_CONFIG.MIN_AMOUNT} монеток!`);
  }
}

export async function addToPiggy(amount) {
  if (amount > gameState.coins) {
    alert('Недостаточно монеток!');
    return false;
  }

  // Списываем монеты
  gameState.coins -= amount;
  
  // Обновляем локальное значение (оптимистично)
  const newTotal = sharedPiggy + amount;
  
  // Обновляем UI
  document.getElementById(UI_ELEMENTS.coins).textContent = gameState.coins;

  // Визуальный эффект
  const addBtn = document.getElementById(UI_ELEMENTS.addToPiggy);
  addBtn.classList.add('success');
  setTimeout(() => addBtn.classList.remove('success'), 600);

  // Сохраняем в БД
  try {
    const { error } = await supabaseClient
      .from('piggy_bank')
      .update({ 
        total: newTotal,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1);
    
    if (error) throw error;
    
    // Локально обновляем только после успешного сохранения
    sharedPiggy = newTotal;
    updatePiggyDisplay();
    
    
    
    // Проверяем цель
    if (sharedPiggy >= PIGGY_CONFIG.GOAL) {
      celebrateGoal();
    }
    
    return true;
  } catch (error) {
    
    alert('Ошибка при добавлении в копилку. Попробуйте еще раз.');
    return false;
  }
}

async function loadPiggyFromDB() {
  try {
    const { data, error } = await supabaseClient
      .from('piggy_bank')
      .select('total')
      .eq('id', 1)
      .maybeSingle();
    
    if (error) {
      
      sharedPiggy = 0;
    } else if (data) {
      sharedPiggy = data.total || 0;
      
    } else {
      // Если нет записи, создаем
      await createPiggyRecord();
      sharedPiggy = 0;
    }
  } catch (error) {
    
    sharedPiggy = 0;
  }
  
  updatePiggyDisplay();
}

async function createPiggyRecord() {
  const { error } = await supabaseClient
    .from('piggy_bank')
    .insert({ id: 1, total: 0 });
  
  if (error) {
    
  }
}

// Функция для ручного обновления (если нужно)
export function refreshPiggy() {
  loadPiggyFromDB();
}

// Отписка от realtime (вызвать при выходе из игры)
export function unsubscribeFromPiggy() {
  if (piggyChannel) {
    supabaseClient.removeChannel(piggyChannel);
    piggyChannel = null;
    
  }
}

function celebrateGoal() {
  alert('🎉 Поздравляем! Лешик скинет ножки!');
  // Здесь можно добавить логику разблокировки нового уровня
}