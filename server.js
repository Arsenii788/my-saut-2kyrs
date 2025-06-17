const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Настройка базы данных
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Ошибка подключения к базе данных:', err.message);
  } else {
    console.log('Подключено к SQLite базе данных.');
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT,
      theme TEXT DEFAULT 'light',
      scale TEXT DEFAULT '100%'
    )`);
  }
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'server-center-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Маршруты
app.get('/', (req, res) => {
  res.render('index', { user: req.session.user });
});

app.get('/services', (req, res) => {
  res.render('services', { user: req.session.user });
});

app.get('/team', (req, res) => {
  res.render('team', { user: req.session.user });
});

app.get('/contacts', (req, res) => {
  res.render('contacts', { user: req.session.user });
});

app.get('/register', (req, res) => {
  res.render('register', { user: req.session.user, error: null });
});

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  
  db.run(
    'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
    [username, email, hashedPassword],
    function(err) {
      if (err) {
        return res.render('register', { 
          user: null, 
          error: 'Пользователь с таким именем или email уже существует' 
        });
      }
      res.redirect('/login');
    }
  );
});

app.get('/login', (req, res) => {
  res.render('login', { user: req.session.user, error: null });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.render('login', { 
        user: null, 
        error: 'Неверное имя пользователя или пароль' 
      });
    }
    
    req.session.user = user;
    res.redirect('/account');
  });
});

app.get('/account', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.render('account', { user: req.session.user });
});

app.post('/update-settings', (req, res) => {
  if (!req.session.user) {
    return res.status(401).send('Не авторизован');
  }
  
  const { theme, scale } = req.body;
  db.run(
    'UPDATE users SET theme = ?, scale = ? WHERE id = ?',
    [theme, scale, req.session.user.id],
    (err) => {
      if (err) {
        return res.status(500).send('Ошибка обновления настроек');
      }
      
      // Обновляем данные в сессии
      req.session.user.theme = theme;
      req.session.user.scale = scale;
      res.send('Настройки обновлены');
    }
  );
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});