module.exports = function (grunt) {
	"use strict";
	grunt.registerTask('default', [
		'npmRun:build'
	]);

	grunt.config.set("deploy_mode", "html_repo");

	require('grunt-load-npm-run-tasks')(grunt, {
		silent: false
	});
};