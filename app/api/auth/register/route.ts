import { NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import {
  ActivityType,
  NewActivityLog,
  NewTeam,
  NewTeamMember,
  NewUser,
  activityLogs,
  invitations,
  teamMembers,
  teams,
  users
} from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth/session';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  inviteId: z.string().optional(),
  locale: z.string().optional()
});

async function logActivity(
  teamId: number | null | undefined,
  userId: number,
  type: ActivityType,
  ipAddress?: string
) {
  if (!teamId) {
    return;
  }

  const entry: NewActivityLog = {
    teamId,
    userId,
    action: type,
    ipAddress: ipAddress ?? ''
  };

  await db.insert(activityLogs).values(entry);
}

export async function POST(request: Request) {
  const ipAddress = request.headers.get('x-forwarded-for') ?? undefined;

  const payload = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid registration payload.'
      },
      { status: 400 }
    );
  }

  const { email, password, inviteId, locale } = parsed.data;

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    return NextResponse.json(
      {
        error: 'An account with this email already exists.'
      },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);

  const newUser: NewUser = {
    email,
    passwordHash,
    role: 'owner',
    locale: locale ?? 'en'
  };

  const [createdUser] = await db.insert(users).values(newUser).returning();

  if (!createdUser) {
    return NextResponse.json(
      {
        error: 'We were unable to create your account. Please try again.'
      },
      { status: 500 }
    );
  }

  let teamId: number | null = null;
  let teamRecord: typeof teams.$inferSelect | null = null;

  if (inviteId) {
    const [invite] = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.id, Number(inviteId)),
          eq(invitations.email, email),
          eq(invitations.status, 'pending')
        )
      )
      .limit(1);

    if (!invite) {
      return NextResponse.json(
        {
          error: 'Invitation is invalid or has expired.'
        },
        { status: 400 }
      );
    }

    teamId = invite.teamId;

    await Promise.all([
      db
        .update(invitations)
        .set({ status: 'accepted' })
        .where(eq(invitations.id, invite.id)),
      logActivity(teamId, createdUser.id, ActivityType.ACCEPT_INVITATION, ipAddress || undefined)
    ]);

    [teamRecord] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
  } else {
    const newTeam: NewTeam = {
      name: `${email.split('@')[0]}'s Team`
    };

    [teamRecord] = await db.insert(teams).values(newTeam).returning();

    if (!teamRecord) {
      return NextResponse.json(
        {
          error: 'Failed to create a workspace for your account.'
        },
        { status: 500 }
      );
    }

    teamId = teamRecord.id;

    await logActivity(teamId, createdUser.id, ActivityType.CREATE_TEAM, ipAddress || undefined);
  }

  if (teamId && teamRecord) {
    const teamMember: NewTeamMember = {
      teamId,
      userId: createdUser.id,
      role: inviteId ? 'member' : 'owner'
    };

    await db.insert(teamMembers).values(teamMember);
  }

  if (teamId) {
    await logActivity(teamId, createdUser.id, ActivityType.SIGN_UP, ipAddress || undefined);
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
