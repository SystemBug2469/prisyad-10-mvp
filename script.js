const STORAGE_KEYS = {
  completed: 'prisyad10.completedDates',
  onboarding: 'prisyad10.onboardingSeen',
  userName: 'prisyad10.userName',
  habits: 'prisyad10.habits',
  reminders: 'prisyad10.reminders',
  sleep: 'prisyad10.sleepPlan'
};

const SUGGESTED_HABITS = [
  'Умыться сразу после пробуждения',
  'Выпить стакан воды',
  'Заправить постель'
];

const state = {
  today: new Date(),
  viewYear: new Date().getFullYear(),
  viewMonth: new Date().getMonth(),
  completedDates: loadCompletedDates(),
  habits: loadHabits(),
  reminders: loadJSON(STORAGE_KEYS.reminders, { enabled: false, time: '09:00' }),
  sleep: loadJSON(STORAGE_KEYS.sleep, { sleepTime: '23:30', wakeTime: '07:30', desiredWake: '', sleepShift: 0, wakeShift: 0 })
};

const onboardingEl = document.getElementById('onboarding');
const startOnboardingBtn = document.getElementById('start-onboarding');
const greetingEl = document.getElementById('greeting');
const todayDateEl = document.getElementById('today-date');
const levelValueEl = document.getElementById('level-value');
const targetValueEl = document.getElementById('target-value');
const progressBarEl = document.getElementById('progress-bar');
const progressCaptionEl = document.getElementById('progress-caption');
const motivationTextEl = document.getElementById('motivation-text');
const dailyActionStateEl = document.getElementById('daily-action-state');
const stackContentEl = document.getElementById('stack-content');
const sleepContentEl = document.getElementById('sleep-content');
const calendarTitleEl = document.getElementById('calendar-title');
const calendarWeekdaysEl = document.getElementById('calendar-weekdays');
const calendarGridEl = document.getElementById('calendar-grid');
const remindersEnabledEl = document.getElementById('reminders-enabled');
const reminderTimeEl = document.getElementById('reminder-time');
const notificationNoteEl = document.getElementById('notification-note');

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadCompletedDates() {
  const parsed = loadJSON(STORAGE_KEYS.completed, []);
  return new Set(Array.isArray(parsed) ? parsed : []);
}

function saveCompletedDates() {
  saveJSON(STORAGE_KEYS.completed, Array.from(state.completedDates));
}

function loadHabits() {
  const parsed = loadJSON(STORAGE_KEYS.habits, null);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return SUGGESTED_HABITS.map((text, index) => ({ id: Date.now() + index, text, active: true }));
  }
  return parsed;
}

