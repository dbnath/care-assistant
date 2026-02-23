const path = require('path');

const monorepoRoot = path.resolve(__dirname, '../..');

module.exports = {
  project: {
    ios: {
      sourceDir: './ios',
    },
    android: {
      sourceDir: './android',
    },
  },
  dependencies: {},
};
