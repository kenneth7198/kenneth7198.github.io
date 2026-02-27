// 陀螺儀感測器管理
class GyroSensorManager {
    constructor() {
        this.isListening = false;
        this.currentGesture = 'stable';
        this.gestureConfidence = 0;
        this.callbacks = new Map();
        
        // 手勢識別設定
        this.thresholds = {
            faceDown: 0.7,        // 螢幕朝下閾值
            gestureChange: 0.3,   // 手勢變化閾值
            minConfidence: 0.6    // 最小信心度
        };
        
        // 感測器數據緩衝
        this.dataBuffer = [];
        this.bufferSize = 10;
        
        this.checkSupport();
    }

    // 檢查設備支援度
    async checkSupport() {
        this.isSupported = false;
        
        if ('DeviceOrientationEvent' in window) {
            // 檢查是否需要權限 (iOS 13+)
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                try {
                    const permission = await DeviceOrientationEvent.requestPermission();
                    this.isSupported = permission === 'granted';
                } catch (error) {
                    console.error('[陀螺儀] 權限請求失敗:', error);
                    this.isSupported = false;
                }
            } else {
                this.isSupported = true;
            }
        }
        
        this.updateUI();
        return this.isSupported;
    }

    // 開始監聽陀螺儀
    async startListening() {
        if (!this.isSupported) {
            const supported = await this.checkSupport();
            if (!supported) {
                this.showNotification('此設備不支援陀螺儀感測器', 'error');
                return false;
            }
        }

        if (this.isListening) {
            console.warn('[陀螺儀] 已在監聽中');
            return true;
        }

        try {
            // 監聽設備方向變化
            window.addEventListener('deviceorientation', this.handleDeviceOrientation.bind(this));
            
            this.isListening = true;
            this.updateUI();
            this.showNotification('陀螺儀感測器已啟用', 'success');
            
            console.log('[陀螺儀] 開始監聽');
            return true;
            
        } catch (error) {
            console.error('[陀螺儀] 啟動失敗:', error);
            this.showNotification('陀螺儀啟動失敗', 'error');
            return false;
        }
    }

    // 停止監聽
    stopListening() {
        if (!this.isListening) return;

        window.removeEventListener('deviceorientation', this.handleDeviceOrientation.bind(this));
        
        this.isListening = false;
        this.currentGesture = 'stable';
        this.gestureConfidence = 0;
        
        this.updateUI();
        this.showNotification('陀螺儀感測器已關閉', 'info');
        
        console.log('[陀螺儀] 停止監聽');
    }

    // 處理設備方向數據
    handleDeviceOrientation(event) {
        if (!this.isListening) return;

        const { alpha, beta, gamma } = event;
        
        // 過濾無效數據
        if (alpha === null || beta === null || gamma === null) {
            return;
        }

        const orientationData = {
            alpha: alpha,  // Z 軸旋轉 (0-360度)
            beta: beta,    // X 軸旋轉 (-180 到 180度)
            gamma: gamma,  // Y 軸旋轉 (-90 到 90度)
            timestamp: Date.now()
        };

        // 添加到緩衝區
        this.addToBuffer(orientationData);
        
        // 識別手勢
        const gesture = this.detectGesture(orientationData);
        
        // 更新當前狀態
        if (gesture.gesture !== this.currentGesture || 
            Math.abs(gesture.confidence - this.gestureConfidence) > 0.1) {
            
            this.currentGesture = gesture.gesture;
            this.gestureConfidence = gesture.confidence;
            
            this.updateGestureUI(gesture);
            
            // 觸發回調
            this.triggerCallback('gesture', gesture);
            
            // 如果是重要手勢，發送 MQTT 事件
            if (gesture.gesture === 'face_down' && gesture.confidence > this.thresholds.minConfidence) {
                this.publishGyroEvent(gesture);
            }
        }
    }

    // 添加數據到緩衝區
    addToBuffer(data) {
        this.dataBuffer.push(data);
        if (this.dataBuffer.length > this.bufferSize) {
            this.dataBuffer.shift();
        }
    }

    // 手勢識別
    detectGesture(data) {
        const { alpha, beta, gamma } = data;
        
        // 轉換角度到合適範圍
        const normalizedBeta = this.normalizeAngle(beta);
        const normalizedGamma = this.normalizeAngle(gamma);
        
        let gesture = 'stable';
        let confidence = 0;

        // 螢幕朝下檢測 (beta 接近 180 度)
        if (Math.abs(normalizedBeta - 180) < 30) {
            gesture = 'face_down';
            confidence = Math.max(0, 1 - Math.abs(normalizedBeta - 180) / 30);
        }
        // 螢幕朝上檢測 (beta 接近 0 度)
        else if (Math.abs(normalizedBeta) < 30) {
            gesture = 'face_up';
            confidence = Math.max(0, 1 - Math.abs(normalizedBeta) / 30);
        }
        // 左傾檢測
        else if (normalizedGamma < -30) {
            gesture = 'tilt_left';
            confidence = Math.max(0, Math.min(1, Math.abs(normalizedGamma) / 90));
        }
        // 右傾檢測
        else if (normalizedGamma > 30) {
            gesture = 'tilt_right';
            confidence = Math.max(0, Math.min(1, Math.abs(normalizedGamma) / 90));
        }
        // 穩定狀態
        else {
            gesture = 'stable';
            confidence = Math.max(0, 1 - (Math.abs(normalizedBeta) + Math.abs(normalizedGamma)) / 180);
        }

        return {
            gesture,
            confidence,
            gyroData: {
                x: alpha,
                y: beta,
                z: gamma
            },
            timestamp: Date.now()
        };
    }

    // 標準化角度到 0-360 範圍
    normalizeAngle(angle) {
        while (angle < 0) angle += 360;
        while (angle >= 360) angle -= 360;
        return angle;
    }

    // 發布陀螺儀事件到 MQTT
    publishGyroEvent(gestureData) {
        if (window.mqttClient && window.mqttClient.isConnected) {
            // 添加位置資訊（如果可用）
            const eventData = {
                ...gestureData,
                proximityCheck: window.nfcProximity ? window.nfcProximity.hasNearbyDevices() : false
            };

            // 獲取位置資訊
            if (window.nfcProximity && window.nfcProximity.getCurrentLocation) {
                eventData.location = window.nfcProximity.getCurrentLocation();
            }

            window.mqttClient.publishGyroEvent(eventData);
        }
    }

    // 更新 UI
    updateUI() {
        const gyroStatus = document.getElementById('gyroStatus');
        const gyroToggle = document.getElementById('gyroToggle');
        const gyroCard = document.querySelector('.gyro-card');

        if (gyroStatus) {
            if (!this.isSupported) {
                gyroStatus.textContent = '不支援';
            } else if (this.isListening) {
                gyroStatus.textContent = '運行中';
            } else {
                gyroStatus.textContent = '已停止';
            }
        }

        if (gyroToggle) {
            gyroToggle.textContent = this.isListening ? '停止' : '啟用';
            gyroToggle.className = `toggle-btn ${this.isListening ? 'active' : ''}`;
        }

        if (gyroCard) {
            gyroCard.className = `sensor-card gyro-card ${this.isListening ? 'active' : ''}`;
        }
    }

    // 更新手勢顯示
    updateGestureUI(gestureData) {
        // 更新手勢文字
        const gestureText = document.getElementById('gestureText');
        if (gestureText) {
            const gestureNames = {
                'stable': '穩定',
                'face_down': '螢幕朝下',
                'face_up': '螢幕朝上',
                'tilt_left': '向左傾斜',
                'tilt_right': '向右傾斜'
            };
            gestureText.textContent = gestureNames[gestureData.gesture] || gestureData.gesture;
        }

        // 更新手機模型
        const phoneModel = document.getElementById('phoneModel');
        if (phoneModel) {
            phoneModel.className = `phone-model ${gestureData.gesture === 'face_down' ? 'face-down' : ''}`;
        }

        // 更新信心度條
        const confidenceFill = document.getElementById('confidenceFill');
        const confidenceValue = document.getElementById('confidenceValue');
        if (confidenceFill && confidenceValue) {
            const percentage = Math.round(gestureData.confidence * 100);
            confidenceFill.style.width = `${percentage}%`;
            confidenceValue.textContent = `${percentage}%`;
        }

        // 更新觸發條件
        this.updateTriggerCondition('gesture', gestureData.gesture === 'face_down' && gestureData.confidence > this.thresholds.minConfidence);
    }

    // 更新觸發條件 UI
    updateTriggerCondition(type, met) {
        const condition = document.getElementById(`${type}Condition`);
        if (condition) {
            condition.className = `condition ${met ? 'met' : ''}`;
            const status = condition.querySelector('.condition-status');
            if (status) {
                status.textContent = met ? '✅' : '❌';
            }
        }
    }

    // 模擬手勢（測試用）
    simulateGesture(gestureType) {
        const simulatedData = {
            gesture: gestureType,
            confidence: 0.9,
            gyroData: {
                x: 0,
                y: gestureType === 'face_down' ? 180 : 0,
                z: 0
            },
            timestamp: Date.now()
        };

        this.currentGesture = gestureType;
        this.gestureConfidence = 0.9;
        
        this.updateGestureUI(simulatedData);
        this.triggerCallback('gesture', simulatedData);
        
        if (gestureType === 'face_down') {
            this.publishGyroEvent(simulatedData);
        }

        this.showNotification(`模擬手勢: ${gestureType}`, 'info');
    }

    // 註冊回調
    on(event, callback) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }
        this.callbacks.get(event).push(callback);
    }

    // 觸發回調
    triggerCallback(event, data) {
        if (this.callbacks.has(event)) {
            this.callbacks.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[陀螺儀] 回調錯誤 (${event}):`, error);
                }
            });
        }
    }

    // 顯示通知
    showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`[陀螺儀] ${message}`);
        }
    }

    // 獲取當前狀態
    getStatus() {
        return {
            isSupported: this.isSupported,
            isListening: this.isListening,
            currentGesture: this.currentGesture,
            gestureConfidence: this.gestureConfidence
        };
    }

    // 設定閾值
    setThresholds(newThresholds) {
        this.thresholds = { ...this.thresholds, ...newThresholds };
    }
}

// 全域陀螺儀管理器實例
window.gyroSensor = new GyroSensorManager();
