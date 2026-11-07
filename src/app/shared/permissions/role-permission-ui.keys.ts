/** Stable UI key references, not permission definitions. Backend owns the
 * PAGE/ACTION metadata and exact Permission.Code for each key. */
export const rolePermissionUiKeys = {
  page: 'system.roles.permissions',
  saveAction: 'system.roles.action.assign-permissions',
} as const;
