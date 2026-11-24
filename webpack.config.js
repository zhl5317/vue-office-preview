const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const baseConfig = require('./webpack.base');
const config = baseConfig;
const officeServer = process.env.ONLYOFFICE_SERVER_URL || 'http://114.55.181.13:4009';
function setOfficeForwardedHeaders(proxyReq, req) {
	proxyReq.setHeader('X-Forwarded-Host', req.headers.host + '/onlyoffice');
	proxyReq.setHeader('X-Forwarded-Proto', 'http');
}

config.mode = 'development';

config.entry = './example/main.js';
config.output = {
  path: path.resolve(__dirname, './example/dist/'),
  publicPath: '',
  filename: '[name]_[hash].js',
};

config.devtool = 'inline-source-map';
config.devServer = {
	host: '0.0.0.0',
	contentBase: './dist',
	proxy: {
		'/onlyoffice': {
			target: officeServer,
			changeOrigin: true,
			ws: true,
			pathRewrite: { '^/onlyoffice': '' },
			onProxyReq: setOfficeForwardedHeaders,
			onProxyReqWs: setOfficeForwardedHeaders,
			onProxyRes(proxyRes) {
				const location = proxyRes.headers.location;
				if (location && location.startsWith('/') && !location.startsWith('/onlyoffice/')) {
					proxyRes.headers.location = '/onlyoffice' + location;
				}
			}
		}
	}
};

config.plugins = config.plugins.concat([
	new HtmlWebpackPlugin({
		template: './example/index.html',
		officeApiUrl: process.env.ONLYOFFICE_API_URL || '/onlyoffice/web-apps/apps/api/documents/api.js'
	})
])

module.exports = config
