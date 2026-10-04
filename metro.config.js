const { withNativeWind } = require("nativewind/metro");
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getSentryExpoConfig(__dirname);

// SQLite web loads its engine as WebAssembly and needs SharedArrayBuffer.
if (!config.resolver.assetExts.includes("wasm")) {
  config.resolver.assetExts.push("wasm");
}
const enhanceMiddleware = config.server?.enhanceMiddleware;
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) => {
    const next = enhanceMiddleware
      ? enhanceMiddleware(middleware, server)
      : middleware;
    return (req, res, done) => {
      res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      return next(req, res, done);
    };
  },
};

module.exports = withNativeWind(config, { input: "./app/global.css" });
