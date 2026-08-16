module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  // AsyncStorage's real native module is null outside a running app, and
  // (unlike some RN libs) it doesn't self-register its Jest mock via
  // setupFiles — it has to be swapped in at the module-resolution level.
  moduleNameMapper: {
    '^@react-native-async-storage/async-storage$':
      '<rootDir>/node_modules/@react-native-async-storage/async-storage/jest/async-storage-mock.js',
  },
  // The RN preset's default transformIgnorePatterns only allows a handful of
  // packages to be transformed out of node_modules. Several deps we import
  // (react-navigation, its sub-packages, and assorted react-native-* native
  // module wrappers) ship untranspiled ESM and need to go through Babel too,
  // or Jest chokes on their `export`/`import` syntax.
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@react-navigation|react-native-.*|@react-native-.*|@react-native-firebase)',
  ],
};
