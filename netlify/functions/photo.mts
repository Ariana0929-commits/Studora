import { getUser, verifyRequestOrigin } from '@netlify/identity';
import { getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';
export default async (req: Request) => {
  if (!['GET','HEAD'].includes(req.method)) { try { verifyRequestOrigin(req); } catch { return new Response('Invalid request origin', { status: 403 }); } }
  const user = await getUser();
  if (!user) return new Response('Please sign in.', { status: 401 });
  const store = getStore({ name: 'study-photos', consistency: 'strong' });
  if (req.method === 'POST') {
    const mime = req.headers.get('content-type');
    if (mime !== 'image/jpeg') return new Response('Use a JPEG image.', { status: 415 });
    const bytes = await req.arrayBuffer();
    if (bytes.byteLength > 3_000_000) return new Response('Image too large.', { status: 413 });
    const id = createHash('sha256').update(new Uint8Array(bytes)).digest('hex');
    await store.set(`${user.id}/${id}`, bytes);
    return Response.json({ url: `/.netlify/functions/photo?id=${id}` });
  }
  if (req.method !== 'GET') return new Response('Method not allowed', { status: 405 });
  const id = new URL(req.url).searchParams.get('id') ?? '';
  if (!/^[a-f0-9]{64}$/.test(id)) return new Response('Invalid photo', { status: 400 });
  const data = await store.get(`${user.id}/${id}`, { type: 'arrayBuffer' });
  return data ? new Response(data, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, no-store' } }) : new Response('Photo not found', { status: 404 });
};
