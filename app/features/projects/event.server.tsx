import { EventEmitter } from "node:events";
// import { createBoard } from "./board";

export const projectEvent = new EventEmitter();

export const PROJECT_EVENTS = {
  //   NEW_PROJECT: "NEW_PROJECT",
  NEW_INVITE: "NEW_INVITE",
} as const;

projectEvent.on(
  PROJECT_EVENTS.NEW_INVITE,
  async ({
    user,
    project,
    invitee,
    token,
  }: {
    user: { email: string };
    project: { name: string };
    invitee: { name: string };
    token: {
      token: string;
      expiryInDays: number;
    };
  }) => {
    const inviteLink = `http://localhost:3000/dashboard/invitation/${token.token}`;
    // send email
    console.log(
      `Hello, ${invitee.name} has invited you to join ${project.name}. This invitation would expire in ${token.expiryInDays} days.${inviteLink}.`,
    );
  },
);

// projectEvent.on(PROJECT_EVENTS.NEW_PROJECT, async (project: { id: number }) => {
//   const boardPromises = [
//     "Backlog",
//     "Todo",
//     "In Progress",
//     "Done",
//     "Cancelled",
//   ].map((item) => {
//     return createBoard({ name: item, projectId: project.id });
//   });
//   // Create Default Boards
//   await Promise.allSettled(boardPromises);
// });
