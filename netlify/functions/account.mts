import { admin, getUser, verifyRequestOrigin } from '@netlify/identity';
import { getStore } from '@netlify/blobs';
import { eq } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { studySpaces } from '../../db/schema.js';
export default async (req:Request) => {
  if(req.method!=='DELETE')return new Response('Method not allowed',{status:405});
  try{verifyRequestOrigin(req)}catch{return new Response('Invalid request origin',{status:403})}
  const user=await getUser();
  if(!user)return new Response('Please sign in.',{status:401});
  try{
    // Delete private files and study data before removing the account, so failures can be retried.
    const store=getStore('study-photos');
    const {blobs}=await store.list({prefix:`${user.id}/`});
    await Promise.all(blobs.map(blob=>store.delete(blob.key)));
    await database().delete(studySpaces).where(eq(studySpaces.userId,user.id));
    await admin.deleteUser(user.id);
    return new Response(null,{status:204});
  }catch{return new Response('Unable to finish account deletion. Please retry.',{status:503})}
};
