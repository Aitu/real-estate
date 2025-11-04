import { desc, and, eq, isNull } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from './drizzle';
import { activityLogs, teamMembers, teams, users } from './schema';

export type CurrentUser = {
  id: number;
  name: string | null;
  email: string;
  role: string;
  locale: string | null;
  phoneNumber: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function getUser(): Promise<CurrentUser | null> {
  const session = await auth();
  const userId =
    typeof session?.user?.id === 'string'
      ? Number.parseInt(session.user.id, 10)
      : typeof session?.user?.id === 'number'
      ? session.user.id
      : null;

  if (!userId) {
    return null;
  }

  const user = await db.query.users.findFirst({
    where: and(eq(users.id, userId), isNull(users.deletedAt)),
    columns: {
      id: true,
      name: true,
      email: true,
      role: true,
      locale: true,
      phoneNumber: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
      passwordHash: false,
      deletedAt: false
    }
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    locale: user.locale,
    phoneNumber: user.phoneNumber,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

export async function getTeamByStripeCustomerId(customerId: string) {
  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.stripeCustomerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateTeamSubscription(
  teamId: number,
  subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string;
  }
) {
  await db
    .update(teams)
    .set({
      ...subscriptionData,
      updatedAt: new Date()
    })
    .where(eq(teams.id, teamId));
}

export async function getUserWithTeam(userId: number) {
  const result = await db
    .select({
      user: users,
      teamId: teamMembers.teamId
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .where(eq(users.id, userId))
    .limit(1);

  return result[0];
}

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.userId, user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10);
}

export async function getTeamForUser() {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const result = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
    with: {
      team: {
        with: {
          teamMembers: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      }
    }
  });

  return result?.team || null;
}
