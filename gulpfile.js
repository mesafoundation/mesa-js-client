const { src, dest, series } = require('gulp')
const ts = require('gulp-typescript')
const del = require('del')

const rename = require('gulp-rename')
const replace = require('gulp-replace')

const tsModule = ts.createProject('tsconfig.module.json')
const tsBrowser = ts.createProject('tsconfig.browser.json')

function clean (cb) {
  del([
    'lib/**/*'
  ])

  cb()
}

function module (cb) {
  src('src/*.ts')
    .pipe(replace('/*export default*/', 'export default'))
    .pipe(tsModule())
    .pipe(dest('lib/module'))

  cb()
}

function browser (cb) {
  src('src/index.ts')
    .pipe(tsBrowser())
    .pipe(rename({ basename: 'client' }))
    .pipe(dest('lib/browser'))

  cb()
}

exports.default = series(clean, module, browser)
exports.module = series(clean, module)
exports.browser = series(clean, browser)
