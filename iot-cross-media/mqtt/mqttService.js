// MQTT Broker 服務 - 教學用輕量級版本
const aedes = require('aedes')();
const net = require('net');
const EventEmitter = require('events');

class MQTTService extends EventEmitter {
    constructor() {
        super();
        this.broker = null;
        this.server = null;
        this.port = 1883;
        this.clients = new Map();
        this.topics = new Map();
        
        this.setupBroker();
    }

    // 設定 MQTT Broker
    setupBroker() {
        console.log('🔗 初始化 MQTT Broker...');

        // 設定 Aedes 事件監聽
        aedes.on('client', (client) => {
            console.log(`📱 MQTT 客戶端連接: ${client.id}`);
            this.clients.set(client.id, {
                id: client.id,
                connectedAt: new Date(),
                subscriptions: []
            });
            
            this.emit('clientConnected', client.id);
        });

        aedes.on('clientDisconnect', (client) => {
            console.log(`📱 MQTT 客戶端斷線: ${client.id}`);
            this.clients.delete(client.id);
            
            this.emit('clientDisconnected', client.id);
        });

        aedes.on('subscribe', (subscriptions, client) => {
            console.log(`📡 客戶端 ${client.id} 訂閱主題:`, subscriptions.map(s => s.topic));
            
            const clientInfo = this.clients.get(client.id);
            if (clientInfo) {
                clientInfo.subscriptions = subscriptions.map(s => s.topic);
            }
            
            this.emit('clientSubscribed', client.id, subscriptions);
        });

        aedes.on('publish', (packet, client) => {
            if (client) {
                console.log(`📤 收到 MQTT 訊息 - 主題: ${packet.topic}, 來源: ${client.id}`);
                
                // 解析訊息內容
                let payload;
                try {
                    payload = JSON.parse(packet.payload.toString());
                } catch (e) {
                    payload = packet.payload.toString();
                }
                
                // 發出事件供其他模組使用
                this.emit('messageReceived', {
                    topic: packet.topic,
                    payload: payload,
                    clientId: client.id,
                    timestamp: new Date()
                });
                
                // 如果是感測器資料，記錄到主題統計
                if (packet.topic.startsWith('sensor/')) {
                    this.updateTopicStats(packet.topic, payload);
                }
            }
        });

        // 建立 TCP 服務器
        this.server = net.createServer(aedes.handle);
    }

    // 啟動 MQTT Broker
    start() {
        return new Promise((resolve, reject) => {
            this.server.listen(this.port, (err) => {
                if (err) {
                    console.error('❌ MQTT Broker 啟動失敗:', err);
                    reject(err);
                } else {
                    console.log(`✅ MQTT Broker 運行在 port ${this.port}`);
                    console.log(`📡 IoT 設備可連接到: mqtt://localhost:${this.port}`);
                    resolve();
                }
            });
        });
    }

    // 停止 MQTT Broker
    stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    console.log('🛑 MQTT Broker 已停止');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    // 發布訊息到 MQTT 主題
    publish(topic, payload, options = {}) {
        const message = {
            topic: topic,
            payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
            qos: options.qos || 0,
            retain: options.retain || false
        };

        aedes.publish(message, (err) => {
            if (err) {
                console.error(`❌ MQTT 發布失敗 - 主題: ${topic}`, err);
            } else {
                console.log(`📤 MQTT 訊息已發布 - 主題: ${topic}`);
            }
        });
    }

    // 更新主題統計
    updateTopicStats(topic, payload) {
        if (!this.topics.has(topic)) {
            this.topics.set(topic, {
                messageCount: 0,
                lastMessage: null,
                lastTimestamp: null
            });
        }

        const stats = this.topics.get(topic);
        stats.messageCount++;
        stats.lastMessage = payload;
        stats.lastTimestamp = new Date();
    }

    // 獲取 MQTT 狀態
    getStatus() {
        return {
            running: this.server && this.server.listening,
            port: this.port,
            clientCount: this.clients.size,
            topicCount: this.topics.size,
            clients: Array.from(this.clients.values()),
            topics: Array.from(this.topics.entries()).map(([topic, stats]) => ({
                topic,
                ...stats
            }))
        };
    }

    // 獲取已連接的客戶端
    getClients() {
        return Array.from(this.clients.values());
    }

    // 獲取主題統計
    getTopics() {
        return Array.from(this.topics.entries()).map(([topic, stats]) => ({
            topic,
            ...stats
        }));
    }

    // 模擬 IoT 設備發布感測器資料
    simulateDeviceData() {
        const devices = [
            { id: 'TEMP_001', type: 'temperature', unit: '°C' },
            { id: 'HUMID_001', type: 'humidity', unit: '%' },
            { id: 'LIGHT_001', type: 'light', unit: 'lux' },
            { id: 'MOTION_001', type: 'motion', unit: '' }
        ];

        devices.forEach(device => {
            const topic = `sensor/${device.id}/${device.type}`;
            let value;

            // 根據感測器類型生成合理的模擬資料
            switch (device.type) {
                case 'temperature':
                    value = (20 + Math.random() * 15).toFixed(1); // 20-35°C
                    break;
                case 'humidity':
                    value = (40 + Math.random() * 40).toFixed(1); // 40-80%
                    break;
                case 'light':
                    value = Math.floor(Math.random() * 1000); // 0-1000 lux
                    break;
                case 'motion':
                    value = Math.random() > 0.8 ? 1 : 0; // 20% 機率偵測到動作
                    break;
                default:
                    value = Math.random() * 100;
            }

            const payload = {
                device_id: device.id,
                sensor_type: device.type,
                value: parseFloat(value),
                unit: device.unit,
                timestamp: new Date().toISOString()
            };

            this.publish(topic, payload);
        });
    }

    // 啟動定期的設備模擬
    startDeviceSimulation(intervalMs = 5000) {
        console.log(`🎯 啟動 IoT 設備模擬 (每 ${intervalMs/1000} 秒)`);
        
        // 立即執行一次
        this.simulateDeviceData();
        
        // 設定定期執行
        this.simulationInterval = setInterval(() => {
            this.simulateDeviceData();
        }, intervalMs);
    }

    // 停止設備模擬
    stopDeviceSimulation() {
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
            this.simulationInterval = null;
            console.log('🛑 IoT 設備模擬已停止');
        }
    }
}

module.exports = MQTTService;
