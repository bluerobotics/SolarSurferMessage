// Karma configuration
// Generated on Thu Apr 24 2014 17:03:20 GMT-0700 (PDT)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '../',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
        // required libraries
        'bower_components/extend-error/index.js',
        'bower_components/lodash/dist/lodash.js',
        'bower_components/jquery/dist/jquery.js',
        'bower_components/jasmine-jquery/lib/jasmine-jquery.js',

        // app under test
        'src/Message.js',
        {pattern: 'src/*.json', watched: true, served: true, included: false},

        // tests
        'test/*.karma.js'
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    // preprocessors: {
    //     'src/*.js': ['coverage']
    // },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['spec'], //, 'coverage', 'junit'


    // the default configuration
    // junitReporter: {
    //   outputFile: 'test-results.xml',
    //   suite: ''
    // },


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,
    usePolling: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};
