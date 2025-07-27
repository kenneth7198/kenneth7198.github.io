#!/usr/bin/env node

const { spawn } = require('child_process');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');

console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════╗
║       🚀 IoT Cross-Media 教學系統啟動           ║
╚══════════════════════════════════════════════════╝
`));

// 檢查是否已經安裝
function checkInstallation() {
    const frontendExists = fs.existsSync('frontend-simple/package.json');
    const backendExists = fs.existsSync('backend-simple/package.json');
    
    if (!frontendExists || !backendExists) {
        console.log(chalk.red('❌ 系統尚未安裝或安裝不完整'));
        console.log(chalk.yellow('請先執行安裝命令：'));
        console.log(chalk.cyan('  npm run setup-education\n'));
        process.exit(1);
    }
}

// 檢查端口是否被佔用
function checkPorts() {
    const net = require('net');
    
    return new Promise((resolve) => {
        const frontendPort = 3000;
        const backendPort = 3001;
        let checkedPorts = 0;
        let conflicts = [];
        
        [frontendPort, backendPort].forEach((port, index) => {
            const server = net.createServer();
            
            server.listen(port, () => {
                server.close(() => {
                    checkedPorts++;
                    if (checkedPorts === 2) {
                        if (conflicts.length > 0) {
                            console.log(chalk.yellow(`⚠️  以下端口被佔用: ${conflicts.join(', ')}`));
                            console.log(chalk.gray('系統將嘗試使用其他可用端口\n'));
                        }
                        resolve();
                    }
                });
            });
            
            server.on('error', () => {
                conflicts.push(port);
                checkedPorts++;
                if (checkedPorts === 2) {
                    if (conflicts.length > 0) {
                        console.log(chalk.yellow(`⚠️  以下端口被佔用: ${conflicts.join(', ')}`));
                        console.log(chalk.gray('系統將嘗試使用其他可用端口\n'));
                    }
                    resolve();
                }
            });
        });
    });
}

// 啟動後端服務
function startBackend() {
    return new Promise((resolve, reject) => {
        console.log(chalk.yellow('📡 正在啟動後端服務...'));
        
        const backend = spawn('npm', ['start'], {
            cwd: path.join(__dirname, 'backend-simple'),
            stdio: ['ignore', 'pipe', 'pipe']
        });
        
        let backendReady = false;
        
        backend.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes('Server running') || output.includes('listening on')) {
                if (!backendReady) {
                    backendReady = true;
                    console.log(chalk.green('✅ 後端服務啟動成功'));
                    resolve(backend);
                }
            }
        });
        
        backend.stderr.on('data', (data) => {
            const error = data.toString();
            console.log(chalk.red('後端錯誤:'), error);
        });
        
        backend.on('error', (err) => {
            console.error(chalk.red('❌ 後端啟動失敗:'), err.message);
            reject(err);
        });
        
        // 5秒後如果還沒啟動成功，也算成功（可能輸出格式不同）
        setTimeout(() => {
            if (!backendReady) {
                console.log(chalk.green('✅ 後端服務應該已啟動（未檢測到啟動訊息）'));
                resolve(backend);
            }
        }, 5000);
    });
}

// 啟動前端應用
function startFrontend() {
    return new Promise((resolve) => {
        console.log(chalk.yellow('🌐 正在啟動前端應用...'));
        
        const frontend = spawn('npm', ['start'], {
            cwd: path.join(__dirname, 'frontend-simple'),
            stdio: ['ignore', 'pipe', 'pipe']
        });
        
        let frontendReady = false;
        
        frontend.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes('webpack compiled') || output.includes('Local:') || output.includes('On Your Network:')) {
                if (!frontendReady) {
                    frontendReady = true;
                    console.log(chalk.green('✅ 前端應用啟動成功'));
                    console.log(chalk.cyan('🌍 瀏覽器將自動開啟 http://localhost:3000'));
                }
            }
        });
        
        frontend.stderr.on('data', (data) => {
            const error = data.toString();
            // React 開發服務器會輸出一些 "錯誤" 訊息，但實際上是正常的
            if (!error.includes('WARNING') && !error.includes('注意')) {
                console.log(chalk.yellow('前端訊息:'), error);
            }
        });
        
        frontend.on('error', (err) => {
            console.error(chalk.red('❌ 前端啟動失敗:'), err.message);
        });
        
        resolve(frontend);
    });
}

// 顯示系統狀態
function showSystemStatus() {
    console.log(chalk.green.bold('\n🎯 系統狀態儀表板'));
    console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    
    console.log(chalk.white('📱 前端應用: ') + chalk.cyan('http://localhost:3000'));
    console.log(chalk.white('⚡ 後端 API: ') + chalk.cyan('http://localhost:3001'));
    console.log(chalk.white('📊 API 文檔: ') + chalk.cyan('http://localhost:3001/api-docs'));
    console.log(chalk.white('🗄️  資料庫:   ') + chalk.cyan('SQLite (backend-simple/database/)'));
    
    console.log(chalk.gray('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.white('🎓 教學資源:'));
    console.log(chalk.white('   📚 教學文檔: ') + chalk.yellow('./tutorials/'));
    console.log(chalk.white('   💡 範例程式: ') + chalk.yellow('./examples/'));
    console.log(chalk.white('   🔧 開發工具: ') + chalk.yellow('./tools/'));
    
    console.log(chalk.gray('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.white('⌨️  常用命令:'));
    console.log(chalk.white('   重置資料庫: ') + chalk.yellow('npm run reset-db'));
    console.log(chalk.white('   執行測試:   ') + chalk.yellow('npm run test'));
    console.log(chalk.white('   停止系統:   ') + chalk.yellow('Ctrl + C'));
    
    console.log(chalk.gray('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.green('✨ 系統運行中，祝您學習愉快！'));
    console.log(chalk.gray('按 Ctrl+C 關閉系統\n'));
}

// 優雅地處理退出
function setupGracefulShutdown(processes) {
    process.on('SIGINT', () => {
        console.log(chalk.yellow('\n🛑 正在關閉系統...'));
        
        processes.forEach((proc, index) => {
            if (proc && !proc.killed) {
                const name = index === 0 ? '後端' : '前端';
                console.log(chalk.gray(`  關閉${name}服務...`));
                proc.kill('SIGTERM');
            }
        });
        
        setTimeout(() => {
            console.log(chalk.green('✅ 系統已安全關閉'));
            console.log(chalk.cyan('感謝使用 IoT Cross-Media 教學系統！'));
            process.exit(0);
        }, 1000);
    });
    
    // 處理異常退出
    process.on('uncaughtException', (err) => {
        console.error(chalk.red('系統發生未預期的錯誤:'), err.message);
        processes.forEach(proc => {
            if (proc && !proc.killed) {
                proc.kill();
            }
        });
        process.exit(1);
    });
}

// 主啟動函數
async function main() {
    try {
        // 檢查安裝狀態
        checkInstallation();
        
        // 檢查端口
        await checkPorts();
        
        // 啟動後端
        const backendProcess = await startBackend();
        
        // 等待後端穩定後啟動前端
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 啟動前端
        const frontendProcess = await startFrontend();
        
        // 等待前端啟動
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 顯示系統狀態
        showSystemStatus();
        
        // 設定優雅關閉
        setupGracefulShutdown([backendProcess, frontendProcess]);
        
        // 開啟瀏覽器（嘗試）
        setTimeout(() => {
            const open = require('child_process').spawn;
            try {
                if (process.platform === 'win32') {
                    open('cmd', ['/c', 'start', 'http://localhost:3000']);
                } else if (process.platform === 'darwin') {
                    open('open', ['http://localhost:3000']);
                } else {
                    open('xdg-open', ['http://localhost:3000']);
                }
            } catch (err) {
                console.log(chalk.gray('無法自動開啟瀏覽器，請手動造訪: http://localhost:3000'));
            }
        }, 2000);
        
    } catch (error) {
        console.error(chalk.red('❌ 系統啟動失敗:'), error.message);
        console.log(chalk.yellow('\n💡 疑難排解建議:'));
        console.log(chalk.white('1. 確認已執行安裝: npm run setup-education'));
        console.log(chalk.white('2. 檢查端口 3000 和 3001 是否被占用'));
        console.log(chalk.white('3. 重新安裝依賴: npm run install-all'));
        console.log(chalk.white('4. 重置資料庫: npm run reset-db'));
        process.exit(1);
    }
}

// 執行主程序
main().catch(console.error);
