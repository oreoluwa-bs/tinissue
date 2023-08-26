import { defineAbility } from "@casl/ability";

export const defineAbilityFor = (user: {
  role: "MEMBER" | "ADMIN" | "OWNER" | null;
}) => {
  /**
   * User can read
   *
   * Only owners can manage
   *
  //  * Admins cannot delete
   */

  return defineAbility((can, cannot) => {
    can("read", "Team");

    if (user.role === "OWNER" || user.role === "ADMIN") {
      can("manage", "Team");
      can("create", "Project");
    }
    if (user.role === "ADMIN") {
      cannot("delete", "Team");
    }
  });
};
