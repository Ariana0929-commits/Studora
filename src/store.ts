import type { State, Settings } from "./types";

const KEY = "studora-data-v1";
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export const todayYmd = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
export const parseYmd = (s: string) => { const [y=2000,m=1,d=1] = s.split("-").map(Number); return new Date(y,m-1,d); };
export const weekdayIndex = (d: Date) => (d.getDay()+6)%7;
export const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
export const classColors = ["#8fa98a","#d4a5a5","#b7a6cf","#e5cf8a","#9db7d1","#c9a27e","#a3c4bc","#d9a7c7"];
export const defaultSettings: Settings = {
  theme:"sage", mode:"light", accent:"#819b7a", font:"dm", textSize:"md", radius:18, spacing:"comfortable",
  name:"", focusMin:25, breakMin:5, notif:{lead:15,quietStart:"22:00",quietEnd:"07:00",enabled:false}
};
export const defaultState: State = {
  version:1, classes:[], periods:[], assignments:[], events:[], notes:[], goals:[], reminders:[], focusLog:{}, settings:defaultSettings
};
let state: State = defaultState;
const listeners = new Set<() => void>();
let loaded = false;
function normalize(raw: unknown): State {
  if (!raw || typeof raw !== "object") return structuredClone(defaultState);
  const d = raw as Partial<State>;
  return {
    ...structuredClone(defaultState), ...d, version:1,
    classes:Array.isArray(d.classes)?d.classes:[], periods:Array.isArray(d.periods)?d.periods:[],
    assignments:Array.isArray(d.assignments)?d.assignments:[], events:Array.isArray(d.events)?d.events:[],
    notes:Array.isArray(d.notes)?d.notes:[], goals:Array.isArray(d.goals)?d.goals:[],
    reminders:Array.isArray(d.reminders)?d.reminders:[], focusLog:d.focusLog && typeof d.focusLog==="object"?d.focusLog:{},
    settings:{...defaultSettings,...(d.settings??{}),notif:{...defaultSettings.notif,...(d.settings?.notif??{})}}
  };
}
function load() {
  if (loaded || typeof window==="undefined") return;
  loaded=true;
  try { const raw=localStorage.getItem(KEY); if(raw) state=normalize(JSON.parse(raw)); }
  catch { state=structuredClone(defaultState); }
}
export function getState(){load();return state;}
export function subscribe(listener:()=>void){listeners.add(listener);return()=>listeners.delete(listener);}
export function update(mutator:(s:State)=>State) {
  load(); state=mutator(state);
  try { localStorage.setItem(KEY,JSON.stringify(state)); }
  catch { window.dispatchEvent(new CustomEvent("studora-storage-full")); }
  listeners.forEach(l=>l());
}
export function patchSettings(p:Partial<Settings>){update(s=>({...s,settings:{...s.settings,...p}}));}
export function upsert<K extends "classes"|"periods"|"assignments"|"events"|"notes"|"goals"|"reminders">(key:K,item:State[K][number]) {
  update(s=>{const list=s[key] as {id:string}[];const it=item as {id:string};return {...s,[key]:list.some(x=>x.id===it.id)?list.map(x=>x.id===it.id?it:x):[...list,it]};});
}
export function remove(key:"classes"|"periods"|"assignments"|"events"|"notes"|"goals"|"reminders",id:string){
  update(s=>({...s,[key]:(s[key] as {id:string}[]).filter(x=>x.id!==id)}));
}
export function fileToDataUrl(file:File,max=1200,quality=0.78):Promise<string>{
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();reader.onerror=reject;reader.onload=()=>{
      const img=new Image();img.onerror=reject;img.onload=()=>{
        const scale=Math.min(1,max/Math.max(img.width,img.height));const canvas=document.createElement("canvas");
        canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);
        const ctx=canvas.getContext("2d");if(!ctx){reject(new Error("Image processing unavailable"));return;}
        ctx.drawImage(img,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL("image/jpeg",quality));
      };img.src=String(reader.result);
    };reader.readAsDataURL(file);
  });
}
