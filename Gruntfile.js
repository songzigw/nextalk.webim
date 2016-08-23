module.exports = function(grunt) {
    
    'use strict'
    
    grunt.initConfig({
        pkg : grunt.file.readJSON('package.json')

    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask('default', [ 'concat', 'uglify', 'cssmin', 'copy' ]);
}