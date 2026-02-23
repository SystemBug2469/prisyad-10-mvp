const STORAGE_KEY = 'prisyad10.completedDates';

const todayDateEl = document.getElementById('today-date');
const actionState = document.getElementById('action-state');
const streakValue = document.getElementById('streak-value');
const monthCountValue = document.getElementById('month-count-value');
const calendarTitle = document.getElementById('calendar-title');
const calendarWeekdays = document.getElementById('calendar-weekdays');
const calendarGrid = document.getElementById('calendar-grid');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');

const weekdaysRu = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const today = new Date();
let viewYear = today.getFullYear();
let viewMonth = today.getMonth();

function formatRuDate(date) {
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function formatIso(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function loadCompletedDates() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return new Set();

  try {
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveCompletedDates(completedDates) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(completedDates)));
}

function getCurrentStreak(completedDates) {
  let streak = 0;
  const cursor = new Date(today);

  while (completedDates.has(formatIso(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getCompletedCountForMonth(completedDates, year, month) {
  let count = 0;

  completedDates.forEach((isoDate) => {
    const [y, m] = isoDate.split('-').map(Number);
    if (y === year && m - 1 === month) {
      count += 1;
    }
  });

  return count;
}

function renderActionState(completedDates) {
  const todayIso = formatIso(today);
  const isDoneToday = completedDates.has(todayIso);

  if (isDoneToday) {
    actionState.innerHTML = `
      <div class="success-state">
        <div class="success-icon" aria-hidden="true">✅</div>
        <div>
          <p class="success-title">Отличная работа! Сегодня выполнено.</p>
          <p class="success-note">Ты уже сделал 10 приседаний — так держать!</p>
        </div>
      </div>
    `;
  } else {
    actionState.innerHTML = `
      <button id="done-button" class="done-button" type="button">Я сделал 10 приседаний сегодня</button>
      <p id="status-text" class="status-text">Статус: ещё не отмечено.</p>
    `;

    const button = document.getElementById('done-button');
    button.addEventListener('click', () => {
      completedDates.add(todayIso);
      saveCompletedDates(completedDates);
      refreshUI(completedDates);
    });
  }
}

function renderStats(completedDates) {
  streakValue.textContent = String(getCurrentStreak(completedDates));
  monthCountValue.textContent = String(getCompletedCountForMonth(completedDates, today.getFullYear(), today.getMonth()));
}

function renderWeekdays() {
  calendarWeekdays.innerHTML = '';
  weekdaysRu.forEach((dayLabel) => {
    const el = document.createElement('div');
    el.className = 'weekday';
    el.textContent = dayLabel;
    calendarWeekdays.appendChild(el);
  });
}

function renderCalendar(completedDates) {
  const monthDate = new Date(viewYear, viewMonth, 1);
  const monthLabel = monthDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  calendarTitle.textContent = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  calendarGrid.innerHTML = '';

  const firstDayMondayIndex = (monthDate.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  for (let i = 0; i < firstDayMondayIndex; i += 1) {
    const cell = document.createElement('div');
    cell.className = 'day-cell muted';
    cell.textContent = String(daysInPrevMonth - firstDayMondayIndex + i + 1);
    calendarGrid.appendChild(cell);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(viewYear, viewMonth, day);
    const iso = formatIso(date);

    const cell = document.createElement('div');
    cell.className = 'day-cell';
    cell.textContent = String(day);

    if (iso === formatIso(today)) {
      cell.classList.add('today');
    }

    if (completedDates.has(iso)) {
      cell.classList.add('completed');
    }

    calendarGrid.appendChild(cell);
  }

  const totalCells = firstDayMondayIndex + daysInMonth;
  const tail = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= tail; i += 1) {
    const cell = document.createElement('div');
    cell.className = 'day-cell muted';
    cell.textContent = String(i);
    calendarGrid.appendChild(cell);
  }
}

function refreshUI(completedDates) {
  todayDateEl.textContent = formatRuDate(today);
  renderActionState(completedDates);
  renderStats(completedDates);
  renderCalendar(completedDates);
}

prevMonthBtn.addEventListener('click', () => {
  viewMonth -= 1;
  if (viewMonth < 0) {
    viewMonth = 11;
    viewYear -= 1;
  }
  renderCalendar(loadCompletedDates());
});

nextMonthBtn.addEventListener('click', () => {
  viewMonth += 1;
  if (viewMonth > 11) {
    viewMonth = 0;
    viewYear += 1;
  }
  renderCalendar(loadCompletedDates());
});

const completedDates = loadCompletedDates();
renderWeekdays();
refreshUI(completedDates);
