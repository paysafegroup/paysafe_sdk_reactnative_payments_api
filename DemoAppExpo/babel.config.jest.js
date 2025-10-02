// babel.config.jest.js - Specific configuration for Jest tests
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    ['@babel/preset-typescript', { allowNamespaces: true }],
    'babel-preset-expo',
  ],
  plugins: [
    [
      'module-resolver',
      {
        root: ['.'],
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        alias: {
          '@sdk': './src/sdk/index.ts',
          '@': './'
        }
      }
    ]
  ]
};