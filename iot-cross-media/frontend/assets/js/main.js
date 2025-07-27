// IoT Cross-Media 教學系統 - 主要 JavaScript 檔案

// 全域變數
let socket = null;
let charts = {};
let devices = [];
let isConnected = false;

// 系統初始化
$(document).ready(function() {
    console.log('📱 IoT Cross-Media 教學系統初始化...');
    
    // 初始化 Socket.IO 連接
    initializeSocket();
    
    // 初始化介面
    initializeUI();
    
    // 載入初始資料
    loadInitialData();
});

// 初始化 Socket.IO 連接
function initializeSocket() {
    try {
        socket = io('http://localhost:3001');
        
        socket.on('connect', function() {
            console.log('✅ WebSocket 連接成功');
            isConnected = true;
            updateConnectionStatus(true);
        });
        
        socket.on('disconnect', function() {
            console.log('❌ WebSocket 連接中斷');
            isConnected = false;
            updateConnectionStatus(false);
        });
        
        // 監聽即時感測器資料
        socket.on('sensor_data', function(data) {
            console.log('📊 收到即時感測器資料:', data);
            updateSensorData(data);
        });
        
        // 監聽設備狀態變化
        socket.on('device_status', function(data) {
            console.log('🔧 設備狀態更新:', data);
            updateDeviceStatus(data);
        });
        
    } catch (error) {
        console.error('❌ Socket.IO 初始化失敗:', error);
        updateConnectionStatus(false);
    }
}

// 更新連接狀態
function updateConnectionStatus(connected) {
    const statusElement = $('.navbar-text');
    if (connected) {
        statusElement.html('<i class="fas fa-circle text-success me-1"></i>系統運行中');
    } else {
        statusElement.html('<i class="fas fa-circle text-danger me-1"></i>連接中斷');
    }
}

// 初始化使用者介面
function initializeUI() {
    // 設定導航欄活動狀態
    setActiveNavItem();
    
    // 初始化工具提示
    initializeTooltips();
    
    // 設定載入動畫
    setupLoadingAnimations();
    
    // 設定表單驗證
    setupFormValidation();
}

// 設定活動導航項目
function setActiveNavItem() {
    const currentPath = window.location.pathname;
    $('.nav-link').removeClass('active');
    
    $('.nav-link').each(function() {
        const href = $(this).attr('href');
        if (href === currentPath || (currentPath === '/' && href === '/')) {
            $(this).addClass('active');
        }
    });
}

// 初始化工具提示
function initializeTooltips() {
    $('[data-bs-toggle="tooltip"]').tooltip();
}

// 設定載入動畫
function setupLoadingAnimations() {
    $(document).ajaxStart(function() {
        $('.loading-spinner').show();
    }).ajaxStop(function() {
        $('.loading-spinner').hide();
    });
}

// 設定表單驗證
function setupFormValidation() {
    $('form').on('submit', function(e) {
        if (!this.checkValidity()) {
            e.preventDefault();
            e.stopPropagation();
        }
        $(this).addClass('was-validated');
    });
}

// 載入初始資料
function loadInitialData() {
    // 載入設備清單
    loadDevices();
    
    // 載入最新感測器資料
    loadLatestSensorData();
    
    // 載入媒體檔案清單
    loadMediaFiles();
}

// 載入設備清單
function loadDevices() {
    $.ajax({
        url: 'http://localhost:3001/api/devices',
        method: 'GET',
        success: function(data) {
            console.log('📱 載入設備清單:', data);
            devices = data;
            updateDeviceList(data);
            updateDeviceCount(data.length);
        },
        error: function(xhr, status, error) {
            console.error('❌ 載入設備失敗:', error);
            showAlert('無法載入設備清單', 'danger');
        }
    });
}

// 載入最新感測器資料
function loadLatestSensorData() {
    $.ajax({
        url: 'http://localhost:3001/api/sensor-data/latest',
        method: 'GET',
        success: function(data) {
            console.log('📊 載入最新感測器資料:', data);
            updateSensorDisplay(data);
        },
        error: function(xhr, status, error) {
            console.error('❌ 載入感測器資料失敗:', error);
        }
    });
}

// 載入媒體檔案清單
function loadMediaFiles() {
    $.ajax({
        url: 'http://localhost:3001/api/media',
        method: 'GET',
        success: function(data) {
            console.log('🎬 載入媒體檔案:', data);
            updateMediaCount(data.length);
        },
        error: function(xhr, status, error) {
            console.error('❌ 載入媒體檔案失敗:', error);
        }
    });
}

// 更新設備清單顯示
function updateDeviceList(deviceList) {
    if ($('#device-list').length === 0) return;
    
    const deviceListHtml = deviceList.map(device => `
        <div class="col-md-6 col-lg-4 mb-3">
            <div class="card device-card" data-device-id="${device.device_id}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h6 class="card-title mb-0">${device.name}</h6>
                        <span class="badge ${device.status === 'online' ? 'bg-success' : 'bg-secondary'}">
                            ${device.status === 'online' ? '在線' : '離線'}
                        </span>
                    </div>
                    <p class="card-text">
                        <small class="text-muted">
                            <i class="fas fa-tag me-1"></i>${device.type}
                            <span class="ms-2">
                                <i class="fas fa-clock me-1"></i>
                                ${device.last_seen ? new Date(device.last_seen).toLocaleString() : '從未連接'}
                            </span>
                        </small>
                    </p>
                    <button class="btn btn-sm btn-outline-primary" onclick="viewDeviceDetails('${device.device_id}')">
                        <i class="fas fa-eye me-1"></i>查看詳情
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    $('#device-list').html(deviceListHtml);
}

// 更新設備數量顯示
function updateDeviceCount(count) {
    $('.badge:contains("個設備")').text(`${count} 個設備在線`);
}

// 更新媒體檔案數量
function updateMediaCount(count) {
    $('.badge:contains("個檔案")').text(`${count} 個檔案`);
}

// 更新感測器資料顯示
function updateSensorDisplay(sensorData) {
    if ($('#sensor-data').length === 0) return;
    
    sensorData.forEach(data => {
        const sensorId = `sensor-${data.device_id}-${data.sensor_type}`;
        const displayValue = `${data.value} ${data.unit || ''}`;
        
        $(`#${sensorId}`).text(displayValue);
        $(`#${sensorId}-time`).text(new Date(data.timestamp).toLocaleTimeString());
    });
}

