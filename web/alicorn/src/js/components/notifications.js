var HT = HT || {};

let $action;
let notificationData;
let dialogEl;

const openNotifications = function() {
  if ( notificationData == null || notificationData.length == 0) { return; }

  if ( dialogEl === undefined ) {
    let modal_html = `
<div class="notifications-panel modal micromodal-slide" tabindex="-1" aria-hidden="true" id="notifications-modal">
  <div class="modal__overlay" tabindex="-1" data-micromodal-close>
    <div class="modal__container" role="dialog" aria-modal="true" aria-labelledby="notifications-modal-title">
      <div class="notifications-panel-arrow"></div>
      <div class="modal__header"><h2 class="modal__title" id="notifications-modal-title">Your notifications</h2><button class="modal__close" aria-label="Close" data-micromodal-close></button></div>
      <div class="modal__content" id="notifications-modal-content">
        <dl id="notifications-modal-description">
        </dl>
      </div>
    </div>
  </div>
</div>
    `;

    dialogEl = $(modal_html).appendTo('body').get(0);

    notificationData.forEach((datum) => {
      let message;
      if (datum.message.indexOf('<p>') > -1) {
        message = datum.message + '<p>';
      } else {
        message = `<p>${datum.message} `;
      }
      message += `<a href="${datum.read_more_link}">${datum.read_more_label}</a></p>`;
      let notice_html = `<div>
        <dt>${datum.title}</dt>
        <dd>
          ${message}
        </dd>
      </div>`;
      $(notice_html).appendTo(dialogEl.querySelector('dl'));
    })
  }

  // why is this modal calculated by the right?
  let modalEl = dialogEl.querySelector('[aria-modal]');
  let leftX = $action.position().left - $(modalEl).width() + 150;
  let rightX = window.innerWidth - (leftX + $(modalEl).width());
  rightX += ( 2 * 16 ); // padding
  if (rightX < 0) {
    rightX = 0;
  }
  if (window.innerWidth - (rightX + $(modalEl).width() ) < 0 ) {
    rightX = 0;
  }
  dialogEl.style.setProperty('--right-x', rightX);

  $action.get(0).dataset.active = 'true';
  bootbox.show('notifications-modal', {
    onClose: function (modal) {
      docCookies.setItem('HT.notice', notificationData[0].effective_on, null, '/', '.hathitrust.org', true);
      // localStorage.setItem('ht.notification', notificationData[0].effective_on);
    }
  });

}

head.ready(function () {

  $action = $(".action-toggle-notifications");
  if ( ! $action.get(0) ){ return; }

  $("html").on('ht:login', function(event) {
    // console.log("AHOY WE ARE LOGGED IN");

    notificationData = HT.login_status.notificationData;
    if (notificationData == null || notificationData.length == 0) { return; }

    $action.prop('disabled', false);

    let notificationTimestamp = notificationData[0].effective_on;
    let lastNotificationTimestamp = docCookies.getItem('HT.notice');
    // let lastNotificationTimestamp = localStorage.getItem('ht.notification');

    // console.log("-- notification timestamp", notificationTimestamp, lastNotificationTimestamp, lastNotificationTimestamp != notificationTimestamp);
    if ( lastNotificationTimestamp != notificationTimestamp ) {
      // automatically open if there are unseen notifications
      openNotifications();
    }
    

    $action.on('click', (event) => {
      openNotifications();
    })

  })

});