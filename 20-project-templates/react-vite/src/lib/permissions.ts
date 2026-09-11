/** Pure check; never compare role names in the app. */
export const hasPermission = (permissionKeys: readonly string[], key: string): boolean =>
  permissionKeys.includes(key);

export const hasAnyPermission = (permissionKeys: readonly string[], keys: readonly string[]): boolean =>
  keys.some((k) => permissionKeys.includes(k));