// 即時更新感測器資料
function updateSensorData(data) {
    updateSensorDisplay([data]);
    
    // 如果在儀表板頁面，更新圖表
    if (window.location.pathname === '/dashboard' && charts[data.sensor_type]) {
        addDataToChart(charts[data.sensor_type], data);
    }
}

// 更新設備狀態
function updateDeviceStatus(statusData) {
    const deviceCard = $(`.device-card[data-device-id="${statusData.device_id}"]`);
    if (deviceCard.length > 0) {
        const badge = deviceCard.find('.badge');
        if (statusData.status === 'online') {
            badge.removeClass('bg-secondary').addClass('bg-success').text('在線');
        } else {
            badge.removeClass('bg-success').addClass('bg-secondary').text('離線');
        }
    }
}

// 查看設備詳情
function viewDeviceDetails(deviceId) {
    const device = devices.find(d => d.device_id === deviceId);
    if (!device) return;
    
    // 顯示設備詳情模態框
    const modalHtml = `
        <div class="modal fade" id="deviceModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-microchip me-2"></i>${device.name}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-sm-4"><strong>設備 ID:</strong></div>
                            <div class="col-sm-8">${device.device_id}</div>
                        </div>
                        <div class="row mt-2">
                            <div class="col-sm-4"><strong>類型:</strong></div>
                            <div class="col-sm-8">${device.type}</div>
                        </div>
                        <div class="row mt-2">
                            <div class="col-sm-4"><strong>狀態:</strong></div>
                            <div class="col-sm-8">
                                <span class="badge ${device.status === 'online' ? 'bg-success' : 'bg-secondary'}">
                                    ${device.status === 'online' ? '在線' : '離線'}
                                </span>
                            </div>
                        </div>
                        <div class="row mt-2">
                            <div class="col-sm-4"><strong>最後上線:</strong></div>
                            <div class="col-sm-8">${device.last_seen ? new Date(device.last_seen).toLocaleString() : '從未連接'}</div>
                        </div>
                        <div id="device-sensor-data" class="mt-3"></div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">關閉</button>
                        <button type="button" class="btn btn-primary" onclick="refreshDeviceData('${deviceId}')">
                            <i class="fas fa-sync me-1"></i>重新整理
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 移除舊的模態框
    $('#deviceModal').remove();
    
    // 加入新的模態框
    $('body').append(modalHtml);
    
    // 顯示模態框
    $('#deviceModal').modal('show');
    
    // 載入設備感測器資料
    loadDeviceSensorData(deviceId);
}

// 載入設備感測器資料
function loadDeviceSensorData(deviceId) {
    $.ajax({
        url: `http://localhost:3001/api/devices/${deviceId}/data`,
        method: 'GET',
        success: function(data) {
            displayDeviceSensorData(data);
        },
        error: function(xhr, status, error) {
            $('#device-sensor-data').html('<p class="text-muted">無法載入感測器資料</p>');
        }
    });
}

// 顯示設備感測器資料
function displayDeviceSensorData(sensorData) {
    if (sensorData.length === 0) {
        $('#device-sensor-data').html('<p class="text-muted">暫無感測器資料</p>');
        return;
    }
    
    const latestData = sensorData.slice(-5); // 只顯示最新 5 筆
    
    const tableHtml = `
        <h6 class="mt-3">最新感測器資料</h6>
        <div class="table-responsive">
            <table class="table table-sm">
                <thead>
                    <tr>
                        <th>類型</th>
                        <th>數值</th>
                        <th>時間</th>
                    </tr>
                </thead>
                <tbody>
                    ${latestData.map(data => `
                        <tr>
                            <td>${data.sensor_type}</td>
                            <td>${data.value} ${data.unit || ''}</td>
                            <td>${new Date(data.timestamp).toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    $('#device-sensor-data').html(tableHtml);
}

// 重新整理設備資料
function refreshDeviceData(deviceId) {
    loadDeviceSensorData(deviceId);
    showAlert('資料已重新整理', 'success');
}

// 顯示警告訊息
function showAlert(message, type = 'info') {
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    // 加入到頁面頂部
    $('main .container').prepend(alertHtml);
    
    // 3 秒後自動消失
    setTimeout(() => {
        $('.alert').fadeOut();
    }, 3000);
}

// 工具函數：格式化時間
function formatTime(timestamp) {
    return new Date(timestamp).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// 工具函數：格式化檔案大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 匯出給其他腳本使用的函數
window.IoTSystem = {
    loadDevices,
    loadLatestSensorData,
    showAlert,
    formatTime,
    formatFileSize,
    updateSensorData,
    isConnected: () => isConnected,
    getDevices: () => devices
};
