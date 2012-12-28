amazons = require('./amazons')

/**
 * Render a template
 *
 * Adds variables that all templates will expect. We use this function so we
 * have one location to add all these variables. We also allow caller to
 * override the default values specified here by simply declaring them in the
 * object they pass as `locals`.
 * 
 * Use this function instead of calling res.render() directly. 
 * 
 * @param  {Object} res          Response Object
 * @param  {String} templateName Name of the template to render
 * @param  {Object} locals       Local variables to make available to template
 */
function render(res, templateName, locals) {
  var defaultLocals =
    { ads: PRODUCTION
    , cls: templateName
    , config: config
    , courses: m.cache.courses
    , search_term: ''
    , topnav: topnav
    }

  res.render(templateName, u.extend(defaultLocals, locals))
}

/**
 * Render 404 page, and log error message
 * 
 * @param  {Object} res Response Object
 * @param  {String} msg Error message to log
 */
function render404(res, msg) {
  if (msg) error(msg) // don't return since we want to serve a 404 page
  
  res.status(404)
  render(res, 'notFound',
    { err: msg
    , ads: false
    , meta:
      { title: 'Page Not Found - 404 Error'
      , forceTitle: true
      }
    }
  )
}

//
// Top header links
//
var topnav =
  { courses:
    { url: '#'
    , meta: { title: 'Browse all AP study notes' }
    , shortname: 'AP Courses'
    }

  , astore:
    { url: '/study-guides'
    , meta: { title: 'Buy Amazon.com AP Study Guides' }
    , shortname: 'Book Store'
    }

  // add: {
  //   url: '/add/'
  //   meta: { title: 'Add Notes' }
  //   shortname: 'Add Notes'
  // }

  // login: {
  //   url: '/login/'
  //   meta: { title: 'Log In to StudyNotes' }
  //   shortname: 'Log In'
  // }
  }

//
// Other routes without header links 
//
var other =
  { home:
    { url: '/'
    , shortname: ''
    , hero:
      { title: 'AP Study Notes'
      , desc: 'Fast, free study tools for AP* students.'
      // desc: 'The best AP* study guides.'
      // desc: 'Study tools for smart students.'
      // desc: 'The secret to getting a 5 on the AP* exam.'
      }
    }

  , search:
    { url: '/search'
    , handler: function (req, res){
        q = req.query.q
        
        render(res, 'search',
          { meta: { title: 'Search Results for ' + q }
          , search_term: q
          }
        )
      }
    }
    
  , course:
    { url: '/:courseSlug'
    , handler: function (req, res) {
        var p = req.params
          , course = m.cache.courses[p.courseSlug]

        if (!course) {
          render404(res, "No course with slug #{ p.courseSlug }")
          return
        }

        render(res, 'course',
          { amazon: amazons[course.slug]
          , breadcrumbs: []
          , cls: "course #{course.slug}"
          , course: course
          , hero:
            { title: course.name
            , desc: 'Online Prep and Review'
            , mini: true
            }
          , notetypes: course.notetypes
          , meta:
            { url: course.absoluteUrl
            , title: course.name
            }
          }
        )
      }
    }

  , notetype:
    { url: '/:courseSlug/:notetypeSlug'
    , handler: function (req, res){
        var p = req.params
          , course = m.cache.courses[p.courseSlug]

        if (!course) {
          render404(res, "No course with slug #{ p.courseSlug }")
          return
        }

        var notetype = u.find(course.notetypes, function (n){
          return n.slug == p.notetypeSlug
        })
        if (!notetype) {
          render404(res, "Course has no notetype w/ slug #{ p.notetypeSlug }")
          return
        }
        
        m.Note
        .find({ courseId: course._id, notetypeId: notetype._id })
        .sort('ordering')
        .exec(function (err, notes){
          if (err) {
            error(err)
            return
          }

          if (!notes) {
            render404(res, 'Unable to load notes')
            return
          }

          render(res, 'notetype',
            { amazon: amazons[course.slug]
            , breadcrumbs: [ { name: course.name, url: course.url } ]
            , course: course
            , notetype: notetype
            , notes: notes
            , meta:
              { url: notetype.absoluteUrl
              , title: course.name + ' ' + notetype.name
              }
            }
          )
        })
      }
    }

  , note:
    { url: '/:courseSlug/:notetypeSlug/:noteSlug'
    , handler: function (req, res){
        var p = req.params
        , course = m.cache.courses[p.courseSlug]

        if (!course) {
          render404(res, "No course with slug #{ p.courseSlug }")
          return
        }

        var notetype = u.find(course.notetypes, function (n){
          return n.slug == p.notetypeSlug
        })
        if (!notetype) {
          render404(res, 'Course has no notetype with slug ' + p.notetypeSlug)
          return
        }
             
        m.Note
        .find({ courseId: course._id, notetypeId: notetype._id })
        .sort('ordering')
        .exec(function (err, notes){
          if (err) {
            error(err)
            return
          }

          if (!notes) {
            render404(res, 'Unable to load notes')
            return
          }

          var note = u.find(notes, function (n){
            return n.slug == p.noteSlug
          })

          if (!note) {
            render404(res, 'Course+notetype have no note w slug ' + p.noteSlug)
            return
          }

          var noteOrdering = note.ordering

          var noteNext = u.find(notes, function (note){
            return note.ordering == noteOrdering + 1
          })

          var notePrev = u.find(notes, function (note){
            return note.ordering == noteOrdering - 1
          })

          // Update hit count -- don't wait for confirmation
          note.update({ $inc: { hits: 1 } }, { upsert: true }, util.noop)

          render(res, 'note',
            { amazon: amazons[course.slug]
            , breadcrumbs:
              [ { name: course.name, url: course.url }
              , { name: notetype.name, url: notetype.url }
              ]
            , course: course
            , notetype: notetype
            , note: note
            , noteNext: noteNext
            , notePrev: notePrev
            , relatedNotes: notes
            , meta:
              { url: note.absoluteUrl
              , title: util.titleify( note.name
                                    , course.name + ' ' + notetype.name)
              }
            }
          )
        })
      }
    }

  , notFound:
    { url: '*'
    , handler: function (req, res){
        render404(res)
      }
    }
  }

//
// Initialize and register the app's routes
//
var routes = u.extend({}, topnav, other)

u.each(routes, function (locals, templateName){
  if (locals.url == '#')
    return

  app.get(locals.url, function (req, res){

    // If locals.meta is missing `url`, try to add it
    // This is so that static pages will get the canonical url meta tag
    if ((!locals.meta || !locals.meta.url)
        && locals.url.indexOf(':') == -1
        && locals.url.indexOf('*') == -1) {
      
      var absoluteUrl = config.siteUrl + locals.url
      if (absoluteUrl[absoluteUrl.length - 1] != '/')
        absoluteUrl += '/'

      locals.meta = locals.meta || {}
      locals.meta.url = absoluteUrl
    }

    if (locals.handler)
      locals.handler(req, res)
    else
      render(res, templateName, locals) 
  })
})
