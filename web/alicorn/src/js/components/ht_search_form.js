head.ready(function() {

  var $form = $("#ht-search-form");
  if ( ! $form.length ) { return ; }

  var is_search_app = $("html").data('use') == 'search';
  var inited = false;

  var $input = $form.find("input.search-input-text");
  var $input_label = $form.find("label[for='q1-input']");
  var $select = $form.find(".control-searchtype");
  var $search_target = $form.find(".search-target");
  var $ft = $form.find("span.funky-full-view");

  var $ft_check = $("html").data('ft');

  var _setup = {};
  _setup.ls = function() {
      $select.hide();
      $input.attr('placeholder', 'Search words about or within the items');
      $input_label.text('Search full-text index');
      if ( inited ) {
        HT.update_status("Search will use the full-text index.");
      }
  }

  _setup.catalog = function() {
      $select.show();
      $input.attr('placeholder', 'Search words about the items');
      $input_label.text('Search catalog index');
      if ( inited ) {
        HT.update_status("Search will use the catalog index; use Shift + Tab to limit your search to a selection of fields.");
      }
  }

  var target = $search_target.find("input:checked").val();
  _setup[target]();
  inited = true;

  var prefs = HT.prefs.get();
  if ( $ft == null && ! is_search_app && prefs.search && prefs.search.ft ) {
    console.log("AHOY AHOY SEARCH FORM");
      $("input[name=ft]").attr('checked', 'checked');
  }

  $search_target.on('change', 'input[type="radio"]', function(e) {
      var target = this.value;
      _setup[target]();
      HT.analytics.trackEvent({ label : "-", category : "HT Search", action : target });
  })

  // add event handler for submit to check for empty query or asterisk
  $form.submit(function(event)
       {


          if ( ! this.checkValidity() ) {
              this.reportValidity();
              return false;
          }

         //check for blank or single asterisk
         var $input = $(this).find("input[name=q1]");
         var query = $input.val();
         query = $.trim(query);
         if (query === '')
         {
           alert("Please enter a search term.");
           $input.trigger('blur');
           return false;
         }
         // // *  Bill says go ahead and forward a query with an asterisk   ######
         // else if (query === '*')
         // {
         //   // change q1 to blank
         //   $("#q1-input").val("")
         //   $(".search-form").submit();
         // }
         // ##################################################################*
         else
         {

          // save last settings
          var searchtype = ( target == 'ls' ) ? 'all' : $select.find("select").val();
          HT.prefs.set({ search : { ft : $("input[name=ft]:checked").length > 0, target : target, searchtype: searchtype }})

          return true;
         }

   } );

})