function formatIso(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatRuDate(date) {
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function shiftTime(time, delta) {
  const [h, m] = time.split(':').map(Number);
  const total = (h * 60 + m + delta + 24 * 60) % (24 * 60);
  const nh = String(Math.floor(total / 60)).padStart(2, '0');
  const nm = String(total % 60).padStart(2, '0');
  return `${nh}:${nm}`;
}

function getStats() {
  // level calculation block
  const totalCompletedDays = state.completedDates.size;
  const level = Math.floor(totalCompletedDays / 10) + 1;
  const progressInLevel = totalCompletedDays % 10;
  const squatTargetToday = 10 + (level - 1);
  return { totalCompletedDays, level, progressInLevel, squatTargetToday };
}

function getCurrentStreak() {
  let streak = 0;
  const cursor = new Date(state.today);
  while (state.completedDates.has(formatIso(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function getMotivation(level) {
  if (level >= 5) return 'Ты строишь систему. Теперь можно оптимизировать сон и восстановление.';
  if (level >= 2) return 'Отлично! Пора усиливать эффект через цепочку привычек.';
  return 'Стабильность важнее масштаба: маленькое действие каждый день.';
}

function updateGreeting() {
  // Telegram user detection block
  const telegramName = window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name;
  let name = telegramName || localStorage.getItem(STORAGE_KEYS.userName);
  if (!name) {
    const answer = window.prompt('Как к вам обращаться?', 'Друг');
    name = (answer || 'Друг').trim() || 'Друг';
    localStorage.setItem(STORAGE_KEYS.userName, name);
  }
  greetingEl.textContent = `Привет, ${name}`;
}

function renderProgress() {
  const stats = getStats();
  levelValueEl.textContent = String(stats.level);
  targetValueEl.textContent = String(stats.squatTargetToday);
  progressCaptionEl.textContent = `${stats.progressInLevel}/10 до следующего уровня`;
  progressBarEl.style.width = `${stats.progressInLevel * 10}%`;
  motivationTextEl.textContent = getMotivation(stats.level);
}

function markTodayDone() {
  const todayIso = formatIso(state.today);
  if (state.completedDates.has(todayIso)) return;
  state.completedDates.add(todayIso);
  saveCompletedDates();
  renderAll();
}

function renderDailyAction() {
  const todayIso = formatIso(state.today);
  const done = state.completedDates.has(todayIso);
  if (done) {
    dailyActionStateEl.innerHTML = `
      <div class="success-box">
        <p class="success-title">✅ Сегодня выполнено</p>
        <p class="success-meta">Текущая серия: ${getCurrentStreak()} дн.</p>
      </div>
    `;
    return;
  }

  dailyActionStateEl.innerHTML = `
    <button id="done-btn" class="primary-btn" type="button">Я сделал приседания сегодня</button>
    <p class="modal-note">Отметить можно только один раз в день.</p>
  `;
  document.getElementById('done-btn').addEventListener('click', markTodayDone);
}

function renderWeekdays() {
  const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  calendarWeekdaysEl.innerHTML = '';
  weekdays.forEach((label) => {
    const item = document.createElement('div');
    item.className = 'weekday';
    item.textContent = label;
    calendarWeekdaysEl.appendChild(item);
  });
}

function renderCalendar() {
  const first = new Date(state.viewYear, state.viewMonth, 1);
  const monthLabel = first.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  calendarTitleEl.textContent = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
  calendarGridEl.innerHTML = '';

  const start = (first.getDay() + 6) % 7;
  const days = new Date(state.viewYear, state.viewMonth + 1, 0).getDate();
  const prevDays = new Date(state.viewYear, state.viewMonth, 0).getDate();

  for (let i = 0; i < start; i += 1) {
    const cell = document.createElement('div');
    cell.className = 'day-cell muted';
    cell.textContent = String(prevDays - start + i + 1);
    calendarGridEl.appendChild(cell);
  }

  for (let day = 1; day <= days; day += 1) {
    const cell = document.createElement('div');
    const date = new Date(state.viewYear, state.viewMonth, day);
    const iso = formatIso(date);
    cell.className = 'day-cell';
    cell.textContent = String(day);
    if (iso === formatIso(state.today)) cell.classList.add('today');
    if (state.completedDates.has(iso)) cell.classList.add('completed');
    calendarGridEl.appendChild(cell);
  }

  const total = start + days;
  const tail = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let i = 1; i <= tail; i += 1) {
    const cell = document.createElement('div');
    cell.className = 'day-cell muted';
    cell.textContent = String(i);
    calendarGridEl.appendChild(cell);
  }
}

function renderStackModal() {
  const { level } = getStats();

  // habit stack unlock block
  if (level < 2) {
    stackContentEl.innerHTML = '<div class="locked">Откроется на 2 уровне. Сначала закрепим базовую привычку.</div>';
    return;
  }

  stackContentEl.innerHTML = `
    <p>Якорь → цепочка: после приседаний запускай 2-3 простых действия подряд.</p>
    <label class="field-row">Новая привычка
      <input id="new-habit-input" type="text" placeholder="Например: 5 минут чтения" />
    </label>
    <button id="add-habit-btn" class="primary-btn" type="button">Добавить</button>
    <ul class="stack-list" id="stack-list"></ul>
  `;

  const listEl = document.getElementById('stack-list');
  function renderList() {
    listEl.innerHTML = '';
    state.habits.forEach((habit) => {
      const li = document.createElement('li');
      li.className = 'stack-item';
      li.innerHTML = `
        <div>
          <strong>${habit.active ? '🟢' : '⚪'} ${habit.text}</strong>
        </div>
        <div class="stack-controls">
          <button class="mini-btn" data-toggle="${habit.id}" type="button">${habit.active ? 'Выключить' : 'Включить'}</button>
          <button class="mini-btn" data-delete="${habit.id}" type="button">Удалить</button>
        </div>
      `;
      listEl.appendChild(li);
    });

    listEl.querySelectorAll('[data-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.toggle);
        state.habits = state.habits.map((h) => (h.id === id ? { ...h, active: !h.active } : h));
        saveJSON(STORAGE_KEYS.habits, state.habits);
        renderList();
      });
    });

    listEl.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.delete);
        state.habits = state.habits.filter((h) => h.id !== id);
        saveJSON(STORAGE_KEYS.habits, state.habits);
        renderList();
      });
    });
  }

  renderList();

  document.getElementById('add-habit-btn').addEventListener('click', () => {
    const input = document.getElementById('new-habit-input');
    const text = input.value.trim();
    if (!text) return;
    state.habits.push({ id: Date.now(), text, active: true });
    saveJSON(STORAGE_KEYS.habits, state.habits);
    input.value = '';
    renderList();
  });
}

