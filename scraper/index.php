<?php
/**
 * Telebirr Receipt Scraper - PHP Edition
 * Compatible with Plesk PHP 8.1 - 8.4
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, x-api-key');

// --- 1. Simple .env Loader ---
function loadEnv($path) {
    if (!file_exists($path)) return;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
        putenv(trim($name) . "=" . trim($value));
    }
}
loadEnv(__DIR__ . '/.env');

// --- 2. Authentication ---
$BUNA_ENGINE_KEY = getenv('BUNA_ENGINE_KEY') ?: $_ENV['BUNA_ENGINE_KEY'] ?? '9f7a2d8e4c6b1a0f9e8d7c6b5a43210fe9';
$headers = getallheaders();
$apiKey = $headers['x-api-key'] ?? $headers['X-API-KEY'] ?? '';

if ($BUNA_ENGINE_KEY && $apiKey !== $BUNA_ENGINE_KEY) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

// --- 3. Routing ---
$txnId = $_GET['transactionId'] ?? null;

if (!$txnId) {
    echo json_encode(['success' => true, 'message' => 'Telebirr PHP Scraper Active']);
    exit;
}

// --- 4. Scraper Logic ---
$result = scrapeTelebirrReceipt($txnId);

if (!$result) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Receipt not found or portal unreachable']);
} else {
    echo json_encode(['success' => true, 'data' => $result]);
}

/**
 * Scrapes Telebirr receipt info from the official portal
 */
function scrapeTelebirrReceipt($transactionId) {
    $url = "https://transactioninfo.ethiotelecom.et/receipt/" . strtoupper(trim($transactionId));
    
    $options = [
        "http" => [
            "method" => "GET",
            "header" => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36\r\n",
            "timeout" => 15
        ]
    ];

    $context = stream_context_create($options);
    $html = @file_get_contents($url, false, $context);

    if (!$html) return null;

    $dom = new DOMDocument();
    // Suppress warnings for malformed HTML
    @$dom->loadHTML($html);
    $xpath = new DOMXPath($dom);

    $data = [
        'transactionId' => $transactionId,
        'amount' => '',
        'senderName' => '',
        'receiverName' => '',
        'receiverPhone' => '',
        'dateTime' => '',
        'status' => 'Success'
    ];

    // Scrape Telebirr table rows
    $nodes = $xpath->query("//tr | //div[contains(@class, 'detail-item')] | //div[contains(@class, 'row')]");
    
    foreach ($nodes as $node) {
        $text = trim($node->nodeValue);
        
        if (stripos($text, 'Transaction ID') !== false) $data['transactionId'] = extractValue($text);
        if (stripos($text, 'Amount') !== false)         $data['amount'] = extractValue($text);
        if (stripos($text, 'Sender') !== false)         $data['senderName'] = extractValue($text);
        if (stripos($text, 'Receiver Name') !== false)   $data['receiverName'] = extractValue($text);
        if (stripos($text, 'Receiver Phone') !== false)  $data['receiverPhone'] = extractValue($text);
        if (stripos($text, 'Date') !== false)           $data['dateTime'] = extractValue($text);
    }

    // Clean numeric amount (e.g., "ETB 15.00" -> "15.00")
    if ($data['amount']) {
        preg_match('/[\d.]+/', $data['amount'], $amtMatches);
        if ($amtMatches) $data['amount'] = $amtMatches[0];
    }

    return $data;
}

function extractValue($text) {
    $parts = explode(':', $text);
    if (count($parts) > 1) {
        return trim($parts[1]);
    }
    // Fallback: try to split by whitespace if no colon
    return trim($text);
}
