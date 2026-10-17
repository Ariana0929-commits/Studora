import { test } from 'node:test';
import assert from 'node:assert/strict';
import { printedPeriods } from '../src/scanner';
import scan from '../netlify/functions/scan.mts';
import space from '../netlify/functions/space.mts';
import photo from '../netlify/functions/photo.mts';
import account from '../netlify/functions/account.mts';
test('reads printed time ranges with varied punctuation and class names',()=>{
  assert.deepEqual(printedPeriods('9:05 – 10:10 Biology\n12.15 to 12.45 Lunch'),[
    {start:'09:05',end:'10:10',label:'Biology',kind:'class'},
    {start:'12:15',end:'12:45',label:'Lunch',kind:'lunch'},
  ]);
});
test('converts noon, midnight, and explicit AM/PM',()=>{
  assert.equal(printedPeriods('12:05 am - 1:10 am Study')[0].start,'00:05');
  assert.equal(printedPeriods('12:00 pm — 1:30 pm Break')[0].end,'13:30');
});
test('rejects impossible and uncertain ranges',()=>{
  assert.equal(printedPeriods('25:00 - 26:00 Maths\n09:75 - 10:00 Notes\n10:00 - 09:00 Reversed\nNo times here').length,0);
});
test('private API endpoints reject unsigned requests',async()=>{
  for(const handler of [scan,space,photo,account]){
    const method=handler===space||handler===photo?'GET':handler===account?'DELETE':'POST';
    const result=await handler(new Request('https://studora1.netlify.app/.netlify/functions/test',{method,headers:{Origin:'https://studora1.netlify.app'}}));
    assert.equal(result.status,401);
  }
});
test('mutation endpoints reject cross-origin requests',async()=>{
  for(const handler of [scan,space,photo,account]){
    const result=await handler(new Request('https://studora1.netlify.app/.netlify/functions/test',{method:handler===account?'DELETE':'POST',headers:{Origin:'https://unrelated.invalid'}}));
    assert.equal(result.status,403);
  }
});
