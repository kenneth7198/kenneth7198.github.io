// NFC 接近偵測管理
class NFCProximityManager {
    constructor() {
        this.isMonitoring = false;
        this.currentLocation = null;
        this.nearestDevice = null;
        this.knownDevices = new Map();
        this.callbacks = new Map();
        
        // 監控設定
        this.config = {
            updateInterval: 2000,     // 更新間隔 (毫秒)
            maxDistance: 50,          // 最大偵測距離 (米)
            nearThreshold: 3,         // 接近閾值 (米)
            veryNearThreshold: 1      // 非常接近閾值 (米)
        };
        
        this.watchId = null;
        this.proximityCheckInterval = null;
        
        this.initializeKnownDevices();
        this.checkSupport();
    }

    // 初始化已知設備
    initializeKnownDevices() {
        const defaultDevices = [
            {
                id: 'nfc_trigger_001',
                name: 'NFC 觸發器 001',
                location: { lat: 25.0330, lng: 121.5654 },
                lastSeen: Date.now(),
                type: 'esp32_nfc'
            },
            {
                id: 'nfc_trigger_002', 
                name: 'NFC 觸發器 002',
                location: { lat: 25.0335, lng: 121.5660 },
                lastSeen: Date.now(),
                type: 'esp32_nfc'
            }
        ];

        defaultDevices.forEach(device => {
            this.knownDevices.set(device.id, device);
        });

        this.updateDeviceUI();
    }

    // 檢查支援度
    checkSupport() {
        this.isSupported = 'geolocation' in navigator;
        this.updateUI();
        return this.isSupported;
    }

    // 開始監控
    async startMonitoring() {
        if (!this.isSupported) {
            this.showNotification('此設備不支援位置偵測', 'error');
            return false;
        }

        if (this.isMonitoring) {
            console.warn('[NFC接近] 已在監控中');
            return true;
        }

        try {
            // 請求位置權限
            const hasPermission = await this.requestLocationPermission();
            if (!hasPermission) {
                this.showNotification('需要位置權限來偵測 NFC 設備', 'error');
                return false;
            }

            // 開始位置監控
            this.startLocationTracking();
            
            // 開始接近檢查
            this.startProximityCheck();

            this.isMonitoring = true;
            this.updateUI();
            this.showNotification('位置偵測已啟用', 'success');

            console.log('[NFC接近] 開始監控');
            return true;

        } catch (error) {
            console.error('[NFC接近] 啟動失敗:', error);
            this.showNotification('位置偵測啟動失敗', 'error');
            return false;
        }
    }

