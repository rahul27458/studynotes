
/**
 * Cache DOM element references that are used in DOM events that get triggered
 * frequently (e.g. scroll, resize)
 */
var $browse = $('.browse')
  , $coursesButton = $('.header .courses')
  , $headerLeft = $('.header .left')
  , $headerRight = $('.header .right')
  , $search = $('.header .search')
  , $searchAndAutocomplete = $('.header .search, .header .autocomplete')
  , $html = $('html')
  , $window = $(window)
  , $searchInput = $('.header .search input')
  , $headerAutocomplete = $('.header .autocomplete')
  , $content = $('.content')
  , $contentToolbar = $('.content .toolbar')


/**
 * Disable caching of jQuery AJAX responses
 * (workaround for callbacks not firing if the response was cached)
 */
$.ajaxSetup ({
    cache: false
})


/**
 * Set search bar's width so it fills the header correctly.
 * (Need to ensure this gets called after Typekit fonts are loaded.)
 */
function updateSearchWidth() {
  var headerLeftWidth = $headerLeft.width()
    , headerRightWidth = $headerRight.width()
  $searchAndAutocomplete
  .css({
    'margin-left': headerLeftWidth,
    'margin-right': headerRightWidth
  })

  $search.removeClass('off')

  /**
   * Continue to set the width every 100ms until fonts are done loading.
   * 
   * (If fonts don't load, then wf-loading gets removed automatically
   * after 1000ms, so this won't run forever.)
   */
  if ($html.hasClass('wf-loading')) {
    setTimeout(updateSearchWidth, 100)
  }
}


/**
 * Show or hide the browse menu.
 */
function toggleBrowseMenu(_switch) {
  $browse.toggleClass('on', _switch)
  $coursesButton.toggleClass('on', _switch)
}


/**
 * Loads the Facebook SDK asynchronously. Calls `window.fbAsyncInit` when done loading.
 */
function loadFacebookSDK() {
  (function(d){
     var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0]
     if (d.getElementById(id)) {return}
     js = d.createElement('script'); js.id = id; js.async = true
     js.src = "//connect.facebook.net/en_US/all.js"
     ref.parentNode.insertBefore(js, ref)
   }(document))
}


/**
 * Executed when the Facebook SDK is ready.
 */
window.fbAsyncInit = function() {
  // init the FB JS SDK
  FB.init({
    appId      : '466476846723021', // App ID from the App Dashboard
    channelUrl : '//www.apstudynotes.org/channel.html', // Channel File for x-domain communication
    status     : true, // check the login status upon init?
    cookie     : true, // set sessions cookies to allow your server to access the session?
    xfbml      : true  // parse XFBML tags on this page?
  });

  // Additional initialization code such as adding Event Listeners goes here

};


/**
 * Executed when `document` is ready.
 */
