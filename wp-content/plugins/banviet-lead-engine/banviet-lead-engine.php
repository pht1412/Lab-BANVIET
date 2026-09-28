<?php
/**
 * Plugin Name:       Bản Việt Lead Engine
 * Plugin URI:        https://banviet.edu.vn
 * Description:       Module xử lý Data Pipeline bắt sự kiện nộp đơn học viên và đồng bộ thời gian thực sang Google Sheets qua Webhook.
 * Version:           1.0.0
 * Author:            Le Hong Phat
 * Author URI:        https://linkedin.com/in/le-hong-phat-dev
 * License:           GPL-2.0+
 * Text Domain:       banviet-lead-engine
 */

// 1. SECURITY GUARD: Chặn thực thi file trực tiếp từ URL trình duyệt
if (!defined('ABSPATH')) {
    exit; // Thoát ngay nếu bị gọi trực tiếp ngoài môi trường nạp của WordPress
}

// 2. KHAI BÁO CẤU HÌNH NGHIỆP VỤ (CONFIG CONSTANTS)
define('BANVIET_TARGET_FORM_ID', 3);
define('BANVIET_GOOGLE_WEBHOOK_URL', 'https://script.google.com/macros/s/THAY_THE_URL_CUA_BAN_O_DAY/exec');

/**
 * Hook lắng nghe sự kiện Fluent Forms lưu bản ghi thành công
 *
 * @param int   $entryId  ID của bản ghi nộp đơn
 * @param array $formData Dữ liệu thô từ form người dùng nộp
 * @param object $form     Thực thể Form metadata
 */
function banviet_dispatch_lead_to_sheets($entryId, $formData, $form) {
    // Chỉ kích hoạt cho đúng Form tuyển sinh (ID = 3)
    if ((int)$form->id !== BANVIET_TARGET_FORM_ID) {
        return;
    }

    // Bỏ qua nếu chưa cấu hình URL Webhook thực tế
    if (strpos(BANVIET_GOOGLE_WEBHOOK_URL, 'THAY_THE_URL') !== false) {
        error_log('[Bản Việt Lead Engine] Cảnh báo: Webhook URL chưa được cấu hình.');
        return;
    }

    // 3. SANITIZATION THEO DATA CONTRACT ĐÃ THỐNG NHẤT
    $payload = array(
        'full_name' => isset($formData['full_name']) ? sanitize_text_field($formData['full_name']) : '',
        'phone'     => isset($formData['phone'])     ? sanitize_text_field($formData['phone'])     : '',
        'email'     => isset($formData['email'])     ? sanitize_email($formData['email'])          : '',
        'course'    => isset($formData['course'])    ? sanitize_text_field($formData['course'])    : '',
    );

    // 4. BẮN ASYNCHRONOUS HTTP POST REQUEST
    $response = wp_remote_post(BANVIET_GOOGLE_WEBHOOK_URL, array(
        'method'      => 'POST',
        'timeout'     => 15,
        'redirection' => 5,
        'httpversion' => '1.0',
        'blocking'    => false, // Non-blocking: tối ưu UX, không bắt client đợi phản hồi
        'headers'     => array(
            'Content-Type' => 'application/json; charset=utf-8',
        ),
        'body'        => wp_json_encode($payload),
        'data_format' => 'body',
    ));

    // Ghi log kiểm tra nếu gặp lỗi hệ thống (Dành cho QC/Dev debug)
    if (is_wp_error($response)) {
        error_log('[Bản Việt Lead Engine] Lỗi kết nối Webhook: ' . $response->get_error_message());
    }
}

// Đăng ký hàm với Action Hook của Fluent Forms
add_action('fluentform/submission_inserted', 'banviet_dispatch_lead_to_sheets', 20, 3);