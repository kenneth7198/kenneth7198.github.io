// MQTT 客戶端模擬器 - 模擬真實 IoT 設備
const mqtt = require('mqtt');

class MQTTDeviceSimulator {
    constructor(brokerUrl = 'mqtt://localhost:1883') {
        this.brokerUrl = brokerUrl;
        this.client = null;
        this.devices = [];
        this.isConnected = false;
        this.simulationIntervals = [];
        
        this.initializeDevices();
    }

    // 初始化虛擬設備
    initializeDevices() {
        this.devices = [
            {
                id: 'TEMP_001',
                name: '溫度感測器 #1',
                type: 'temperature',
                unit: '°C',
                min: 18,
                max: 32,
                topic: 'sensor/TEMP_001/data',
                controlTopic: 'device/TEMP_001/control',
                statusTopic: 'device/TEMP_001/status',
                interval: 3000,
                enabled: true
            },
            {
                id: 'HUMID_001',
                name: '濕度感測器 #1',
                type: 'humidity',
                unit: '%',
                min: 35,
                max: 85,
                topic: 'sensor/HUMID_001/data',
                controlTopic: 'device/HUMID_001/control',
                statusTopic: 'device/HUMID_001/status',
                interval: 4000,
                enabled: true
            },
            {
                id: 'LIGHT_001',
                name: '光線感測器 #1',
                type: 'light',
                unit: 'lux',
                min: 0,
                max: 1000,
                topic: 'sensor/LIGHT_001/data',
                controlTopic: 'device/LIGHT_001/control',
                statusTopic: 'device/LIGHT_001/status',
                interval: 5000,
                enabled: true
            },
            {
                id: 'LED_001',
                name: 'LED 控制器 #1',
                type: 'actuator',
                unit: '',
                topic: 'actuator/LED_001/data',
                controlTopic: 'device/LED_001/control',
                statusTopic: 'device/LED_001/status',
                interval: 10000,
                enabled: true,
                state: 'off',
                brightness: 0
            }
        ];
    }

    // 連接到 MQTT Broker
    async connect() {
        return new Promise((resolve, reject) => {
            console.log(`🔗 連接到 MQTT Broker: ${this.brokerUrl}`);
            
            this.client = mqtt.connect(this.brokerUrl, {
                clientId: 'IoT_Simulator_' + Math.random().toString(16).substr(2, 8),
                clean: true,
                connectTimeout: 4000,
                reconnectPeriod: 1000
            });

            this.client.on('connect', () => {
                console.log('✅ MQTT 客戶端連接成功');
                this.isConnected = true;
                
                // 訂閱所有設備的控制主題
                this.subscribeToControlTopics();
                
                // 發布設備上線狀態
                this.publishDeviceStatus();
                
                resolve();
            });

            this.client.on('error', (err) => {
                console.error('❌ MQTT 連接錯誤:', err);
                this.isConnected = false;
                reject(err);
            });

            this.client.on('offline', () => {
                console.log('📴 MQTT 客戶端離線');
                this.isConnected = false;
            });

            this.client.on('reconnect', () => {
                console.log('🔄 MQTT 客戶端重新連接中...');
            });

            this.client.on('message', (topic, message) => {
                this.handleControlMessage(topic, message);
            });
        });
    }

    // 訂閱控制主題
    subscribeToControlTopics() {
        this.devices.forEach(device => {
            if (device.controlTopic) {
                this.client.subscribe(device.controlTopic, (err) => {
                    if (err) {
                        console.error(`❌ 訂閱失敗: ${device.controlTopic}`, err);
                    } else {
                        console.log(`📡 訂閱控制主題: ${device.controlTopic}`);
                    }
                });
            }
        });
    }

    // 處理控制訊息
    handleControlMessage(topic, message) {
        try {
            const payload = JSON.parse(message.toString());
            console.log(`🎮 收到控制命令 - 主題: ${topic}`, payload);

            // 找到對應的設備
            const device = this.devices.find(d => d.controlTopic === topic);
            if (!device) return;

            // 處理不同類型的控制命令
            switch (payload.command) {
                case 'turn_on':
                    if (device.type === 'actuator') {
                        device.state = 'on';
                        device.brightness = payload.brightness || 100;
                        console.log(`💡 ${device.name} 已開啟 (亮度: ${device.brightness}%)`);
                    }
                    break;

                case 'turn_off':
                    if (device.type === 'actuator') {
                        device.state = 'off';
                        device.brightness = 0;
                        console.log(`💡 ${device.name} 已關閉`);
                    }
                    break;

                case 'set_brightness':
                    if (device.type === 'actuator') {
                        device.brightness = Math.max(0, Math.min(100, payload.value));
                        console.log(`💡 ${device.name} 亮度設為 ${device.brightness}%`);
                    }
                    break;

                case 'enable':
                    device.enabled = true;
                    console.log(`🔧 ${device.name} 已啟用`);
                    break;

                case 'disable':
                    device.enabled = false;
                    console.log(`🔧 ${device.name} 已停用`);
                    break;
            }

            // 立即發布設備狀態更新
            this.publishDeviceStatus(device.id);

        } catch (err) {
            console.error('❌ 解析控制訊息失敗:', err);
        }
    }

