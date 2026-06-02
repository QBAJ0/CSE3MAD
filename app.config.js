/**
 * Local phone dev: `EXPO_LOCAL_DEV=1` (set by npm start) omits `extra.eas.projectId`
 * so Expo CLI does not block on the login / "Proceed anonymously" prompt.
 * EAS Build sets `EAS_BUILD=true` and keeps the project ID for cloud builds.
 */
module.exports = ({ config }) => {
  const keepEasProjectId = process.env.EAS_BUILD === "true";
  const extra = { ...config.extra };

  if (!keepEasProjectId && extra?.eas?.projectId) {
    const { projectId: _removed, ...easRest } = extra.eas;
    if (Object.keys(easRest).length > 0) {
      extra.eas = easRest;
    } else {
      delete extra.eas;
    }
  }

  return {
    ...config,
    extra,
  };
};
