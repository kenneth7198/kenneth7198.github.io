// 主應用程式邏輯
class IoTGestureApp {
    constructor() {
        this.currentPage = 'main';
        this.eventHistory = [];
        this.maxHistoryLength = 100;
        this.isInitialized = false;
        
        this.init();
    }

    async init() {
        if (this.isInitialized) return;

        console.log('[App] 初始化應用程式...');

        // 設置事件監聽器
        this.setupEventListeners();
        
        // 載入設定
        this.loadSettings();
        
        // 初始化服務
        await this.initializeServices();
        
        // 設置通知系統
        this.setupNotificationSystem();
        
        // 開始自動連接
        this.autoConnect();

        this.isInitialized = true;
        console.log('[App] 應用程式初始化完成');
    }

    setupEventListeners() {
        // 頁面載入完成
        document.addEventListener('DOMContentLoaded', () => {
            this.updateDeviceId();
            this.setupUIHandlers();
        });

        // 視窗大小變化
        window.addEventListener('resize', () => {
            this.handleOrientationChange();
        });

        // 頁面可見性變化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handlePageHidden();
            } else {
                this.handlePageVisible();
            }
        });
    }

    setupUIHandlers() {
        // 設定按鈕事件
        const sensitivitySlider = document.getElementById('gestureSensitivity');
        if (sensitivitySlider) {
            sensitivitySlider.addEventListener('input', (e) => {
                const value = e.target.value;
                document.getElementById('sensitivityValue').textContent = value;
                window.gyroSensor.setThresholds({ minConfidence: parseFloat(value) });
            });
        }

        // 觸發按鈕事件
        const triggerButton = document.getElementById('triggerButton');
        if (triggerButton) {
            triggerButton.addEventListener('click', () => {
                this.manualTrigger();
            });
        }
    }

    async initializeServices() {
        try {
            // 設置服務間的回調
            this.setupServiceCallbacks();
            
            console.log('[App] 服務初始化完成');
        } catch (error) {
            console.error('[App] 服務初始化失敗:', error);
            this.showNotification('服務初始化失敗', 'error');
        }
    }

    setupServiceCallbacks() {
        // MQTT 事件回調
        if (window.mqttClient) {
            window.mqttClient.on('connected', () => {
                this.onMQTTConnected();
            });

            window.mqttClient.on('disconnected', () => {
                this.onMQTTDisconnected();
            });

            window.mqttClient.on('esp32_nfc', (data) => {
                this.onESP32NFCEvent(data);
            });

            window.mqttClient.on('crossmedia_trigger', (data) => {
                this.onCrossMediaTrigger(data);
            });
        }

        // 陀螺儀事件回調
        if (window.gyroSensor) {
            window.gyroSensor.on('gesture', (data) => {
                this.onGestureEvent(data);
            });
        }

        // NFC 接近事件回調
        if (window.nfcProximity) {
            window.nfcProximity.on('proximity', (data) => {
                this.onProximityEvent(data);
            });

            window.nfcProximity.on('gesture_nfc_combo', (data) => {
                this.onGestureNFCCombo(data);
            });
        }
    }

    // MQTT 事件處理
    onMQTTConnected() {
        this.showNotification('MQTT 連接成功', 'success');
        this.addEventToHistory('mqtt', 'MQTT 連接成功', 'success');
    }

    onMQTTDisconnected() {
        this.showNotification('MQTT 連接斷開', 'warning');
        this.addEventToHistory('mqtt', 'MQTT 連接斷開', 'warning');
    }

    onESP32NFCEvent(data) {
        console.log('[App] ESP32 NFC 事件:', data);
        this.showNotification(`ESP32 偵測到 NFC: ${data.tag_uid}`, 'info');
        this.addEventToHistory('esp32_nfc', `標籤 ${data.tag_uid} 被偵測`, data);
        
        // 檢查是否需要觸發跨媒體動作
        this.checkCrossMediaTrigger(data);
    }

    onCrossMediaTrigger(data) {
        console.log('[App] 跨媒體觸發:', data);
        this.showNotification('🎯 跨媒體動作已觸發！', 'success');
        this.addEventToHistory('crossmedia', '跨媒體動作觸發', data);
        
        // 執行相應的媒體動作
        this.executeCrossMediaAction(data);
    }

    // 手勢事件處理
    onGestureEvent(data) {
        if (data.gesture === 'face_down' && data.confidence > 0.7) {
            this.addEventToHistory('gesture', `手勢: ${data.gesture}`, data);
        }
    }

    // 接近事件處理
    onProximityEvent(data) {
        this.showNotification(`接近設備: ${data.deviceName}`, 'info');
        this.addEventToHistory('proximity', `接近 ${data.deviceName}`, data);
    }

    // 手勢+NFC組合事件處理
    onGestureNFCCombo(data) {
        console.log('[App] 手勢+NFC組合觸發:', data);
        this.showNotification('🚀 手勢+NFC組合觸發成功！', 'success');
        this.addEventToHistory('combo', '手勢+NFC組合觸發', data);
        
        // 執行組合動作
        this.executeComboAction(data);
    }

    // 檢查跨媒體觸發條件
    checkCrossMediaTrigger(esp32Data) {
        const gestureStatus = window.gyroSensor ? window.gyroSensor.getStatus() : null;
        const proximityStatus = window.nfcProximity ? window.nfcProximity.getStatus() : null;

        if (gestureStatus && gestureStatus.currentGesture === 'face_down' &&
            proximityStatus && proximityStatus.nearestDevice) {
            
            this.triggerCrossMediaAction({
                esp32_data: esp32Data,
                gesture_data: gestureStatus,
                proximity_data: proximityStatus
            });
        }
    }

    // 觸發跨媒體動作
    triggerCrossMediaAction(data) {
        // 可以在這裡實現具體的跨媒體動作
        // 例如：播放視頻、開啟網頁、發送通知等
        
        console.log('[App] 執行跨媒體動作:', data);
        
        // 示例：開啟特定網頁
        if (data.esp32_data && data.esp32_data.uri) {
            this.openWebApp(data.esp32_data.uri);
        }
    }

    // 執行跨媒體動作
    executeCrossMediaAction(data) {
        if (data.action_result && data.action_result.target_url) {
            this.openWebApp(data.action_result.target_url);
        }
    }

    // 執行組合動作
    executeComboAction(data) {
        // 閃爍效果
        document.body.style.animation = 'flash 0.5s ease-in-out 3';
        
        // 振動反饋（如果支援）
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 200]);
        }
        
        setTimeout(() => {
            document.body.style.animation = '';
        }, 1500);
    }

    // 開啟 WebApp
    openWebApp(url) {
        try {
            window.open(url, '_blank');
            this.showNotification(`開啟網頁: ${url}`, 'info');
        } catch (error) {
            console.error('[App] 開啟網頁失敗:', error);
            this.showNotification('無法開啟網頁', 'error');
        }
    }

    // 手動觸發
    manualTrigger() {
        const gestureStatus = window.gyroSensor ? window.gyroSensor.getStatus() : null;
        const proximityStatus = window.nfcProximity ? window.nfcProximity.getStatus() : null;

        if (gestureStatus && gestureStatus.currentGesture === 'face_down' &&
            proximityStatus && proximityStatus.nearestDevice) {
            
            // 發送控制命令到最近的 ESP32
            if (window.mqttClient) {
                window.mqttClient.publishESP32Control(proximityStatus.nearestDevice.id, {
                    command: 'read_tag',
                    trigger_source: 'manual_trigger',
                    gesture_data: gestureStatus
                });
            }

            this.showNotification('手動觸發成功', 'success');
            this.addEventToHistory('manual', '手動觸發', {
                gesture: gestureStatus,
                proximity: proximityStatus
            });
        } else {
            this.showNotification('觸發條件未滿足', 'warning');
        }
    }

    // 自動連接
    autoConnect() {
        // 自動連接 MQTT
        if (window.mqttClient) {
            setTimeout(() => {
                window.mqttClient.connect();
            }, 1000);
        }
    }

    // 載入設定
    loadSettings() {
        const settings = localStorage.getItem('iotGestureSettings');
        if (settings) {
            try {
                const parsed = JSON.parse(settings);
                this.applySettings(parsed);
            } catch (error) {
                console.error('[App] 設定載入失敗:', error);
            }
        }
    }

    // 應用設定
    applySettings(settings) {
        if (settings.mqttConfig && window.mqttClient) {
            window.mqttClient.updateConfig(settings.mqttConfig);
        }

        if (settings.gestureSensitivity && window.gyroSensor) {
            window.gyroSensor.setThresholds({ 
                minConfidence: settings.gestureSensitivity 
            });
        }
    }

    // 儲存設定
    saveSettings() {
        const settings = {
            mqttConfig: window.mqttClient ? window.mqttClient.config : {},
            gestureSensitivity: document.getElementById('gestureSensitivity')?.value || 0.7,
            lastSaved: Date.now()
        };

        localStorage.setItem('iotGestureSettings', JSON.stringify(settings));
        this.showNotification('設定已儲存', 'success');
    }

    // 更新設備 ID
    updateDeviceId() {
        const deviceIdInput = document.getElementById('deviceId');
        if (deviceIdInput && window.mqttClient) {
            deviceIdInput.value = window.mqttClient.config.deviceId;
        }
    }

    // 處理方向變化
    handleOrientationChange() {
        // 更新 UI 以適應新的方向
        setTimeout(() => {
            this.updateLayoutForOrientation();
        }, 100);
    }

    updateLayoutForOrientation() {
        const isLandscape = window.innerWidth > window.innerHeight;
        document.body.classList.toggle('landscape', isLandscape);
    }

    // 頁面隱藏處理
    handlePageHidden() {
        console.log('[App] 頁面隱藏，暫停非關鍵服務');
        // 可以在這裡暫停一些服務以節省電力
    }

    // 頁面可見處理
    handlePageVisible() {
        console.log('[App] 頁面可見，恢復服務');
        // 恢復服務
    }

    // 事件歷史管理
    addEventToHistory(type, message, data = null) {
        const event = {
            id: Date.now() + Math.random(),
            type: type,
            message: message,
            data: data,
            timestamp: new Date()
        };

        this.eventHistory.unshift(event);
        
        if (this.eventHistory.length > this.maxHistoryLength) {
            this.eventHistory.pop();
        }

        this.updateEventHistoryUI();
    }

    updateEventHistoryUI() {
        const eventList = document.getElementById('eventList');
        if (!eventList) return;

        // 清空現有內容
        eventList.innerHTML = '';

        if (this.eventHistory.length === 0) {
            eventList.innerHTML = '<div class="no-events">尚無事件記錄</div>';
            return;
        }

        // 顯示最近的事件
        const recentEvents = this.eventHistory.slice(0, 20);
        recentEvents.forEach(event => {
            const eventElement = this.createEventElement(event);
            eventList.appendChild(eventElement);
        });
    }

    createEventElement(event) {
        const element = document.createElement('div');
        element.className = 'event-item';
        
        element.innerHTML = `
            <div class="event-header">
                <span class="event-type">${event.type.toUpperCase()}</span>
                <span class="event-time">${event.timestamp.toLocaleTimeString()}</span>
            </div>
            <div class="event-message">${event.message}</div>
            ${event.data ? `<div class="event-data">${JSON.stringify(event.data, null, 2).substring(0, 200)}...</div>` : ''}
        `;

        return element;
    }

    // 清除歷史
    clearEventHistory() {
        this.eventHistory = [];
        this.updateEventHistoryUI();
        this.showNotification('事件歷史已清除', 'info');
    }

    // 匯出歷史
    exportEventHistory() {
        const data = {
            exportTime: new Date(),
            events: this.eventHistory
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `iot-gesture-history-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('歷史已匯出', 'success');
    }

    // 通知系統
    setupNotificationSystem() {
        // 創建通知容器（如果不存在）
        if (!document.getElementById('notificationContainer')) {
            const container = document.createElement('div');
            container.id = 'notificationContainer';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
    }

    showNotification(message, type = 'info', duration = 3000) {
        const container = document.getElementById('notificationContainer');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        container.appendChild(notification);

        // 自動移除
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    // 獲取應用狀態
    getAppStatus() {
        return {
            isInitialized: this.isInitialized,
            currentPage: this.currentPage,
            eventCount: this.eventHistory.length,
            services: {
                mqtt: window.mqttClient ? window.mqttClient.getConnectionStatus() : null,
                gyro: window.gyroSensor ? window.gyroSensor.getStatus() : null,
                proximity: window.nfcProximity ? window.nfcProximity.getStatus() : null
            }
        };
    }
}

// 全域函數 (供 HTML 調用)
window.toggleGyroscope = function() {
    if (window.gyroSensor) {
        if (window.gyroSensor.isListening) {
            window.gyroSensor.stopListening();
        } else {
            window.gyroSensor.startListening();
        }
    }
};

window.toggleLocation = function() {
    if (window.nfcProximity) {
        if (window.nfcProximity.isMonitoring) {
            window.nfcProximity.stopMonitoring();
        } else {
            window.nfcProximity.startMonitoring();
        }
    }
};

window.simulateGesture = function(gestureType) {
    if (window.gyroSensor) {
        window.gyroSensor.simulateGesture(gestureType);
    }
};

window.simulateProximity = function(deviceId) {
    if (window.nfcProximity) {
        window.nfcProximity.simulateProximity(deviceId);
    }
};

window.testMQTTConnection = function() {
    if (window.mqttClient) {
        window.mqttClient.testConnection();
    }
};

window.sendTestCommand = function() {
    if (window.mqttClient) {
        window.mqttClient.publishESP32Control('nfc_trigger_001', {
            command: 'led_on',
            duration: 3000
        });
        window.app.showNotification('測試命令已發送', 'info');
    }
};

window.clearHistory = function() {
    if (window.app) {
        window.app.clearEventHistory();
    }
};

window.exportHistory = function() {
    if (window.app) {
        window.app.exportEventHistory();
    }
};

window.openSettings = function() {
    const settingsPanel = document.getElementById('settingsPanel');
    if (settingsPanel) {
        settingsPanel.style.display = 'block';
    }
};

window.closeSettings = function() {
    const settingsPanel = document.getElementById('settingsPanel');
    if (settingsPanel) {
        settingsPanel.style.display = 'none';
    }
};

window.saveSettings = function() {
    // 更新 MQTT 設定
    const mqttConfig = {
        host: document.getElementById('mqttHost')?.value,
        port: document.getElementById('mqttPort')?.value,
        userId: document.getElementById('userId')?.value
    };

    if (window.mqttClient) {
        window.mqttClient.updateConfig(mqttConfig);
    }

    if (window.app) {
        window.app.saveSettings();
    }

    window.closeSettings();
};

window.showPage = function(page) {
    // 簡單的頁面切換（這裡可以擴展）
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => btn.classList.remove('active'));
    
    event.target.closest('.nav-btn').classList.add('active');
    
    if (window.app) {
        window.app.currentPage = page;
    }
};

// 添加 CSS 動畫
const style = document.createElement('style');
style.textContent = `
    @keyframes flash {
        0%, 100% { background-color: transparent; }
        50% { background-color: rgba(102, 126, 234, 0.1); }
    }
    
    @keyframes slideOut {
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .landscape {
        /* 橫屏特殊樣式 */
    }
`;
document.head.appendChild(style);

// 初始化應用程式
window.app = new IoTGestureApp();
