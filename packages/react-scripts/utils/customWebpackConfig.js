var ExtractTextPlugin = require('extract-text-webpack-plugin');
var OfflinePlugin = require('offline-plugin');

var paths = require('../config/paths');
var superScriptConfigOptions = require('./superScriptConfigOptions')

var cssModulesConf = 'css?modules&minimize&importLoaders=1'
var cssModulesConfDev = cssModulesConf+'&sourceMap&localIdentName=[name]---[local]---[hash:base64:5]'

var findLoaderType = function(param, type) {
  return param.config.module.loaders.filter(function(loaderParam) {
    return loaderParam.loader === type
  })[0]
}

var excludeFromUrlLoader = function(param, fileType) {
  findLoaderType(param, 'url').exclude.push(fileType)
}

var offlineConfig = function(param) {
  if (param.env === 'prod') {
    if (superScriptConfigOptions('offline')) {
      param.config.plugins.push(
        new OfflinePlugin({
          relativePaths: false,
          publicPath: '/',
          excludes: ['**/.*', '**/*.map','asset-manifest.json'],
          caches: {
            main: [':rest:'],
            additional: ['*.chunk.js'],
          },
          safeToUseOptionalCaches: true,
          AppCache: false,
        })
      )
    }
  }
  return param
}

var esLintConfig = function(param) {
  if (paths.customEslint) {
		param.config.eslint = {
	    configFile: paths.customEslint,
	    useEslintrc: true
	  }
	}
  return param
}

var babelConfig = function(param) {
	var oldConfig = findLoaderType(param, 'babel');
  if( param.env === 'dev') {
		oldConfig.query = {
			babelrc: (paths.customBabelrc ? true : false),
			presets: [require.resolve('babel-preset-react-app'), "react-hmre"],
			cacheDirectory: true
		}

  } else {
    oldConfig.query = {
      babelrc: (paths.customBabelrc ? true : false),
      presets: [require.resolve('babel-preset-react-app')],
    }
	}
  return param;
};

var imageConfig = function(param) {
  if( param.env === 'prod') {
    excludeFromUrlLoader(param, /\.(jpe?g|png|gif|svg)$/i);
		param.config.module.loaders.push({
			test: /\.(jpe?g|png|gif|svg)$/i,
			loaders: [
					'file?hash=sha512&digest=hex&name=static/media/[name].[hash:8].[ext]',
					'image-webpack?bypassOnDebug&optimizationLevel=7&interlaced=false'
			]
		});
  }

  return param;
};

var lessModulesConfig = function(param) {
  if( param.env === 'dev') {
		param.config.module.loaders.push({
      test: /\.module\.less/,
      loaders: ['style', cssModulesConfDev, 'less'],
    });
  } else {
    param.config.module.loaders.push({
      test: /\.module\.less/,
      loader: ExtractTextPlugin.extract('style', [cssModulesConf, 'less']),
    })
	}
  return param;
};

var sassModulesConfig = function(param) {
  if( param.env === 'dev') {
		param.config.module.loaders.push({
      test: /\.module\.(sass|scss)/,
      loaders: ['style', cssModulesConfDev, 'sass'],
    });
  } else {
    param.config.module.loaders.push({
      test: /\.module\.(sass|scss)/,
      loader: ExtractTextPlugin.extract('style', [cssModulesConf, 'sass']),
    })
	}
  return param;
};

var cssModulesConfig = function(param) {
  if( param.env === 'dev') {
		param.config.module.loaders.push( {
      test: /\.module\.css$/,
      loaders: ['style', cssModulesConfDev, 'postcss'],
    })
  } else {
    param.config.module.loaders.push({
      test: /\.module\.css$/,
      loader: ExtractTextPlugin.extract('style', [cssModulesConf, 'postcss']),
    })
	}
  return param;
};

var lessConfig = function(param) {
  excludeFromUrlLoader(param, /\.less/)
	if( param.env === 'dev') {
		param.config.module.loaders.push({
	      test: /\.less/,
	      exclude: /\.module\.less$/,
	      loaders: ['style', 'css', 'less'],
	  });
  } else {
    param.config.module.loaders.push({
        test: /\.less/,
        exclude: /\.module\.less$/,
        loader: ExtractTextPlugin.extract(['css?minimize', 'less']),
    })
	}
  return param;
};

var sassConfig = function(param) {
  excludeFromUrlLoader(param, /\.(sass|scss)/);

  if( param.env === 'dev') {
    param.config.module.loaders.push({
  			test: /\.(sass|scss)/,
  			exclude: /\.module\.(sass|scss)$/,
  			loaders: ['style', 'css', 'sass'],
  	});
  } else {
    param.config.module.loaders.push({
			 test: /\.(sass|scss)/,
			 exclude: /\.module\.(sass|scss)$/,
			 loader: ExtractTextPlugin.extract(['css?minimize', 'sass']),
		});
  }
  return param;
};

var compose = function () {
  var fns = arguments;
  return function (result) {
    for (var i = fns.length - 1; i > -1; i--) {
      result = fns[i].call(this, result);
    }
    return result;
  };
};

var customWebpackConfig = function(config, env) {
  var customConfig = compose(offlineConfig, esLintConfig, babelConfig, imageConfig, lessModulesConfig, sassModulesConfig, cssModulesConfig, lessConfig, sassConfig)
  var params = {config: config, env: env}
	return customConfig(params).config
}

module.exports = customWebpackConfig;
