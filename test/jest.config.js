module.exports = {
  testEnvironmentOptions: {
    "jest-playwright": {
      browsers: ["chromium", "firefox", "webkit"],
      launchOptions: {
        headless: false,
      },
    },
  },
};