<?php
// log.php ─ 同名＋同日：TXT 寫原 JSON，CSV 追加欄位含 total 及 bank
header('Content-Type: application/json');

/* 1. 只接受 POST */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'POST only']);
    exit;
}

/* 2. 讀取並驗證 JSON */
$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!$data || json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid JSON']);
    exit;
}
if (empty($data['name']) || empty($data['bank'])) {
    http_response_code(400);
    echo json_encode(['error' => 'name or bank missing']);
    exit;
}

/* 3. 檔名資訊 */
$name = preg_replace('/[^A-Za-z0-9_\-]/', '_', trim($data['name']));
$date = (new DateTime('now', new DateTimeZone('Asia/Taipei')))->format('Y-m-d');
$dir  = __DIR__ . '/log_data';
if (!is_dir($dir) && !mkdir($dir, 0777, true)) {
    http_response_code(500);
    echo json_encode(['error' => 'cannot create log_data dir']);
    exit;
}
$txtFile = sprintf('%s/log_%s_%s.txt', $dir, $name, $date);
$csvFile = sprintf('%s/log_%s_%s.csv', $dir, $name, $date);

/* 4. 追加 TXT（原 JSON） */
if (file_put_contents($txtFile, $raw . PHP_EOL, FILE_APPEND) === false) {
    http_response_code(500);
    echo json_encode(['error' => 'write TXT failed']);
    exit;
}

/* 5. 追加 CSV（擴充 bank 欄） */
$firstCsv = !file_exists($csvFile);
$fp = fopen($csvFile, 'a');
if (!$fp) {
    http_response_code(500);
    echo json_encode(['error' => 'open CSV failed']);
    exit;
}
if ($firstCsv) {
    // 標題列新增 bank
    fputcsv($fp, ['timestamp','seconds','total','status','bank','question','answer','final']);
}
// 依欄位順序填入
fputcsv($fp, [
    $data['timestamp'] ?? '',
    $data['seconds']   ?? '',
    $data['total']     ?? '',
    $data['status']    ?? '',
    $data['bank']      ?? '',
    $data['question']  ?? '',
    $data['answer']    ?? '',
    $data['final']     ?? ''
]);
fclose($fp);

/* 6. 回應 */
echo json_encode([
    'ok'  => true,
    'txt' => 'log_data/' . basename($txtFile),
    'csv' => 'log_data/' . basename($csvFile)
]);
