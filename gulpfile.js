"use strict";

const gulp = require('gulp');
const boilerplate = require('appium-gulp-plugins').boilerplate.use(gulp);

boilerplate({
  build: 'appium-ios-driver',
  files: ["*.js", "lib/**/*.js", "test/**/*.js", "!gulpfile.js", "!test/assets/**/*.js"],
  test: {
    files: ['${testDir}/**/*-specs.js', '!${testDir}/e2e/**']
  },
  coverage: {
    files: ['./test/**/*-specs.js', '!./test/e2e/**', '!./test/assets'],
    verbose: true
  },
  e2eTest: {
    files: '${testDir}/e2e/**/*-specs.js',
  },
  testReporter: 'spec'
});
