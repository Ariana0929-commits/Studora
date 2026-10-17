import { createWorker, PSM } from 'tesseract.js';
import { getUser } from '@netlify/identity';
import { DAYS, fileToDataUrl } from './store';
import type { Period } from './types';
export type ScanResult = { text:string; periods:Partial<Period>[] };
export function printedPeriods(text:string):Partial<Period>[] {
  const result:Partial<Period>[]=[];
  const time='(\\d{1,2})[:.](\\d{2})\\s*(am|pm)?';
  const regex=new RegExp(time+'\\s*(?:-|–|—|to)\\s*'+time,'i');
  for(const line of text.split('\n')) {
    const m=line.match(regex);if(!m)continue;
    const format=(h:string,min:string,ap:string)=>{let hour=Number(h);if(Number(min)>59 || hour>23 || (ap && (hour<1||hour>12)))return '';if(ap)hour=hour%12+(ap.toLowerCase()==='pm'?12:0);return `${String(hour).padStart(2,'0')}:${min}`};
    const start=format(m[1],m[2],m[3]);const end=format(m[4],m[5],m[6]);
    if(!start||!end||start>=end)continue;
    const label=line.replace(m[0],'').replace(/^[\s:|\-]+|[\s:|\-]+$/g,'')||'Review class name';
    result.push({start,end,label,kind:/lunch/i.test(label)?'lunch':/break|free/i.test(label)?'free':'class'});
  }
  return result;
}
export async function scanImage(file:File,mode:'text'|'timetable',day:number,printed:boolean,onProgress:(s:string)=>void):Promise<ScanResult> {
  if (!file.type.startsWith('image/'))throw new Error('Choose an image file.');
  if(file.size>25_000_000)throw new Error('Choose an image smaller than 25 MB.');
  onProgress('Preparing a clear image…');
  const image=await fileToDataUrl(file,2400,.92);
  if(!printed){
    onProgress('Reading handwriting and printed text…');
    await getUser();
    const res=await fetch('/.netlify/functions/scan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image,mode,day:DAYS[day]}),signal:AbortSignal.timeout(55000)});
    if(!res.ok)throw new Error(await res.text());
    return res.json();
  }
  onProgress('Loading printed-text recognition…');
  const worker=await createWorker('eng',1,{logger:m=>{if(m.status==='recognizing text')onProgress(`Reading printed text… ${Math.round(m.progress*100)}%`)}});
  try {
    await worker.setParameters({tessedit_pageseg_mode:PSM.AUTO,preserve_interword_spaces:'1'});
    const result=await worker.recognize(image,{rotateAuto:true});
    return {text:result.data.text,periods:printedPeriods(result.data.text)};
  } finally {await worker.terminate()}
}
