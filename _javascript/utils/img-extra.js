// 즉시 data-src를 src로 변환하여 이미지 표시
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('img[data-src]').forEach(img => {
    img.src = img.dataset.src;
    img.removeAttribute('data-src');
  });
});

/**
  Popup images when clicked (https://github.com/dimsemenov/Magnific-Popup)
*/

$(function () {

  const IMG_SCOPE = '#main > div.row:first-child > div:first-child';

  if ($(`${IMG_SCOPE} img`).length <= 0) {
    return;
  }

  /* popup */

  $(`${IMG_SCOPE} p > img,${IMG_SCOPE} img.preview-img`).each(
    function () {
      let nextTag = $(this).next();
      const title = nextTag.prop('tagName') === 'EM' ? nextTag.text() : '';
      const src = $(this).attr('src'); // use standard src attribute

      $(this).wrap(`<a href="${src}" title="${title}" class="popup"></a>`);
    }
  );

  $('.popup').magnificPopup({
    type: 'image',
    closeOnContentClick: true,
    showCloseBtn: false,
    zoom: {
      enabled: true,
      duration: 300,
      easing: 'ease-in-out'
    }
  });

  /* markup the image links */

  $(`${IMG_SCOPE} a`).has('img').addClass('img-link');

});
