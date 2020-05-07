const path = require('path');
const webpack = require('webpack');
// const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const dist = path.resolve(path.dirname(__dirname), 'dist');
process.env.NODE_ENV = 'production';


const config = {
    mode: process.env.NODE_ENV,
    entry: {
        mqtt: './src/index.ts'
    },
    output: {
        filename: '[name].js',
        path: dist
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/
        }]
    },
    plugins: [
        new webpack.ProgressPlugin(),
        new CleanWebpackPlugin(),
    ]
};

webpack(config, (err, stats) => {
    if (err) throw err;
    process.stdout.write(stats.toString({
        colors: true,
        modules: false,
        children: true,
        chunks: false,
        chunkModules: false
    }) + '\n\n');

    if (stats.hasErrors()) {
        console.log('  Build failed with errors')
        process.exit(1)
    }
})