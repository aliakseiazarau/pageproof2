"use strict";

let gulp = require("gulp");
let sass = require("gulp-sass");
let plumber = require("gulp-plumber");
let postcss = require("gulp-postcss");
let autoprefixer = require("autoprefixer");
let mqpacker = require("css-mqpacker"); //Сортировка медиавыражений
let minify = require("gulp-csso"); //Минификация scc
let minifyjs = require("gulp-js-minify"); //Минификация js
let concat = require("gulp-concat"); //Сборка js-файлов
let rename = require("gulp-rename"); //Переименовываем файлы
let imagemin = require("gulp-imagemin"); //Сжимаем изображения
let spritesmith = require("gulp.spritesmith"); //Спрайт png
let svgstore = require("gulp-svgstore"); //Спрайт svg
let svgmin = require("gulp-svgmin");  //Сжатие svg
const browserSync = require("browser-sync");
let server = browserSync.create();
let run = require("run-sequence");
let del = require("del"); //Очистка папки
//stylelint

// Sass
gulp.task("scss", function () {
	gulp.src("scss/style.scss")
		.pipe(plumber())
		.pipe(sass())
		.pipe(postcss([
			autoprefixer({
				browsers: [
					"last 2 versions"
				]
			}),
			mqpacker({
				sort: false
			})
		]))
		.pipe(gulp.dest("css"))
		.pipe(minify())
		.pipe(rename("style.min.css"))
		.pipe(gulp.dest("css"))
		.pipe(server.stream());
});

// Сборка и минификация JS
gulp.task("js", function () {
	return gulp.src("scss/**/*.js")
		.pipe(plumber())
		.pipe(concat("script.js"))
		.pipe(minifyjs())
		.pipe(rename("script.min.js"))
		.pipe(gulp.dest("js"));
});

//Сжимаем изображения
gulp.task("img", function () {
	return gulp.src("img/**/*.{png,jpg,gif}")
		.pipe(imagemin([
			imagemin.optipng({ optimizationLevel: 3 }),
			imagemin.jpegtran({ progressive: true })
		]))
		.pipe(gulp.dest("img"));
});

// PNG-спрайт
gulp.task("sprite-png", function () {
	return gulp.src("img/icons-png/*.png")
		.pipe(spritesmith({
			imgName: "sprite.png",
			cssName: "sprite.scss"
		}))
		.pipe(gulp.dest("img"));
});

// SVG-спрайт
gulp.task("sprite-svg", function () {
	return gulp.src("img/icons-svg/*.svg")
		.pipe(svgmin())
		.pipe(svgstore({
			inlineSvg: true
		}))
		.pipe(rename("sprite.svg"))
		.pipe(gulp.dest("img"));
});

// Живой сервер
gulp.task("serve", ["scss"], function () {
	server.init({
		server: ".",
		notify: false,
		open: true,
		cors: true,
		ui: false
	});

	gulp.watch("scss/**/*.{scss,sass}", ["scss"]).on("change", server.reload);
	gulp.watch("scss/**/*.js", ["js"]).on("change", server.reload);
	gulp.watch("*.html").on("change", server.reload);
});

//BUILD

// Gulp-sass для build
gulp.task("style", function () {
	gulp.src("scss/style.scss")
		.pipe(plumber())
		.pipe(sass())
		.pipe(postcss([
			autoprefixer({
				browsers: [
					"last 2 versions"
				]
			}),
			mqpacker({
				sort: false
			})
		]))
		.pipe(gulp.dest("build/css"))
		.pipe(minify())
		.pipe(rename("style.min.css"))
		.pipe(gulp.dest("build/css"))
		.pipe(browserSync.reload({ stream: true }));
});

// Сборка и минификация JS для build
gulp.task("js-mini", function () {
	return gulp.src("scss/**/*.js")
		.pipe(plumber())
		.pipe(concat("script.js"))
		.pipe(minifyjs())
		.pipe(rename("script.min.js"))
		.pipe(gulp.dest("build/js"))
		.pipe(browserSync.reload({ stream: true }));
});

// Gulp-imagemin для build
gulp.task("images", function () {
	return gulp.src("build/img/**/*.{png,jpg,gif}")
		.pipe(imagemin([
			imagemin.optipng({ optimizationLevel: 3 }),
			imagemin.jpegtran({ progressive: true })
		]))
		.pipe(gulp.dest("build/img"));
});

// Png-спрайт для build
gulp.task("symbols-png", function () {
	return gulp.src("img/icons-png/*.png")
		.pipe(spritesmith({
			imgName: "sprite.png",
			cssName: "sprite.scss"
		}))
		.pipe(gulp.dest("build/img"));
});

// Gulp-svgstore для build
gulp.task("symbols-svg", function () {
	return gulp.src("build/img/icons-svg/*.svg")
		.pipe(svgmin())
		.pipe(svgstore({
			inlineSvg: true
		}))
		.pipe(rename("sprite.svg"))
		.pipe(gulp.dest("build/img"));
});

// Копирование html-файлов для живого сервера build
gulp.task("html:copy", function () {
	return gulp.src("*.html")
		.pipe(gulp.dest("build"));
});

gulp.task("html:update", ["html:copy"], function (done) {
	browserSync.reload({ stream: true });
	done();
});

// Живой сервер для build
gulp.task("serv", function () {
	server.init({
		server: "build/",
		notify: false,
		open: true,
		cors: true,
		ui: false
	});

	gulp.watch("scss/**/*.{scss,sass}", ["style"]);
	gulp.watch("scss/**/*.js", ["js-mini"]);
	gulp.watch("*.html", ["html:update"]);
});

// Копирование файлов для build
gulp.task("copy", function () {
	return gulp.src([
		"fonts/**/*.{woff,woff2,eot,ttf}",
		"img/**",
		"js/**",
		"*.html"
	], {
			base: "."
		})
		.pipe(gulp.dest("build"));
});

// Очистка папки build (всегда висит)
gulp.task("clean", function () {
	return del("build");
});

gulp.task("build", function (fn) {
	run("clean", "copy", "style", "js-mini", "images", "symbols-png", "symbols-svg", fn);
});
