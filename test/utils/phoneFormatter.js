/**
 * Chuẩn hóa số điện thoại di động Việt Nam về định dạng quốc tế E.164 (+84...)
 * Hỗ trợ các đầu mạng hợp lệ: 03, 05, 07, 08, 09
 *
 * @param {string} phone
 * @returns {string|null} Chuỗi E.164 hợp lệ hoặc null nếu không hợp lệ
 */
function normalizeVietnamPhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  // 1. Loại bỏ toàn bộ khoảng trắng, dấu gạch ngang, chấm, ngoặc đơn
  let cleaned = phone.trim().replace(/[\s\-\.\(\)]/g, '');

  // 2. Chuyển đổi các định dạng bắt đầu bằng 84 hoặc +84 về số 0 đầu
  if (cleaned.startsWith('+84')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('84') && cleaned.length === 11) {
    cleaned = '0' + cleaned.slice(2);
  }

  // 3. Regex kiểm định: 10 chữ số, bắt đầu bằng 0 và theo sau bởi các đầu mạng 3, 5, 7, 8, 9
  const vnMobileRegex = /^0[35789]\d{8}$/;

  if (!vnMobileRegex.test(cleaned)) {
    return null; // Không phải số di động Việt Nam hợp lệ
  }

  // 4. Định dạng lại thành chuẩn quốc tế E.164
  return '+84' + cleaned.slice(1);
}

module.exports = { normalizeVietnamPhone };