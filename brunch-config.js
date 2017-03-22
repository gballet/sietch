module.exports = {
    files: {
        javascripts: {
            joinTo: {
                'app.js': /^app/,
                'test.js': 'test/*.js',
                'vendor.js': /^node_modules/,
                'test-vendor.js': /^test\/vendor/
            }
        }
    }
}
