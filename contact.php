<?php
// MiamiWash contact form handler (PHP).
// Expects JSON POST from frontend. Returns JSON.
//
// IMPORTANT: server must support PHP mail() or you need to configure SMTP on hosting.
// On many hosts, mail() works out of the box. If not, ask hosting for SMTP and I can switch this to SMTP.

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
  exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) { $data = $_POST; }

$name = trim((string)($data['name'] ?? ''));
$surname = trim((string)($data['surname'] ?? ''));
$email = trim((string)($data['email'] ?? ''));
$message = trim((string)($data['message'] ?? ''));

// Basic validation
if ($name === '' || $surname === '' || $email === '' || $message === '') {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Vyplňte prosím všetky polia.']);
  exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Neplatná emailová adresa.']);
  exit;
}

// Recipient (change if needed)
$to = 'info@miamiwash.sk';
$subject = 'Kontakt z webu – MiamiWash';

// Build email body
$bodyLines = [
  "Nová správa z kontaktného formulára:",
  "",
  "Meno: {$name}",
  "Priezvisko: {$surname}",
  "Email: {$email}",
  "",
  "Správa:",
  $message,
  "",
  "—",
  "Odoslané: " . date('Y-m-d H:i:s'),
  "IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'),
];

$body = implode("\n", $bodyLines);

// Headers: use site email as From, user as Reply-To
$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'From: MiamiWash <info@miamiwash.sk>';
$headers[] = 'Reply-To: ' . $email;

$sent = @mail($to, '=?UTF-8?B?'.base64_encode($subject).'?=', $body, implode("\r\n", $headers));

if (!$sent) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Email sa nepodarilo odoslať. Skúste neskôr alebo nás kontaktujte priamo.']);
  exit;
}

echo json_encode(['ok' => true, 'message' => 'Správa bola odoslaná. Ďakujeme!']);
