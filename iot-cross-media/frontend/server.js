const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// 啟用 CORS
app.use(cors());

// 靜態檔案服務
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/components', express.static(path.join(__dirname, 'components')));

// 首頁路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 頁面路由
app.get('/devices', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'devices.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'dashboard.html'));
});

app.get('/media', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'media.html'));
});

app.get('/tutorial', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'tutorial.html'));
});

app.get('/mqtt', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'mqtt.html'));
});

// 404 處理
app.use((req, res) => {
    res.status(404).send(`
        <h1>404 - 頁面找不到</h1>
        <p><a href="/">返回首頁</a></p>
    `);
});

// 啟動服務器
app.listen(PORT, () => {
    console.log(`✅ 前端服務器運行在 http://localhost:${PORT}`);
    console.log(`📱 IoT 教學系統已啟動`);
});
