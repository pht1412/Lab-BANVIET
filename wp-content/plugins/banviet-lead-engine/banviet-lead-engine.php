<?php
/**
 * Plugin Name:       Bản Việt Lead Engine
 * Plugin URI:        https://banviet.edu.vn
 * Description:       Module xử lý Data Pipeline đồng bộ lead sang Google Sheets.
 * Version:           1.0.3
 * Author:            Le Hong Phat
 */

if (!defined('ABSPATH')) {
    exit;
}

// 1. CẤU HÌNH NGHIỆP VỤ
define('BANVIET_TARGET_FORM_ID', 3);
define('BANVIET_GOOGLE_WEBHOOK_URL', 'https://script.google.com/macros/s/AKfycbyX79lcRGbl27ZNKnpakdhYpqQhsflFlMz49W31UAp6NlY5v5lY677-NaGMRSJzWPA9/exec');

function banviet_dispatch_lead_to_sheets($entryId, $formData, $form) {
    // 2. Bóc tách Form ID an toàn
    $formId = 0;
    if (is_object($form) && isset($form->id)) {
        $formId = (int) $form->id;
    } elseif (is_array($form) && isset($form['id'])) {
        $formId = (int) $form['id'];
    }

    if ($formId !== BANVIET_TARGET_FORM_ID) {
        return;
    }

    if (empty(BANVIET_GOOGLE_WEBHOOK_URL)) {
        return;
    }

    // 3. Chuẩn hóa Payload theo Data Contract
    $payload = array(
        'full_name' => isset($formData['full_name']) ? sanitize_text_field($formData['full_name']) : '',
        'phone'     => isset($formData['phone'])     ? sanitize_text_field($formData['phone'])     : '',
        'email'     => isset($formData['email'])     ? sanitize_email($formData['email'])          : '',
        'course'    => isset($formData['course'])    ? sanitize_text_field($formData['course'])    : '',
    );

    // 4. Bắn HTTP POST Request sang Google Apps Script
    // Bỏ httpversion để cURL tự dùng HTTP/1.1, không theo dõi redirect sâu để tránh lỗi GFE 400
    wp_remote_post(BANVIET_GOOGLE_WEBHOOK_URL, array(
        'method'      => 'POST',
        'timeout'     => 15,
        'redirection' => 0, // Không follow redirect vì Google đã ghi dữ liệu vào Sheet ở lượt POST đầu tiên
        'blocking'    => false, // Fire-and-forget: Client nộp xong không phải chờ máy chủ phản hồi
        'headers'     => array(
            'Content-Type' => 'application/json; charset=utf-8',
        ),
        'body'        => wp_json_encode($payload),
        'data_format' => 'body',
    ));
}

add_action('fluentform/submission_inserted', 'banviet_dispatch_lead_to_sheets', 20, 3);

/**
 * Nạp stylesheet tùy biến cho giao diện Bản Việt Education
 */
function banviet_enqueue_custom_styles() {
    wp_enqueue_style(
        'banviet-custom-styles',
        plugins_url('assets/css/banviet-custom.css', __FILE__),
        array(),
        time() // Tự động đổi version sau mỗi giây: ?ver=1727513...
    );
}
add_action('wp_enqueue_scripts', 'banviet_enqueue_custom_styles');