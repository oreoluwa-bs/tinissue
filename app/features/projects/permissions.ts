import { defineAbility } from "@casl/ability";

export const defineAbilityFor = (user: {
  role: "MEMBER" | "OWNER" | "ADMIN" | null;
}) => {
  /**
   * User can read
   *
   * Only owners can manage
   *
   * Admins cannot delete
   */

  return defineAbility((can, cannot) => {
    can("read", "Project");

    if (user.role === "OWNER" || user.role === "ADMIN") {
      can("manage", "Project");
    }
    if (user.role === "ADMIN") {
      cannot("delete", "Project");
    }
  });
};
