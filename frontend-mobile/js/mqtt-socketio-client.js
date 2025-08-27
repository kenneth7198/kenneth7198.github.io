// MQTT Socket.IO 客戶端 - 連接到 Flask 伺服器
class MQTTSocketIOClient {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.callbacks = new Map();
        
        // 設定
        this.config = {
            host: window.location.hostname || '192.168.50.100',  // 自動使用當前主機
            port: window.location.port || '5000',               // 或指定端口
            userId: 'user123',
            deviceId: this.generateDeviceId()
        };
        
        this.loadConfig();
    }

    generateDeviceId() {
        return `phone_web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    loadConfig() {
        const saved = localStorage.getItem('mqttConfig');
        if (saved) {
            try {
                const savedConfig = JSON.parse(saved);
                this.config = { ...this.config, ...savedConfig };
            } catch (error) {
                console.error('[MQTT] 配置載入失敗:', error);
            }
        }
        
        // 更新 UI 配置
        this.updateConfigUI();
    }

    saveConfig() {
        localStorage.setItem('mqttConfig', JSON.stringify(this.config));
    }

    updateConfigUI() {
        const elements = {
            mqttHost: document.getElementById('mqttHost'),
            mqttPort: document.getElementById('mqttPort'),
            userId: document.getElementById('userId'),
            deviceId: document.getElementById('deviceId')
        };
        
        if (elements.mqttHost) elements.mqttHost.value = this.config.host;
        if (elements.mqttPort) elements.mqttPort.value = this.config.port;
        if (elements.userId) elements.userId.value = this.config.userId;
        if (elements.deviceId) elements.deviceId.value = this.config.deviceId;
    }

    async connect() {
        if (this.isConnected || this.socket) {
            console.warn('[MQTT] 已經連接或正在連接中');
            return;
        }

        try {
            // 動態載入 Socket.IO 客戶端
            if (!window.io) {
                await this.loadSocketIO();
            }

            const serverUrl = `http://${this.config.host}:${this.config.port}`;
            console.log(`[MQTT] 嘗試連接到 Flask SocketIO: ${serverUrl}`);
            
            this.socket = io(serverUrl, {
                autoConnect: true,
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: this.reconnectDelay
            });
            
            this.setupEventHandlers();
            
        } catch (error) {
            console.error('[MQTT] 連接失敗:', error);
            this.handleConnectionError();
        }
    }

    async loadSocketIO() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
            script.onload = () => {
                console.log('[MQTT] Socket.IO 客戶端載入成功');
                resolve();
            };
            script.onerror = () => {
                console.error('[MQTT] Socket.IO 客戶端載入失敗');
                reject(new Error('Socket.IO 載入失敗'));
            };
            document.head.appendChild(script);
        });
    }

    setupEventHandlers() {
        this.socket.on('connect', () => {
            console.log('[MQTT] SocketIO 連接成功');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.updateConnectionStatus(true);
            
            // 註冊設備
            this.socket.emit('register_device', {
                device_id: this.config.deviceId,
                device_type: 'mobile_web',
                user_id: this.config.userId
            });
            
            // 觸發連接成功回調
            this.triggerCallback('connected', {});
        });

        this.socket.on('disconnect', () => {
            console.log('[MQTT] SocketIO 連接中斷');
            this.isConnected = false;
            this.updateConnectionStatus(false);
            this.triggerCallback('disconnected', {});
        });

        this.socket.on('mqtt_message', (data) => {
            console.log('[MQTT] 收到訊息:', data);
            this.handleMqttMessage(data);
        });

        this.socket.on('system_stats', (data) => {
            console.log('[MQTT] 系統統計:', data);
            this.triggerCallback('system_stats', data);
        });

        this.socket.on('mqtt_status', (data) => {
            console.log('[MQTT] MQTT 狀態:', data);
            this.triggerCallback('mqtt_status', data);
        });

        this.socket.on('connect_error', (error) => {
            console.error('[MQTT] 連接錯誤:', error);
            this.handleConnectionError();
        });
    }

    handleMqttMessage(data) {
        const { topic, payload } = data;
        
        try {
            const message = typeof payload === 'string' ? JSON.parse(payload) : payload;
            
            // 根據主題分發訊息
            if (topic.includes('/nfc/events')) {
                this.triggerCallback('nfc_event', { topic, message });
            } else if (topic.includes('/gyro/events')) {
                this.triggerCallback('gyro_event', { topic, message });
            } else if (topic.includes('/crossmedia/trigger')) {
                this.triggerCallback('crossmedia_trigger', { topic, message });
            } else {
                this.triggerCallback('message', { topic, message });
            }
            
        } catch (error) {
            console.error('[MQTT] 訊息處理錯誤:', error);
        }
    }

    // 發送 MQTT 訊息
    publishMessage(topic, payload) {
        if (!this.isConnected || !this.socket) {
            console.error('[MQTT] 未連接，無法發送訊息');
            return false;
        }

        try {
            this.socket.emit('mqtt_publish', {
                topic: topic,
                payload: JSON.stringify(payload),
                device_id: this.config.deviceId
            });
            
            console.log(`[MQTT] 發送訊息到 ${topic}:`, payload);
            return true;
        } catch (error) {
            console.error('[MQTT] 發送訊息失敗:', error);
            return false;
        }
    }

    // 發送陀螺儀事件
    sendGyroEvent(gestureData) {
        const topic = `iot/mobile/${this.config.deviceId}/gyro/events`;
        const payload = {
            timestamp: Date.now(),
            user_id: this.config.userId,
            device_id: this.config.deviceId,
            gesture_type: gestureData.gesture,
            confidence: gestureData.confidence,
            orientation: gestureData.orientation,
            raw_data: {
                alpha: gestureData.alpha,
                beta: gestureData.beta,
                gamma: gestureData.gamma
            }
        };
        
        return this.publishMessage(topic, payload);
    }

    // 發送 NFC 接近事件
    sendNFCProximityEvent(proximityData) {
        const topic = `iot/mobile/${this.config.deviceId}/nfc/proximity`;
        const payload = {
            timestamp: Date.now(),
            user_id: this.config.userId,
            device_id: this.config.deviceId,
            esp32_id: proximityData.esp32_id,
            distance: proximityData.distance,
            signal_strength: proximityData.signal_strength,
            is_near: proximityData.is_near
        };
        
        return this.publishMessage(topic, payload);
    }

    // 發送跨媒體觸發事件
    sendCrossMediaTrigger(triggerData) {
        const topic = `iot/crossmedia/trigger/${this.config.deviceId}`;
        const payload = {
            timestamp: Date.now(),
            user_id: this.config.userId,
            mobile_device_id: this.config.deviceId,
            esp32_device_id: triggerData.esp32_id,
            trigger_type: 'gesture_nfc_combined',
            gesture_data: triggerData.gesture,
            proximity_data: triggerData.proximity,
            conditions_met: triggerData.conditions_met
        };
        
        return this.publishMessage(topic, payload);
    }

    // 發送 ESP32 控制命令 (為了兼容舊代碼)
    publishESP32Control(esp32Id, command) {
        const topic = `iot/esp32/${esp32Id}/commands`;
        const payload = {
            timestamp: Date.now(),
            user_id: this.config.userId,
            mobile_device_id: this.config.deviceId,
            command: command,
            esp32_id: esp32Id
        };
        
        return this.publishMessage(topic, payload);
    }

    // 獲取連接狀態 (為了兼容舊代碼)
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            config: this.config,
            reconnectAttempts: this.reconnectAttempts,
            status: this.isConnected ? 'connected' : 'disconnected'
        };
    }

    // 事件回調管理
    on(event, callback) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }
        this.callbacks.get(event).push(callback);
    }

    off(event, callback) {
        if (this.callbacks.has(event)) {
            const callbacks = this.callbacks.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    triggerCallback(event, data) {
        if (this.callbacks.has(event)) {
            this.callbacks.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[MQTT] 回調執行錯誤 (${event}):`, error);
                }
            });
        }
    }

    // 連接狀態管理
    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('mqttStatus');
        if (statusElement) {
            const dot = statusElement.querySelector('.dot');
            const text = statusElement.querySelector('span:last-child');
            
            if (connected) {
                dot.className = 'dot online';
                text.textContent = 'MQTT 已連接';
                statusElement.classList.add('connected');
            } else {
                dot.className = 'dot offline';
                text.textContent = 'MQTT 離線';
                statusElement.classList.remove('connected');
            }
        }
    }

    handleConnectionError() {
        this.isConnected = false;
        this.updateConnectionStatus(false);
        
        this.reconnectAttempts++;
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            console.log(`[MQTT] ${this.reconnectDelay/1000} 秒後重試連接 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => {
                this.connect();
            }, this.reconnectDelay);
        } else {
            console.error('[MQTT] 達到最大重連次數，停止重連');
            this.triggerCallback('max_reconnect_reached', {});
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnected = false;
        this.updateConnectionStatus(false);
        console.log('[MQTT] 已主動斷開連接');
    }

    // 測試連接
    async testConnection() {
        try {
            console.log('[MQTT] 開始測試連接...');
            
            if (!this.isConnected) {
                await this.connect();
                await new Promise(resolve => setTimeout(resolve, 2000)); // 等待連接
            }
            
            if (this.isConnected) {
                // 發送測試訊息
                const testMessage = {
                    test: true,
                    timestamp: Date.now(),
                    device_id: this.config.deviceId
                };
                
                this.publishMessage(`test/connection/${this.config.deviceId}`, testMessage);
                console.log('[MQTT] 測試連接成功');
                return true;
            } else {
                throw new Error('連接失敗');
            }
        } catch (error) {
            console.error('[MQTT] 測試連接失敗:', error);
            return false;
        }
    }

    // 獲取狀態
    getStatus() {
        return {
            connected: this.isConnected,
            config: this.config,
            reconnectAttempts: this.reconnectAttempts
        };
    }

    // 更新配置
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.saveConfig();
        this.updateConfigUI();
        
        // 如果已連接，重新連接以使用新配置
        if (this.isConnected) {
            this.disconnect();
            setTimeout(() => {
                this.connect();
            }, 1000);
        }
    }
}

// 全域 MQTT 客戶端實例
window.mqttClient = new MQTTSocketIOClient();

// 頁面載入時自動連接
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.mqttClient.connect();
    }, 1000);
});

// 頁面卸載時斷開連接
window.addEventListener('beforeunload', () => {
    if (window.mqttClient) {
        window.mqttClient.disconnect();
    }
});
