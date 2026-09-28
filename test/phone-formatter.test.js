const { normalizeVietnamPhone } = require('./utils/phoneFormatter');

describe('QC Unit Test Suite: Vietnam Mobile Phone Normalizer (E.164)', () => {
  // Nhóm 1: Ca hợp lệ (Equivalence Partitioning - Valid Class)
  test('TC-01 [Standard]: Chuẩn hóa số 10 chữ số thông thường -> Trả về +84...', () => {
    expect(normalizeVietnamPhone('0762314781')).toBe('+84762314781');
    expect(normalizeVietnamPhone('0912345678')).toBe('+84912345678');
    expect(normalizeVietnamPhone('0388999888')).toBe('+84388999888');
  });

  test('TC-02 [Prefix Normalization]: Nhập số có tiền tố +84 hoặc 84 -> Trả về chuẩn +84...', () => {
    expect(normalizeVietnamPhone('+84762314781')).toBe('+84762314781');
    expect(normalizeVietnamPhone('84762314781')).toBe('+84762314781');
  });

  test('TC-03 [Sanitization]: Nhập số chứa khoảng trắng, dấu gạch ngang, dấu chấm -> Lọc sạch ký tự rác', () => {
    expect(normalizeVietnamPhone('076 231 4781')).toBe('+84762314781');
    expect(normalizeVietnamPhone('076-231-4781')).toBe('+84762314781');
    expect(normalizeVietnamPhone('(076).231.4781')).toBe('+84762314781');
  });

  // Nhóm 2: Ca giá trị biên & Dữ liệu không hợp lệ (Boundary & Invalid Class)
  test('TC-04 [Boundary/Length]: Số thiếu hoặc thừa chữ số -> Trả về null', () => {
    expect(normalizeVietnamPhone('076231478')).toBeNull(); // 9 số (thiếu)
    expect(normalizeVietnamPhone('07623147819')).toBeNull(); // 11 số (thừa)
  });

  test('TC-05 [Invalid Carrier]: Đầu số nhà mạng không tồn tại hoặc số cố định bàn -> Trả về null', () => {
    expect(normalizeVietnamPhone('0283899999')).toBeNull(); // Đầu số bàn TP.HCM (028)
    expect(normalizeVietnamPhone('0412345678')).toBeNull(); // Đầu 04 không tồn tại
    expect(normalizeVietnamPhone('0123456789')).toBeNull(); // Đầu 01 cũ đã bị khai tử
  });

  test('TC-06 [Edge/Security]: Input chứa chữ cái, ký tự đặc biệt hoặc kiểu dữ liệu rỗng -> Xử lý an toàn', () => {
    expect(normalizeVietnamPhone('')).toBeNull();
    expect(normalizeVietnamPhone(null)).toBeNull();
    expect(normalizeVietnamPhone(undefined)).toBeNull();
    expect(normalizeVietnamPhone('076231478a')).toBeNull();
    expect(normalizeVietnamPhone('<script>0762314781</script>')).toBeNull();
  });
});