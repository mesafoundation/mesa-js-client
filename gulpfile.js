const { src, dest } = require('gulp')
const ts = require('gulp-typescript')

const rename = require('gulp-rename')
const replace = require('gulp-replace')

const tsModule = ts.createProject('tsconfig.module.json'),
		tsBrowser = ts.createProject('tsconfig.browser.json')

module.exports.module = () => src('src/*.ts').pipe(replace('/*export default*/', 'export default')).pipe(tsModule()).pipe(dest('dist/module'))
module.exports.browser = () => src('src/index.ts').pipe(tsBrowser()).pipe(rename({ basename: 'client' })).pipe(dest('dist/browser'))
