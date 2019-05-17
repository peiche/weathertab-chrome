var autoprefixer	= require('autoprefixer'),
	concat					= require('gulp-concat'),
	declare					= require('gulp-declare'),
	del							= require('del'),
	eslint					= require('gulp-eslint'),
	gulp						= require('gulp'),
	handlebars			= require('gulp-handlebars'),
	postcss					= require('gulp-postcss'),
	sass						= require('gulp-sass'),
	scss						= require('postcss-scss'),
	stripDebug			= require('gulp-strip-debug'),
	stylelint				= require('stylelint'),
	util						= require('gulp-util'),
	wrap						= require('gulp-wrap'),
	zip							= require('gulp-zip');

gulp.task('clean', function() {
	return del(['dist', 'release']);
});

gulp.task('copy:img', function() {
	return gulp.src([
		'./assets/img/**/*'
	]).pipe(gulp.dest('./dist/img'));
});

gulp.task('copy:js', function() {
	return gulp.src([
		'./node_modules/handlebars/dist/handlebars.min.js',
		'./node_modules/codyhouse-framework/main/assets/js/util.js'
	]).pipe(gulp.dest('./dist/js'));
});

gulp.task('copy:fonts', function() {
	return gulp.src([
		'./node_modules/open-weather-icons/dist/fonts/**/*'
	]).pipe(gulp.dest('./dist/font'));
});

gulp.task('copy', function() {
	gulp.start('copy:img', 'copy:js', 'copy:fonts');
});

gulp.task('lint:css', function() {
	return gulp.src('./assets/scss/**/*.scss')
		.pipe(postcss([stylelint({
			configFile: './assets/scss/stylelintrc.json',
			syntax: scss
		})], {
			parser: scss
		}));
});

gulp.task('lint:js', function() {
	return gulp.src(['./assets/js/**/*.js'])
		.pipe(eslint({
			configFile: './assets/js/eslint.json'
		}))
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
});

gulp.task('lint', function() {
	gulp.start('lint:css', 'lint:js')
});

gulp.task('build:css', function() {
	return gulp.src('./assets/scss/**/*.scss')
		.pipe(sass({
			importer: require('node-sass-tilde-importer')
		}).on('error', sass.logError))
		.pipe(postcss([
			autoprefixer
		]))
		.pipe(gulp.dest('./dist/css/'));
});

gulp.task('build:templates', function() {
	gulp.src('./assets/templates/**/*.hbs')
		.pipe(handlebars({
			handlebars: require('handlebars')
		}))
		.pipe(wrap('Handlebars.template(<%= contents %>)'))
		.pipe(declare({
			namespace: 'WeatherTab.templates',
			noRedeclare: true
		}))
		.pipe(concat('templates.js'))
		.pipe(gulp.dest('./dist/js/'));
});

gulp.task('build:js', function() {
	return gulp.src(['./assets/js/**/*.js'])
		.pipe(!!util.env.production ? stripDebug() : util.noop())
		.pipe(gulp.dest('./dist/js/'));
});

gulp.task('build', function() {
	gulp.start('build:css', 'build:templates', 'build:js');
});

gulp.task('default', ['clean'], function() {
	gulp.start('copy', 'build');
});

gulp.task('zip', function() {
	del(['./release']);

	return gulp.src([
			'./dist/**/*',
			'./index.html',
			'./manifest.json'
		], {
			base: '.'
		})
		.pipe(zip('weathertab.zip'))
		.pipe(gulp.dest('./release'));
});