    // 發布設備狀態
    publishDeviceStatus(deviceId = null) {
        const devicesToUpdate = deviceId 
            ? this.devices.filter(d => d.id === deviceId)
            : this.devices;

        devicesToUpdate.forEach(device => {
            const status = {
                device_id: device.id,
                name: device.name,
                type: device.type,
                enabled: device.enabled,
                timestamp: new Date().toISOString()
            };

            // 對於執行器，加入狀態資訊
            if (device.type === 'actuator') {
                status.state = device.state;
                status.brightness = device.brightness;
            }

            if (device.statusTopic) {
                this.client.publish(device.statusTopic, JSON.stringify(status), { qos: 1 });
            }
        });
    }

    // 開始模擬感測器資料
    startSimulation() {
        if (!this.isConnected) {
            console.error('❌ MQTT 未連接，無法開始模擬');
            return;
        }

        console.log('🎯 開始 IoT 設備資料模擬...');

        this.devices.forEach(device => {
            if (!device.enabled) return;

            const intervalId = setInterval(() => {
                this.publishSensorData(device);
            }, device.interval);

            this.simulationIntervals.push(intervalId);

            // 立即發布一次資料
            this.publishSensorData(device);
        });
    }

    // 發布感測器資料
    publishSensorData(device) {
        if (!device.enabled) return;

        let data;

        if (device.type === 'actuator') {
            // 執行器狀態資料
            data = {
                device_id: device.id,
                type: device.type,
                state: device.state,
                brightness: device.brightness,
                power_consumption: device.state === 'on' ? (device.brightness * 0.1).toFixed(2) : 0,
                timestamp: new Date().toISOString()
            };
        } else {
            // 感測器資料
            let value;
            
            // 根據時間產生更真實的變化
            const now = new Date();
            const hour = now.getHours();
            
            switch (device.type) {
                case 'temperature':
                    // 溫度隨時間變化 (白天較熱)
                    const tempBase = 20 + (hour > 6 && hour < 18 ? 5 : 0);
                    value = (tempBase + Math.random() * 8 - 4).toFixed(1);
                    break;
                    
                case 'humidity':
                    // 濕度與溫度相關 (溫度高濕度低)
                    const humidBase = 60 - (hour > 6 && hour < 18 ? 10 : 0);
                    value = (humidBase + Math.random() * 20 - 10).toFixed(1);
                    break;
                    
                case 'light':
                    // 光線強度隨時間變化
                    if (hour >= 6 && hour <= 18) {
                        value = Math.floor(200 + Math.random() * 600); // 白天
                    } else {
                        value = Math.floor(Math.random() * 50); // 夜晚
                    }
                    break;
                    
                default:
                    value = (device.min + Math.random() * (device.max - device.min)).toFixed(1);
            }

            data = {
                device_id: device.id,
                sensor_type: device.type,
                value: parseFloat(value),
                unit: device.unit,
                timestamp: new Date().toISOString()
            };
        }

        // 發布到 MQTT
        this.client.publish(device.topic, JSON.stringify(data), { qos: 0 });
        
        console.log(`📊 ${device.name} 資料已發布:`, data);
    }

    // 停止模擬
    stopSimulation() {
        console.log('🛑 停止 IoT 設備模擬...');
        
        this.simulationIntervals.forEach(intervalId => {
            clearInterval(intervalId);
        });
        this.simulationIntervals = [];
    }

    // 斷線
    disconnect() {
        return new Promise((resolve) => {
            this.stopSimulation();
            
            if (this.client) {
                this.client.end(false, () => {
                    console.log('📴 MQTT 客戶端已斷線');
                    this.isConnected = false;
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    // 獲取設備列表
    getDevices() {
        return this.devices;
    }

    // 手動控制設備
    controlDevice(deviceId, command, params = {}) {
        const device = this.devices.find(d => d.id === deviceId);
        if (!device || !device.controlTopic) {
            console.error(`❌ 找不到設備或控制主題: ${deviceId}`);
            return false;
        }

        const controlMessage = {
            command: command,
            timestamp: new Date().toISOString(),
            ...params
        };

        this.client.publish(device.controlTopic, JSON.stringify(controlMessage));
        console.log(`🎮 發送控制命令到 ${device.name}:`, controlMessage);
        
        return true;
    }
}

module.exports = MQTTDeviceSimulator;
