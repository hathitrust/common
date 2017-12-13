var HT = HT || {};

head.ready(function() {


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
                '<label class="control-label" for="email">Email Address<br /><span class="label">Optional</span></label>' +
                '<div class="controls">' +
                    '<input id="email" name="email" type="text" class="input-xlarge" placeholder="[Your email address]" />' +
                '</div>' +
            '</div>' +
            '<div class="control-group">' + 
                '<label class="control-label" for="comments">Comments</label>' +
                '<div class="controls">' +
                    '<textarea rows="5" id="comments" name="comments" required="required" class="input-xlarge" placeholder="Add your feedback here"></textarea>' +
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
            if ( ( today.getFullYear() == 2017 && today.getDate() >= 22 && today.getMonth() == 11 ) || 
                 ( today.getFullYear() == 2018 && today.getDate() < 2 && today.getMonth() == 0 ) ) { // ☃
                message = '<div class="alert alert-block"><p><span style="font-size: 400%; float: left; display: inline-block; margin-right: 8px" aria-hidden="true">❄</span> Because of the winter holiday, HathiTrust staff and volunteers are unavailable from December 22nd through January 1st. We will respond to your feedback as soon as possible starting January 2nd. Thank you for your patience.</p></div>';
                // if ( typeof(html) == 'string' ) {
                //     html = html.replace('<form', message + '<form');
                // } else {
                //     var $tmp = $(html).children().slice(0,1);
                //     $tmp.before(message);
                // }
            }

            // message = '<div class="alert alert-block"><p><span style="font-size: 400%; float: left; display: inline-block; margin-right: 8px" aria-hidden="true"><svg style="height: 64px; width: 64px" version="1.1" xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"> <title></title> <g id="icomoon-ignore"> </g> <path fill="#000" d="M143.274 232.508c8.422 8.406 40.858 42.64 40.858 42.64l17.984-18.546-28.186-29.124 54.107-57.467c0 0-24.421-23.811-13.734-14.327 10.219-37.952 0.906-80.294-27.921-110.121-28.577-29.593-69.185-39.296-105.668-29.109l61.827 63.858-16.265 62.654-60.53 16.719-61.795-63.874c-9.859 37.718-0.485 79.669 28.156 109.278 30.047 31.061 73.311 40.186 111.169 27.421zM349.408 294.615l-74.56 73.654 122.966 127.403c10.031 10.406 23.249 15.594 36.436 15.594 13.125 0 26.312-5.188 36.406-15.594 20.125-20.812 20.125-54.498 0-75.31l-121.247-125.747zM511.841 80.919l-78.31-80.919-230.837 238.649 28.186 29.124-138.167 142.808-31.577 16.875-44.608 72.779 11.36 11.781 70.419-46.123 16.328-32.656 138.168-142.777 28.202 29.124 230.837-238.664z"></path> </svg></span> From June 9 through June 26, users may experience slower response times while we upgrade and transition HathiTrust user support systems. We will respond to your question as quickly as possible. Thank you for your patience.</p></div>';

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
                        "class" : "btn-primary",
                        "callback" : function() {

                            var data = { 'return' : location.href, m : m };
                            if ( id ) { data.id = id ; }
                            var is_valid = true; is_empty = true;
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
                                            $dialog.modal('hide');
                                            bootbox.alert("<p>Thank you for your feedback!</p>");
                                    });
                                } else {
                                    // have to post the form
                                    var $form = $("<form method='POST'></form>");
                                    $form.attr("action", get_feedback_url());
                                    _.each(_.keys(data), function(name) {
                                        var values = data[name];
                                        values = $.isArray(values) ? values : [ values ];
                                        _.each(values, function(value) {
                                            $("<input type='hidden' />").attr({ name : name }).val(value).appendTo($form);
                                        })
                                    })
                                    $dialog.modal('hide');
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
