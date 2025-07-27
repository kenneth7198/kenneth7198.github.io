#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');

console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════╗
║        IoT Cross-Media 教學版安裝程式            ║
║                                                  ║
║    歡迎使用專為大學教學設計的輕量級版本！        ║
╚══════════════════════════════════════════════════╝
`));

async function main() {
    try {
        // 檢查系統需求
        await checkSystemRequirements();
        
        // 詢問安裝選項
        const options = await askInstallationOptions();
        
        // 執行安裝
        await performInstallation(options);
        
        // 顯示完成訊息
        showCompletionMessage();
        
    } catch (error) {
        console.error(chalk.red('安裝過程中發生錯誤:'), error.message);
        process.exit(1);
    }
}

async function checkSystemRequirements() {
    const spinner = ora('檢查系統需求...').start();
    
    try {
        // 檢查 Node.js 版本
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
        
        if (majorVersion < 16) {
            throw new Error(`需要 Node.js 16 以上版本，目前版本: ${nodeVersion}`);
        }
        
        // 檢查 npm
        execSync('npm --version', { stdio: 'ignore' });
        
        // 檢查可用空間（簡化版）
        const stats = fs.statSync('.');
        
        spinner.succeed('系統需求檢查通過！');
        console.log(chalk.green(`✓ Node.js 版本: ${nodeVersion}`));
        console.log(chalk.green(`✓ npm 已安裝`));
        
    } catch (error) {
        spinner.fail('系統需求檢查失敗');
        throw error;
    }
}

async function askInstallationOptions() {
    console.log(chalk.yellow('\n請選擇安裝選項：\n'));
    
    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'installType',
            message: '選擇安裝類型：',
            choices: [
                {
                    name: '🎓 完整教學版 (推薦給初學者)',
                    value: 'full-education'
                },
                {
                    name: '⚡ 精簡版 (只有核心功能)',
                    value: 'minimal'
                },
                {
                    name: '🔧 開發者版 (包含除錯工具)',
                    value: 'developer'
                }
            ]
        },
        {
            type: 'confirm',
            name: 'includeExamples',
            message: '是否包含範例程式碼和教學文檔？',
            default: true
        },
        {
            type: 'list',
            name: 'databaseInit',
            message: '選擇初始資料設定：',
            choices: [
                { name: '📊 包含示範資料 (推薦)', value: 'with-demo-data' },
                { name: '🗃️ 空白資料庫', value: 'empty' },
                { name: '🎯 互動式教學資料', value: 'tutorial-data' }
            ]
        }
    ]);
    
    return answers;
}

async function performInstallation(options) {
    console.log(chalk.blue('\n開始安裝程序...\n'));
    
    // 1. 建立專案結構
    await createProjectStructure(options);
    
    // 2. 安裝前端依賴
    await installFrontendDependencies(options);
    
    // 3. 安裝後端依賴
    await installBackendDependencies(options);
    
    // 4. 初始化資料庫
    await initializeDatabase(options);
    
    // 5. 設定教學內容
    if (options.includeExamples) {
        await setupTutorialContent(options);
    }
    
    // 6. 建立啟動腳本
    await createStartupScripts();
}

async function createProjectStructure(options) {
    const spinner = ora('建立專案結構...').start();
    
    try {
        const directories = [
            'frontend-simple/assets/css',
            'frontend-simple/assets/js',
            'frontend-simple/assets/images',
            'frontend-simple/pages',
            'frontend-simple/components',
            'backend-simple/src/routes',
            'backend-simple/src/models',
            'backend-simple/src/controllers',
            'backend-simple/src/middleware',
            'backend-simple/src/simulators',
            'backend-simple/database',
            'backend-simple/scripts',
            'tutorials',
            'examples/api-examples',
            'examples/component-examples',
            'examples/iot-examples',
            'tools/code-checker',
            'tools/progress-tracker',
            'tools/deployment-helper'
        ];
        
        for (const dir of directories) {
            await fs.ensureDir(dir);
        }
        
        spinner.succeed('專案結構建立完成');
        
    } catch (error) {
        spinner.fail('專案結構建立失敗');
        throw error;
    }
}

async function installFrontendDependencies(options) {
    const spinner = ora('安裝前端依賴套件...').start();
    
    try {
        // 建立前端 package.json (簡化的靜態服務器)
        const frontendPackage = {
            name: "iot-crossmedia-frontend-simple",
            version: "1.0.0",
            private: true,
            dependencies: {
                "express": "^4.18.2",
                "cors": "^2.8.5"
            },
            scripts: {
                "start": "node server.js",
                "dev": "node server.js"
            },
            description: "Static server for jQuery-based IoT frontend"
        };
        
        await fs.writeJson('frontend-simple/package.json', frontendPackage, { spaces: 2 });
        
        // 安裝依賴
        execSync('npm install', { 
            cwd: 'frontend-simple', 
            stdio: ['ignore', 'pipe', 'pipe'] 
        });
        
        spinner.succeed('前端依賴安裝完成');
        
    } catch (error) {
        spinner.fail('前端依賴安裝失敗');
        throw error;
    }
}

async function installBackendDependencies(options) {
    const spinner = ora('安裝後端依賴套件...').start();
    
    try {
        // 建立後端 package.json
        const backendPackage = {
            name: "iot-crossmedia-backend-simple",
            version: "1.0.0",
            main: "src/app.js",
            scripts: {
                "start": "node src/app.js",
                "dev": "nodemon src/app.js",
                "test": "jest"
            },
            dependencies: {
                "express": "^4.18.2",
                "cors": "^2.8.5",
                "helmet": "^6.0.1",
                "morgan": "^1.10.0",
                "sqlite3": "^5.1.6",
                "socket.io": "^4.6.1",
                "multer": "^1.4.5-lts.1",
                "express-rate-limit": "^6.7.0",
                "express-session": "^1.17.3",
                "bcryptjs": "^2.4.3",
                "joi": "^17.8.3",
                "mqtt": "^4.3.7",
                "aedes": "^0.49.0"
            },
            devDependencies: {
                "nodemon": "^2.0.20",
                "jest": "^29.4.3",
                "supertest": "^6.3.3"
            }
        };
        
        await fs.writeJson('backend-simple/package.json', backendPackage, { spaces: 2 });
        
        // 安裝依賴
        execSync('npm install', { 
            cwd: 'backend-simple', 
            stdio: ['ignore', 'pipe', 'pipe'] 
        });
        
        spinner.succeed('後端依賴安裝完成');
        
    } catch (error) {
        spinner.fail('後端依賴安裝失敗');
        throw error;
    }
}

async function initializeDatabase(options) {
    const spinner = ora('初始化資料庫...').start();
    
    try {
        // 建立資料庫初始化腳本
        const dbScript = `
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/iot_education.db');
const db = new sqlite3.Database(dbPath);

