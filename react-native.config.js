module.exports = {
  dependencies: {
    '@paysafe/paysafe-venmo': {
      root: __dirname,
      platforms: {
        android: {
          sourceDir: './android',
        },
        ios: {
          sourceDir: './ios',
        },
      },
    },
    '@paysafe/paysafe-google-pay': {
      root: __dirname,
      platforms: {
        ios: null,
      },
    },
    '@paysafe/paysafe-card-payments': {
      root: __dirname,
      platforms: {
        android: {
          sourceDir: './android',
        },
        ios: {
          sourceDir: './ios',
        },
      },
    },
  },
};
