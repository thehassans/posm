const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const sessionMaxAgeMs = Number(process.env.SESSION_MAX_AGE_MS || 8 * 60 * 60 * 1000);

app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'pos-super-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: sessionMaxAgeMs,
        httpOnly: true,
        sameSite: process.env.SESSION_COOKIE_SAME_SITE || 'lax',
        secure: process.env.SESSION_COOKIE_SECURE === 'true' || isProduction
    }
}));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/brands', require('./routes/brands'));
app.use('/api/products', require('./routes/products'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/analytics', require('./routes/analytics'));

// Named page routes — MUST be before express.static to avoid index.html conflict
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Static assets (js, css, etc.) served after named routes
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 4000;
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;
app.locals.appUrl = APP_URL;

process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});

if (require.main === module) {
    const server = app.listen(PORT, () => {
        console.log(`✅ POS System running at ${APP_URL}`);
        console.log('   Login: admin / admin123');
    });

    server.on('error', (error) => {
        console.error('Server startup error:', error);
    });
}

module.exports = app;