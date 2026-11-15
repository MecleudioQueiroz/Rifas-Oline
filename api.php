<?php
// API da rifa: guarda os números vendidos em data/rifa.json
$cfg = require __DIR__ . '/config.php';
session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'httponly' => true, 'samesite' => 'Strict', 'secure' => !empty($_SERVER['HTTPS'])]);
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$file = __DIR__ . '/data/rifa.json';
$total = (int)$cfg['total'];
$isAdmin = !empty($_SESSION['vendedor']);

function out($d, $code = 200) { http_response_code($code); echo json_encode($d, JSON_UNESCAPED_UNICODE); exit; }
function readData($file) {
    if (!file_exists($file)) return [];
    $d = json_decode(file_get_contents($file), true);
    return is_array($d) ? $d : [];
}
// Lê, altera e grava com trava para dois vendedores não se atropelarem
function mutate($file, $fn) {
    $fh = fopen($file, 'c+'); flock($fh, LOCK_EX);
    $raw = stream_get_contents($fh); $d = json_decode($raw ?: '[]', true); if (!is_array($d)) $d = [];
    $d = $fn($d);
    ftruncate($fh, 0); rewind($fh); fwrite($fh, json_encode($d, JSON_UNESCAPED_UNICODE));
    fflush($fh); flock($fh, LOCK_UN); fclose($fh);
    return $d;
}
function needAdmin($isAdmin) { if (!$isAdmin) out(['erro' => 'Faça login como vendedor.'], 401); }

$a = $_GET['a'] ?? 'list';
$body = json_decode(file_get_contents('php://input') ?: '[]', true) ?: [];

switch ($a) {
    case 'list':
        $d = readData($file);
        // Comprador só recebe quais números estão vendidos, sem nomes.
        if (!$isAdmin) $d = array_map(fn($v) => true, $d);
        out(['vendedor' => $isAdmin, 'total' => $total, 'valor' => (float)$cfg['valor'], 'vendidos' => (object)$d]);
    case 'login':
        if ($cfg['senha'] === 'TROCAR-ESTA-SENHA') out(['erro' => 'Defina a senha no arquivo config.php.'], 500);
        if (hash_equals($cfg['senha'], (string)($body['senha'] ?? ''))) { session_regenerate_id(true); $_SESSION['vendedor'] = true; out(['ok' => true]); }
        sleep(1); out(['erro' => 'Senha incorreta.'], 401);
    case 'logout':
        $_SESSION = []; session_destroy(); out(['ok' => true]);
    case 'set':
        needAdmin($isAdmin);
        $n = (int)($body['n'] ?? 0); if ($n < 1 || $n > $total) out(['erro' => 'Número inválido.'], 400);
        $nome = mb_substr(trim((string)($body['nome'] ?? '')), 0, 60);
        mutate($file, function ($d) use ($n, $nome) { $d[$n] = $nome; ksort($d); return $d; });
        out(['ok' => true]);
    case 'unset':
        needAdmin($isAdmin);
        $n = (int)($body['n'] ?? 0);
        mutate($file, function ($d) use ($n) { unset($d[$n]); return $d; });
        out(['ok' => true]);
    case 'import':
        needAdmin($isAdmin);
        $new = [];
        foreach (($body['vendidos'] ?? []) as $k => $v) { $k = (int)$k; if ($k >= 1 && $k <= $total) $new[$k] = mb_substr(trim((string)$v), 0, 60); }
        ksort($new);
        mutate($file, fn($d) => $new);
        out(['ok' => true]);
    default:
        out(['erro' => 'Ação desconhecida.'], 400);
}