function renderSleepModal() {
  const { level } = getStats();

  // sleep module unlock block
  if (level < 5) {
    sleepContentEl.innerHTML = '<div class="locked">Откроется на 5 уровне. Сначала укрепим базовую систему.</div>';
    return;
  }

  const wakePlanned = shiftTime(state.sleep.wakeTime, -10 * state.sleep.wakeShift);
  const sleepPlanned = shiftTime(state.sleep.sleepTime, -10 * state.sleep.sleepShift);

  sleepContentEl.innerHTML = `
    <p>Сдвигай график постепенно: по 10 минут в день, без резких изменений.</p>
    <label class="field-row">Текущее время отбоя <input id="sleep-time" type="time" value="${state.sleep.sleepTime}" /></label>
    <label class="field-row">Текущее время подъема <input id="wake-time" type="time" value="${state.sleep.wakeTime}" /></label>
    <label class="field-row">Желаемое время подъема (опционально) <input id="desired-wake-time" type="time" value="${state.sleep.desiredWake}" /></label>
    <button id="save-sleep" class="primary-btn" type="button">Сохранить базовые времена</button>
    <div class="success-box" style="margin-top:10px;">
      <p class="success-title">План сейчас</p>
      <p class="success-meta">Подъем: ${wakePlanned} (шагов: ${state.sleep.wakeShift})</p>
      <p class="success-meta">Отбой: ${sleepPlanned} (шагов: ${state.sleep.sleepShift})</p>
    </div>
    <div class="quick-grid" style="margin-top:10px;">
      <button id="shift-wake" class="quick-btn" type="button">Сдвинуть подъем на 10 минут раньше</button>
      <button id="shift-sleep" class="quick-btn" type="button">Сдвинуть отбой на 10 минут раньше</button>
    </div>
  `;

  document.getElementById('save-sleep').addEventListener('click', () => {
    state.sleep.sleepTime = document.getElementById('sleep-time').value || state.sleep.sleepTime;
    state.sleep.wakeTime = document.getElementById('wake-time').value || state.sleep.wakeTime;
    state.sleep.desiredWake = document.getElementById('desired-wake-time').value || '';
    saveJSON(STORAGE_KEYS.sleep, state.sleep);
    renderSleepModal();
  });

  document.getElementById('shift-wake').addEventListener('click', () => {
    state.sleep.wakeShift += 1;
    saveJSON(STORAGE_KEYS.sleep, state.sleep);
    renderSleepModal();
  });

  document.getElementById('shift-sleep').addEventListener('click', () => {
    state.sleep.sleepShift += 1;
    saveJSON(STORAGE_KEYS.sleep, state.sleep);
    renderSleepModal();
  });
}

function initReminders() {
  remindersEnabledEl.checked = Boolean(state.reminders.enabled);
  reminderTimeEl.value = state.reminders.time || '09:00';
  notificationNoteEl.textContent = 'Browser Notification API: опционально, без гарантии в текущей версии.';

  document.getElementById('save-reminders').addEventListener('click', () => {
    state.reminders = { enabled: remindersEnabledEl.checked, time: reminderTimeEl.value || '09:00' };
    saveJSON(STORAGE_KEYS.reminders, state.reminders);
    if ('Notification' in window) {
      notificationNoteEl.textContent = 'API уведомлений обнаружен. Запрос разрешения будет добавлен в следующих версиях.';
    }
  });
}

function bindCalendarNav() {
  document.getElementById('prev-month').addEventListener('click', () => {
    state.viewMonth -= 1;
    if (state.viewMonth < 0) {
      state.viewMonth = 11;
      state.viewYear -= 1;
    }
    renderCalendar();
  });

  document.getElementById('next-month').addEventListener('click', () => {
    state.viewMonth += 1;
    if (state.viewMonth > 11) {
      state.viewMonth = 0;
      state.viewYear += 1;
    }
    renderCalendar();
  });
}

function initModals() {
  document.querySelectorAll('[data-modal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const modal = document.getElementById(btn.dataset.modal);
      if (!modal) return;
      if (btn.dataset.modal === 'stack-modal') renderStackModal();
      if (btn.dataset.modal === 'sleep-modal') renderSleepModal();
      if (btn.dataset.modal === 'calendar-modal') renderCalendar();
      modal.classList.remove('hidden');
    });
  });

  document.querySelectorAll('[data-close]').forEach((btn) => {
    btn.addEventListener('click', () => btn.closest('.modal').classList.add('hidden'));
  });

  document.querySelectorAll('.modal').forEach((modal) => {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) modal.classList.add('hidden');
    });
  });
}

function initOnboarding() {
  // onboarding block
  const seen = localStorage.getItem(STORAGE_KEYS.onboarding) === 'true';
  if (!seen) onboardingEl.classList.remove('hidden');

  startOnboardingBtn.addEventListener('click', () => {
    localStorage.setItem(STORAGE_KEYS.onboarding, 'true');
    onboardingEl.classList.add('hidden');
  });
}

function renderAll() {
  todayDateEl.textContent = formatRuDate(state.today);
  updateGreeting();
  renderProgress();
  renderDailyAction();
  renderCalendar();
}

renderWeekdays();
bindCalendarNav();
initModals();
initOnboarding();
initReminders();
renderAll();
