import { defineAbility } from "@casl/ability";

export const defineAbilityFor = (user: { role: "MEMBER" | "OWNER" | null }) => {
  /**
   * User can read
   *
   * Only owners can manage
   *
  //  * Admins cannot delete
   */

  return defineAbility((can, cannot) => {
    can("read", "Team");

    if (user.role === "OWNER") {
      can("manage", "Team");
    }
    // if (user.role === "ADMIN") {
    //   cannot("delete", "Team");
    // }
  });
};
