import { test, expect } from '@playwright/test';
test('email account, scanned note review, cloud reload, and timetable review',async({page})=>{
  const user={id:'test-study-user',email:'learner@example.test',confirmed_at:new Date().toISOString(),app_metadata:{provider:'email'},user_metadata:{full_name:'Learner'}};
  const jwt=[{alg:'HS256',typ:'JWT'},{sub:user.id,email:user.email,exp:Math.floor(Date.now()/1000)+3600,aud:'authenticated'},{}].map(value=>Buffer.from(JSON.stringify(value)).toString('base64url')).join('.');
  let saved:any=null;
  let conflict=false;
  await page.route('**/.netlify/identity/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    const data=path.endsWith('/settings')?{autoconfirm:true,external:{}}:path.endsWith('/token')?{access_token:jwt,token_type:'bearer',expires_in:3600,refresh_token:crypto.randomUUID(),user}:user;
    await route.fulfill({json:data});
  });
  await page.route('**/.netlify/functions/space',async route=>{
    if(route.request().method()==='PUT'){
      if(conflict){await route.fulfill({status:409,body:'Another device saved changes. Export your work, then reload.'});return}
      const body=route.request().postDataJSON();saved={data:body.data,revision:body.revision+1};await route.fulfill({json:{revision:saved.revision}});
    }else await route.fulfill({json:saved});
  });
  await page.route('**/.netlify/functions/scan',route=>route.fulfill({json:{text:'Biology notes\nCells contain a nucleus.',periods:[{label:'Biology',start:'09:00',end:'10:00',kind:'class'}]}}));
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'Welcome back'})).toBeVisible();
  await page.getByLabel('Email',{exact:true}).fill(user.email);
  await page.getByLabel('Password',{exact:true}).fill(crypto.randomUUID());
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page.getByRole('heading',{name:'A calm day starts here'})).toBeVisible();
  await page.getByRole('button',{name:'Notes',exact:true}).click();
  await page.getByRole('button',{name:'New note',exact:true}).click();
  await page.getByLabel('Title',{exact:true}).fill('Cell revision');
  const image=await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=400;canvas.height=200;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#ffffff';ctx.fillRect(0,0,400,200);ctx.fillStyle='#222222';ctx.font='24px sans-serif';ctx.fillText('Biology notes',20,50);return canvas.toDataURL('image/png').split(',')[1]});
  await page.locator('.photo-scanner input[type=file]').first().setInputFiles({name:'notes.png',mimeType:'image/png',buffer:Buffer.from(image,'base64')});
  await page.getByRole('button',{name:'Read photo',exact:true}).click();
  await expect(page.getByLabel('Your notes',{exact:true})).toHaveValue('Biology notes\nCells contain a nucleus.');
  await page.getByLabel('Your notes',{exact:true}).fill('Reviewed: cells contain a nucleus.');
  await page.getByRole('button',{name:'Save',exact:true}).click();
  await expect(page.getByText('Saved to your account',{exact:true})).toBeVisible();
  expect(saved.data.notes[0].body).toBe('Reviewed: cells contain a nucleus.');
  await page.reload();
  await expect(page.getByRole('heading',{name:'A calm day starts here'})).toBeVisible();
  await page.getByRole('button',{name:'Notes',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Cell revision',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Timetable',exact:true}).click();
  await page.locator('.photo-scanner input[type=file]').first().setInputFiles({name:'timetable.png',mimeType:'image/png',buffer:Buffer.from(image,'base64')});
  await page.getByRole('button',{name:'Read photo',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Review scanned periods'})).toBeVisible();
  await page.getByLabel('End',{exact:true}).fill('08:00');
  await expect(page.getByRole('button',{name:'Save reviewed periods'})).toBeDisabled();
  await page.getByLabel('End',{exact:true}).fill('10:00');
  await page.getByRole('button',{name:'Save reviewed periods'}).click();
  await expect(page.getByText('Saved to your account',{exact:true})).toBeVisible();
  expect(saved.data.periods).toHaveLength(1);
  conflict=true;
  await page.getByRole('button',{name:'Notes',exact:true}).click();
  await page.getByRole('button',{name:'Edit note',exact:true}).click();
  await page.getByLabel('Your notes',{exact:true}).fill('Keep this unsaved revision for export.');
  await page.getByRole('button',{name:'Save',exact:true}).click();
  await expect(page.getByText('Another device saved changes. Export your work, then reload.',{exact:true})).toBeVisible();
  await expect(page.getByText('Keep this unsaved revision for export.',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Sign out',exact:true}).click();
  await expect(page.getByText('Save your changes before signing out.',{exact:true})).toBeVisible();
  expect(saved.data.notes[0].body).toBe('Reviewed: cells contain a nucleus.');
});
test('mobile signup and password recovery remain usable',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.route('**/.netlify/identity/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    await route.fulfill({json:path.endsWith('/settings')?{autoconfirm:false,external:{}}:path.endsWith('/signup')?{id:'pending-user',email:'learner@example.test',user_metadata:{},app_metadata:{}}:{}});
  });
  await page.goto('/');
  await page.getByRole('button',{name:'Create an account',exact:true}).click();
  await page.getByLabel('Your name').fill('Learner');
  await page.getByLabel('Email',{exact:true}).fill('learner@example.test');
  await page.getByLabel('Password',{exact:true}).fill(crypto.randomUUID());
  await page.getByRole('button',{name:'Create account',exact:true}).click();
  await expect(page.getByText('Check your inbox to confirm your email, then return here to sign in.')).toBeVisible();
  await page.getByRole('button',{name:'Forgot password?'}).click();
  await page.getByRole('button',{name:'Send reset link'}).click();
  await expect(page.getByText('Check your inbox for a password reset link.')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:'/tmp/studora-account-mobile.png'});
});
