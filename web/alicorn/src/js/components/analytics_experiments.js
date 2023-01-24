const isEnabled = true;
const profiles = {
  'www.hathitrust.org': {
    'ga4': 'G-88Z3DQ18W5',
    'matomo': '1',
    'matomo_container': 'JBgjlXyE'
  },
  'catalog.hathitrust.org': {
    'ga4': 'G-SRTQWPMGW8',
    'matomo': '2',
    'matomo_container': 'SnfE6ZC0'
  }
}

var HT = HT || {};
HT.analytics = HT.analytics || {}; 
HT.analytics.babel = {};

// hide most of these from the global namespace
HT.analytics.babel.get_report_href = function() {

  function de_semicolon(href) {
    if (href.indexOf(';') > -1) {
      href = href.replace(/;/g, "&");
    }
    return href;
  }

  function parse_babel_href(href) {
    let url = new URL(href);
    let params = new URLSearchParams(url.search);
    return [[url.pathname.replace('/cgi', '')], params];
  }

  // /mb/<id>
  function get_mb_report_href(href) {
    let [parts, params] = parse_babel_href(href);
    let action = params.get('a');
    parts.push(action);
    if (action == 'listcs') {
      parts.push(params.get('colltype'));
    } else if (action == 'listis') {
      parts.push(params.get('c'));
      parts.push(params.get('lmt') || 'all');
    }
    return parts.join('/');
  }

  function get_ls_report_href(href) {
    let [parts, params] = parse_babel_href(href);
    let new_params = new URLSearchParams();

    let action = params.get('a');
    
    if (params.get('c')) {
      parts.push('listis');
      parts.push(params.get('c'));
      parts.push(params.get('lmt') || 'all');
    } else {
      parts.push(action);
    }

    for (const key of params.keys()) {
      if ( key.match(/q[0-9]|field[0-9]|anyall[0-9]|op[0-9]|lmt/) ) {
        new_params.set(key, params.get(key));
      }
    }

    let qs = new_params.toString();
    return `${parts.join('/')}${qs ? '?' : ''}${qs}`;
  }

  // pt/<id>
  // pt/<id>/search
  function get_pt_report_href(href) {
    let [parts, params] = parse_babel_href(href);

    let new_params = new URLSearchParams();
    let id = params.get('id');

    parts.push(document.documentElement.dataset.contentProvider);
    parts.push(id);
    
    if (parts[0] == 'pt/search') {
      parts[0] = 'pt';
      parts.push('search');
      new_params.add('q1', params.get('q1'));
    } else {
      parts.push(params.get('view') || '1up');

      if (params.has('seq')) {
        new_params.set('seq', params.get('seq'));
      }
    }

    let qs = new_params.toString();
    return `${parts.join('/')}${qs ? '?' : ''}${qs}`;
  }

  let href = de_semicolon(location.href);
  if ( href.indexOf('/cgi/mb') > -1 ) {
    return get_mb_report_href(href);
  } else if ( href.indexOf('/cgi/ls') > -1 ) {
    return get_ls_report_href(href);
  } else if ( href.indexOf('/cgi/pt') > -1 ) {
    return get_pt_report_href(href);
  }
  return href; // punt
}

const add_ga4 = function(profileId) {
  // < !--Google tag(gtag.js)-- >
  // <script async src="https://www.googletagmanager.com/gtag/js?id=G-SRTQWPMGW8"></script>
  // <script>
  //   window.dataLayer = window.dataLayer || [];
  //   function gtag(){dataLayer.push(arguments);}
  //   gtag('js', new Date());

  //   gtag('config', 'G-SRTQWPMGW8');
  // </script>

  head.js(`https://www.googletagmanager.com/gtag/js?id=${profileId}`, function () {
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', profileId);
  })
}

const add_matomo = function(profileId) {
  var _paq = window._paq = window._paq || [];
  _paq.push(['trackPageView']);
  _paq.push(['enableLinkTracking']);
  (function () {
    var u = "//testing.matomo.hathitrust.org/";
    _paq.push(['setTrackerUrl', u + 'matomo.php']);
    _paq.push(['setSiteId', profileId]);
    var d = document, g = d.createElement('script'), s = d.getElementsByTagName('script')[0];
    g.async = true; g.src = u + 'matomo.js'; s.parentNode.insertBefore(g, s);
  })();
}

const add_matomo_tag = function(profileId) {
  var _mtm = window._mtm = window._mtm || [];
  var _paq = window._paq = window._paq || [];
  _mtm.push({ 'mtm.startTime': (new Date().getTime()), 'event': 'mtm.Start' });

  if ( location.host.indexOf('babel.') > -1 ) {
    // this is a babel app, change the URL
    _paq.push(['setCustomUrl', HT.analytics.babel.get_report_href()]);
  }

  var d = document, g = d.createElement('script'), s = d.getElementsByTagName('script')[0];
  g.async = true; g.src = `https://testing.matomo.hathitrust.org/js/container_${profileId}.js`; s.parentNode.insertBefore(g, s);  
}

head.ready(function () {

  const hostname = location.hostname;
  let profileId;

  if ( ! isEnabled ) { return; }

  let config;
  if ( hostname.indexOf('catalog.hathitrust.org') > -1 ) {
    config = profiles['catalog.hathitrust.org'];
  } else if (hostname.indexOf('babel.hathitrust.org') > -1) {
    config = profiles['catalog.hathitrust.org'];
  } else if ( hostname.indexOf('www.hathitrust.org') > -1 ) {
    config = profiles['www.hathitrust.org'];
  } else {
    return;
  }

  add_ga4(config.ga4);
  // add_matomo(config.matomo);
  add_matomo_tag(config.matomo_container);
});