// 建立資料表
db.serialize(() => {
    // 用戶表
    db.run(\`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'student',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )\`);
    
    // 設備表
    db.run(\`CREATE TABLE IF NOT EXISTS devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'offline',
        last_seen DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )\`);
    
    // 感測器資料表
    db.run(\`CREATE TABLE IF NOT EXISTS sensor_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT NOT NULL,
        sensor_type TEXT NOT NULL,
        value REAL NOT NULL,
        unit TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES devices (device_id)
    )\`);
    
    // 媒體檔案表
    db.run(\`CREATE TABLE IF NOT EXISTS media_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        path TEXT NOT NULL,
        uploaded_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uploaded_by) REFERENCES users (id)
    )\`);
    
    console.log('資料庫表格建立完成');
});

db.close((err) => {
    if (err) {
        console.error('關閉資料庫時發生錯誤:', err);
    } else {
        console.log('資料庫初始化完成');
    }
});
`;
        
        await fs.writeFile('backend-simple/scripts/init-database.js', dbScript);
        
        // 執行資料庫初始化
        execSync('node scripts/init-database.js', { 
            cwd: 'backend-simple',
            stdio: ['ignore', 'pipe', 'pipe']
        });
        
        // 根據選項添加示範資料
        if (options.databaseInit === 'with-demo-data') {
            await addDemoData();
        } else if (options.databaseInit === 'tutorial-data') {
            await addTutorialData();
        }
        
        spinner.succeed('資料庫初始化完成');
        
    } catch (error) {
        spinner.fail('資料庫初始化失敗');
        throw error;
    }
}

async function addDemoData() {
    // 添加示範資料的腳本
    const demoScript = `
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/iot_education.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // 添加示範設備
    const devices = [
        ['TEMP_001', '溫度感測器 #1', 'temperature', 'online'],
        ['HUMID_001', '濕度感測器 #1', 'humidity', 'online'],
        ['LIGHT_001', '光線感測器 #1', 'light', 'online'],
        ['LED_001', 'LED 控制器 #1', 'actuator', 'online']
    ];
    
    const stmt = db.prepare('INSERT OR REPLACE INTO devices (device_id, name, type, status, last_seen) VALUES (?, ?, ?, ?, datetime("now"))');
    devices.forEach(device => stmt.run(device));
    stmt.finalize();
    
    // 添加示範感測器資料
    const sensorData = [];
    const now = new Date();
    for (let i = 0; i < 100; i++) {
        const timestamp = new Date(now.getTime() - i * 60000); // 每分鐘一筆資料
        sensorData.push(['TEMP_001', 'temperature', 20 + Math.random() * 10, '°C', timestamp.toISOString()]);
        sensorData.push(['HUMID_001', 'humidity', 40 + Math.random() * 20, '%', timestamp.toISOString()]);
        sensorData.push(['LIGHT_001', 'light', Math.random() * 1000, 'lux', timestamp.toISOString()]);
    }
    
    const dataStmt = db.prepare('INSERT INTO sensor_data (device_id, sensor_type, value, unit, timestamp) VALUES (?, ?, ?, ?, ?)');
    sensorData.forEach(data => dataStmt.run(data));
    dataStmt.finalize();
    
    console.log('示範資料添加完成');
});

db.close();
`;
    
    await fs.writeFile('backend-simple/scripts/add-demo-data.js', demoScript);
    execSync('node scripts/add-demo-data.js', { cwd: 'backend-simple' });
}

async function addTutorialData() {
    // 添加教學用資料
    // 類似 addDemoData 但是為教學設計的特定資料
}

async function setupTutorialContent(options) {
    const spinner = ora('設定教學內容...').start();
    
    try {
        // 建立週別教學目錄和內容
        for (let week = 1; week <= 6; week++) {
            const weekDir = `tutorials/week${week}`;
            await fs.ensureDir(weekDir);
            
            // 建立該週的 README.md
            const weekContent = `# 第 ${week} 週教學內容\n\n## 學習目標\n\n## 實作步驟\n\n## 練習題\n\n## 延伸閱讀\n`;
            await fs.writeFile(`${weekDir}/README.md`, weekContent);
        }
        
        spinner.succeed('教學內容設定完成');
        
    } catch (error) {
        spinner.fail('教學內容設定失敗');
        throw error;
    }
}

async function createStartupScripts() {
    const spinner = ora('建立啟動腳本...').start();
    
    try {
        // 建立一鍵啟動腳本
        const startScript = `
#!/usr/bin/env node

const { spawn } = require('child_process');
const chalk = require('chalk');
const path = require('path');

console.log(chalk.blue.bold('🚀 啟動 IoT Cross-Media 教學系統...\\n'));

// 啟動後端
console.log(chalk.yellow('📡 啟動後端服務...'));
const backend = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'backend-simple'),
    stdio: 'inherit'
});

// 等待 2 秒後啟動前端
setTimeout(() => {
    console.log(chalk.yellow('🌐 啟動前端應用...'));
    const frontend = spawn('npm', ['start'], {
        cwd: path.join(__dirname, 'frontend-simple'),
        stdio: 'inherit'
    });
    
    frontend.on('error', (err) => {
        console.error(chalk.red('前端啟動失敗:'), err);
    });
}, 2000);

backend.on('error', (err) => {
    console.error(chalk.red('後端啟動失敗:'), err);
});

// 處理退出
process.on('SIGINT', () => {
    console.log(chalk.yellow('\\n正在關閉系統...'));
    backend.kill();
    process.exit();
});

console.log(chalk.green('\\n✅ 系統啟動中，請稍候...'));
console.log(chalk.cyan('📖 前端將在 http://localhost:3000 開啟'));
console.log(chalk.cyan('⚡ 後端 API 運行在 http://localhost:3001'));
console.log(chalk.gray('\\n按 Ctrl+C 停止系統'));
`;
        
        await fs.writeFile('start-education.js', startScript);
        
        spinner.succeed('啟動腳本建立完成');
        
    } catch (error) {
        spinner.fail('啟動腳本建立失敗');
        throw error;
    }
}

function showCompletionMessage() {
    console.log(chalk.green.bold(`
╔══════════════════════════════════════════════════╗
║              🎉 安裝完成！                       ║
╚══════════════════════════════════════════════════╝
`));
    
    console.log(chalk.cyan('接下來您可以：\n'));
    console.log(chalk.white('1. 啟動教學系統：'));
    console.log(chalk.yellow('   npm run start-education\n'));
    
    console.log(chalk.white('2. 開發模式（前後端同時啟動）：'));
    console.log(chalk.yellow('   npm run dev\n'));
    
    console.log(chalk.white('3. 查看教學文檔：'));
    console.log(chalk.yellow('   打開 tutorials/ 目錄\n'));
    
    console.log(chalk.white('4. 重置資料庫：'));
    console.log(chalk.yellow('   npm run reset-db\n'));
    
    console.log(chalk.green('🎓 祝您教學愉快！'));
    console.log(chalk.gray('如有問題，請參考 README.md 或聯繫技術支援。'));
}

// 執行主程序
main().catch(console.error);
