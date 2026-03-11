module.exports = {
  dependencies: {
    'paysafe-venmo': {
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
    'paysafe-google-pay': {
      root: __dirname,
      platforms: {
        ios: null,
      },
    },
    'paysafe-card-payments': {
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
