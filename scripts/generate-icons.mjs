import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const source=await readFile('public/app-icon.svg','utf8');
const browser=await chromium.launch();
const page=await browser.newPage();
async function icon(path,size,foreground=false){
  await page.setViewportSize({width:size,height:size});
  const svg=foreground?source.replace(/<rect[^>]+\/>/,'').replace('<g fill=', '<g transform="translate(174 174) scale(.66)" fill='):source.replace('rx="224"','rx="0"');
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{width:100vw;height:100vh;display:block}</style>${svg}`);
  await page.screenshot({path,omitBackground:foreground});
}
await icon('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png',1024);
for(const [density,size] of Object.entries({mdpi:48,hdpi:72,xhdpi:96,xxhdpi:144,xxxhdpi:192})){
  const base=`android/app/src/main/res/mipmap-${density}`;
  await icon(`${base}/ic_launcher.png`,size);
  await icon(`${base}/ic_launcher_round.png`,size);
  await icon(`${base}/ic_launcher_foreground.png`,size*2.25,true);
}
await browser.close();
