// Expo loads .env locally; EAS supplies its environment on remote builds.
// The auth token is consumed by build tools, never by the public app config.
module.exports = ({ config }) => ({
  ...config,
  plugins: (config.plugins ?? []).map((plugin) => {
    if (!Array.isArray(plugin) || plugin[0] !== "@sentry/react-native/expo") {
      return plugin;
    }
    const options = plugin[1] ?? {};
    return [
      plugin[0],
      {
        ...options,
        organization: process.env.SENTRY_ORG?.trim() || options.organization,
        project: process.env.SENTRY_PROJECT?.trim() || options.project,
      },
    ];
  }),
});
