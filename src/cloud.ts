import { getUser } from '@netlify/identity';
import { defaultState, getState, replaceState, subscribe } from './store';
import type { State } from './types';
let revision = 0;
let generation = 0;
let ready = false;
let dirty = false;
let running: Promise<void> | null = null;
let timer: ReturnType<typeof setTimeout>;
let status = 'Loading your study space…';
const listeners = new Set<() => void>();
const photoCache = new Map<string,string>();
export const cloudStatus = () => status;
export function subscribeCloud(fn:()=>void) { listeners.add(fn); return ()=>{listeners.delete(fn)}; }
function report(message:string) { status=message; listeners.forEach(fn=>fn()); }
async function request(path:string, init?:RequestInit) {
  await getUser();
  const res = await fetch(`/.netlify/functions/${path}`, init);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function uploadImages(value:unknown):Promise<unknown> {
  if (typeof value === 'string' && value.startsWith('data:image/')) {
    if (photoCache.has(value)) return photoCache.get(value);
    const blob = await (await fetch(value)).blob();
    const { url } = await request('photo', { method:'POST', headers:{'Content-Type':'image/jpeg'}, body:blob });
    photoCache.set(value,url);return url;
  }
  if (Array.isArray(value)) return Promise.all(value.map(uploadImages));
  if (value && typeof value === 'object') {
    const pairs=[];
    for (const [key,item] of Object.entries(value)) pairs.push([key, await uploadImages(item)]);
    return Object.fromEntries(pairs);
  }
  return value;
}
export async function loadSpace() {
  ready=false;generation++;photoCache.clear();
  const space = await request('space');
  revision=space?.revision??0;
  replaceState(space?.data??structuredClone(defaultState));
  dirty=false; ready=true;
  report('Saved to your account');
}
subscribe(()=>{
  if (!ready) return;
  dirty=true;report('Saving…');clearTimeout(timer);timer=setTimeout(()=>{void saveSpace()},700);
});
export async function saveSpace():Promise<void> {
  clearTimeout(timer);
  if (running) return running;
  const session=generation;
  running=(async()=>{
    try {
      while(dirty && ready) {
        dirty=false;
        const data=await uploadImages(structuredClone(getState()));
        if(!ready||session!==generation)return;
        const saved=await request('space',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({data,revision})});
        revision=saved.revision;
      }
      if(session===generation)report('Saved to your account');
    } catch(e) { if(session!==generation)return;dirty=true;report(e instanceof Error?e.message:'Save failed. Please retry.'); }
    finally { running=null; }
  })();
  return running;
}
export function stopCloud(){generation++;ready=false;dirty=false;clearTimeout(timer);photoCache.clear()}
export function hasPendingChanges(){return dirty || running!==null}
export function importDeviceData() {
  const raw=localStorage.getItem('studora-data-v1');
  if (!raw) throw new Error('No previous device data found.');
  const legacy=JSON.parse(raw) as State;
  if(!legacy || !Array.isArray(legacy.notes) || !Array.isArray(legacy.classes)) throw new Error('Old device data could not be read.');
  const current=getState();
  const merged={...current};
  for(const key of ['classes','periods','notes','assignments','events','goals','reminders'] as const){
    const existing=new Set(current[key].map(item=>item.id));
    (merged[key] as {id:string}[])=[...current[key],...(legacy[key]??[]).filter(item=>!existing.has(item.id))];
  }
  replaceState(merged);
}
window.addEventListener('online',()=>{if(dirty)void saveSpace()});
window.addEventListener('beforeunload',e=>{if(hasPendingChanges()){e.preventDefault();e.returnValue=''}});