    // 停止監控
    stopMonitoring() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }

        if (this.proximityCheckInterval) {
            clearInterval(this.proximityCheckInterval);
            this.proximityCheckInterval = null;
        }

        this.isMonitoring = false;
        this.currentLocation = null;
        this.nearestDevice = null;

        this.updateUI();
        this.updateDeviceUI();
        this.showNotification('位置偵測已關閉', 'info');

        console.log('[NFC接近] 停止監控');
    }

    // 請求位置權限
    async requestLocationPermission() {
        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                () => resolve(true),
                (error) => {
                    console.error('[NFC接近] 位置權限錯誤:', error);
                    resolve(false);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                }
            );
        });
    }

    // 開始位置追蹤
    startLocationTracking() {
        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.currentLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: Date.now()
                };
                
                console.log('[NFC接近] 位置更新:', this.currentLocation);
            },
            (error) => {
                console.error('[NFC接近] 位置獲取錯誤:', error);
                this.showNotification('位置獲取失敗', 'error');
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 10000,
                distanceFilter: 1  // 移動 1 米才更新
            }
        );
    }

    // 開始接近檢查
    startProximityCheck() {
        this.proximityCheckInterval = setInterval(() => {
            this.checkProximityToDevices();
        }, this.config.updateInterval);
    }

    // 檢查與設備的接近程度
    checkProximityToDevices() {
        if (!this.currentLocation) return;

        let closest = null;
        let minDistance = Infinity;

        this.knownDevices.forEach((device, deviceId) => {
            const distance = this.calculateDistance(
                this.currentLocation,
                device.location
            );

            // 更新設備距離資訊
            device.distance = distance;
            device.lastCalculated = Date.now();

            if (distance < minDistance && distance <= this.config.maxDistance) {
                minDistance = distance;
                closest = { ...device, distance };
            }
        });

        // 更新最近設備
        const previousNearest = this.nearestDevice?.id;
        this.nearestDevice = closest;

        // 如果最近設備改變，觸發事件
        if (this.nearestDevice?.id !== previousNearest) {
            this.triggerCallback('nearest_changed', {
                previous: previousNearest,
                current: this.nearestDevice
            });
        }

        // 檢查接近條件
        if (this.nearestDevice) {
            const distanceLevel = this.getDistanceLevel(this.nearestDevice.distance);
            
            if (distanceLevel === 'very_near' || distanceLevel === 'near') {
                this.handleProximityEvent(this.nearestDevice, distanceLevel);
            }
        }

        this.updateDeviceUI();
        this.updateProximityCondition();
    }

    // 處理接近事件
    handleProximityEvent(device, distanceLevel) {
        const proximityEvent = {
            targetDevice: device.id,
            deviceName: device.name,
            distance: device.distance,
            distanceLevel: distanceLevel,
            timestamp: Date.now()
        };

        console.log('[NFC接近] 接近事件:', proximityEvent);

        // 觸發回調
        this.triggerCallback('proximity', proximityEvent);

        // 發送 MQTT 事件
        this.publishProximityEvent(proximityEvent);

        // 檢查手勢組合觸發
        this.checkGestureCombo(proximityEvent);
    }

    // 發布接近事件到 MQTT
    publishProximityEvent(proximityData) {
        if (window.mqttClient && window.mqttClient.isConnected) {
            // 添加手勢狀態
            const eventData = {
                ...proximityData,
                gestureActive: window.gyroSensor ? window.gyroSensor.currentGesture === 'face_down' : false
            };

            window.mqttClient.publishNFCProximityEvent(eventData);
        }
    }

    // 檢查手勢組合觸發
    checkGestureCombo(proximityData) {
        if (window.gyroSensor && 
            window.gyroSensor.currentGesture === 'face_down' &&
            window.gyroSensor.gestureConfidence > 0.6 &&
            proximityData.distanceLevel === 'very_near') {
            
            this.triggerGestureNFCCombo(proximityData);
        }
    }

    // 觸發手勢 + NFC 組合
    triggerGestureNFCCombo(proximityData) {
        console.log('[NFC接近] 觸發手勢+NFC組合:', proximityData);
        
        // 發送控制命令到 ESP32
        if (window.mqttClient) {
            window.mqttClient.publishESP32Control(proximityData.targetDevice, {
                command: 'read_tag',
                trigger_source: 'gesture_combo',
                gesture_data: window.gyroSensor.getStatus()
            });
        }

        // 觸發全域組合事件
        this.triggerCallback('gesture_nfc_combo', {
            proximity: proximityData,
            gesture: window.gyroSensor.getStatus()
        });

        // 更新 UI
        this.showComboTrigger();
        this.showNotification('🚀 手勢+NFC組合觸發！', 'success');
    }

    // 計算兩點間距離 (Haversine 公式)
    calculateDistance(point1, point2) {
        const R = 6371e3; // 地球半徑 (米)
        const φ1 = point1.lat * Math.PI / 180;
        const φ2 = point2.lat * Math.PI / 180;
        const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
        const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c; // 距離 (米)
    }

    // 獲取距離等級
    getDistanceLevel(distance) {
        if (distance <= this.config.veryNearThreshold) return 'very_near';
        if (distance <= this.config.nearThreshold) return 'near';
        if (distance <= this.config.maxDistance) return 'medium';
        return 'far';
    }

    // 模擬接近事件（測試用）
    simulateProximity(deviceId) {
        const device = this.knownDevices.get(deviceId);
        if (!device) {
            this.showNotification(`未找到設備: ${deviceId}`, 'error');
            return;
        }

        const proximityData = {
            targetDevice: deviceId,
            deviceName: device.name,
            distance: 0.5,
            distanceLevel: 'very_near',
            timestamp: Date.now()
        };

        this.nearestDevice = { ...device, distance: 0.5 };
        this.handleProximityEvent(device, 'very_near');
        this.updateDeviceUI();
        this.updateProximityCondition();

        this.showNotification(`模擬接近: ${device.name}`, 'info');
    }

    // 更新 UI
    updateUI() {
        const locationStatus = document.getElementById('locationStatus');
        const locationToggle = document.getElementById('locationToggle');
        const locationCard = document.querySelector('.location-card');

        if (locationStatus) {
            if (!this.isSupported) {
                locationStatus.textContent = '不支援';
            } else if (this.isMonitoring) {
                locationStatus.textContent = '運行中';
            } else {
                locationStatus.textContent = '已停止';
            }
        }

        if (locationToggle) {
            locationToggle.textContent = this.isMonitoring ? '停止' : '啟用';
            locationToggle.className = `toggle-btn ${this.isMonitoring ? 'active' : ''}`;
        }

        if (locationCard) {
            locationCard.className = `sensor-card location-card ${this.isMonitoring ? 'active' : ''}`;
        }
    }

    // 更新設備 UI
    updateDeviceUI() {
        // 更新雷達顯示
        const nfcDevices = document.getElementById('nfcDevices');
        if (nfcDevices) {
            nfcDevices.innerHTML = '';
            
            this.knownDevices.forEach((device, deviceId) => {
                if (device.distance !== undefined && device.distance <= this.config.maxDistance) {
                    const deviceElement = document.createElement('div');
                    deviceElement.className = `nfc-device ${this.getDistanceLevel(device.distance)}`;
                    deviceElement.textContent = '📡';
                    deviceElement.title = `${device.name} (${device.distance.toFixed(1)}m)`;
                    
                    // 根據距離計算位置
                    const angle = Math.random() * 360; // 簡化：隨機角度
                    const radius = Math.min(device.distance * 5, 90); // 簡化：距離轉換為像素
                    
                    deviceElement.style.left = `${50 + radius * Math.cos(angle * Math.PI / 180)}%`;
                    deviceElement.style.top = `${50 + radius * Math.sin(angle * Math.PI / 180)}%`;
                    
                    nfcDevices.appendChild(deviceElement);
                }
            });
        }

        // 更新最近設備資訊
        const nearestDevice = document.getElementById('nearestDevice');
        const deviceDistance = document.getElementById('deviceDistance');
        
        if (nearestDevice) {
            nearestDevice.textContent = this.nearestDevice ? this.nearestDevice.name : '無';
        }
        
        if (deviceDistance) {
            deviceDistance.textContent = this.nearestDevice ? 
                `${this.nearestDevice.distance.toFixed(1)}m` : '--';
        }

        // 啟動雷達脈衝
        if (this.nearestDevice && this.nearestDevice.distance <= this.config.nearThreshold) {
            this.activateRadarPulse();
        }
    }

    // 更新接近條件
    updateProximityCondition() {
        const isNear = this.nearestDevice && 
                      this.nearestDevice.distance <= this.config.nearThreshold;
        
        const condition = document.getElementById('proximityCondition');
        if (condition) {
            condition.className = `condition ${isNear ? 'met' : ''}`;
            const status = condition.querySelector('.condition-status');
            if (status) {
                status.textContent = isNear ? '✅' : '❌';
            }
        }

        // 更新觸發按鈕
        this.updateTriggerButton();
    }

    // 更新觸發按鈕
    updateTriggerButton() {
        const gestureReady = window.gyroSensor && 
                           window.gyroSensor.currentGesture === 'face_down' &&
                           window.gyroSensor.gestureConfidence > 0.6;
        
        const proximityReady = this.nearestDevice && 
                             this.nearestDevice.distance <= this.config.nearThreshold;

        const triggerButton = document.getElementById('triggerButton');
        if (triggerButton) {
            const allReady = gestureReady && proximityReady;
            
            triggerButton.disabled = !allReady;
            triggerButton.className = `trigger-button ${allReady ? 'active' : ''}`;
            
            const triggerText = triggerButton.querySelector('.trigger-text');
            if (triggerText) {
                if (allReady) {
                    triggerText.textContent = '點擊觸發';
                } else {
                    triggerText.textContent = '等待條件滿足';
                }
            }
        }
    }

    // 啟動雷達脈衝動畫
    activateRadarPulse() {
        const radarPulse = document.getElementById('radarPulse');
        if (radarPulse) {
            radarPulse.classList.remove('active');
            setTimeout(() => {
                radarPulse.classList.add('active');
            }, 100);
        }
    }

    // 顯示組合觸發
    showComboTrigger() {
        const triggerButton = document.getElementById('triggerButton');
        if (triggerButton) {
            triggerButton.classList.add('active');
            setTimeout(() => {
                triggerButton.classList.remove('active');
            }, 3000);
        }
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
                    console.error(`[NFC接近] 回調錯誤 (${event}):`, error);
                }
            });
        }
    }

    // 顯示通知
    showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`[NFC接近] ${message}`);
        }
    }

    // 獲取當前狀態
    getStatus() {
        return {
            isSupported: this.isSupported,
            isMonitoring: this.isMonitoring,
            currentLocation: this.currentLocation,
            nearestDevice: this.nearestDevice,
            deviceCount: this.knownDevices.size
        };
    }

    // 輔助方法
    hasNearbyDevices() {
        return this.nearestDevice && this.nearestDevice.distance <= this.config.nearThreshold;
    }

    getCurrentLocation() {
        return this.currentLocation;
    }

    getNearestDevice() {
        return this.nearestDevice;
    }
}

// 全域 NFC 接近管理器實例
window.nfcProximity = new NFCProximityManager();
