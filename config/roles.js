// Every role the system knows about. Add new roles here (e.g. 'staff', 'manager')
// and then protect routes with allowRoles(...).
export const ROLES = Object.freeze({
  ADMIN: 'admin',
});

export const ALL_ROLES = Object.values(ROLES);
