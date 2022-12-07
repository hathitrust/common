var HT = HT || {};

head.ready(function() {

  $("body").on('focusin', ".modal__container input[type='radio']", function(event) {
    // $(event.target).next().get(0).scrollIntoView();
    var target = event.target;
    var name = target.getAttribute('name');
    var $first = $(`input[name="${name}"]:first`);
    $first.next().get(0).scrollIntoView();
    $(target).parents(".modal__content").get(0).scrollTop -= 150;
  })

  $("body").on('focusin', ".modal__container input[type='checkbox']", function(event) {
    $(event.target).next().get(0).scrollIntoView();
    $(event.target).parents(".modal__content").get(0).scrollTop -= 150;
  })

  function get_feedback_url() {
    var login_status = HT.login_status || {};
    var FEEDBACK_URL = '//' + HT.service_domain + '/cgi/feedback';
    if ( login_status.logged_in ) {
      FEEDBACK_URL = 'https:' + FEEDBACK_URL;
    }
    return FEEDBACK_URL;
  }

  function default_dialog() {
    var html =
    '<form class="form-horizontal">' +
      '<div class="control-group">' +
        '<label class="control-label" for="email">Email Address</label>' +
        '<div class="controls">' +
          '<input id="email" name="email" type="text" class="input-xlarge" placeholder="[Your email address]" required="required" />' +
          '<span class="required"><i class="icomoon icomoon-info-circle" aria-hidden="true"></i> This field is required.</span>' + 
        '</div>' +
      '</div>' +
      '<div class="control-group">' +
        '<label class="control-label" for="comments">Comments</label>' +
        '<div class="controls">' +
          '<textarea rows="5" id="comments" name="comments" required="required" class="input-xlarge" placeholder="Add your feedback here"></textarea>' +
          '<span class="required"><i class="icomoon icomoon-info-circle" aria-hidden="true"></i> This field is required.</span>' + 
        '</div>' +
      '</div>' +
    '</form>';

    return html;
  }

  $(document).on('click.feedback.data-api', '[data-toggle^=feedback]', function(e) {
      e.preventDefault();
      bootbox.hideAll();

      var id = $(this).data('id');
      var m = $(this).data('m') || 'ht';
      var html = $(this).data('default-form') ? default_dialog() : ( HT.feedback ? HT.feedback.dialog() : default_dialog() );
      var message;

      var today = new Date();
      if ( ( today.getFullYear() == 2021 && today.getDate() >= 22 && today.getMonth() == 11 ) ||
         ( today.getFullYear() == 2022 && today.getDate() < 3 && today.getMonth() == 0 ) ) { // ☃
        message = '<div class="alert alert-block"><p><span style="font-size: 400%; float: left; display: inline-block; margin-right: 8px" aria-hidden="true">❄</span> Because of the winter holiday, HathiTrust User Support is unavailable from December 22nd through January 2nd. We will respond to your feedback as soon as possible starting January 4th. Thank you for your patience.</p></div>';
      }

      if ( message ) {
        if ( typeof(html) == 'string' ) {
          html = html.replace('<form', message + '<form');
        } else {
          var $tmp = $(html).children().slice(0,1);
          $tmp.before(message);
        }
      }

      var $dialog = bootbox.dialog(
        html,
        [
          {
            "label" : "Cancel",
            "class" : "btn-dismiss"
          },
          {
            "label" : "Submit",
            "class" : "btn btn-primary",
            "callback" : function() {

              var data = { 'return' : location.href, m : m };
              if ( id ) { data.id = id ; }
              var is_valid = true; var is_empty = true;
              $dialog.find("input[type=text],textarea,input:checked,input[type=hidden]").each(function() {
                var value = $.trim($(this).val());
                if ( value ) {
                  data[$(this).attr("name")] = $(this).val();
                  is_empty = false;
                }
                if ( $(this).attr("required") && ! value ) {
                  is_valid = false;
                }
              })

              // var val_email = $.trim($("#email").val());
              // var val_comments = $.trim($("#comments").val());
              if ( is_valid && ! is_empty) {
                $dialog.find(".btn").attr("disabled", "disabled");
                $dialog.find(".btn-primary").addClass("btn-loading");

                if ( location.hostname == HT.service_domain ) {
                  // we can do this with ajax
                  $.post(get_feedback_url(),
                    data,
                    function() {
                      $dialog.closeModal();
                      bootbox.alert("<p>Thank you for your feedback!</p>");
                  }).fail(function() {
                    $dialog.closeModal();
                    bootbox.alert("<p>There was an issue submitting this feedback.</p>");
                  });
                } else {
                  // have to post the form
                  var $form = $("<form method='POST'></form>");
                  $form.attr("action", get_feedback_url());
                  $.each(data, function(name, values) {
                      values = $.isArray(values) ? values : [ values ];
                      $.each(values, function(index, value) {
                        $("<input type='hidden' />").attr({ name : name }).val(value).appendTo($form);
                      });
                  })

                  // $.each($.keys(data), function(name) {
                  //   var values = data[name];
                  //   values = $.isArray(values) ? values : [ values ];
                  //   _.each(values, function(value) {
                  //     $("<input type='hidden' />").attr({ name : name }).val(value).appendTo($form);
                  //   })
                  // })

                  $dialog.closeModal();
                  $form.hide().appendTo("body");
                  $form.submit();
                }


              } else if ( ! is_valid) {
                $("<div class='alert alert-error'>Please fill in required fields.</div>").insertBefore($dialog.find(".btn-dismiss"));
                $dialog.addClass("required");
              } else {
                $("<div class='alert alert-error'>You cannot submit an empty form.</div>").insertBefore($dialog.find(".btn-dismiss"));
              }
              return false;
            }
          }
        ],
        {
          header : 'Feedback'
        }
      );
    }
  );

})
