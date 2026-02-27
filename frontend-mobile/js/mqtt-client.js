// MQTT WebSocket 客戶端
class MQTTWebSocketClient {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.callbacks = new Map();
        
        // 設定
        this.config = {
            host: '192.168.50.100',  // 使用 Flask 伺服器的 IP
            port: '5000',            // 連接到 Flask SocketIO
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
            this.config = { ...this.config, ...JSON.parse(saved) };
        }
    }

    saveConfig() {
        localStorage.setItem('mqttConfig', JSON.stringify(this.config));
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.saveConfig();
        
        // 如果已連接，重新連接以使用新設定
        if (this.isConnected) {
            this.disconnect();
            setTimeout(() => this.connect(), 1000);
        }
    }

    connect() {
        if (this.isConnected || this.ws) {
            console.warn('[MQTT] 已經連接或正在連接中');
            return;
        }

        try {
            const wsUrl = `ws://${this.config.host}:${this.config.port}`;
            console.log(`[MQTT] 嘗試連接到: ${wsUrl}`);
            
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('[MQTT] WebSocket 連接成功');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.updateConnectionStatus(true);
                
                // 發送初始狀態
                this.sendMessage({
                    type: 'get_status'
                });
                
                // 觸發連接成功回調
                this.triggerCallback('connected', {});
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('[MQTT] 訊息解析錯誤:', error);
                }
            };

            this.ws.onclose = (event) => {
                console.log('[MQTT] WebSocket 連接關閉', event.code, event.reason);
                this.isConnected = false;
                this.ws = null;
                this.updateConnectionStatus(false);
                
                // 自動重連
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    console.log(`[MQTT] ${this.reconnectDelay/1000} 秒後嘗試重連 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                    setTimeout(() => this.connect(), this.reconnectDelay);
                }
                
                this.triggerCallback('disconnected', { code: event.code, reason: event.reason });
            };

            this.ws.onerror = (error) => {
                console.error('[MQTT] WebSocket 錯誤:', error);
                this.triggerCallback('error', error);
            };

        } catch (error) {
            console.error('[MQTT] 連接錯誤:', error);
            this.updateConnectionStatus(false);
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        this.updateConnectionStatus(false);
    }

    sendMessage(data) {
        if (this.isConnected && this.ws) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.warn('[MQTT] 未連接，無法發送訊息:', data);
        }
    }

    handleMessage(data) {
        console.log('[MQTT] 收到訊息:', data);
        
        switch (data.type) {
            case 'status':
                this.triggerCallback('status', data.data);
                break;
                
            case 'message_received':
                this.handleMQTTMessage(data.data);
                break;
                
            case 'esp32_nfc_event':
                this.triggerCallback('esp32_nfc', data.data);
                break;
                
            case 'mobile_gyro_event':
                this.triggerCallback('mobile_gyro', data.data);
                break;
                
            case 'nfc_proximity_event':
                this.triggerCallback('nfc_proximity', data.data);
                break;
                
            case 'crossmedia_trigger':
                this.triggerCallback('crossmedia_trigger', data.data);
                break;
                
            default:
                console.log('[MQTT] 未處理的訊息類型:', data.type);
        }
    }

    handleMQTTMessage(messageData) {
        const { topic, payload, clientId, timestamp } = messageData;
        
        try {
            const message = JSON.parse(payload);
            
            // 根據 topic 分類處理
            if (topic.includes('/esp32/') && topic.includes('/nfc/events')) {
                this.triggerCallback('esp32_nfc', message);
            } else if (topic.includes('/mobile/') && topic.includes('/gyro/events')) {
                this.triggerCallback('mobile_gyro', message);
            } else if (topic.includes('/crossmedia/trigger/')) {
                this.triggerCallback('crossmedia_trigger', message);
            }
            
            // 觸發通用訊息回調
            this.triggerCallback('message', {
                topic,
                message,
                clientId,
                timestamp
            });
            
        } catch (error) {
            console.error('[MQTT] MQTT 訊息解析錯誤:', error);
        }
    }

    // 發布陀螺儀事件
    publishGyroEvent(gyroData) {
        const topic = `iot/mobile/${this.config.userId}/gyro/events`;
        const message = {
            user_id: this.config.userId,
            device_id: this.config.deviceId,
            timestamp: Date.now(),
            gyro_data: gyroData.gyroData,
            gesture: gyroData.gesture,
            orientation: this.getOrientation(),
            event_type: 'gesture_detected',
            proximity_check: gyroData.proximityCheck || false,
            location: gyroData.location
        };

        this.sendMessage({
            type: 'publish_message',
            topic: topic,
            message: message
        });

        console.log(`[MQTT] 發布陀螺儀事件到 ${topic}:`, message);
    }

    // 發布 NFC 接近事件
    publishNFCProximityEvent(proximityData) {
        const topic = `iot/mobile/${this.config.userId}/nfc/proximity`;
        const message = {
            user_id: this.config.userId,
            device_id: this.config.deviceId,
            timestamp: Date.now(),
            target_esp32: proximityData.targetDevice,
            distance_estimated: proximityData.distanceLevel,
            gesture_active: proximityData.gestureActive || false,
            event_type: 'nfc_proximity_detected',
            interaction_intent: 'gesture_trigger'
        };

        this.sendMessage({
            type: 'publish_message',
            topic: topic,
            message: message
        });

        console.log(`[MQTT] 發布 NFC 接近事件到 ${topic}:`, message);
    }

    // 發送 ESP32 控制命令
    publishESP32Control(deviceId, command) {
        const topic = `iot/esp32/${deviceId}/nfc/control`;
        const message = {
            command: command.command,
            timestamp: Date.now(),
            source: 'mobile_webapp',
            user_id: this.config.userId,
            ...command
        };

        this.sendMessage({
            type: 'publish_message',
            topic: topic,
            message: message
        });

        console.log(`[MQTT] 發送控制命令到 ${topic}:`, message);
    }

    // 獲取設備方向
    getOrientation() {
        if (screen.orientation) {
            return screen.orientation.type.includes('landscape') ? 'landscape' : 'portrait';
        }
        return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    }

    // 更新連接狀態 UI
    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('mqttStatus');
        const dotElement = statusElement?.querySelector('.dot');
        
        if (statusElement) {
            if (connected) {
                statusElement.innerHTML = '<span class="dot online"></span><span>MQTT 已連接</span>';
            } else {
                statusElement.innerHTML = '<span class="dot offline"></span><span>MQTT 離線</span>';
            }
        }
    }

    // 註冊回調函數
    on(event, callback) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }
        this.callbacks.get(event).push(callback);
    }

    // 移除回調函數
    off(event, callback) {
        if (this.callbacks.has(event)) {
            const callbacks = this.callbacks.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    // 觸發回調函數
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

    // 獲取連接狀態
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            config: this.config
        };
    }

    // 測試連接
    testConnection() {
        this.sendMessage({ type: 'get_status' });
    }
}

// 全域 MQTT 客戶端實例
window.mqttClient = new MQTTWebSocketClient();
