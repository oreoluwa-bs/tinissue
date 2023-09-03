import { EventEmitter } from "node:events";

export const teamEvent = new EventEmitter();

export const TEAM_EVENTS = {
  NEW_INVITE: "NEW_INVITE",
} as const;

teamEvent.on(
  TEAM_EVENTS.NEW_INVITE,
  async ({
    user,
    team,
    invitee,
    token,
  }: {
    user: { email: string };
    team: { name: string };
    invitee: { name: string };
    token: {
      token: string;
      expiryInDays: number;
    };
  }) => {
    const inviteLink = `http://localhost:3000/dashboard/invitation/${token.token}`;
    // send email
    console.log(
      `Hello, ${invitee.name} has invited you to join ${team.name}. This invitation would expire in ${token.expiryInDays} days.${inviteLink}.`,
    );
  },
);
