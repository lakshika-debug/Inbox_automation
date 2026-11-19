const {chromium}=require('playwright');
const SHOTS='/Users/arjuna/Documents/inbox automation/Inbox_automation/.agents/tasks/inbox-v2/shots/';
const URL='http://127.0.0.1:3000/';
const results=[];const errors=[];
const rec=(group,name,ok,detail='')=>{results.push({group,name,ok:!!ok,detail});console.log(`${ok?'PASS':'FAIL'} [${group}] ${name}${detail?' :: '+detail:''}`);};
(async()=>{
 require('fs').mkdirSync(SHOTS,{recursive:true});
 const browser=await chromium.launch({channel:'chrome'});
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text()+' @ '+JSON.stringify(m.location()));});
 page.on('response',r=>{if(r.status()>=400)console.log('HTTP',r.status(),r.url());});
 page.on('pageerror',e=>errors.push('pageerror: '+e.message));
 const fresh=async()=>{await page.goto(URL,{waitUntil:'load'});await page.waitForSelector('#rows tr');};
 const row=id=>page.locator(`#rows tr[onclick="openPanel(${id})"]`);
 const closeP=async()=>{if(await page.locator('#panel').evaluate(e=>e.classList.contains('visible')))await page.locator('#panel .close').click();};
 const clickRow=async(id,sel)=>{await closeP();await row(id).locator(sel).first().click();};
 const statusText=async id=>(await row(id).locator('td').nth(3).innerText()).trim();
 const dlgTitle=()=>page.locator('#dialogTitle').innerText();
 const dlgText=()=>page.locator('#dialogContent').innerText();
 const shadeVisible=()=>page.locator('#shade').evaluate(e=>e.classList.contains('visible'));
 const menuItems=()=>page.locator('#menu button').evaluateAll(bs=>bs.map(b=>({t:b.innerText.replace(/\s+/g,' ').trim(),d:b.disabled})));
 const toastText=()=>page.locator('#toast').innerText();
 const C='QA';

 await fresh();
 // 1
 const ths=await page.locator('.emailtable thead th').allInnerTexts();
 rec(C,'No Type column, no Type filter, no "Test 24-hour rule" button',!ths.includes('Type')&&ths.length===6&&ths[5]==='Action'&&await page.locator('#typeFilter').count()===0&&await page.locator('.scenario-btn').count()===0&&!(await page.locator('body').innerText()).includes('24-hour rule'),'headers='+ths.join('|'));
 // 2
 const opts=await page.locator('#statusFilter option').allInnerTexts();
 const sts=await page.locator('#rows tr td:nth-child(4)').allInnerTexts();
 let filterOk=true;const counts={};
 for(const v of ['Action needed','Done','No action']){await page.selectOption('#statusFilter',v);const s=await page.locator('#rows tr td:nth-child(4)').allInnerTexts();counts[v]=s.length;if(!s.every(x=>x.trim()===v))filterOk=false;}
 await page.selectOption('#statusFilter','all');
 rec(C,'Status shows only Action needed / Done / No action; filter has the same three values',JSON.stringify(opts)==='["All statuses","Action needed","Done","No action"]'&&sts.every(s=>['Action needed','Done','No action'].includes(s.trim()))&&filterOk&&counts['Action needed']+counts.Done+counts['No action']===12,`options=${opts.join('|')} counts=${JSON.stringify(counts)}`);
 // 3
 const r5=row(5);const r5act=await r5.locator('td').nth(5).innerText();
 rec(C,'Broken security door: Action needed, "Actions ▾", no recommendation',(await statusText(5))==='Action needed'&&r5act.includes('Actions ▾')&&await r5.locator('.smain').count()===0,'action cell='+r5act.trim());
 // 4
 const ids=[12,11,1,2,3,4,5,6,7,8,9,10];let eyeOk=true;
 for(const id of ids){if(await row(id).locator('.row-icon').count()!==1){eyeOk=false;continue;}await clickRow(id,'.row-icon');const vis=await page.locator('#panel').evaluate(e=>e.classList.contains('visible'));const subj=await page.locator('#panel .ptitle').innerText();const rs=(await row(id).locator('td').nth(1).innerText()).split('\n')[0].trim();if(!vis||subj.trim()!==rs)eyeOk=false;}
 await closeP();
 rec(C,'Every row has an eye icon that opens the side panel',eyeOk,'12 rows checked');
 // 5
 const mains=await page.locator('#rows .smain').allInnerTexts();
 let menuOk=true,menuDetail=[];
 for(const id of [12,3,4,8,10]){await clickRow(id,'.smore');const it=await menuItems();const recd=it.filter(x=>x.t.includes('✦ Recommended'));const main=(await row(id).locator('.smain').innerText()).replace('✦','').trim();menuDetail.push(`${id}:${it.length} items, rec=${recd.map(x=>x.t).join()}`);
  const SH={'Create QR':'Create Quote Request','Create WO':'Create Work Order','Link to WO':'Link to Work Order','Link to QR':'Link to Quote Request'};
  if(recd.length!==1||!recd[0].t.startsWith(SH[main])||it.length<5)menuOk=false;await page.mouse.click(5,890);}
 rec(C,'Recommended action shows ✦ + action name, never a record number; ▾ lists all actions with the recommended one tagged',mains.length===5&&mains.every(m=>m.includes('✦')&&!/(WO|QR|SR)\d/.test(m))&&menuOk,'buttons='+mains.map(m=>m.replace(/\s+/g,' ')).join(' / ')+' ; '+menuDetail.join(' ; '));
 // screenshot table + menu
 await page.screenshot({path:SHOTS+'01-table.png',fullPage:false});
 await clickRow(10,'.smore');await page.screenshot({path:SHOTS+'04-action-menu.png'});
 const m10=await menuItems();
 await page.mouse.click(5,890);
 // 6 email 6 chip
 const c6=(await row(6).locator('td').nth(4).innerText()).replace(/\s+/g,' ');
 // email 10 panel screenshots before change
 await row(10).locator('td').first().click();await page.screenshot({path:SHOTS+'02-panel-email10.png'});
 const p10=await page.locator('#panelContent').innerText();
 const order=await page.locator('#panelContent').evaluate(c=>{const b=c.querySelector('.panelbody');const kids=[...b.children].map(k=>k.classList.contains('ai')?'ai':k.id==='linksBox'?'links':(t=>t.includes('Original Email')?'Original Email':t.includes('AI-filled details')?'AI-filled details':t)(k.querySelector('h3')?.innerText||'?'));const foot=c.lastElementChild.classList.contains('panelfoot');const btn=!!c.querySelector('.panelfoot .split');return kids.concat(foot&&btn?['footer+button']:[]);});
 rec(C,'Side panel order: AI result → Linked records → AI-filled details → Original email → footer button',JSON.stringify(order)===JSON.stringify(['ai','links','AI-filled details','Original Email','footer+button']),'order='+order.join(' → '));
 const pend10=await page.locator('#linksBox .pending').count(),lrows10=await page.locator('#linksBox .lrow').allInnerTexts();
 await row(3).locator('td').first().click();await page.screenshot({path:SHOTS+'03-panel-email3.png'});
 // 7 create WO on email 10 via row button
 await clickRow(10,'.smain');
 const t05=await dlgTitle(),sp05=await page.locator('#m-sp').inputValue(),sub0=await page.locator('#submitForm').isDisabled();
 const bl=await page.locator('#dialogContent label.opt',{hasText:'BlueLine'}).locator('input').isDisabled();
 await page.screenshot({path:SHOTS+'05-new-wo.png'});
 await page.locator('#c1').check();const sub1=await page.locator('#submitForm').isDisabled();
 await page.locator('#submitForm').click();
 const toast10=await toastText();
 const cell10=(await row(10).locator('td').nth(4).innerText()).replace(/\s+/g,' ');
 const st10=await statusText(10);
 const ovf=await page.evaluate(()=>[...document.querySelectorAll('#rows td:nth-child(5)')].filter(td=>td.scrollWidth>td.clientWidth+1).length);rec('Extra','Linked Record cells do not overflow into the Action column after Create WO',ovf===0,'overflowing cells='+ovf);
 await clickRow(10,'.plus');
 const inView=await page.locator('#linksBox').evaluate(el=>{const r=el.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0;});
 const lrows10b=(await page.locator('#linksBox .lrow').allInnerTexts()).map(s=>s.replace(/\s+/g,' '));
 rec(C,'Linked Record chips; email 6 = QR002215 · from SR0003; email 10 after Create WO = new WO chip + "+1"; "+1" opens Linked records',c6.includes('QR002215')&&c6.includes('from SR0003')&&!c6.includes('SR0003 ·')&&cell10.includes('WO620041')&&cell10.includes('+1')&&inView,`email6="${c6}" email10="${cell10}" linksBox in view=${inView}`);
 rec(C,'Email 10: invoice link to WO615003 + pending row; Create WO adds second link, status Done',pend10===1&&lrows10.length===1&&lrows10[0].includes('WO615003')&&lrows10b.some(s=>s.includes('WO620041'))&&lrows10b.some(s=>s.includes('WO615003'))&&st10==='Done'&&await page.locator('#linksBox .pending').count()===0,`before: pending=${pend10}, rows=${lrows10.length}; after: status=${st10}, rows=${lrows10b.join(' | ')}`);
 // menu for email 10 had Create SR enabled
 const csr10=m10.find(x=>x.t.startsWith('Create Service Request'));

 // 8 L2
 await fresh();await clickRow(3,'.smore');const m3=await menuItems();const csr3=m3.find(x=>x.t.startsWith('Create Service Request'));
 rec(C,'Create Service Request disabled once the email has an SR (L2)',csr3&&csr3.d&&csr3.t.includes('Already created')&&csr10&&!csr10.d,`email3: "${csr3&&csr3.t}" disabled=${csr3&&csr3.d}; email10 (no SR): disabled=${csr10&&csr10.d}`);
 await page.mouse.click(5,890);
 // 9 L3
 await row(10).locator('td').first().click();await page.locator('#panel .addlink').click();await page.locator('#menu button',{hasText:'Link to Work Order'}).click();
 const wo615=page.locator('#lk-results label.opt',{hasText:'WO615003'});
 const l3=await wo615.locator('input').isDisabled(),l3t=(await wo615.innerText()).replace(/\s+/g,' ');const chk=await page.locator('#lk-results input:checked').getAttribute('value');
 await page.screenshot({path:SHOTS+'06-link-wo.png'});
 await page.fill('#lk-q','harbour');const filt=await page.locator('#lk-results label.opt').allInnerTexts();
 rec(C,'Linking a WO already linked to the email is disabled as "Already linked" (L3)',l3&&l3t.includes('Already linked')&&chk==='WO620021'&&filt.length===1,`"${l3t}" disabled=${l3}; default checked=${chk}; search "harbour" -> ${filt.length} result`);
 await page.locator('#dialogFoot button',{hasText:'Cancel'}).click();
 // 10 L4
 await row(2).locator('td').first().click();await page.locator('#panel .ai .change').click();const hd2=await page.locator('#menu .mh').innerText();
 await page.locator('#menu button',{hasText:'Create Quote Request'}).click();const l4=await dlgText();
 rec(C,'Replace an invoice link with Create QR: confirm shows "The invoice will be removed from…" (L4)',(await dlgTitle())==='Please confirm'&&l4.includes('The invoice will be removed from WO613048.')&&l4.includes('Then: Create Quote Request.'),`menu heading="${hd2}" text="${l4.replace(/\s+/g,' ').trim()}"`);
 await page.locator('#dialogFoot button',{hasText:'Confirm'}).click();
 const t4=await dlgTitle(),note4=await page.locator('#dialogContent .ai small').innerText();
 await page.selectOption('#m-sp','RESVU – ESTATE');await page.locator('#c2').check();await page.locator('#submitForm').click();
 const cell2=(await row(2).locator('td').nth(4).innerText()).replace(/\s+/g,' ');const lr2=(await page.locator('#linksBox .lrow').allInnerTexts()).map(s=>s.replace(/\s+/g,' '));
 rec('Extra','L4 follow-through: confirm opens New Quote Request, submit replaces WO613048',t4==='New Quote Request'&&note4.startsWith('A Service Request will be created')&&!lr2.some(s=>s.includes('WO613048'))&&cell2.includes('QR002217'),`cell="${cell2}" links=${lr2.join(' | ')}`);
 // 11 L5
 await fresh();await row(3).locator('td').first().click();await page.locator('#panel .ai .change').click();const hd3=await page.locator('#menu .mh').innerText();
 const m3r=await menuItems();
 await page.locator('#menu button',{hasText:'Link to Quote Request'}).click();const l5=await dlgText();
 rec(C,'Replace SR0001 with Link to QR: confirm shows "Service Request SR0001 will be cancelled (created in error)" (L5)',l5.includes('Service Request SR0001 will be cancelled (created in error).')&&l5.includes('Then: Link to Quote Request.'),`heading="${hd3}" text="${l5.replace(/\s+/g,' ').trim()}" ; menu=${m3r.map(x=>x.t+(x.d?'[disabled]':'')).join(', ')}`);
 await page.locator('#dialogFoot button',{hasText:'Confirm'}).click();await page.locator('#dialogFoot button',{hasText:'Link'}).click();
 const lr3=(await page.locator('#linksBox .lrow').allInnerTexts()).map(s=>s.replace(/\s+/g,' '));
 rec('Extra','L5 follow-through: SR0001 kept as Cancelled, QR002208 linked as Quote, status Done',lr3.some(s=>s.includes('SR0001')&&s.includes('Cancelled'))&&lr3.some(s=>s.includes('QR002208')&&s.includes('Quote'))&&(await statusText(3))==='Done',lr3.join(' | '));
 // 12 L6
 await fresh();await row(1).locator('td').first().click();await page.locator('#linksBox .kebab').first().click();const lm=await menuItems();const lmh=await page.locator('#menu .mh').innerText();
 await page.locator('#menu button',{hasText:'Remove link'}).click();const l6a=await dlgText(),l6at=await dlgTitle();
 await page.screenshot({path:SHOTS+'07-change-not-possible.png'});
 await page.locator('#dialogFoot button',{hasText:'OK'}).click();
 await row(6).locator('td').first().click();const kebabs=page.locator('#linksBox .lrow');const n6=await kebabs.count();
 await page.locator('#linksBox .kebab[aria-label="Link actions for SR0003"]').click();await page.locator('#menu button',{hasText:'Remove link'}).click();const l6b=await dlgText(),l6bt=await dlgTitle();
 await page.locator('#dialogFoot button',{hasText:'OK'}).click();
 rec(C,'Remove on WO619624 (invoice submitted) or SR0003 (converted) shows "Change not possible" with the reason (L6)',l6at==='Change not possible'&&l6a.includes('WO619624: the invoice is already invoice submitted and cannot be removed from the record.')&&l6bt==='Change not possible'&&l6b.includes('SR0003 is now QR002215. Cancel QR002215 first, then change this link.'),`link menu "${lmh}": ${lm.map(x=>x.t).join(', ')} ; WO619624="${l6a.replace(/\s+/g,' ').trim()}" ; SR0003="${l6b.replace(/\s+/g,' ').trim()}" ; email 6 panel rows=${n6}`);
 // 13 gating
 await clickRow(4,'.smain');
 const g0=await page.locator('#submitForm').isDisabled(),gsp=await page.locator('#m-sp').inputValue();
 await page.locator('#c1').check();const g1=await page.locator('#submitForm').isDisabled();
 await page.selectOption('#m-sp','SP12345');const g2=await page.locator('#submitForm').isDisabled();
 await page.locator('#c1').uncheck();const g3=await page.locator('#submitForm').isDisabled();
 const blue=await page.locator('#dialogContent label.opt',{hasText:'BlueLine'}).locator('input').isDisabled();
 const blueTxt=await page.locator('#dialogContent label.opt',{hasText:'BlueLine'}).innerText();
 rec(C,'Create QR/WO: Submit disabled until Strata Plan and a compliant contractor; non-compliant disabled',sub0&&!sub1&&sp05==='SP12345'&&t05==='New Work Order'&&bl&&g0&&gsp===''&&g1&&!g2&&g3&&blue,`email4: initial=${g0} strata="${gsp}", +contractor=${g1}, +strata=${g2}, -contractor=${g3}; BlueLine disabled=${blue} ("${blueTxt.trim()}"); email10 strata prefilled=${sp05}`);
 await page.locator('#dialogFoot button',{hasText:'Save Draft'}).click();const draft=await toastText();
 rec('Extra','Save Draft closes form with a toast and no data change',!(await shadeVisible())&&draft.includes('Draft saved')&&!draft.includes('Undo')&&(await statusText(4))==='Action needed',draft);
 // 14 toasts with Undo
 const undoRes=[];
 const tryUndo=async(label,id,act,expectToast)=>{const before=await statusText(id);const cellB=await row(id).locator('td').nth(4).innerText();await act();const t=await toastText();const hasUndo=await page.locator('#undoBtn').count()===1;const after=await statusText(id);
   await page.locator('#undoBtn').click();const restored=await statusText(id);const cellR=await row(id).locator('td').nth(4).innerText();const panelSt=selectedPanel=await page.locator('#panel .tags .badge').first().innerText().catch(()=>'');
   const ok=t.includes(expectToast)&&hasUndo&&restored===before&&cellR===cellB&&(!(await page.locator('#panel').evaluate(e=>e.classList.contains('visible')))||panelSt===before);
   undoRes.push(`${label}: toast="${t.replace(/\s+/g,' ').trim()}" ${before}→${after}→undo→${restored} panel=${panelSt}`);return ok;};
 let selectedPanel;let allUndo=true;
 await fresh();
 allUndo&=await tryUndo('Create SR (email 9)',9,async()=>{await clickRow(9,'.smore');await page.locator('#menu button',{hasText:'Create Service Request'}).click();},'SR0005 created');
 await page.screenshot({path:SHOTS+'08-toast-undo.png'});
 await clickRow(9,'.smore');await page.locator('#menu button',{hasText:'Create Service Request'}).click();await page.waitForTimeout(50);
 await page.screenshot({path:SHOTS+'08-toast-undo.png'});
 await page.locator('#undoBtn').click();
 allUndo&=await tryUndo('Mark as Other (email 5)',5,async()=>{await row(5).locator('td').first().click();await page.locator('#panel .panelfoot .smore').click();await page.locator('#menu button',{hasText:'Mark as Other'}).click();},'Marked as Other');
 allUndo&=await tryUndo('Link to QR (email 12)',12,async()=>{await clickRow(12,'.smain');await page.locator('#dialogFoot button',{hasText:'Link'}).click();},'Linked to QR002208');
 allUndo&=await tryUndo('Remove link (email 2)',2,async()=>{await row(2).locator('td').first().click();await page.locator('#linksBox .kebab').first().click();await page.locator('#menu button',{hasText:'Remove link'}).click();await page.locator('#dialogFoot button',{hasText:'Remove link'}).click();},'Link to WO613048 removed');
 allUndo&=await tryUndo('Create QR (email 3)',3,async()=>{await clickRow(3,'.smain');await page.locator('#c1').check();await page.locator('#submitForm').click();},'submitted');
 allUndo&=await tryUndo('Link to WO (email 8)',8,async()=>{await clickRow(8,'.smain');await page.locator('#dialogFoot button',{hasText:'Link'}).click();},'Linked to WO615003');
 rec(C,'Each manual action shows a toast with Undo, and Undo restores the row and panel',allUndo,undoRes.join(' ; '));
 // email 2 after removal -> pending text
 await row(2).locator('td').first().click();await page.locator('#linksBox .kebab').first().click();await page.locator('#menu button',{hasText:'Remove link'}).click();await page.locator('#dialogFoot button',{hasText:'Remove link'}).click();
 const p2=await page.locator('#linksBox .pending').innerText().catch(()=>'');
 rec('Extra','Removing the last link sets pending "All links removed…" and Action needed',p2.includes('All links removed. Choose what to do with this email.')&&(await statusText(2))==='Action needed',p2);
 // Mark as Other blocked when links exist via Replace? (add-mode hidden)
 await clickRow(1,'.smore');const m1=await menuItems();
 rec('Extra','Add mode hides "Mark as Other" when the email has links',!m1.some(x=>x.t.startsWith('Mark as Other')),m1.map(x=>x.t).join(', '));
 await page.mouse.click(5,890);
 // no Retry anywhere: body text + every menu
 let retry=(await page.locator('body').innerText()).match(/Retry|Failed/i);
 for(const id of ids){await clickRow(id,'.smore');const t=(await menuItems()).map(x=>x.t).join(' ');if(/Retry|Failed/i.test(t))retry=true;await page.mouse.click(5,890);}
 rec(C,'No Retry action and no Failed status anywhere (Inbox DOM and all row menus)',!retry,'');
 // open record dialogs
 await fresh();await clickRow(6,'.rec');const orT=await dlgTitle();await page.locator('#dialogFoot button',{hasText:'Close'}).click();
 await clickRow(3,'.rec');const orS=await dlgTitle();const srBtns=await page.locator('#dialogFoot button').allInnerTexts();
 await page.locator('#dialogFoot button',{hasText:'Create Quote Request'}).click();const fromSR=await dlgTitle();const fromNote=await page.locator('#dialogContent .ai small').innerText();await page.locator('#dialogFoot button',{hasText:'Cancel'}).click();
 rec('Extra','Chip opens record dialog (QR dialog; SR details with Create QR/WO → prefilled form "From Service Request SR0001")',orT==='Quote Request – QR002215'&&orS==='Service Request – SR0001'&&fromSR==='New Quote Request'&&fromNote==='From Service Request SR0001',`${orT} ; ${orS} [${srBtns.join(', ')}] ; ${fromSR}: ${fromNote}`);
 // menu flip near bottom
 await page.setViewportSize({width:1440,height:600});await row(10).scrollIntoViewIfNeeded();
 const b=await row(10).locator('.smore').boundingBox();await clickRow(10,'.smore');const mb=await page.locator('#menu').boundingBox();
 rec('Extra','Action menu flips above the button when there is no room below',mb.y+mb.height<=b.y+1||mb.y>b.y+b.height-1,`button y=${Math.round(b.y)} menu y=${Math.round(mb.y)} h=${Math.round(mb.height)} viewport h=600`);
 await page.mouse.click(5,590);await page.setViewportSize({width:1440,height:900});
 // section 13: WO & Calendar
 const R='Regression';
 await fresh();
 await page.locator('#navCalendarMain').click();await page.waitForTimeout(700);
 const calVis=await page.locator('#woIntegratedView').isVisible();const calTxt=await page.frameLocator('#woIntegratedFrame').locator('body').innerText();
 await page.locator('#navWoAll').click();await page.waitForTimeout(500);const woTxt=await page.frameLocator('#woIntegratedFrame').locator('body').innerText();const woHash=await page.evaluate(()=>location.hash);
 await page.locator('#navInbox').click();const backInbox=await page.locator('#inboxView').isVisible()&&!(await page.locator('#woIntegratedView').isVisible());
 rec(C,'Work Orders and Calendar navigation still works (iframe module untouched)',calVis&&calTxt.length>50&&woTxt.length>50&&woHash==='#work-orders'&&backInbox,`calendar visible=${calVis}, iframe text ${calTxt.length} chars; WO hash=${woHash}; back to Inbox=${backInbox}`);
 await page.screenshot({path:SHOTS+'09-after-wo-back-to-inbox.png'});
 // regressions
 await page.locator('.ps-gear').click();const setVis=await page.locator('#settingsView').isVisible(),inbHidden=!(await page.locator('#inboxView').isVisible());
 const feat=await page.locator('#settingsView .ps-feat-grid').innerText();
 await page.locator('#navInbox').click();const inbVis=await page.locator('#inboxView').isVisible();await row(10).locator('td').first().click();const pv=await page.locator('#panel').evaluate(e=>e.classList.contains('visible'));const rows12=await page.locator('#rows tr').count();
 rec(R,'Header gear opens Profile & Account Settings; sidebar Inbox returns to a working Inbox',setVis&&inbHidden&&inbVis&&pv&&rows12===12&&!feat.includes('AI Service Request Creation'),`settings visible=${setVis}; inbox back=${inbVis}; rows=${rows12}; panel opens=${pv}; Features unchanged (no new toggles)=${!feat.includes('AI Service Request Creation')}`);
 await page.locator('.nav',{hasText:'Service Requests'}).click();const regT=await dlgTitle();const regTxt=await dlgText();
 await page.locator('.sr-card',{hasText:'SR0001'}).locator('button',{hasText:'View SR'}).click();const vT=await dlgTitle();const vTxt=await dlgText();
 await page.locator('#dialogFoot button',{hasText:'Archive SR'}).click();const aT=await dlgTitle();await page.locator('#dialogFoot button',{hasText:'Archive Service Request'}).click();const aToast=await toastText();
 await page.locator('.nav',{hasText:'Service Requests'}).click();const regTxt2=await dlgText();
 await page.locator('.sr-card',{hasText:'SR0001'}).locator('button',{hasText:'View SR'}).click();const rbtn=await page.locator('#dialogFoot button').allInnerTexts();await page.locator('#dialogFoot button',{hasText:'Restore Service Request'}).click();const rToast=await toastText();
 await page.locator('.nav',{hasText:'Service Requests'}).click();await page.locator('.sr-card',{hasText:'SR0003'}).locator('button',{hasText:'View SR'}).click();const v3=await dlgTitle();const v3b=await page.locator('#dialogFoot button').allInnerTexts();
 await page.locator('#dialogFoot button',{hasText:'Reject Request'}).click();const rjT=await dlgTitle();await page.locator('#dialogFoot button',{hasText:'Cancel'}).click();
 rec(R,'Sidebar Service Requests opens the register and View SR works (Archive / Restore / Reject dialogs)',regT==='Service Requests – Active and Archived'&&regTxt.includes('RESVU – ESTATE')&&vT==='Service Request – SR0001'&&vTxt.includes('Open')&&aT==='Archive SR0001'&&aToast.includes('archived')&&regTxt2.includes('Archived')&&rbtn.includes('Restore Service Request')&&rToast.includes('restored')&&v3==='Service Request – SR0003'&&!v3b.includes('Create Work Order')&&rjT==='Reject Service Request',`register="${regT}"; view="${vT}"; archive="${aT}"/${aToast}; restore=${rToast}; SR0003 buttons=[${v3b.join(', ')}]; reject="${rjT}"`);
 await page.locator('.nav',{hasText:'Email Integration'}).click();const eiT=await dlgTitle();const eiTxt=await dlgText();await page.locator('#dialogFoot button',{hasText:'Save Configuration'}).click();const eiToast=await toastText();
 rec(R,'Sidebar Email Integration opens its existing dialog',eiT==='Email Integration – Settings'&&eiTxt.includes('Automatically create Service Requests')&&eiToast.includes('automation enabled'),`${eiT}; save toast="${eiToast}"`);
 const hdr=await page.locator('#inboxView').innerText();
 rec(R,'Inbox header: no "Sync Now", no "Auto (every 5 mins)"; breadcrumb, title, Connected, Sync Folders kept',!/Sync Now|every 5 min/i.test(hdr)&&hdr.includes('Connected: developer@i4tglobal.onmicrosoft.com')&&hdr.includes('Sync Folders')&&hdr.includes('HOME'),'');
 const real=errors.filter(x=>!x.includes('/favicon.ico'));rec(R,'No console errors or page errors from the page (browser auto favicon.ico 404 reported separately)',real.length===0,'page errors='+real.length+'; favicon 404 entries='+(errors.length-real.length)+(real.length?' :: '+real.join(' | '):''));
 await browser.close();
 require('fs').writeFileSync('/tmp/inbox-v2-verify/results.json',JSON.stringify({results,errors},null,1));
 const fails=results.filter(r=>!r.ok).length;console.log(`\n${results.length-fails}/${results.length} passed, console errors: ${errors.length}`);process.exit(fails?1:0);
})().catch(e=>{console.error('SCRIPT ERROR',e);process.exit(2);});
