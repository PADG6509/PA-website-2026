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
// Sent as multipart (HTML + plain text) so that Outlook replies in HTML
// and keeps the company signature and formatting.
$subject = 'Upit sa sajta – ' . $name;
$sentAt  = date('d.m.Y. H:i');
$orgTxt  = ($org !== '' ? $org : '—');

// plain-text part (fallback)
$text  = "Nova poruka sa kontakt forme na www.proanalytica.com\n";
$text .= "------------------------------------------------------\n\n";
$text .= "Ime i prezime: $name\n";
$text .= "E-pošta:       $email\n";
$text .= "Organizacija:  $orgTxt\n";
$text .= "Jezik sajta:   " . strtoupper($lang) . "\n";
$text .= "Vreme:         $sentAt\n\n";
$text .= "Poruka:\n$message\n\n";
$text .= "------------------------------------------------------\n";
$text .= "Odgovorom na ovaj mejl odgovarate direktno pošiljaocu.\n";

// HTML part
function h($v) { return htmlspecialchars($v, ENT_QUOTES, 'UTF-8'); }
$row = function ($label, $value) {
    return '<tr><td style="padding:6px 16px 6px 0;color:#5b6770;white-space:nowrap;vertical-align:top;">' . $label . '</td>'
         . '<td style="padding:6px 0;color:#17242c;">' . $value . '</td></tr>';
};
$html  = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>';
$html .= '<body style="margin:0;padding:0;font-family:Calibri,Arial,Helvetica,sans-serif;font-size:11pt;color:#17242c;">';
$html .= '<div style="max-width:640px;">';
$html .= '<p style="margin:0 0 12px 0;color:#00807F;font-weight:bold;">Nova poruka sa kontakt forme na www.proanalytica.com</p>';
$html .= '<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-family:Calibri,Arial,Helvetica,sans-serif;font-size:11pt;">';
$html .= $row('Ime i prezime:', '<b>' . h($name) . '</b>');
$html .= $row('E-pošta:', '<a href="mailto:' . h($email) . '" style="color:#00807F;">' . h($email) . '</a>');
$html .= $row('Organizacija:', h($orgTxt));
$html .= $row('Jezik sajta:', strtoupper($lang));
$html .= $row('Vreme:', $sentAt);
$html .= '</table>';
$html .= '<p style="margin:16px 0 6px 0;color:#5b6770;">Poruka:</p>';
$html .= '<div style="padding:12px 14px;background:#f3f2ee;border-left:3px solid #00807F;">' . nl2br(h($message)) . '</div>';
$html .= '<p style="margin:16px 0 0 0;font-size:9pt;color:#8a949a;">Odgovorom na ovaj mejl odgovarate direktno pošiljaocu.</p>';
$html .= '</div></body></html>';

$boundary = 'pa_' . bin2hex(random_bytes(12));
$body  = "--$boundary\r\n";
$body .= "Content-Type: text/plain; charset=UTF-8\r\n";
$body .= "Content-Transfer-Encoding: base64\r\n\r\n";
$body .= chunk_split(base64_encode($text)) . "\r\n";
$body .= "--$boundary\r\n";
$body .= "Content-Type: text/html; charset=UTF-8\r\n";
$body .= "Content-Transfer-Encoding: base64\r\n\r\n";
$body .= chunk_split(base64_encode($html)) . "\r\n";
$body .= "--$boundary--\r\n";

$encSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$encFrom    = '=?UTF-8?B?' . base64_encode($FROM_NAME) . '?=';
$headers  = "From: $encFrom <$FROM>\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: multipart/alternative; boundary=\"$boundary\"\r\n";
$headers .= "X-Mailer: Proanalytica contact form\r\n";

$sent = @mail($TO, $encSubject, $body, $headers, '-f' . $FROM);

finish($sent, $sent ? null : 'mail', $isAjax, $lang);
