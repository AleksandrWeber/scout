export const isLocalPathScanEnabled = (): boolean => process.env.SCOUT_ALLOW_LOCAL_PATHS !== 'false';
