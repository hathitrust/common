const isEnabled = true;
const profiles = {
  'www.hathitrust.org': {
    'ga4': 'G-88Z3DQ18W5',
    'matomo': '1'
  },
  'catalog.hathitrust.org': {
    'ga4': 'G-SRTQWPMGW8',
    'matomo': '2'
  }
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

head.ready(function () {

  const hostname = location.hostname;
  let profileId;

  if ( ! isEnabled ) { return; }

  let config;
  if ( hostname.indexOf('catalog.hathitrust.org') > 1 ) {
    config = profiles['catalog.hathitrust.org'];
  } else if ( hostname.indexOf('www.hathitrust.org') > -1 ) {
    config = profiles['www.hathitrust.org'];
  } else {
    return;
  }

  add_ga4(config.ga4);
  add_matomo(config.matomo);
});