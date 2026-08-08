const mix = require("laravel-mix");
const path = require("path");
/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel application. By default, we are compiling the Sass
 | file for the application as well as bundling up all the JS files.
 |
 */

mix.js("resources/js/app.js", "public/js")
    .react()
    .sass("resources/sass/app.scss", "public/css");
// mix.browserSync('127.0.0.1:8000');
// if (mix.inProduction()) { mix.version(); }

mix.webpackConfig({
    resolve: {
        alias: {
            "~": path.resolve(__dirname, "resources/js"),
            'react/jsx-dev-runtime': 'react/jsx-dev-runtime.js',
            'react/jsx-runtime': 'react/jsx-runtime.js',
        },
        fallback: {
             "zlib": false 
        }
    },
     module: {
        rules: [
            {
                test: /\.(mp3|wav|m4a|ogg)$/,
                type: 'asset/resource',
                generator: {
                    filename: 'audio/[name][hash][ext]'
                }
            }
        ]
    }
});

