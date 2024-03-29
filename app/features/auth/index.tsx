import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "~/db/db.server";
import { users } from "~/db/schema/users";
import {
  credentialsLoginSchema,
  credentialsSignupSchema,
  type ICredentialsLogin,
  type ICredentialsSignUp,
} from "./shared";
import {
  type Session,
  createCookieSessionStorage,
  redirect,
} from "@remix-run/node";
import { env } from "~/env";
import { generateAvatarThumbnail } from "~/lib/utils";

export async function credentialsLogin(credentials: ICredentialsLogin) {
  credentialsLoginSchema.parse(credentials);

  const usersRow = await db
    .select()
    .from(users)
    .where(eq(users.email, credentials.email.toLowerCase()));

  const user = usersRow[0];

  if (!user || !user.password) {
    return null;
  }

  const isCorrectPassword = await bcrypt.compare(
    credentials.password,
    user.password,
  );

  if (!isCorrectPassword) {
    return null;
  }

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

export async function credentialsSignUp(credentials: ICredentialsSignUp) {
  credentialsSignupSchema.parse(credentials);

  const email = credentials.email.toLowerCase();

  const usersRow = await db.select().from(users).where(eq(users.email, email));

  const existingUser = usersRow[0];

  if (existingUser) throw new Error("Account already exists.");

  const passwordHash = await bcrypt.hash(credentials.password, 10);

  const defaultProfile = generateAvatarThumbnail(
    (credentials.firstName + " " + credentials.lastName)
      .trim()
      .split(" ")
      .map((i) => i[0].toUpperCase()) // Get initials
      .filter(Boolean)
      .join(""),
  );

  await db.insert(users).values({
    ...credentials,
    email,
    password: passwordHash,
    profilePhoto: defaultProfile,
  });

  const newUser = (
    await db.select().from(users).where(eq(users.email, email))
  )[0];

  return {
    id: newUser.id,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
  };
}

const storage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    secrets: [env.SESSION_SECRET],
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
  },
});

export function getAuthSession(request: Request) {
  return storage.getSession(request.headers.get("Cookie"));
}

export function commitAuthSession(session: Session) {
  return storage.commitSession(session);
}

export async function getUserId(request: Request) {
  const session = await getAuthSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "number") {
    return null;
  }
  return userId;
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname,
) {
  const session = await getAuthSession(request);
  const userId = session.get("userId");

  if (!userId || typeof userId !== "number") {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }

  return userId;
}

export async function createAuthSession(userId: number, redirectTo: string) {
  const session = await storage.getSession();
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session),
    },
  });
}

//   if (!user) {
//     throw await logout(request);
//   }

//   return user;
// }

export async function logout(request: Request) {
  const session = await getAuthSession(request);

  return redirect("/login", {
    headers: {
      "Set-Cookie": await storage.destroySession(session),
    },
  });
}
