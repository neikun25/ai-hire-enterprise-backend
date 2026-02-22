import path from 'path';
import type { UserConfigExport } from '@tarojs/cli';

const config: UserConfigExport = {
  projectName: 'open-action-miniapp',
  date: '2026-2-7',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    375: 2,
    828: 1.81 / 2
  },
  sourceRoot: 'miniapp',
  outputRoot: 'dist-miniapp',
  plugins: ['@tarojs/plugin-platform-weapp'],
  defineConstants: {},
  copy: {
    patterns: [],
    options: {}
  },
  framework: 'react',
  compiler: {
    type: 'webpack5',
    prebundle: {
      enable: false
    }
  },
  cache: {
    enable: false
  },
  mini: {
    postcss: {
      pxtransform: {
        enable: true,
        config: {}
      },
      url: {
        enable: true,
        config: {
          limit: 1024
        }
      },
      cssModules: {
        enable: false,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]'
        }
      }
    },
    webpackChain(chain) {
      chain.resolve.alias
        .set('@', path.resolve(__dirname, '..', 'miniapp'))
        .set('@/components', path.resolve(__dirname, '..', 'miniapp/components'))
        .set('@/utils', path.resolve(__dirname, '..', 'miniapp/utils'))
        .set('@/services', path.resolve(__dirname, '..', 'miniapp/services'));
    }
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    postcss: {
      autoprefixer: {
        enable: true,
        config: {}
      },
      cssModules: {
        enable: false,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]'
        }
      }
    }
  }
};

export default config;
