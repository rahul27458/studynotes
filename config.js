module.exports = {
  
  db: {
    host: PRODUCTION
      ? 'athena.feross.net'
      : 'localhost',
    port: '27017',
    database: 'studynotes'
  },

  redis: {
    host: PRODUCTION
      ? 'athena.feross.net'
      : 'localhost',
    port: 6379
  },

  siteTitle: 'Study Notes',
  siteUrl: 'http://www.apstudynotes.org', // no trailing slash

}
