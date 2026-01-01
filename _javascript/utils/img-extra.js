// data-src transformation logic removed since it is handled server-side now.

/**
  Popup images when clicked (https://github.com/dimsemenov/Magnific-Popup)
*/

$(function () {

  /* popup */
  const $images = $('.post-content img:not(.emoji), .preview-img');

  if ($images.length <= 0) {
    return;
  }

  $images.each(function () {
    // If the image is already wrapped in a link, skip it or handle appropriately
    if ($(this).parent().is('a')) {
      return;
    }

    let nextTag = $(this).next();
    const title = nextTag.prop('tagName') === 'EM' ? nextTag.text() : '';
    const src = $(this).attr('src'); // use standard src attribute

    $(this).wrap(`<a href="${src}" title="${title}" class="popup img-link"></a>`);
  });

  $('.popup').magnificPopup({
    type: 'image',
    closeOnContentClick: true,
    showCloseBtn: false,
    zoom: {
      enabled: true,
      duration: 300,
      easing: 'ease-in-out'
    },
    tLoading: '',
    image: {
      verticalFit: false 
    }
  });

  $('.popup').on('click', function() {
  });

});
