var HT = HT || {};
head.ready(function() {

    var PING_URL; var PING_DOMAIN;

    PING_URL = location.protocol + '//' + HT.service_domain + '/cgi/ping';

    var is_babel = (window.location.href.indexOf("babel.hathitrust") > -1);
    var $button = $("#login-button,#login-link");

    var prefs = HT.prefs.get();

    var $block;
    var $dialog;

    function getWeek(date) {
        date.setHours(0, 0, 0, 0);
          // Thursday in current week decides the year.
          date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
          // January 4 is always in week 1.
          var week1 = new Date(date.getFullYear(), 0, 4);
          // Adjust to Thursday in week 1 and count number of weeks from date to week1.
          return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
                                - 3 + (week1.getDay() + 6) % 7) / 7);
    }

    function create_login_panel(args) {
        args = args || {};
        var status = HT.login_status;
        var block_html = 
            '<div class="login-panel modal micromodal-slide" tabindex="-1" aria-hidden="true" id="login-modal">' + 
                '<div class="modal__overlay" tabindex="-1" data-micromodal-close>' + 
                '<div class="modal__container compact" role="dialog" aria-modal="true" aria-labelledby="login-modal-title">' +
                '<div class="login-panel-arrow"></div>' +
                '<div class="modal__header"><h2 class="modal__title" id="login-modal-title">Login</h2><button class="modal__close" aria-label="Close" data-micromodal-close></button></div>' + 
                '<div class="modal__content" id="login-modal-content">' +
                    '<form method="POST">' + 
                        '<div class="headline">' + 
                            '<p>Find your partner institution:</p>' +
                        '</div>' +
                        '<div class="wayf-list">' + 
                            '<label for="idp" class="offscreen">Select your institution</label>' + 
                            '<select id="idp" name="idp"><option value="0" style="font-weight: bold">Choose your partner institution</option></select>' + 
                        '</div>' +
                        '<div class="actions">' + 
                            '<button class="button continue">Continue<span class="after icomoon icomoon-arrow-right" aria-hidden="true"></span></button>' +
                        '</div>' +
                        '<input type="hidden" name="target" value="" />' + 
                    '</form>' + 
                    '<p class="aup-notice">By logging into HathiTrust, you agree to follow our <a href="https://www.hathitrust.org/acceptable-use">Acceptable Use Policy</a>.</p>' + 
                '</div>' + 
                '<div class="modal__footer">' + 
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
                '</div>' + // modal__container
                '</div>' + // modal__overlay
            '</div>' ;

        $block = $(block_html.replace(/{WWW_DOMAIN}/g, HT.www_domain).replace(/{SERVICE_DOMAIN}/g, HT.service_domain));
        $dialog = $block.find(".modal__container");

        var $select = $dialog.find("select[name=idp]");

        var target = window.location.href;
        if ( target.indexOf("babel.hathitrust") < 0 ) {
            // not a babel app, need to route through ping/pong
            target = HT.get_pong_target(target);
        } else {
            target = target.replace("http://", "https://");
        }

        $dialog.find("input[name=target]").val(encodeURI(target));

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
        })


        $dialog.find("a[data-href=wayf]").attr("href", 'https://' + HT.service_domain + "/cgi/wayf?target=" + encodeURIComponent(target));

        var classes = 'login-modal';
        if ( args.classname ) {
            classes += ' ' + args.classname;
        }

        var $trigger = args.$trigger;
        // $block.insertAfter($trigger);
        $block.appendTo($("body"));
        HT.$block = $block;
        HT.$dialog = $dialog;
        HT.$button = $trigger;

        $dialog.find("button.continue").click(function(e) {
            e.preventDefault();
            var href = $select.val();
            if ( href == '0' ) { return ; }
            var sdrinst = $select.find("option:selected").data('sdrinst');
            HT.prefs.set({ sdrinst : sdrinst });
            href = href.replace('___TARGET___', encodeURIComponent(target));

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

        $dialog.on('keyup.dismiss.login', function(e) {
            if ( e.which == 27 ) {
                if ( $dialog.data('selecting') ) {
                    // NOOP
                    $dialog.data('selecting', false);
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
        $dialog.css({ position: position });
    }

    function setup_login_link(status) {
        if ( $("body").is(".no-login") ) {
            return;
        }

        $("a.trigger-login").each(function() {
            var target = $(this).attr("href");
            if ( ! target || target == '#' ) { target = window.location.href; }
            if ( target.indexOf("/cgi/wayf") < 0 ) {
                if ( ! HT.is_babel ) {
                    target = HT.get_pong_target(target);
                }
                var href = 'https://' + HT.service_domain + "/cgi/wayf?target=" + encodeURIComponent(target);
                $(this).attr('href', href);
            } else if ( target.indexOf('http://') > -1 ) {
                $(this).attr("href", target.replace('http://', 'https://'));
            }
        })

        create_login_panel({ $trigger: $button });
        $button.on('click', function(e) {
            // if ( $("html").is(".mobile") ) { return ; }
            if ( $(window).width() < 700 ) { return ; }
            e.preventDefault();
            console.log("AHOY LOGIN CLICK", $button.data('active'), e);
            if ( $button.data('active') ) {
                console.log("AHOY LOGIN OFF");
                hide_login_dialog({ $trigger: $(this) });
            } else {
                console.log("AHOY LOGIN ON");
                display_login_dialog({ $trigger: $(this) });
            }
        })

        var target = window.location.href;
        if ( target.indexOf("babel.hathitrust") < 0 ) {
            // not a babel app, need to route through ping/pong
            target = HT.get_pong_target(target);
        } else {
            target = target.replace("http://", "https://");
        }

        var login_href = 'https://' + HT.service_domain + "/cgi/wayf?target=" + encodeURIComponent(target);
        if ( status.expired ) {
            // var $alert = $('<div class="alert alert-block alert-warning alert-plain alert-banner"><a href="javascript:;" aria-label="Close banner" class="close" style="margin-right: 24px;"><i aria-hidden="true" class="icomoon icomoon-cancel"></i></a><p>You have been logged out. <a class="btn btn-default" data-action="login" data-close-target=".modal.login" href="#">Login</a></p></div>');
            // $alert.find("a[data-action='login']").attr("href", 'https://' + HT.service_domain + "/cgi/wayf?target=" + encodeURIComponent(window.location.href));
            // $alert.find("a.close").on('click', function() { $alert.hide(); });
            // // $alert.find("button").on('click', function() { $alert.hide(); });
            // var $target = $("#skiplinks");
            // if ( ! $target.length ) { $target = $("h1"); }
            // $alert.insertAfter($target);

            insert_banner('login-expired', '<p>You have been logged out. <a class="btn btn-default" data-action="login" data-close-target=".modal.login" href="' + login_href + '">Login</a></p>', true);
        }

        var last_provider = $.cookie('HTproviderName');
        if ( last_provider ) {
            // previous login
            if ( document.referrer == location.href ) {
                // var $navbar = $(".navbar-static-top");
                // var $alert = $('<div class="alert alert-block centered" style="border-radius: 0; width: auto; height: 45px;margin-left: auto; margin-right: auto; position: fixed; top: 0px; left: 0; right: 0; z-index: 1005; background: #ef7c22; border-color: #703608; color: white; text-shadow: none; font-size: 14px;"><p style="width: 900px; margin-left: auto; margin-right: auto; color: #000">You have been logged out of HathiTrust, but are still logged in to your provider ({LAST_PROVIDER}).&nbsp;<button type="button" class="close" style="opacity: 0.8"><span class="offscreen">Close</span><span aria-hidden="true">×</span></button></p></div>'.replace('{LAST_PROVIDER}', last_provider));
                // var margin_top = parseInt($("body").css("margin-top") || "0");
                // // $alert.find("a").attr("href", 'https://' + HT.service_domain + "/cgi/wayf?target=" + encodeURIComponent(window.location.href));
                // $alert.insertBefore(".navbar-static-top");
                // $navbar.css("top", 45);
                // $alert.find("button").on("click", function(e) {
                //     e.preventDefault();
                //     $alert.remove();
                //     $navbar.css('top', 0);
                //     $.removeCookie('HTproviderName', { domain: '.hathitrust.org', path: '/', secure: true });
                //     $("body").css("margin-top", margin_top);
                // })
                // $("body").css('margin-top', margin_top + 45);

                var callback = function() {
                    $.removeCookie('HTproviderName', { domain: '.hathitrust.org', path: '/', secure: true });
                }
                var message = `You have been logged out of HathiTrust, but are still logged in to your provider (${last_provider}).`;
                insert_banner('logged-out', `<p>${message} <a class="btn btn-default" data-action="login" data-close-target=".modal.login" href="${login_href}">Login</a></p>`, true, callback);
            }
            $.removeCookie('HTproviderName', { domain: '.hathitrust.org', path: '/', secure: true });
        }
    }

    function display_login_dialog(options) {

        var $trigger = options.$trigger;
        var top = $block.css('position') == 'fixed' ? $trigger.position().top : $trigger.offset().top;
        top = $trigger.position().top;
        top += $trigger.outerHeight() + ( 100 / 2 ); // 32;

        var left = $trigger.position().left - $dialog.width() + 150;
        // console.log("-- positioning", left, "<-", $trigger.position().left, $block.width(), "/", left, $dialog.get(0).getBoundingClientRect());
        var right = window.innerWidth - ( left + $dialog.width() );
        if (right < 0) {
            left += right;
        }

        $dialog.css({ top: top, left: left });

        var $caret = $dialog.find(".login-panel-arrow");
        $caret.css({ right: 25 });


        if ( $button.is(".button") ) {
            $button.addClass("active");
        } else {
            $button.parents("li").addClass("active");
        }
        $button.data('active', true);
        bootbox.show('login-modal', {
            onClose: function(modal) {
                remove_active_status();
                $button.data('active', false);
            }
        });
        // bootbox.dialog($block);
        // $block.modal({ backdrop: true, keyboard: false });
        // $block.on('hidden', function() {
        //     remove_active_status();
        //     $button.data('active', false);
        // })
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
            var $navbar = $("#person-nav");
            var fragment = document.createDocumentFragment();
            var coll_url = 'https://' + HT.service_domain + '/cgi/mb?colltype=my-collections';
            var html = 
                '<ul id="person-nav" class="nav pull-right">' + 
                    '<li><span>' + status.affiliation + ' (' + status.providerName + ')</span></li>' + 
                    '<li><a href="' + coll_url + '">My Collections</a></li>' + 
                    '<li><a class="logout-link" href="https://{SERVICE_DOMAIN}/cgi/logout?'.replace('{SERVICE_DOMAIN}', HT.service_domain) + window.location.href + '">Log out</a></li>' + 
                '</ul>';

            $(fragment).append('<li><span>' + status.affiliation + '</span></li>');
            $(fragment).append('<li><a href="' + coll_url + '">My Collections</a></li>');
            $(fragment).append('<li><a class="logout-link" href="https://{SERVICE_DOMAIN}/cgi/logout?'.replace('{SERVICE_DOMAIN}', HT.service_domain) + window.location.href + '">Log out</a></li>');
            // $(html).appendTo($navbar);
            $navbar.find("#login-link").parent().remove();
            $navbar.append(fragment);

            // var $footer = $(".navbar.footer .navbar-inner");
            // html = 
            //     '<ul class="nav">' + 
            //         '<li><span>' + status.affiliation + '<br />Member, HathiTrust</span></li>' + 
            //     '</ul>';
            // $(html).prependTo($footer);
        }
        var $logout_link = $(".logout-link,#logout-link");
        $logout_link.attr('href', 'https://{SERVICE_DOMAIN}/cgi/logout?'.replace('{SERVICE_DOMAIN}', HT.service_domain) + encodeURIComponent(window.location.href))
        $("html").trigger("action.login");

        if ( status.r ) {
            // what is happening?
            var switchableRoles = [ 'enhancedTextProxy', 'totalAccess' ];
            var switchableRolesLabels = {};
            switchableRolesLabels['enhancedTextProxy'] = 'ATRS';
            switchableRolesLabels['totalAccess'] = 'Admin';
        
            var $check = $("a.action-switch-role");
            if ( $check.length == 0 ) {
                for(var i = 0; i < switchableRoles.length; i++) {
                    var switchableRole = switchableRoles[i];
                    if ( status.r.hasOwnProperty(switchableRole) ) {
                        var $li = $("#person-nav li.item-vanishing");
                        $li.removeClass('item-vanishing').addClass('x--of-for-narrowest');
                        var $e = $li.find("span");
                        var link_text = 'Member ⚡';
                        if ( status.r[switchableRole] ) {
                            // the role is active
                            link_text =
                              switchableRolesLabels[switchableRole] + " ⚡";
                            document.documentElement.dataset.activated = switchableRole;
                        }
                        $e = $e.replaceWith(`<a class="action-switch-role" href=\"https://${HT.service_domain}/cgi/ping/switch?target=${encodeURIComponent(location.href)}\">${link_text}</a>`);
                    }
                }
            }
        }

        // hey do I have the AUP-checked cookie?
        insert_banner(
            'aup-alert-form', 
            '<p>By logging into HathiTrust, you agree to follow our <a href="https://www.hathitrust.org/acceptable-use">Acceptable Use Policy.</a></p>',
            null, null,
            '<button class="btn" data-action="close">OK</button>'
        );

        // insert_banner('usability-study-2019', '<p>Want to help improve our site? <a href="http://eepurl.com/gbk5Jb" target="_blank">Sign up for more information.</a></p>');
        // if ( location.pathname.indexOf('/cgi/pt') > -1 && status && status.affiliation.match(/Member|Faculty|Staff|Student|Employee|Alum/) ) {
        //     var possible_links = [];
        //     possible_links.push('https://t.maze.design/17978544');
        //     possible_links.push('https://t.maze.design/18239317');
        //     var date = new Date;
        //     var day = date.getDay();
        //     var week = getWeek(date);
        //     var link;
        //     if ( location.href.indexOf("debug=cta") > -1 || ( day >= 2 && day <= 6) ) {
        //         var idx = ( day == 6 ) ? 1 : ( day % 2 ); // Saturday acts like Friday
        //         if ( week % 2 == 0 ) { idx = ( ( day + 1 ) % 2 ); }
        //         link = possible_links[idx];
        //         insert_banner('usability-study-2020', `<p style="text-align: left">Help us improve our website! We're making changes to our download feature and would love to hear from you. Would you be willing to take a 10 minute survey? <a style="font-weight: bold" href="${link}" target="_blank">Yes, I want to help</a></p>`);
        //     }
        // }
    }

    function insert_banner(id, html, timestamped, callback, action) {

        if ( head.mobile ) { return ; }

        if ( $(".alert-banner").length ) {
            // already have a banner, so don't do this one
            return;
        }

        var xtracking;

        var xupdate = function(id) {
            xtracking[id] = true;
            var expires = new Date();
            expires.setDate(expires.getDate() + 90);
            docCookies.setItem('HT.x', JSON.stringify(xtracking), expires, '/', '.hathitrust.org', true);
        }

        try {
            xtracking = JSON.parse(docCookies.getItem('HT.x') || '{}');
        } catch (e) {
            // just null the prefs
            docCookies.removeItem("HT.x");
            xtracking = {};
        }

        if ( ! timestamped ) {
            // get any pre-existing localStorage value
            var check = xtracking[id] || localStorage.getItem('x:' + id);
            if ( check ) { return; }
        }

        var banner_html = '<div class="alert alert-block alert-banner"><a href="javascript:;" aria-label="Close banner" class="close" style="margin-right: 24px;"><i aria-hidden="true" class="icomoon icomoon-cancel"></i></a>' + html + '</div>';
        if ( action ) {
            banner_html = '<div class="alert alert-block alert-banner"><div>' + html + '</div>' + action +  '</div>';
        }
        var $banner = $(banner_html);
        $banner.attr('id', id);
        var $target = $("#skiplinks");
        if ( ! $target.length ) { $target = $("h1"); }
        $banner.insertAfter($target);

        $banner.find("a[target]").on('click', function(event) {
            $banner.remove();
            if ( ! timestamped ) {
                // localStorage.setItem('x:' + id, 'true');
                xupdate(id);
            }
            if (callback) {
                callback();
            }
        });

        $banner.find("a.close,[data-action='close']").on('click', function(event) {
            event.preventDefault();
            $banner.remove();
            if ( callback ) {
                callback();
            }
            if ( ! timestamped ) {
                // localStorage.setItem('x:' + id, 'true');
                xupdate(id);
            }
        });

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

        console.log("AHOY LOGIN STATUS", status);

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

        $("html").trigger('ht:login');

        if (false && location.hostname.indexOf('www.hathitrust.org') > -1 && sessionStorage.getItem('website-survey') != 'true') {
            insert_banner('website-survey', '<p>Would you help us improve the HathiTrust website? <a xclass="btn btn-default" data-close-target=".modal.login" target="_blank" style="font-weight: bold" href="https://www.surveymonkey.com/r/2MV55VY">Take this survey!</a></p>', true, function() {
                sessionStorage.setItem('website-survey', true);
            });
        }
    }

    if ( HT.login_status ) {
        // we already have the status
        console.log("AHOY have status", HT.login_status.logged_in);
        setTimeout(() => {
            HT.login_callback(HT.login_status);
        }, 0);
    } else {
        var args = {};
        if (document.referrer) {
            args.ref = document.referrer;
        }
        $.ajax({
            type: "GET",
            url: PING_URL,
            data: args,
            async: true,
            jsonp: 'callback',
            dataType: 'jsonp',
            jsonpCallback: 'HT.login_callback'
        })
    }

    // $("body").on('click', '.trigger-login', function(e) {
    //     e.preventDefault();
    //     bootbox.hideAll();
    //     display_login_dialog({ $target: $(this), classname: 'login-centered' })
    // })

});
