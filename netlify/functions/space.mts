import { getUser, verifyRequestOrigin } from '@netlify/identity';
import { and, eq } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { studySpaces } from '../../db/schema.js';
export default async (req: Request) => {
  if (!['GET','HEAD'].includes(req.method)) { try { verifyRequestOrigin(req); } catch { return new Response('Invalid request origin', { status: 403 }); } }
  const user = await getUser();
  const headers = { 'Cache-Control': 'no-store' };
  if (!user) return new Response('Please sign in.', { status: 401, headers });
  const db = database();
  if (req.method === 'GET') {
    const [space] = await db.select().from(studySpaces).where(eq(studySpaces.userId, user.id));
    return Response.json(space ?? null, { headers });
  }
  if (req.method !== 'PUT') return new Response('Method not allowed', { status: 405 });
  try {
    const body = await req.text();
    if (body.length > 4_500_000) return new Response('Your study space is too large. Export a backup and remove old attachments.', { status: 413 });
    const { data, revision } = JSON.parse(body);
    if (data?.version !== 1 || !['notes','classes','periods','assignments','events','goals','reminders'].every(k => Array.isArray(data[k])) || !data.settings || !data.focusLog || !Number.isInteger(revision)) return new Response('Invalid study data.', { status: 400 });
    if (revision === 0) {
      const [created] = await db.insert(studySpaces).values({ userId: user.id, data }).onConflictDoNothing().returning();
      return created ? Response.json({ revision: created.revision }, { headers }) : new Response('Another device saved changes. Export your work, then reload.', { status: 409 });
    }
    const [saved] = await db.update(studySpaces).set({ data, revision: revision + 1, updatedAt: new Date() }).where(and(eq(studySpaces.userId, user.id), eq(studySpaces.revision, revision))).returning();
    return saved ? Response.json({ revision: saved.revision }, { headers }) : new Response('Another device saved changes. Export your work, then reload.', { status: 409 });
  } catch { return new Response('Unable to save your study space. Please retry.', { status: 500 }); }
};
