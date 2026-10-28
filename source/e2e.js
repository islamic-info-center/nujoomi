const {chromium}=require('playwright');
const U='http://127.0.0.1:5173/index.html?emu=1';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const b=await chromium.launch();
 const errs=[];
 const mk=async(name,w,h)=>{const c=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1});const p=await c.newPage();
   p.on('pageerror',e=>errs.push(name+' PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push(name+' CONSOLE '+m.text())});return p};
 const par=await mk('parent',1180,820), kid=await mk('kid',1024,1366);
 await par.goto(U);await par.waitForSelector('#goParent');await par.screenshot({path:'shots/01-welcome.png'});
 await par.click('#goParent');await par.click('#tSignup');
 await par.fill('#aEmail','mom@example.com');await par.fill('#aPass','secret123');await par.click('#authForm button[type=submit]');
 await par.waitForSelector('[data-ptab="requests"]',{timeout:15000});await sleep(800);await par.screenshot({path:'shots/02-parent.png'});
 await par.click('[data-ptab="family"]');await sleep(500);await par.screenshot({path:'shots/03-family.png',fullPage:true});
 await par.click('[data-linkdev="k1"]');await par.waitForSelector('.codeShow');const code=(await par.textContent('.codeShow')).trim();console.log('code',code);
 await par.screenshot({path:'shots/04-code.png'});await par.click('#cClose');
 await kid.goto(U);await kid.waitForSelector('#goKid');await kid.click('#goKid');await kid.fill('#aCode',code.toLowerCase());await kid.screenshot({path:'shots/05-kidcode.png'});
 await kid.click('#codeForm button[type=submit]');await kid.waitForSelector('.hero',{timeout:15000});await sleep(800);
 console.log('kid hero:',(await kid.textContent('.hero h2')).trim(),'roles hidden:',await kid.isHidden('#roles'),'picker:',await kid.$$eval('.kids',x=>x.length));
 await kid.screenshot({path:'shots/06-kid.png'});
 await kid.click('[data-task="h1"]');await kid.click('#yes');await sleep(1500);
 console.log('kid state h1:',await kid.getAttribute('[data-task="h1"]','class'));
 await par.click('[data-ptab="requests"]');await sleep(800);
 console.log('parent pending:',await par.$$eval('.req2',x=>x.length));await par.screenshot({path:'shots/07-pending.png'});
 await par.click('.req2 [data-ok]');await sleep(1500);
 console.log('kid jar:',(await kid.textContent('#jar b')).trim(),'h1:',await kid.getAttribute('[data-task="h1"]','class'));
 // reject flow on another task
 await kid.click('[data-task="h2"]');await kid.click('#yes');await sleep(800);await par.click('[data-ptab="requests"]');await sleep(800);await par.click('.req2 [data-rej]');await sleep(1200);console.log('kid h2 after reject:',await kid.getAttribute('[data-task="h2"]','class'));
 // devices list & pin
 await par.click('[data-ptab="family"]');await sleep(500);
 console.log('devices k1:',await par.$$eval('[data-unlink]',x=>x.length));
 await par.fill('[data-kidform="k1"] input[name=pin]','1234');await par.click('[data-kidform="k1"] button[type=submit]');await sleep(1500);
 console.log('kid pin pad:',await kid.$$eval('.pinPad button',x=>x.length));await kid.screenshot({path:'shots/08-pin.png'});
 for(const d of '1234')await kid.click(`[data-pin="${d}"]`);await sleep(500);
 console.log('after pin hero:',await kid.$$eval('.hero',x=>x.length));
 // reload kid: still linked, pin asked again? (sessionStorage persists in same tab)
 await kid.reload();await kid.waitForSelector('.hero,.pinPad',{timeout:15000});console.log('after reload:',await kid.$$eval('.hero',x=>x.length)?'hero':'pin');
 // parent adds task for k1 only
 await par.click('[data-ptab="tasks"]');await sleep(400);await par.fill('#fTitle','تجربة مهمة');await par.click('#fKids [data-k="k2"]');await par.click('#fKids [data-k="k3"]');await par.click('#addForm button[type=submit]');await sleep(1200);
 console.log('kid sees new task:',(await kid.textContent('#view')).includes('تجربة مهمة'));
 await par.screenshot({path:'shots/09-tasks.png',fullPage:true});
 // unlink
 await par.click('[data-ptab="family"]');await sleep(400);await par.click('[data-unlink]');await sleep(2500);
 console.log('kid after unlink welcome:',await kid.$$eval('#goKid',x=>x.length));
 // logout and login again
 await par.click('#logout');await par.waitForSelector('#goParent');await par.click('#goParent');await par.fill('#aEmail','mom@example.com');await par.fill('#aPass','secret123');await par.click('#authForm button[type=submit]');
 await par.waitForSelector('[data-ptab]',{timeout:15000});await sleep(800);console.log('relogin stars text:',(await par.textContent('.stats')).replace(/\s+/g,' ').slice(0,80));
 // overflow check
 const p3=await mk('phone',400,800);await p3.goto(U);await p3.waitForSelector('#goParent');console.log('phone overflow:',await p3.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
 console.log('ERRORS:',errs.length?errs.join('\n'):'none');
 await b.close();
})().catch(e=>{console.error('FAIL',e);process.exit(1)});
