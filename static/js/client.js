;(function() {

// Avoid `console` errors in browsers that lack a console.
var method
  , noop = function noop() {}
  , methods = [
  'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
  'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
  'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
  'timeStamp', 'trace', 'warn']
  , length = methods.length
  , console = (window.console = window.console || {})

while (length--) {
  method = methods[length]

  // Only stub undefined methods.
  if (!console[method]) {
    console[method] = noop
  }
}

// Short-named logging functions for convenience
window.log = function() {
  var args = Array.prototype.slice.call(arguments, 0)
  if (console.log.apply) console.log.apply(console, args)
}
window.error = function() {
  var args = Array.prototype.slice.call(arguments, 0)
  args.unshift('ERROR:')
  if (console.error.apply) console.error.apply(console, args)
}

}())



;(function() {

window.u = _

// Set search bar's width so it fills the header correctly.
// Need to ensure this gets called after Typekit fonts are loaded.
var $headerLeft = $('.header .left')
  , $headerRight = $('.header .right')
  , $headerSearch = $('.header .search')

function updateHeaderSearchWidth() {
  var headerLeftWidth = $headerLeft.width()
    , headerRightWidth = $headerRight.width()
  $headerSearch
    .css({
      'margin-left': headerLeftWidth,
      'margin-right': headerRightWidth
    })
    .removeClass('off')

  // Continue to set the width every 100ms until fonts are done loading.
  // If fonts don't load, then wf-loading gets removed automatically
  // after 1000ms, so this won't run forever. 
  if ($('html').hasClass('wf-loading')) {
    setTimeout(updateHeaderSearchWidth, 100)
  }
}

// Show or hide the browse menu
function toggleBrowseMenu(_switch) {
  $('.browse').toggleClass('on', _switch)
  $('.header .courses').toggleClass('on', _switch)
}

// On DOM ready
$(function() {

  updateHeaderSearchWidth()

  // Browse menu dropdown
  $('.header .courses').on('click', function (e){
    // Only handle left-clicks
    if (e.which != 1) return
    
    toggleBrowseMenu()
    e.preventDefault()
  })

  // Close browse menu on search focus
  $headerSearch.on('focusin', function (e){
    toggleBrowseMenu(false)
  })

  var $hero = $('.hero, .heroMini')
    , $html = $('html')    
    , $header = $('.header')
    , $window = $(window)

  var heroBottom = $hero.length
    ? $hero.offset().top + $hero.height() - $header.height()
    : undefined

  // Close browse menu on page scroll
  $(window).on('scroll', u.throttle(function(){
    toggleBrowseMenu(false)

    // Toggle header text color
    if ($hero.length) {
      var windowScrollTop = $window.scrollTop()
        , className = 'solidHeader'
        , htmlHasClass = $html.hasClass(className)

      if (htmlHasClass && windowScrollTop < heroBottom) {
        $html.removeClass(className)
      } else if (!htmlHasClass && windowScrollTop >= heroBottom) {
        $html.addClass(className)
      }
    
    }
  }, 100))

  // Page-specific JS
  // if ($('body').hasClass('course'))

  // Load polyfills for old browsers
  Modernizr.load(
    { test: Modernizr.placeholder
    , nope: '/js/lib/jquery.placeholder.min.js'
    , callback: function(url, result, key) {
        if (!result) $('input, textarea').placeholder()
        log('hey')
      }
    }
  )

})

// On DOM load
$(window).load(function() {

})

}())