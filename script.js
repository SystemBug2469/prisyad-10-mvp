const todayDateEl = document.getElementById('today-date');
const doneButton = document.getElementById('done-button');
const statusText = document.getElementById('status-text');

const now = new Date();
const dateRu = now.toLocaleDateString('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric'
});

todayDateEl.textContent = dateRu;

doneButton.addEventListener('click', () => {
  statusText.textContent = 'Статус: отлично, сегодня 10 приседаний сделаны!';
  statusText.classList.add('done');
});
