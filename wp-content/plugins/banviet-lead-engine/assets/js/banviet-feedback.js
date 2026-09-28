/**
 * Bản Việt Education - Client Feedback Controller (Strict Mode)
 */
(function ($) {
  'use strict';

  console.log('[Bản Việt Feedback] Script đã nạp thành công vào DOM.');

  // Lắng nghe sự kiện submission thành công từ Fluent Forms
  $(document)
    .off('fluentform_submission_success.banviet')
    .on('fluentform_submission_success.banviet', function (event, data) {
      console.log('[Bản Việt Feedback] Bắt được sự kiện nộp form:', data);

      // 1. CHỐT CHẶN 1: Bỏ qua hoàn toàn các sự kiện ma không có payload
      if (!data) {
        console.warn('[Bản Việt Feedback] Bỏ qua sự kiện không chứa dữ liệu (Ghost Event).');
        return;
      }

      // 2. CHỐT CHẶN 2: Bóc tách Form ID nghiêm ngặt
      let formId = null;
      if (data.form_id) {
        formId = data.form_id;
      } else if (data.form && typeof data.form.attr === 'function') {
        formId = data.form.attr('data-form_id') || data.form.find('input[name="form_id"]').val();
      } else if (data.response && data.response.form_id) {
        formId = data.response.form_id;
      }

      console.log('[Bản Việt Feedback] Form ID xác định:', formId);

      // Chỉ chấp nhận DUY NHẤT Form ID 3
      if (formId != 3) {
        return;
      }

      // 3. CHỐT CHẶN 3: Khóa toàn cục chống bắn Toast liên tiếp
      if (window.isBanVietToastActive) {
        return;
      }
      window.isBanVietToastActive = true;

      // Kích hoạt Toast thông báo
      showBanVietToast(
        'Đăng ký thành công!',
        'Cảm ơn bạn. Chuyên viên tuyển sinh Bản Việt sẽ liên hệ trong 15 phút.'
      );

      // Giải phóng khóa sau 3 giây
      setTimeout(function () {
        window.isBanVietToastActive = false;
      }, 3000);
    });

  function showBanVietToast(title, message) {
    let $container =$('#banviet-toast-container');
    if (!$container.length) {
      $container =$('<div id="banviet-toast-container"></div>');
      $('body').append($container);
    }

    const toastId = 'toast-' + Date.now();
    const toastHtml = `
      <div id="${toastId}" class="banviet-toast">
        <div class="toast-icon">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <div class="toast-content">
          <h4 class="toast-title">${title}</h4>
          <p class="toast-desc">${message}</p>
        </div>
        <button class="toast-close" onclick="document.getElementById('${toastId}').remove()">&times;</button>
      </div>
    `;

    const $toast =$(toastHtml);
    $container.append($toast);

    setTimeout(() => $toast.addClass('show'), 20);

    setTimeout(() => {
      $toast.removeClass('show');
      setTimeout(() => $toast.remove(), 400);
    }, 4000);
  }
})(jQuery);