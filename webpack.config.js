module.exports = {
    devtool: '#source-map',
    entry: './src/app.js',
    output: {
        path: __dirname + '/dist',
        filename: 'stars.js',
    },
    module: {
        loaders: [{
            test: /\.js$/,
            exclude: /node_modules|vendor|bootstrap/,
            loader: 'babel-loader?presets[]=es2015'
        }]
    }
};
