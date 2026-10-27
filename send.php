<?php
/*
 * Proanalytica — contact form handler (cPanel / PHP mail()).
 * Receives the form from contact.html and emails it to the company inbox.
 * Answers JSON for the JS submit; falls back to a redirect without JS.
 */

$TO        = 'komercijala@proanalytica.com';     // inquiries go to sales; the address shown on the site stays proanalytica@
$FROM      = 'proanalytica@proanalytica.com';   // must be a mailbox on this domain (SPF/DKIM)
$FROM_NAME = 'Proanalytica web sajt';
$MIN_SECONDS = 3;                                // faster submits are treated as bots
date_default_timezone_set('Europe/Belgrade');

$isAjax = isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] === 'XMLHttpRequest';

function finish($ok, $code, $isAjax, $lang) {
    if ($isAjax) {
        header('Content-Type: application/json; charset=utf-8');
        if (!$ok) http_response_code($code === 'method' ? 405 : 400);
        echo json_encode(['ok' => $ok, 'error' => $ok ? null : $code]);
    } else {
        $q = $ok ? 'sent=1' : 'error=' . urlencode($code);
        header('Location: contact.html?lang=' . $lang . '&' . $q . '#contact-form', true, 303);
    }
    exit;
}

$lang = (isset($_POST['lang']) && $_POST['lang'] === 'sr') ? 'sr' : 'en';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') finish(false, 'method', $isAjax, $lang);

// --- Spam protection -------------------------------------------------------
// 1) honeypot: hidden field that people never see and bots fill in
if (!empty($_POST['website'])) finish(true, null, $isAjax, $lang);   // pretend success
// 2) timing: form must be open at least a few seconds
$ts = isset($_POST['ts']) ? (int) $_POST['ts'] : 0;
if ($ts > 0 && (time() - (int) floor($ts / 1000)) < $MIN_SECONDS) finish(true, null, $isAjax, $lang);

// --- Input -----------------------------------------------------------------
function clean_line($v, $max) {
    $v = trim((string) $v);
    $v = str_replace(["\r", "\n", "%0a", "%0d"], ' ', $v);   // no header injection
    return mb_substr($v, 0, $max, 'UTF-8');
}
$name    = clean_line($_POST['name'] ?? '', 120);
$email   = clean_line($_POST['email'] ?? '', 160);
$org     = clean_line($_POST['organisation'] ?? '', 160);
$message = trim((string) ($_POST['message'] ?? ''));
$message = mb_substr($message, 0, 5000, 'UTF-8');

if ($name === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    finish(false, 'invalid', $isAjax, $lang);
}
// crude link-spam filter
if (preg_match_all('#https?://#i', $message) > 3) finish(true, null, $isAjax, $lang);

// --- Compose ---------------------------------------------------------------
$subject = 'Upit sa sajta – ' . $name;
$body  = "Nova poruka sa kontakt forme na www.proanalytica.com\n";
$body .= "------------------------------------------------------\n\n";
$body .= "Ime i prezime: $name\n";
$body .= "E-pošta:       $email\n";
$body .= "Organizacija:  " . ($org !== '' ? $org : '—') . "\n";
$body .= "Jezik sajta:   " . strtoupper($lang) . "\n";
$body .= "Vreme:         " . date('d.m.Y. H:i') . "\n\n";
$body .= "Poruka:\n$message\n\n";
$body .= "------------------------------------------------------\n";
$body .= "Odgovorom na ovaj mejl odgovarate direktno pošiljaocu.\n";

$encSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$encFrom    = '=?UTF-8?B?' . base64_encode($FROM_NAME) . '?=';
$headers  = "From: $encFrom <$FROM>\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "Content-Transfer-Encoding: 8bit\r\n";
$headers .= "X-Mailer: Proanalytica contact form\r\n";

$sent = @mail($TO, $encSubject, $body, $headers, '-f' . $FROM);

finish($sent, $sent ? null : 'mail', $isAjax, $lang);
