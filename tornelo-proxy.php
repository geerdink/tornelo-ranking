<?php
/**
 * Tornelo CORS Proxy
 * 
 * This PHP script acts as a proxy to bypass CORS restrictions when fetching
 * data from Tornelo.
 * 
 * INSTALLATION:
 * 1. Upload this file to your WordPress site (e.g., /wp-content/uploads/tornelo-proxy.php)
 * 2. Update the proxyUrl in tornelo-live.js to match this file's URL
 * 
 * SECURITY: This proxy only allows requests to tornelo.com
 */

header('Content-Type: text/html; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Get the URL parameter
$url = isset($_GET['url']) ? $_GET['url'] : '';

// Validate URL - only allow tornelo.com
if (empty($url) || strpos($url, 'tornelo.com') === false) {
    http_response_code(400);
    die('Invalid URL');
}

// Security: Only allow HTTPS tornelo.com URLs
if (!preg_match('/^https:\/\/.*\.?tornelo\.com\//', $url)) {
    http_response_code(403);
    die('Only tornelo.com URLs are allowed');
}

// Set cache headers (30 minutes)
$cacheFile = sys_get_temp_dir() . '/tornelo_cache_' . md5($url) . '.html';
$cacheTime = 30 * 60; // 30 minutes

// Check if cache exists and is fresh
if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTime) {
    header('X-Cache: HIT');
    readfile($cacheFile);
    exit;
}

// Fetch from Tornelo
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_MAXREDIRS => 3,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_USERAGENT => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    CURLOPT_HTTPHEADER => [
        'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language: nl,en;q=0.9',
    ],
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($response === false || $httpCode !== 200) {
    http_response_code(502);
    die('Failed to fetch from Tornelo: ' . $error);
}

// Save to cache
file_put_contents($cacheFile, $response);

// Send response
header('X-Cache: MISS');
echo $response;
?>
