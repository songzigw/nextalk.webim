module.exports = function(grunt){
	grunt.initConfig({
        pkg : grunt.file.readJSON('package.json'),
		concat : {
            'dist/sog.debug.js' :
                ['src/js/sog.js','src/js/module/*.js','src/js/plugin/*.js'],
            'dist/sog.css' : ['src/css/base.css','src/css/module/*.css']
		},
        uglify : {
            target : {
                files : {
                    'dist/sog.min.js': 'dist/sog.debug.js'
                }
            }
        },
        cssmin : {
            target : {
                files : {
                    'dist/sog.min.css': 'dist/sog.css'
                }
            }
        },
        copy : {
            target : {
                files : [
                    {expand: true,cwd: 'dist/',src: ['sog.debug.js'],dest: 'demo/js/lib/'},
                    {expand: true,cwd: 'dist/',src: ['sog.css'],dest: 'demo/css/'}
                ]
            }
        }

	});
  	grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-copy');

  	grunt.registerTask('default', ['concat','uglify','cssmin','copy']);
}