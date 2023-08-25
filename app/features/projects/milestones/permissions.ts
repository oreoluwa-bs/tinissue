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
    can("read", "Milestone");

    can("update", "Milestone", ["status"]);

    if (user.role === "OWNER" || user.role === "ADMIN") {
      can("manage", "Milestone");
    }
    if (user.role === "ADMIN") {
      cannot("delete", "Milestone");
    }
  });
};
