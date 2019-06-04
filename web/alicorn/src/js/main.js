if ( window.console === undefined ) {
    window.console = {
        log : function() { }
    }
}

// IE11 POLYFILL
if (!Element.prototype.matches) {
  Element.prototype.matches = Element.prototype.msMatchesSelector || 
                              Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
  Element.prototype.closest = function(s) {
    var el = this;

    do {
      if (el.matches(s)) return el;
      el = el.parentElement || el.parentNode;
    } while (el !== null && el.nodeType === 1);
    return null;
  };
}

var HT = HT || {};

(function() {
    var prefix = '/';

    if ( window.jQuery ) {
        window.old_jQuery = window.jQuery;
    }

    HT.service_domain = 'babel.hathitrust.org';
    HT.catalog_domain = 'catalog.hathitrust.org';

    // figure out if we're in dev or not
    var hostname = location.hostname;
    HT.is_dev = ( hostname != 'www.hathitrust.org' ) && ( hostname != 'catalog.hathitrust.org' ) && ( hostname != 'babel.hathitrust.org' );

    // are we babel or not?
    HT.is_babel = ( hostname.indexOf("babel.hathitrust.org") > -1 );

    if ( HT.is_dev ) {
        var prefix = hostname.split(".")[0];
        if ( prefix == 'mrnibbs' ) {
            HT.service_domain = hostname;
            HT.catalog_domain = hostname;
            HT.www_domain = hostname;
            // HT.www_domain = 'test.www.hathitrusg.org';
        } else {
            // make this more robust later
            var babel_prefix = prefix;
            if ( hostname == 'test.www.hathitrust.org' ) {
                babel_prefix = 'beta-3';
                prefix = 'beta-3';
            }
            if ( babel_prefix != 'test' && ! babel_prefix.match('beta-') && ! babel_prefix.match('-full') ) { babel_prefix += '-full'; }
            if ( prefix.match('-full') ) { prefix = prefix.replace('-full', ''); }
            HT.service_domain = babel_prefix + '.babel.hathitrust.org';
            HT.catalog_domain = prefix + '.catalog.hathitrust.org';
            HT.www_domain = prefix + '.www.hathitrust.org';
        }
    }

    // // service_url is either the babel dev, beta-3, or babel
    // HT.service_domain = ( HT.is_babel ? hostname : ( HT.is_dev ? 'test.babel.hathitrust.org' : 'babel.hathitrust.org' ) );
    // if ( hostname.indexOf('beta-3') > -1 ) {
    //     HT.service_domain = 'beta-3.babel.hathitrust.org';
    // }
    // HT.www_domain = ( HT.is_dev ? 'test.www.hathitrust.org' : 'www.hathitrust.org' );
    // HT.catalog_domain = ( HT.is_dev ? 'test.catalog.hathitrust.org' : 'catalog.hathitrust.org' );

    HT.prefs = {};
    HT.prefs.get = function() { 
        var prefs = {};
        try {
            prefs = $.cookie('HT.prefs', undefined, { json : true }) || {};
        } catch (e) {
            // just null the prefs
            $.removeCookie("HT.prefs");
            prefs = {};
        }
        return prefs;
    };

    HT.prefs.set = function(params) {
        var prefs = HT.prefs.get();
        prefs = $.extend({}, prefs, params);
        try {
            $.cookie('HT.prefs', prefs, { json : true, domain : '.hathitrust.org', path : '/', expires : 90 });
        } catch (e) {
            // noop
        }
    };

    HT.scripts = [];
    HT.scripts.push(function() {
        // console.log("PLACEHOLDERS UPDATED");
        // $(":input[placeholder]").placeholder();

        var $li;
        $li = $("a:contains('Our Collaborative Programs')").parent();
        if ( $li.size() == 0 ) {
            $li = $("a:contains('Our Digital Library')").parent();
            $li.after('<li><a href="https://www.hathitrust.org/collaborative-programs">Our Collaborative Programs</a></li>');
        }
    });

    var $status = $("div[role=status]");

    var lastMessage; var lastTimer;
    HT.update_status = function(message) {
        if ( ! $status.length ) { return ; }
        if ( lastMessage != message ) {
          if ( lastTimer ) { clearTimeout(lastTimer); lastTimer = null; }

          setTimeout(() => {
            $status.text(message);
            lastMessage = message;
            console.log("-- status:", message);
          }, 50);
          lastTimer = setTimeout(() => {
            $status.get(0).innerText = '';
          }, 500);

        }
    }

    head.js.apply(this, HT.scripts);

})();
