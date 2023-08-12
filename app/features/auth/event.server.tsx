import { EventEmitter } from "node:events";
import { createTeam, slugifyAndAddRandomSuffix } from "../teams";

export const authEvent = new EventEmitter();

authEvent.on(
  "NEW_USER",
  async (user: { id: number; firstName: string; lastName: string }) => {
    // Create Personal Team
    await createTeam(
      { name: "Personal", type: "PERSONAL" },
      user.id,
      slugifyAndAddRandomSuffix(user.firstName + " " + user.lastName),
    );
  },
);
