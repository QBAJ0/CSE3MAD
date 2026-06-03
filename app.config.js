module.exports = ({ config }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      router: config.extra?.router ?? {},
      eas: {
        ...(config.extra?.eas ?? {}),
        projectId: "f216fb29-f47a-4ba7-9bdb-5de5249d8d4f",
      },
    },
  };
};