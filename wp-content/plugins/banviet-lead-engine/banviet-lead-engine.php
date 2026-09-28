<?php
/**
 * Plugin Name:       Bản Việt Lead Engine
 * Plugin URI:        https://banviet.edu.vn
 * Description:       Module xử lý Data Pipeline đồng bộ lead sang Google Sheets (Chuẩn hóa E.164 & UI Feedback).
 * Version:           1.0.4
 * Author:            Le Hong Phat
 */

if (!defined('ABSPATH')) {
    exit;
}

// 1. CẤU HÌNH NGHIỆP VỤ HỆ THỐNG
define('BANVIET_TARGET_FORM_ID', 3);
define('BANVIET_GOOGLE_WEBHOOK_URL', 'https://script.google.com/macros/s/AKfycbyX79lcRGbl27ZNKnpakdhYpqQhsflFlMz49W31UAp6NlY5v5lY677-NaGMRSJzWPA9/exec');

/**
 * Chuẩn hóa số điện thoại di động Việt Nam sang định dạng quốc tế E.164 (+84...)
 * 
 * @param string $phone
 * @return string
 */
function banviet_normalize_vietnam_phone($phone) {
    if (empty($phone) || !is_string($phone)) {
        return '';
    }

    // 1. Loại bỏ toàn bộ khoảng trắng, dấu gạch ngang, chấm, ngoặc đơn
    $cleaned = preg_replace('/[\s\-\.\(\)]/', '', trim($phone));

    // 2. Chuyển đổi tiền tố +84 hoặc 84 về đầu 0
    if (str_starts_with($cleaned, '+84')) {
        $cleaned = '0' . substr($cleaned, 3);
    } elseif (str_starts_with($cleaned, '84') && strlen($cleaned) === 11) {
        $cleaned = '0' . substr($cleaned, 2);
    }

    // 3. Kiểm tra định dạng di động Việt Nam: 10 chữ số, đầu 03, 05, 07, 08, 09
    if (preg_match('/^0[35789]\d{8}$/', $cleaned)) {
        return "'+84" . substr($cleaned, 1); // Định dạng chuẩn E.164: +84987654321
    }

    // Nếu không khớp regex di động chuẩn, trả về chuỗi đã lọc sạch ký tự rác
    return $cleaned;
}

/**
 * Điều phối dữ liệu Lead sang Google Sheets qua Webhook Bất đồng bộ
 */
function banviet_dispatch_lead_to_sheets($entryId, $formData, $form) {
    // 1. Bóc tách Form ID an toàn
    $formId = 0;
    if (is_object($form) && isset($form->id)) {
        $formId = (int) $form->id;
    } elseif (is_array($form) && isset($form['id'])) {
        $formId = (int) $form['id'];
    }

    if ($formId !== BANVIET_TARGET_FORM_ID || empty(BANVIET_GOOGLE_WEBHOOK_URL)) {
        return;
    }

    // 2. Trích xuất và chuẩn hóa số điện thoại (Sửa khớp biến $formData)
    $raw_phone = isset($formData['phone']) ? $formData['phone'] : '';
    $normalized_phone = banviet_normalize_vietnam_phone($raw_phone);

    // 3. Đóng gói Payload theo Data Contract (Đã gán biến chuẩn hóa)
    $payload = array(
        'full_name'    => isset($formData['full_name']) ? sanitize_text_field($formData['full_name']) : '',
        'phone'        => $normalized_phone, // Gửi số đã chuẩn hóa E.164 (+84...)
        'email'        => isset($formData['email'])     ? sanitize_email($formData['email'])          : '',
        'course'       => isset($formData['course'])    ? sanitize_text_field($formData['course'])    : '',
        'submitted_at' => current_time('mysql'),
    );

    // 4. Bắn HTTP POST Request sang Google Apps Script (Fire-and-forget)
    wp_remote_post(BANVIET_GOOGLE_WEBHOOK_URL, array(
        'method'      => 'POST',
        'timeout'     => 5,
        'redirection' => 0,
        'blocking'    => false, // Không khóa luồng của client
        'headers'     => array(
            'Content-Type' => 'application/json; charset=utf-8',
        ),
        'body'        => wp_json_encode($payload),
        'data_format' => 'body',
    ));
}
add_action('fluentform/submission_inserted', 'banviet_dispatch_lead_to_sheets', 20, 3);

/**
 * Nạp tập trung Stylesheet và Script cho giao diện Bản Việt Education
 */
function banviet_enqueue_frontend_assets() {
    // 1. Nạp CSS tùy biến (Tia sáng Shimmer nút CTA + Toast Component)
    wp_enqueue_style(
        'banviet-custom-styles',
        plugins_url('assets/css/banviet-custom.css', __FILE__),
        array(),
        time()
    );

    // 2. Nạp JS Feedback (Lắng nghe sự kiện AJAX hiển thị Toast)
    wp_enqueue_script(
        'banviet-feedback-script',
        plugins_url('assets/js/banviet-feedback.js', __FILE__),
        array('jquery'),
        time(),
        true
    );
}
add_action('wp_enqueue_scripts', 'banviet_enqueue_frontend_assets');