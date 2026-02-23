const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

const monorepoRoot = path.resolve(__dirname, '../..');

const config = {
  watchFolders: [monorepoRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],
    extraNodeModules: {
      axios: path.resolve(monorepoRoot, 'node_modules/axios'),
    },
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === 'axios') {
        return {
          filePath: path.resolve(
            monorepoRoot,
            'node_modules/axios/dist/browser/axios.cjs',
          ),
          type: 'sourceFile',
        };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
