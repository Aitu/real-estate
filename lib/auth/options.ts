import type { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { z } from 'zod';

import { db } from '@/lib/db/drizzle';
import {
  ActivityType,
  NewActivityLog,
  NewTeam,
  NewTeamMember,
  NewUser,
  activityLogs,
  teamMembers,
  teams,
  users
} from '@/lib/db/schema';
import { comparePasswords, hashPassword } from '@/lib/auth/session';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

async function createTeamForUser(user: typeof users.$inferSelect) {
  const newTeam: NewTeam = {
    name: `${user.email.split('@')[0]}'s Team`
  };

  const [team] = await db.insert(teams).values(newTeam).returning();
  if (!team) {
    return null;
  }

  const membership: NewTeamMember = {
    teamId: team.id,
    userId: user.id,
    role: 'owner'
  };
  await db.insert(teamMembers).values(membership);

  const activity: NewActivityLog = {
    teamId: team.id,
    userId: user.id,
    action: ActivityType.CREATE_TEAM,
    ipAddress: ''
  };

  const signupActivity: NewActivityLog = {
    teamId: team.id,
    userId: user.id,
    action: ActivityType.SIGN_UP,
    ipAddress: ''
  };

  await db.insert(activityLogs).values([activity, signupActivity]);
  return team;
}

const providers: NextAuthOptions['providers'] = [
  Credentials({
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' }
    },
    authorize: async (credentials) => {
      const parsed = credentialsSchema.safeParse(credentials);
      if (!parsed.success) {
        return null;
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, parsed.data.email))
        .limit(1);

      if (!user) {
        return null;
      }

      const isValid = await comparePasswords(
        parsed.data.password,
        user.passwordHash
      );
      if (!isValid) {
        return null;
      }

      return {
        id: String(user.id),
        email: user.email,
        name: user.name ?? undefined,
        image: user.avatarUrl ?? undefined,
        role: user.role,
        locale: user.locale ?? 'en'
      } satisfies Record<string, unknown>;
    }
  })
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    })
  );
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt'
  },
  secret: process.env.AUTH_SECRET,
  providers,
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== 'google' || !profile?.email) {
        return true;
      }

      const email = profile.email;
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!existing) {
        const passwordHash = await hashPassword(randomUUID());
        const newUser: NewUser = {
          email,
          passwordHash,
          name: profile.name ?? null,
          avatarUrl:
            'picture' in profile
              ? ((profile.picture as string | null | undefined) ?? null)
              : null,
          role: 'owner'
        };

        const [createdUser] = await db
          .insert(users)
          .values(newUser)
          .returning();
        if (!createdUser) {
          return false;
        }

        await createTeamForUser(createdUser);
      } else {
        const updates: Partial<typeof users.$inferInsert> = {};
        if (!existing.avatarUrl && 'picture' in profile && profile.picture) {
          updates.avatarUrl = profile.picture as string;
        }
        if (!existing.name && profile.name) {
          updates.name = profile.name;
        }

        if (Object.keys(updates).length > 0) {
          await db.update(users).set(updates).where(eq(users.id, existing.id));
        }
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const maybeRole = (user as unknown as { role?: unknown }).role;
        const role = typeof maybeRole === 'string' ? maybeRole : 'member';
        const maybeLocale = (user as unknown as { locale?: unknown }).locale;
        const locale = typeof maybeLocale === 'string' ? maybeLocale : 'en';
        token.role = role;
        token.locale = locale;
      } else if (token.email) {
        const [existing] = await db
          .select({ id: users.id, role: users.role, locale: users.locale })
          .from(users)
          .where(eq(users.email, token.email))
          .limit(1);
        if (existing) {
          token.id = existing.id.toString();
          token.role = existing.role;
          token.locale = existing.locale ?? 'en';
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.locale = token.locale as string;
      }

      return session;
    }
  }
};
