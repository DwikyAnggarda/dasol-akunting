export function hasPermission(
  granted: readonly string[],
  required: string,
): boolean {
  return new Set(granted).has(required);
}

export function hasEveryPermission(
  granted: readonly string[],
  required: readonly string[],
): boolean {
  const permissionSet = new Set(granted);
  return required.every((permission) => permissionSet.has(permission));
}
