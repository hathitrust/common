var HT = HT || {};
head.ready(function() {

    var PING_URL; var PING_DOMAIN;

    PING_URL = 'https://' + HT.service_domain + '/cgi/ping';

    var is_babel = (window.location.href.indexOf("babel.hathitrust") > -1);
    var $button = $("#login-button,#login-link");

    var prefs = HT.prefs.get();

    var $block;

    function create_login_panel(args) {
        args = args || {};
        var status = HT.login_status;
        var block_html = 
            '<div class="login-panel modal hide" tabindex="-1">' + 
                '<div class="login-panel-arrow"></div>' +
                '<div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button></div>' + 
                '<div class="modal-body">' +
                    '<form method="POST">' + 
                        '<div class="headline">' + 
                            '<p>Find your partner institution:</p>' +
                        '</div>' +
                        '<div class="wayf-list">' + 
                            '<label for="idp" class="offscreen">Select your institution</label>' + 
                            '<select id="idp" name="idp"><option value="0" style="font-weight: bold">Choose your partner institution</option></select>' + 
                        '</div>' +
                        '<div class="actions">' + 
                            '<button class="btn btn-link btn-cancel" style="display: none">Cancel</button>' + 
                            '<button class="button continue">Continue</button>' +
                        '</div>' +
                        '<input type="hidden" name="target" value="" />' + 
                    '</form>' + 
                '</div>' + 
                '<div class="modal-footer">' + 
                    '<div class="questions">' + 
                        '<p><a href="https://{WWW_DOMAIN}/help_digital_library#LoginNotListed">Why isn\'t my institution listed?</a></p>' + 
                    '</div>' +
                    '<div class="questions">' +
                        '<p>' +
                            '<span style="font-weight: bold">Not with a partner institution?</span><br />' +
                            '<a href="https://{SERVICE_DOMAIN}/cgi/wayf" data-href="wayf">See options to log in as a guest</a><br />' + // &#x27a4;
                        '</p>' +
                    '</div>' +
                '</div>' + 
            '</div>';

        $block = $(block_html.replace(/{WWW_DOMAIN}/g, HT.www_domain).replace(/{SERVICE_DOMAIN}/g, HT.service_domain));

        var $select = $block.find("select[name=idp]");

        var target = window.location.href;
        if ( target.indexOf("babel.hathitrust") < 0 ) {
            // not a babel app, need to route through ping/pong
            target = HT.get_pong_target(target);
        } else {
            target = target.replace("http://", "https://");
        }

        $block.find("input[name=target]").val(encodeURI(target));

        // find the default sdrinst first
        var selected_sdrinst = prefs.sdrinst;
        var default_sdrinst;
        var found_sdrinst = false;

        $.each(status.idp_list, function() {
            if ( this.selected ) { 
                default_sdrinst = this.sdrinst;
            }
            if ( this.sdrinst == selected_sdrinst ) {
                found_sdrinst = true;
            }
        })
        if ( ! found_sdrinst && selected_sdrinst != 'umich.dev' ) {
            selected_sdrinst = default_sdrinst;
        }

        var friend_login_link;
        $.each(status.idp_list, function() {

            //var $option = $("<option></option>").appendTo($select);
            var $option = $("<option></option>");
            $option.val(this.idp_url).data('sdrinst', this.sdrinst);
            var name = this.name.replace("&amp;", "&");
            if ( this.enabled == 1 ) {
                $option.text(name);
            } else if ( this.enabled == 0 ) {
                if ( HT.is_dev ) {
                    $option.text(name + " DEV");
                } else {
                    return;
                }
            } else if ( this.enabled == 2 ) {
                return;
            }
            $option.appendTo($select);

            // if ( this.selected ) { default_sdrinst = this.sdrinst; }
            if ( this.sdrinst == selected_sdrinst ) {
                $option.attr("selected", "selected");
            }

            if ( HT.is_cosign_active && this.sdrinst == 'umich' && ( HT.is_dev || window.location.hash == '#shibboleth' ) ) {
                $option = $("<option></option>").appendTo($select);
                $option.val('https://test.babel.hathitrust.org/Shibboleth.sso/' + this.sdrinst + '?target=___TARGET___');
                $option.text(this.name + ' DEV');
                $option.data('sdrinst', 'umich.dev');
                if ( selected_sdrinst == 'umich.dev' ) {
                    $option.attr("selected", "selected");
                }
            }

            if ( this.sdrinst == 'umich' ) {
                friend_login_link = this.idp_url.replace('&amp;', '&');
            }
        })

        // update the friend account link to be the UM link (for now)
        var $friend_link = $block.find("#friend-login-link");
        $friend_link.attr("href", friend_login_link.replace('___TARGET___', target).replace('&amp;', '&').replace(/\$/, '%24'));

        $block.find("a[data-href=wayf]").attr("href", 'https://' + HT.service_domain + "/cgi/wayf?target=" + encodeURIComponent(target));

        var classes = 'login-modal';
        if ( args.classname ) {
            classes += ' ' + args.classname;
        }

        var $trigger = args.$trigger;
        // $block.insertAfter($trigger);
        $block.appendTo($("body"));
        HT.$block = $block;
        HT.$button = $trigger;

        $block.find("button.continue").click(function(e) {
            e.preventDefault();
            var href = $select.val();
            if ( href == '0' ) { return ; }
            var sdrinst = $select.find("option:selected").data('sdrinst');
            HT.prefs.set({ sdrinst : sdrinst });
            if ( sdrinst == 'umich' && HT.is_cosign_active ) {
                href = href.replace('___TARGET___', target).replace('&amp;', '&').replace(/\$/, '%24');
            } else {
                href = href.replace('___TARGET___', encodeURIComponent(target));
            }

            setTimeout(function() {
                window.location.href = href;
            }, 500);

            // track a fake pageview to the wayf
            HT.analytics.trackPageview("/cgi/wayf?via=" + sdrinst + "&target=" + target);
        });

        $select.select2({
            dropdownParent: $block,
            allowCear: true,
            width: '100%'
        });

        $select.on('select2:open', function() {
            $block.data('selecting', true);
        })

        $select.on('select2:close', function() {
        })

        $block.on('keyup.dismiss.login', function(e) {
            if ( e.which == 27 ) {
                if ( $block.data('selecting') ) {
                    // NOOP
                    $block.data('selecting', false);
                } else {
                    hide_login_dialog();
                }
            }
        })

        // is $button fixed or static?
        var position = 'absolute';
        $button.parents().each(function() {
            var s = window.getComputedStyle(this);
            if ( s.position == 'fixed' ) {
                position = 'fixed';
            }
        })
        console.log("AHOY POSITION", position);
        $block.css({ position: position });
    }

    function setup_login_link(status) {
        if ( $("body").is(".no-login") ) {
            return;
        }

        $("a.trigger-login").each(function() {
            var target = $(this).attr("href") || window.location.href;
            if ( target.indexOf("/cgi/wayf") < 0 ) {
                var href = 'https://' + HT.service_domain + "/cgi/wayf?target=" + encodeURIComponent(target);
                $(this).attr('href', href);
            } else if ( target.indexOf('http://') > -1 ) {
                $(this).attr("href", target.replace('http://', 'https://'));
            }
        })

        create_login_panel({ $trigger: $button });
        $button.on('click', function(e) {
            e.preventDefault();
            console.log("AHOY LOGIN CLICK", $button.data('active'), e);
            if ( $button.data('active') ) {
                console.log("AHOY LOGIN OFF");
                hide_login_dialog({ $trigger: $button });
            } else {
                console.log("AHOY LOGIN ON");
                display_login_dialog({ $trigger: $button });
            }
        })

        if ( status.expired ) {
            //var $alert = $('<div class="container centered clearfix"><div class="row"><div class="span8 push2"><div class="alert alert-block alert-error centered"><p>Your login session has expired.</p></div></div></div></div>');
            var $alert = $('<div class="alert alert-block alert-warning centered" style="width: auto; margin-left: auto; margin-right: auto; position: fixed; top: 42px; right: 0; z-index: 1005; background: #ef7c22; border-color: #703608; color: white; text-shadow: none; font-size: 14px;"><p>You have been logged out. <a class="btn btn-default" data-close-target=".modal.login" href="#">Login</a><button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button></p></div>');
            $alert.find("a").attr("href", 'https://' + HT.service_domain + "/cgi/wayf?target=" + encodeURIComponent(window.location.href));
            $alert.find("button").on('click', function() { $alert.hide(); });
            $alert.insertBefore(".navbar-static-top");
        }

        var last_provider = $.cookie('HTproviderName');
        if ( last_provider ) {
            // previous login
            if ( document.referrer == location.href ) {
                var $navbar = $(".navbar-static-top");
                var $alert = $('<div class="alert alert-block centered" style="border-radius: 0; width: auto; height: 45px;margin-left: auto; margin-right: auto; position: fixed; top: 0px; left: 0; right: 0; z-index: 1005; background: #ef7c22; border-color: #703608; color: white; text-shadow: none; font-size: 14px;"><p style="width: 900px; margin-left: auto; margin-right: auto">You have been logged out of HathiTrust, but are still logged in to your provider ({LAST_PROVIDER}).&nbsp;<button type="button" class="close" style="opacity: 0.8"><span class="offscreen">Close</span><span aria-hidden="true">×</span></button></p></div>'.replace('{LAST_PROVIDER}', last_provider));
                var margin_top = parseInt($("body").css("margin-top") || "0");
                // $alert.find("a").attr("href", 'https://' + HT.service_domain + "/cgi/wayf?target=" + encodeURIComponent(window.location.href));
                $alert.insertBefore(".navbar-static-top");
                $navbar.css("top", 45);
                $alert.find("button").on("click", function(e) {
                    e.preventDefault();
                    $alert.remove();
                    $navbar.css('top', 0);
                    $.removeCookie('HTproviderName', { domain: '.hathitrust.org', path: '/', secure: true });
                    $("body").css("margin-top", margin_top);
                })
                $("body").css('margin-top', margin_top + 45);
            }
            $.removeCookie('HTproviderName', { domain: '.hathitrust.org', path: '/', secure: true });
        }
    }

    function display_login_dialog(options) {

        var top = $block.css('position') == 'fixed' ? $button.position().top : $button.offset().top;
        top += $button.height() + 10;
        // var right = $(window).width() - ( $button.offset().left + $button.outerWidth() );
        var right = $(window).width() - ( $button.offset().left + ( $button.outerWidth() / 2 ) ) - ( 25 + 10 );
        console.log("AHOY SETTING POSITION", top, "x", right);
        $block.css({ top: top, right: right });
        var $caret = $block.find(".login-panel-arrow");
        $caret.css({ right: 25 });

        if ( $button.is(".button") ) {
            $button.addClass("active");
        } else {
            $button.parents("li").addClass("active");
        }
        $button.data('active', true);
        $block.modal({ backdrop: true, keyboard: false });
        $block.on('hidden', function() {
            remove_active_status();
            $button.data('active', false);
        })
    }

    function hide_login_dialog(options) {
        // $block.addClass("hidden");
        setTimeout(function() {
            $block.modal('hide');
            // remove_active_status();
            console.log("AHOY MODAL SHOULD BE OFF?", $button.data('active'));
        }, 0);
    }

    function remove_active_status() {
        if ( $button.is(".button") ) {
            $button.removeClass("active");
        } else {
            $button.parents("li").removeClass("active");
        }
        $button.data('active', false);
    }

    function setup_logged_in_state(status) {
        if ( $button.length ) {
            // rewrite the header so we appear to be logged in!
            $button.remove();
            var $navbar = $(".navbar-static-top .navbar-inner");
            var coll_url = 'https://babel.hathitrust.org/cgi/mb?colltype=priv';
            var html = 
                '<ul id="person-nav" class="nav pull-right">' + 
                    '<li><span>' + status.affiliation + ' (' + status.providerName + ')</span></li>' + 
                    '<li><a href="' + coll_url + '">My Collections</a></li>' + 
                    '<li><a id="logout-link" href="https://{SERVICE_DOMAIN}/cgi/logout?'.replace('{SERVICE_DOMAIN}', HT.service_domain) + window.location.href + '">Logout</a></li>' + 
                '</ul>';
            $(html).appendTo($navbar);

            var $footer = $(".navbar.footer .navbar-inner");
            html = 
                '<ul class="nav">' + 
                    '<li><span>' + status.affiliation + '<br />Member, HathiTrust</span></li>' + 
                '</ul>';
            $(html).prependTo($footer);
        }
        var $logout_link = $("#logout-link");
        $logout_link.attr('href', 'https://{SERVICE_DOMAIN}/cgi/logout?'.replace('{SERVICE_DOMAIN}', HT.service_domain) + encodeURIComponent(window.location.href))
        if ( 0 && status.authType == 'shibboleth' ) {
            $logout_link.click(function(e) {
                e.preventDefault();
                console.log($.removeCookie('MDPsid', { domain: '.hathitrust.org', path: '/' }));
                console.log($.removeCookie('_saml_idp', { domain: '.hathitrust.org', path: '/', secure: true }));
                var shib_cookie = document.cookie.match(/.*(_shibsession_\w+)=/);
                if ( shib_cookie ) {
                    shib_cookie = shib_cookie[1];
                    console.log("AHOY REMOVING", shib_cookie);
                    console.log($.removeCookie(shib_cookie, { domain: '.hathitrust.org', path: '/', scure: true }));
                }
                setTimeout(function() {
                    // window.location.href = location.href;
                    location.reload(true);
                }, 0);
                // bootbox.alert("<p>Please quit your browser to logout.</p>");
                return false;
            })
        }
        $("html").trigger("action.login");

        // rewrite /cgi/ links to /shcgi/ as needed
        if ( status.authType == 'shibboleth' && HT.is_cosign_active && window.location.href.indexOf('/shcgi/') > -1 ) {
            $("a[href*='/cgi/']").map(function() {
                var $this = $(this);
                $this.attr("href", $this.attr("href").replace("/cgi/", "/shcgi/").replace("http://", "https://"));
            })

            // check the action
            var $form = $("#search form, .search-form form");
            if ( $form.length ) {
                var action = $form.attr("action");
                $form.attr("action", action.replace("/cgi/", "/shcgi/").replace("http://", "https://"));
            }

        }
    }

    function track_event(status) {
        var action = "visitor";
        var label = "visitor";
        if ( status.logged_in ) {
            // action = "member";
            // label = status.authType;
            // if ( status.authType == 'cosign' && status.displayName.indexOf('@') > -1 ) {
            //     label = 'friend';
            // }
            label = status.institutionCode;
            action = status.affiliation.toLowerCase();
            if ( status.mappedInstitutionCode ) {
                label = status.mappedInstitutionCode + "/" + label;
            }
        }
        HT.analytics.trackEvent({ category : "userType", action : action, label : label });
    }

    HT.login_callback = function(status) {

        if ( status.logged_in ) {
            setup_logged_in_state(status);
        } else {
            setup_login_link(status);
        }
        track_event(status);
        
        HT.analytics.waiting.login = false;
        HT.analytics.deQ();
        // track the current page view
        if ( ! $("html").data('analytics-skip') ) {
            HT.analytics.trackPageview(HT.analytics.getPageHref());
        }
    }

    var args = {};
    if ( document.referrer ) {
        args.ref = document.referrer;
    }
    $.ajax({
        type : "GET",
        url : PING_URL,
        data: args,
        async : true,
        jsonp : 'callback',
        dataType : 'jsonp',
        jsonpCallback : 'HT.login_callback'
    })

    // $("body").on('click', '.trigger-login', function(e) {
    //     e.preventDefault();
    //     bootbox.hideAll();
    //     display_login_dialog({ $target: $(this), classname: 'login-centered' })
    // })


});
