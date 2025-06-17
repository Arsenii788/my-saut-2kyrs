document.addEventListener('DOMContentLoaded', function() {
  // Переключение темы
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      
      // Сохраняем в базу данных, если пользователь авторизован
      if (window.userId) {
        updateSettings({ theme: newTheme });
      } else {
        // Сохраняем в localStorage для неавторизованных пользователей
        localStorage.setItem('theme', newTheme);
      }
    });
  }
  
  // Проверяем сохраненную тему в localStorage
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme && !window.userId) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }
  
  // Управление масштабом
  const scaleDown = document.getElementById('scale-down');
  const scaleUp = document.getElementById('scale-up');
  const scaleValue = document.getElementById('scale-value');
  
  if (scaleDown && scaleUp && scaleValue) {
    let currentScale = parseInt(document.body.style.zoom || '100');
    
    scaleDown.addEventListener('click', function() {
      if (currentScale > 50) {
        currentScale -= 10;
        updateScale(currentScale);
      }
    });
    
    scaleUp.addEventListener('click', function() {
      if (currentScale < 150) {
        currentScale += 10;
        updateScale(currentScale);
      }
    });
  }
  
  function updateScale(scale) {
    document.body.style.zoom = `${scale}%`;
    scaleValue.textContent = `${scale}%`;
    
    // Сохраняем в базу данных, если пользователь авторизован
    if (window.userId) {
      updateSettings({ scale: `${scale}%` });
    } else {
      // Сохраняем в localStorage для неавторизованных пользователей
      localStorage.setItem('scale', `${scale}%`);
    }
  }
  
  // Проверяем сохраненный масштаб в localStorage
  const savedScale = localStorage.getItem('scale');
  if (savedScale && !window.userId) {
    document.body.style.zoom = savedScale;
    if (scaleValue) {
      scaleValue.textContent = savedScale;
    }
  }
  
  // Функция для обновления настроек
  function updateSettings(settings) {
    fetch('/update-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings)
    })
    .then(response => response.text())
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));
  }
});