$(function() {

  updateSearchWidth()

  loadFacebookSDK()

  /**
   * Make external links open in new window
   */
  $("a[href^='http:'], a[href^='https:']")
    .not("[href*='www.apstudynotes.org']")
    .attr('target','_blank')

  /**
   * Browse menu dropdown
   */
  $('.header .courses').on('click', function (e){
    // Only handle left-clicks
    if (e.which != 1) return
    
    toggleBrowseMenu()
    e.preventDefault()
  })

  /**
   * Close browse menu on search focus
   */
  $search.on('focusin', function (e){
    toggleBrowseMenu(false)
  })

  /**
   * Browser resize event
   */
  var contentToolbarTop
    , contentWidth
  $window.on('resize', _.throttle(function (){
    $contentToolbar.removeClass('sticky')
    contentToolbarTop = $contentToolbar.length
      ? $contentToolbar.offset().top
      : null
    contentWidth = $content.width()

    $window.trigger('scroll')
  }, 100))
  $window.trigger('resize')

  /**
   * Browser scroll event
   */
  $window.on('scroll', _.throttle(function (){
    // Close browse menu on page scroll
    toggleBrowseMenu(false)

    // Hide autocomplete dropdown
    $search.removeClass('searching')
    $headerAutocomplete.addClass('off')
    setAutocompletePosition(0)

    if (contentToolbarTop) {
      var scrollTop = $window.scrollTop() // current vertical position from the top
      
      if (scrollTop > contentToolbarTop) { 
        $contentToolbar
          .addClass('sticky')
          .css({width: contentWidth})
      } else {
        $contentToolbar
          .removeClass('sticky')
          .css({width: ''})
      }
    }

  }, 100))


  /**
   * Autocomplete
   */
  var lastAutocompleteTime = +(new Date)
    , lastAutocompleteQuery
    , autocompletePosition = 0 // 0 means nothing is selected, 1 is the first result


  /**
   * Set the selected result in the autocomplete view to the item at `position`.
   *
   * @param {Number} position index (0 = nothing selected, 1 = first result, etc.)
   */
  
  var setAutocompletePosition = function (position){
    autocompletePosition = _.isNaN(position)
      ? 1
      : position

    var $results = $('.header .autocomplete .result')
      , len = $results.length

    // Handle numbers that are negative or too big by wrapping around.
    if (autocompletePosition < 0) {
      autocompletePosition = len
    }
    autocompletePosition %= (len + 1)

    $results.removeClass('selected')
    if (autocompletePosition != 0) {
      var result = $results[autocompletePosition - 1]
      $(result).addClass('selected')
    }
  }


  /**
   * Perform search for autocomplete results and display them
   */
  
  var doSearchAutocomplete = function (){

    if ($searchInput.val() === lastAutocompleteQuery &&
        !$headerAutocomplete.hasClass('off')) {
      return

    } else if ($searchInput.val() == '') {
      $search.removeClass('searching')
      $headerAutocomplete.addClass('off')
      setAutocompletePosition(0)
    
    } else {
      $search.addClass('searching')
      
      var params = { q: $searchInput.val() }
      var time = +(new Date)
      $.get('/autocomplete-endpoint/', params, function(data) {
        
        if ($searchInput.val() != '' && time >= lastAutocompleteTime) {

          lastAutocompleteTime = time
          lastAutocompleteQuery = data.q

          $headerAutocomplete
            .render(data.results, { // template directives
              name: {
                // don't escape search result name, to show formatting
                html: function (params){ 
                  return this.name
                }
              },
              result: {
                href: function (params){
                  return this.url
                },
                'data-position': function (params){ // position
                  return this.position
                },
                'class': function (params){
                  return params.element.className + ' ' + this.type.toLowerCase()
                }
              }
            })
            .removeClass('off')

          setAutocompletePosition(1)
        }
      })
    }
  }

  $searchInput.on('focus', function (e){
    if ($searchInput.val() != '') {
      $search.addClass('searching')
      $headerAutocomplete.removeClass('off')
    }
  })
  $searchInput.on('keyup', doSearchAutocomplete)

  $('.header .autocomplete').on('mouseover', '.result', function (e){
    var position = parseInt($(this).attr('data-position'))
    setAutocompletePosition(position)
  })


  /**
   * Autocomplete keyboard navigation
   */

  $searchInput.on('keydown', function (e){
    if (e.which == 38) { // UP
      e.preventDefault()
      setAutocompletePosition(autocompletePosition - 1)

    } else if (e.which == 40) { // DOWN
      e.preventDefault()
      setAutocompletePosition(autocompletePosition + 1)
    }
  })

  $('.header .search form').on('submit', function (e){ // ENTER
    if (autocompletePosition == 0) {
      if ($searchInput.val().length) {
        return // go to search page
      } else {
        e.preventDefault()
        return // do nothing
      }
    }

    e.preventDefault()

    var $selected = $('.header .autocomplete .result.selected')
    if ($selected.length) {
      window.location = $selected.attr('href')
    }

  })
  
  $searchInput.on('blur', function (e){
    window.setTimeout(function (){
      $search.removeClass('searching')
      $headerAutocomplete.addClass('off')
      setAutocompletePosition(0)
    }, 100)
  })

  /**
   * Filter keystrokes from keymaster when user is searching. 
   * https://github.com/madrobby/keymaster
   */
  key.filter = function (event){
    log($)
    return $searchInput.val() == ''
  }

  key('left', function () {
    var $prev = $('.noteNav .prev')
    if ($prev.length) {
      window.location = $prev.attr('href')
    }
  })
  key('right', function () {
    var $next = $('.noteNav .next')
    if ($next.length) {
      window.location = $next.attr('href')
    }
  })

  /**
   * Load polyfills for old browsers.
   */
  Modernizr.load(
    [ { test: Modernizr.placeholder
      , nope: '/js/lib/polyfill/jquery.placeholder.min.js'
      , callback: function(url, result, key) {
          if (!result) $('input, textarea').placeholder()
        }
      }
    ]
  )

})


/**
 * Executed when DOM is fully loaded.
 */
$(window).load(function() {

})

