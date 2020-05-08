const path = require('path');
const webpack = require('webpack');
// const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const dist = path.resolve(path.dirname(__dirname), 'dist');
process.env.NODE_ENV = 'production';
process.env.NODE_ENV = 'development';


const config = {
    mode: process.env.NODE_ENV,
    entry: {
        index: './src/index.ts'
    },
    output: {
        libraryTarget: "commonjs",
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
        new CopyPlugin([{
            from: "package.json",
            to: ""
        }, {
            from: "README.md",
            to: ""
        }])
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