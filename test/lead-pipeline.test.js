const axios = require('axios');

const BASE_URL = 'http://banviet-edu-lab.local';
const AJAX_ENDPOINT = `${BASE_URL}/wp-admin/admin-ajax.php`;

describe('QC Automation Suite: Bản Việt Lead Generation Pipeline', () => {
  let formNonce = '';

  // 1. Hook cào Nonce thực tế từ DOM trang chủ
  beforeAll(async () => {
    try {
      const response = await axios.get(BASE_URL, { timeout: 10000 });
      const html = response.data;

      const nonceRegex = /name=["']_fluentform_3_fluentformnonce["']\s+value=["']([^"']+)["']|value=["']([^"']+)["']\s+name=["']_fluentform_3_fluentformnonce["']/;
      const match = html.match(nonceRegex);

      if (match) {
        formNonce = match[1] || match[2];
        console.log(`\n[QC Hook] Bóc tách CSRF Nonce thành công: ${formNonce}`);
      } else {
        console.warn('\n[QC Warning] Không tìm thấy Nonce trong DOM.');
      }
    } catch (error) {
      console.error('\n[QC Error] Lỗi kết nối tới LocalWP:', error.message);
    }
  });

  // TC-01: Happy Path - Đăng ký hợp lệ với payload chuẩn hóa data contract
  test('TC-01 [Happy Path]: Gửi payload đầy đủ thông tin chuẩn -> Kỳ vọng HTTP 200 & Ghi nhận thành công', async () => {
    // Đóng gói các trường vào chuỗi data theo đúng chuẩn Fluent Forms
    const formFields = new URLSearchParams({
      _fluentform_3_fluentformnonce: formNonce,
      __fluent_form_embded_post_id: '7',
      _wp_http_referer: '/',
      full_name: ' Nguyễn Văn A',
      phone: '0123456789',
      email: 'test.automation@gmail.com',
      course: 'Lập trình C++'
    });

    const rootPayload = new URLSearchParams({
      action: 'fluentform_submit',
      form_id: '3',
      data: formFields.toString() // Bọc dữ liệu vào key data
    });

    const response = await axios.post(AJAX_ENDPOINT, rootPayload.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest'
      },
      validateStatus: (status) => status < 500
    });

    if (response.status !== 200) {
      console.dir(response.data, { depth: null });
    }

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('success', true);
  }, 15000);

  // TC-02: Negative Testing - Chỉ bỏ trống trường Phone
  test('TC-02 [Boundary/Negative]: Bỏ trống trường Phone -> Kỳ vọng Fluent Forms từ chối với HTTP 423', async () => {
    const invalidFields = new URLSearchParams({
      _fluentform_3_fluentformnonce: formNonce,
      __fluent_form_embded_post_id: '7',
      _wp_http_referer: '/',
      full_name: 'Người dùng thiếu SĐT',
      phone: '', // Chỉ bỏ trống phone, các trường khác vẫn hợp lệ
      email: 'nophone@gmail.com',
      course: 'AWS'
    });

    const rootPayload = new URLSearchParams({
      action: 'fluentform_submit',
      form_id: '3',
      data: invalidFields.toString()
    });

    const response = await axios.post(AJAX_ENDPOINT, rootPayload.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest'
      },
      validateStatus: (status) => status < 500
    });

    expect(response.status).toBe(423);
    expect(response.data).toHaveProperty('errors');
    expect(response.data.errors).toHaveProperty('phone');
    // Đảm bảo không bị dính False Positive: Các trường còn lại phải hợp lệ
    expect(response.data.errors).not.toHaveProperty('full_name');
  });

  // TC-03: Security & Sanitization - Hệ thống phải chặn đứng payload XSS
  test('TC-03 [Security/XSS]: Input chứa script nguy hiểm -> Hệ thống chặn đứng & Trả về HTTP 423', async () => {
    const xssFields = new URLSearchParams({
      _fluentform_3_fluentformnonce: formNonce,
      __fluent_form_embded_post_id: '7',
      _wp_http_referer: '/',
      full_name: '<script>alert("XSS Vulnerability")</script>',
      phone: '0988776655',
      email: 'xss_tester@gmail.com',
      course: 'Lập trình C'
    });

    const rootPayload = new URLSearchParams({
      action: 'fluentform_submit',
      form_id: '3',
      data: xssFields.toString()
    });

    const response = await axios.post(AJAX_ENDPOINT, rootPayload.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest'
      },
      validateStatus: (status) => status < 500
    });

    // Kỳ vọng: Hệ thống từ chối nhận mã độc bằng mã HTTP 423
    expect(response.status).toBe(423);
    // Phản hồi phải chứa danh sách lỗi validation của Fluent Forms
    expect(response.data).toHaveProperty('errors');
    expect(response.data.errors).toHaveProperty('full_name');
  });
});