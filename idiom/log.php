<?php
// log.php ┐ 同名＋同日：TXT 寫原 JSON，CSV 附加欄位含 total 及 bank
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
$name_raw = trim($data['name']);
$name_sanitized = preg_replace('/[^\p{L}\p{N}_-]+/u', '_', $name_raw); // 保留中文、英數、_與-
$date = (new DateTime('now', new DateTimeZone('Asia/Taipei')))->format('Y-m-d');
$dir  = __DIR__ . '/log_data';
if (!is_dir($dir) && !mkdir($dir, 0777, true)) {
    http_response_code(500);
    echo json_encode(['error' => 'cannot create log_data dir']);
    exit;
}
$txtFile = sprintf('%s/log_%s_%s.txt', $dir, $name_sanitized, $date);
$csvFile = sprintf('%s/log_%s_%s.csv', $dir, $name_sanitized, $date);

/* 4. 附加 TXT（原 JSON） */
if (file_put_contents($txtFile, $raw . PHP_EOL, FILE_APPEND) === false) {
    http_response_code(500);
    echo json_encode(['error' => 'write TXT failed']);
    exit;
}

/* 5. 附加 CSV（擴充 bank 欄） */
$firstCsv = !file_exists($csvFile);
$fp = fopen($csvFile, 'a');
if (!$fp) {
    http_response_code(500);
    echo json_encode(['error' => 'open CSV failed']);
    exit;
}
if ($firstCsv) {
    fputcsv($fp, ['timestamp','seconds','total','status','bank','question','answer','final']);
}
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
