// CR02 verification: cr02.md s.11 checks 1-11 (with plan adjustments), D1, regression, responsive, screenshots.
const {chromium}=require('/tmp/inbox-v2-verify/node_modules/playwright');
const fs=require('fs');
const SHOTS='/Users/arjuna/Documents/inbox automation/Inbox_automation/.agents/tasks/cr02/shots/';
const URL='http://127.0.0.1:3000/';
const results=[],errors=[];
const rec=(group,name,ok,detail='')=>{results.push({group,name,ok:!!ok,detail:String(detail)});console.log(`${ok?'PASS':'FAIL'} [${group}] ${name}${detail!==''?' :: '+detail:''}`);};
const norm=s=>String(s??'').replace(/\s+/g,' ').trim();
const J=JSON.stringify;
(async()=>{
 fs.mkdirSync(SHOTS,{recursive:true});
 const browser=await chromium.launch({channel:'chrome'});
 const ctx=await browser.newContext({viewport:{width:1440,height:900}});
 const page=await ctx.newPage();
 page.on('console',m=>{if(m.type()==='error'&&!/favicon\.ico/.test(m.location().url||''))errors.push('console: '+m.text()+' @ '+J(m.location()));});
 page.on('response',r=>{if(r.status()>=400&&!/favicon\.ico/.test(r.url()))errors.push('http '+r.status()+' '+r.url());});
 page.on('pageerror',e=>errors.push('pageerror: '+e.message));
 const fresh=async(w=1440,h=900,all=true)=>{await page.setViewportSize({width:w,height:h});await page.goto('about:blank');await page.goto(URL+'#inbox',{waitUntil:'load'});await page.waitForSelector('#rows .ib-row');if(all)await page.selectOption('#ibSize','100');};
 const row=id=>page.locator(`#rows .ib-row[data-id="${id}"]`);
 const ids=()=>page.locator('#rows .ib-row').evaluateAll(rs=>rs.map(r=>+r.dataset.id));
 const txt=async s=>norm(await page.locator(s).first().innerText());
 const panelOpen=()=>page.locator('#panel').evaluate(e=>e.classList.contains('visible'));
 const shadeOpen=()=>page.locator('#shade').evaluate(e=>e.classList.contains('visible'));
 const closeP=async()=>{if(await panelOpen())await page.locator('#panel .close').click();};
 const closeD=async()=>{if(await shadeOpen())await page.locator('#shade .dhead .close').click();};
 const open=async id=>{await closeP();await row(id).locator('.ib-subj').click();};
 const toastText=async()=>norm(await page.locator('#toast span').first().innerText());
 const flagCnt=async()=>norm(await page.locator('#ibCntFlag').innerText());
 const line2=()=>page.evaluate(()=>Object.fromEntries([...document.querySelectorAll('#rows .ib-row')].map(r=>{const l=r.querySelector('.ib-l2'),p=[],c=l.querySelector('.ib-chips');
   if(c){const a=c.querySelector('.rec');p.push([a.querySelector('.rt').textContent,a.childNodes[1].textContent,a.querySelector('.rrole').textContent].join(' '));const m=c.querySelector('.ib-more');if(m)p.push(m.textContent);}
   const f=l.querySelector('.ib-st-need');if(f)p.push(f.textContent);return [r.dataset.id,p.join(' + ')];})));
 const footBtn=()=>page.evaluate(()=>{const f=document.querySelector('#panel .panelfoot');const s=f.querySelector('.smain');return (s?s.textContent:f.querySelector('.smore').textContent).replace(/\s+/g,' ').trim();});
 const footHint=()=>txt('#panel .panelfoot .small');
 const menuItems=()=>page.locator('#menu button').evaluateAll(bs=>bs.map(b=>b.innerText.replace(/\s+/g,' ').trim()));
 const menuHtml=()=>page.locator('#menu').innerHTML();
 const aiButtons=()=>page.locator('#panel .ai p').evaluate(p=>[...p.querySelectorAll('button,.ai-sep')].map(b=>b.textContent));
 const dlgTitle=()=>txt('#dialogTitle');
 const dlgText=()=>txt('#dialogContent');
 const clickDlg=async label=>page.locator('#dialogFoot button',{hasText:label}).click();
 const srState=id=>page.evaluate(id=>srRegistry[id]?srRegistry[id].status:null,id);
 const linkBadgeOf=async id=>page.evaluate(id=>{const r=[...document.querySelectorAll('#linksBox .lrow')].find(x=>x.querySelector('.rec')?.textContent.includes(id));return r?r.querySelector('.badge').textContent:null;},id);
 const flagInRow=id=>row(id).locator('.ib-st-need').count();
 const flagInHead=()=>page.locator('#panel .panelhead .badge.needs').count();
 const shot=async name=>{await page.screenshot({path:SHOTS+name,fullPage:false});};
 const noHScroll=()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);

 const EXPECT={12:['Action needed','✦Link to QR'],11:['QR QR002210 · Quote','Actions ▾'],1:['WO WO619624 · Invoice','Actions ▾'],2:['WO WO613048 · Invoice','Actions ▾'],
  3:['SR SR0001 · Service Request + Action needed','✦Create QR'],4:['Action needed','✦Create WO'],5:['Action needed','Actions ▾'],6:['QR QR002215 · from SR0003','Actions ▾'],
  7:['WO WO609221 · Invoice','Actions ▾'],8:['Action needed','✦Link to WO'],9:['','Actions ▾'],10:['WO WO615003 · Invoice + Action needed','✦Create WO']};

 // ---------- Table + check 1 (DOM) + check 2 ----------
 {const G='table';await fresh();
  rec(G,'default order (newest first)',J(await ids())===J([12,11,1,2,3,4,5,6,7,8,9,10]),J(await ids()));
  const aria=await row(3).getAttribute('aria-label');
  rec('3c','row aria-label reads flag and links',aria==='Unread email from Tommy Gennusa: [MAINTENANCE REQUEST] Water leaking in Lot 12 – RESVU ESTATE. Action needed. Linked to SR0001. 29 Oct · 10:36 AM',aria);
  const aria9=await row(9).getAttribute('aria-label');rec('3c','email 9 aria-label has no status',aria9==='Email from Community Office: Swimming pool opening hours for summer. 10 Sep · 10:03 AM',aria9);
  const l2=await line2();
  for(const id of Object.keys(EXPECT)){await open(+id);const fb=await footBtn();
   rec(G,`email ${id}: line 2 "${EXPECT[id][0]}", panel button "${EXPECT[id][1]}"`,l2[id]===EXPECT[id][0]&&fb===EXPECT[id][1],`line2="${l2[id]}" btn="${fb}"`);
   const body=norm(await page.locator('#panel').innerText());
   rec('check1',`email ${id}: panel has no Done / No action status text`,!/\bDone\b/.test(body)&&!/No action(?! needed)/.test(body),body.match(/\bDone\b|No action(?! needed)/)?.[0]||'');}
  await closeP();
  const listTxt=norm(await page.locator('#inboxView').innerText());
  rec('check1','list has no Done / No action text',!/\bDone\b/.test(listTxt)&&!/No action/.test(listTxt));
  rec('check1','#statusFilter removed',await page.locator('#statusFilter').count()===0);
  const G2='check2';
  rec(G2,'Action needed tab reads 6',await flagCnt()==='6',await flagCnt());
  rec(G2,'tab label',norm(await page.locator('#ibTabFlag').innerText())==='Action needed 6');
  await page.click('#ibTabFlag');
  rec(G2,'Action needed tab lists 12,3,4,5,8,10',J(await ids())===J([12,3,4,5,8,10]),J(await ids()));
  rec(G2,'tab aria-selected',await page.locator('#ibTabFlag').getAttribute('aria-selected')==='true'&&await page.locator('#ibTabAll').getAttribute('aria-selected')==='false');
  await shot('list-actionneeded-1440.png');
  await page.click('#ibTabAll');await page.selectOption('#ibSize','10');await shot('list-all-1440.png');
  // chip styling in rows (M1)
  const cs=await page.evaluate(()=>{const a=document.querySelector('#rows .ib-row[data-id="11"] .rec'),t=a.querySelector('.rt');return {b:getComputedStyle(a).borderTopWidth+' '+getComputedStyle(a).borderTopStyle,tbg:getComputedStyle(t).backgroundColor,tc:getComputedStyle(t).color,dec:getComputedStyle(a).textDecorationLine};});
  rec('M1','row chip styled (border, QR tag purple/white, no underline)',cs.b==='1px solid'&&cs.tbg==='rgb(123, 79, 216)'&&cs.tc==='rgb(255, 255, 255)'&&cs.dec==='none',J(cs));
 }

 // ---------- Check 3: chip click / +n / keyboard ----------
 {const G='check3';await fresh();
  await row(11).locator('.rec').click();
  rec(G,'click row chip opens record, not panel',await dlgTitle()==='Quote Request – QR002210'&&!(await panelOpen()),await dlgTitle());
  await closeD();
  await row(11).locator('.rec').focus();await page.keyboard.press('Enter');
  rec(G,'Enter on row chip opens record, not panel',await shadeOpen()&&await dlgTitle()==='Quote Request – QR002210'&&!(await panelOpen()),await dlgTitle());
  await closeD();
  await row(3).locator('.rec').click();
  rec(G,'SR chip opens SR details',await dlgTitle()==='Service Request – SR0001'&&!(await panelOpen()),await dlgTitle());await closeD();
  // make a +n: email 10 Create WO
  await open(10);await page.locator('#panel .panelfoot .smain').click();await page.check('#c1');await page.locator('#submitForm').click();
  const l2=await line2();rec(G,'email 10 after Create WO shows chip +1',l2['10']==='WO WO620041 · from SR0005 + +1',l2['10']);
  await closeP();
  await row(10).locator('.ib-more').click();
  const scrolled=async()=>page.evaluate(()=>{const p=document.querySelector('#panel'),b=document.querySelector('#linksBox'),h=p.querySelector('.panelhead');const bt=b.getBoundingClientRect(),hb=h.getBoundingClientRect().bottom,max=p.scrollHeight-p.clientHeight;return p.scrollTop>0&&bt.top>=hb&&(Math.abs(bt.top-hb)<=12||Math.abs(p.scrollTop-max)<=1)&&bt.bottom<=innerHeight;});
  rec(G,'click +1 opens panel at Linked records',await panelOpen()&&await scrolled()&&!(await shadeOpen()));
  await closeP();
  await row(10).locator('.ib-more').focus();await page.keyboard.press('Enter');
  rec(G,'Enter on +1 opens panel at Linked records',await panelOpen()&&await scrolled());
  await closeP();
  await row(10).locator('.ib-more').focus();await page.keyboard.press(' ');
  rec(G,'Space on +1 opens panel at Linked records',await panelOpen()&&await scrolled());
  await closeP();
  await row(4).focus();await page.keyboard.press('Enter');
  rec(G,'Enter on row still opens panel (M3 regression)',await panelOpen()&&norm(await page.locator('#panel .ptitle').innerText())==='Water pressure issue – Unit 5');
  await closeP();await row(4).focus();await page.keyboard.press(' ');
  rec(G,'Space on row still opens panel',await panelOpen());
  await closeP();
 }

 // ---------- Check 4 + 5: email 5 Dismiss / Flag again; check 8 parts on dismissed 5 ----------
 {const G='check4';await fresh();
  await open(5);
  rec('V13','flagged email 5: AI-filled details editable',await page.locator('#panel .kv input,#panel .kv select').count()>0);
  rec('V14','flagged email 5 footer hint "Choose an action"',await footHint()==='Choose an action');
  rec(G,'AI line shows Change | Dismiss',J(await aiButtons())===J(['Change','|','Dismiss']),J(await aiButtons()));
  const origPending=await txt('#panel .pending');
  await page.locator('#panel .ai .change',{hasText:'Dismiss'}).click();
  const t0=Date.now();
  rec(G,'Dismiss runs with no confirmation',!(await shadeOpen()));
  rec(G,'toast "Email dismissed" with no Undo button',await toastText()==='Email dismissed'&&await page.locator('#toast button').count()===0,await toastText());
  rec(G,'flag gone from row and panel header',await flagInRow(5)===0&&await flagInHead()===0);
  rec(G,'dismissed line text',await txt('#panel .dismissed')==='Dismissed by Jane Thornton · 18/11/2026 · Flag again',await txt('#panel .dismissed'));
  rec(G,'Action needed count 5',await flagCnt()==='5',await flagCnt());
  rec(G,'pending reason hidden while dismissed',await page.locator('#panel .pending').count()===0);
  rec(G,'AI line shows only Change while dismissed',J(await aiButtons())===J(['Change']),J(await aiButtons()));
  const st=await page.evaluate(()=>{const d=document.querySelector('#panel .dismissed'),b=d.querySelector('.change'),ai=document.querySelector('#panel .ai'),th=document.querySelector('#threadBox'),cb=getComputedStyle(b);
   return {border:cb.borderTopStyle,color:cb.color,ul:cb.textDecorationLine,bg:cb.backgroundColor,gapAbove:Math.round(d.getBoundingClientRect().top-ai.getBoundingClientRect().bottom),gapBelow:Math.round(th.getBoundingClientRect().top-d.getBoundingClientRect().bottom)};});
  rec('M2','Flag again styled as link; 14px gaps around dismissed line',st.border==='none'&&st.color==='rgb(11, 123, 255)'&&st.ul==='underline'&&st.gapAbove===14&&st.gapBelow===14,J(st));
  rec('check8','dismissed email 5: AI-filled details read-only',await page.locator('#panel .kv input,#panel .kv select').count()===0&&(await page.locator('#panel .sugg').first().innerText()).trim()==='Suggested by AI');
  rec('check8','dismissed email 5: footer "No action needed", Actions ▾',await footHint()==='No action needed'&&await footBtn()==='Actions ▾',await footHint()+' / '+await footBtn());
  await page.locator('#panel .panelfoot .smore').click();
  rec('check8','dismissed email 5: ▾ menu has no Dismiss',!(await menuItems()).includes('Dismiss'),J(await menuItems()));
  await page.keyboard.press('Escape');await page.mouse.click(5,300);
  await open(5);await shot('email5-dismissed-1440.png');
  await page.waitForTimeout(Math.max(0,3000-(Date.now()-t0)));
  const visAt3=await page.locator('#toast').evaluate(e=>e.classList.contains('visible'));
  await page.waitForTimeout(Math.max(0,3900-(Date.now()-t0)));
  const visAt39=await page.locator('#toast').evaluate(e=>e.classList.contains('visible'));
  rec(G,'toast visible at ~3.0 s, gone by ~3.9 s',visAt3&&!visAt39,`3s=${visAt3} 3.9s=${visAt39}`);
  const G5='check5';
  await page.locator('#panel .dismissed .change').click();
  rec(G5,'Flag again: toast',await toastText()==='Email flagged again',await toastText());
  rec(G5,'Flag again: flag back in row and header, count 6',await flagInRow(5)===1&&await flagInHead()===1&&await flagCnt()==='6',await flagCnt());
  rec(G5,'Flag again: original reason restored',await txt('#panel .pending')===origPending,await txt('#panel .pending'));
  rec(G5,'Flag again: dismissed line gone, Dismiss back on AI line',await page.locator('#panel .dismissed').count()===0&&J(await aiButtons())===J(['Change','|','Dismiss']));
  rec(G5,'Flag again: details editable again',await page.locator('#panel .kv input,#panel .kv select').count()>0);
  await closeP();
 }

 // ---------- Action needed tab: ibKeep after dismiss ----------
 {const G='tab-keep';await fresh();
  await page.click('#ibTabFlag');await open(5);
  await page.locator('#panel .ai .change',{hasText:'Dismiss'}).click();
  rec(G,'dismissed email 5 stays listed in Action needed tab while panel open',(await ids()).includes(5)&&await flagCnt()==='5',J(await ids()));
  await closeP();
  rec(G,'after closing panel email 5 leaves the tab',J(await ids())===J([12,3,4,8,10]),J(await ids()));
 }

 // ---------- Check 6 + D1 ----------
 {const G='check6';await fresh();
  await open(3);
  rec('V14','email 3 footer hint "Recommended by AI"',await footHint()==='Recommended by AI');
  await page.locator('#panel .ai .change',{hasText:'Dismiss'}).click();
  rec(G,'Dismiss (AI line) asks for confirmation',await shadeOpen()&&await dlgTitle()==='Please confirm'&&(await dlgText()).includes('SR0001 will be cancelled: no action needed. This email will no longer be flagged.'),await dlgText());
  await clickDlg('Cancel');
  rec(G,'Cancel leaves SR0001 Open and email flagged',await srState('SR0001')==='Open'&&await flagInHead()===1&&await flagCnt()==='6');
  await page.locator('#panel .panelfoot .smore').click();
  const items=await menuItems(),mh=await menuHtml();
  rec(G,'▾ menu: Dismiss is last, below a divider',items[items.length-1]==='Dismiss'&&/<hr><button[^>]*dismissEmail/.test(mh),J(items));
  rec(G,'▾ menu: ✦ Recommended on Create QR, Dismiss not recommended',/Create Quote Request ?✦ Recommended/.test(items.join('|'))&&!/Dismiss ?✦/.test(items.join('|')),J(items));
  rec('check1','▾ menu has no Mark as Other',!items.some(i=>/Other/.test(i)));
  await page.locator('#menu button',{hasText:'Dismiss'}).click();
  rec(G,'Dismiss (▾ menu) asks for confirmation',await shadeOpen()&&(await dlgText()).includes('SR0001 will be cancelled: no action needed. This email will no longer be flagged.'),await dlgText());
  await clickDlg('Dismiss');
  rec(G,'toast "SR0001 cancelled. Email dismissed"',await toastText()==='SR0001 cancelled. Email dismissed',await toastText());
  rec(G,'SR0001 Cancelled in Linked records; flag cleared',await linkBadgeOf('SR0001')==='Cancelled'&&await flagInHead()===0&&await flagInRow(3)===0&&await flagCnt()==='5',await linkBadgeOf('SR0001'));
  rec(G,'srRegistry SR0001 Cancelled',await srState('SR0001')==='Cancelled');
  rec('D2','row chip for cancelled SR unchanged',(await line2())['3']==='SR SR0001 · Service Request');
  await shot('email3-dismissed-1440.png');
  await page.locator('#linksBox .rec').first().click();
  rec(G,'SR details from chip shows Status Cancelled',await dlgTitle()==='Service Request – SR0001'&&/Status Cancelled/.test(await dlgText()),await dlgText());
  await closeD();
  const GD='D1';
  await page.locator('#panel .dismissed .change').click();
  rec(GD,'Flag again: toast "Email flagged again"',await toastText()==='Email flagged again');
  rec(GD,'Flag again: SR0001 Open in Linked records and srRegistry',await linkBadgeOf('SR0001')==='Open'&&await srState('SR0001')==='Open',await linkBadgeOf('SR0001')+'/'+await srState('SR0001'));
  rec(GD,'Flag again: flag, reason, recommendation restored',await flagInHead()===1&&await flagCnt()==='6'&&await txt('#panel .pending')==='⚠ Create a Quote Request or Work Order from SR0001'&&await footBtn()==='✦Create QR',await footBtn());
  await page.locator('#linksBox .rec').first().click();
  rec(GD,'SR details shows Status Open with Create QR/WO buttons',/Status Open/.test(await dlgText())&&await page.locator('#dialogFoot button',{hasText:'Create Quote Request'}).count()===1,await dlgText());
  await closeD();
  await page.locator('#panel .panelfoot .smain').click();
  rec(GD,'Create QR form says "From Service Request SR0001"',/From Service Request SR0001/.test(await dlgText()));
  await page.check('#c1');await page.locator('#submitForm').click();
  rec(GD,'row shows QR QR002217 · from SR0001, no flag',(await line2())['3']==='QR QR002217 · from SR0001',(await line2())['3']);
  const sr5=await page.evaluate(()=>({reg:'SR0005' in srRegistry,link:emails.some(e=>e.links.some(l=>l.id==='SR0005'))}));
  rec(GD,'no SR0005 created',!sr5.reg&&!sr5.link,J(sr5));
  rec(GD,'SR0001 Converted, count 5',await srState('SR0001')==='Converted'&&await flagCnt()==='5');
  await closeP();
 }

 // ---------- Check 7: email 10 ----------
 {const G='check7';await fresh();await open(10);
  await page.locator('#panel .ai .change',{hasText:'Dismiss'}).click();
  rec(G,'no confirmation (no open SR)',!(await shadeOpen()));
  rec(G,'flag cleared; WO615003 · Invoice stays in row and Linked records',await flagInRow(10)===0&&(await line2())['10']==='WO WO615003 · Invoice'&&await linkBadgeOf('WO615003')!==null,(await line2())['10']);
  await closeP();
 }

 // ---------- Check 8: email 11, email 6, dismissed email 12, email 9 ----------
 {const G='check8';await fresh();await open(11);
  rec(G,'email 11: AI line only Change',J(await aiButtons())===J(['Change']),J(await aiButtons()));
  await page.locator('#panel .panelfoot .smore').click();
  let items=await menuItems();
  rec(G,'email 11 ▾ menu: no Dismiss, no ✦ Recommended',!items.includes('Dismiss')&&!items.some(i=>/Recommended/.test(i)),J(items));
  await page.mouse.click(5,300);
  await page.locator('#panel .addlink').click();items=await menuItems();
  rec(G,'email 11 Add link menu: no Dismiss',!items.includes('Dismiss'),J(items));
  await page.mouse.click(5,300);
  await open(6);
  rec(G,'email 6: AI-filled details read-only',await page.locator('#panel .kv').count()===1&&await page.locator('#panel .kv input,#panel .kv select').count()===0);
  await open(12);
  await page.locator('#panel .ai .change',{hasText:'Dismiss'}).click();
  rec(G,'dismissed email 12: footer Actions ▾, hint No action needed',await footBtn()==='Actions ▾'&&await footHint()==='No action needed',await footBtn());
  await page.locator('#panel .panelfoot .smore').click();items=await menuItems();
  rec(G,'dismissed email 12: ▾ menu has no ✦ and no Dismiss',!items.some(i=>/Recommended/.test(i))&&!items.includes('Dismiss'),J(items));
  await page.mouse.click(5,300);
  await page.locator('#panel .ai .change',{hasText:'Change'}).click();items=await menuItems();
  rec(G,'dismissed email 12: Change menu has no ✦ and no Dismiss',!items.some(i=>/Recommended/.test(i))&&!items.includes('Dismiss'),J(items));
  await page.mouse.click(5,300);
  await open(9);
  rec('seed9','email 9 AI text and why',await txt('#panel .ai p')==='No request, invoice or quote found in this email. Change'&&await txt('#panel .ai small')==='General correspondence. Nothing to do.',await txt('#panel .ai p'));
  rec('seed9','email 9: no flag, footer No action needed / Actions ▾, AI line only Change',await flagInHead()===0&&await footHint()==='No action needed'&&await footBtn()==='Actions ▾'&&J(await aiButtons())===J(['Change']));
  await page.locator('#panel .ai .change').click();items=await menuItems();
  rec('seed9','email 9 Change opens 5-item add menu, no Dismiss / Other',items.length===5&&!items.includes('Dismiss')&&!items.some(i=>/Other/.test(i)),J(items));
  await page.mouse.click(5,300);await closeP();
 }

 // ---------- Check 9: email 3 Create QR (no dismiss) ----------
 {const G='check9';await fresh();await open(3);
  await page.locator('#panel .panelfoot .smain').click();await page.check('#c1');await page.locator('#submitForm').click();
  rec(G,'row shows QR QR002217 · from SR0001 with no flag',(await line2())['3']==='QR QR002217 · from SR0001',(await line2())['3']);
  rec(G,'Action needed count 6 → 5',await flagCnt()==='5');
  rec(G,'toast has no Undo',await toastText()==='QR002217 submitted'&&await page.locator('#toast button').count()===0,await toastText());
  await closeP();
 }

 // ---------- Check 10: dismiss then Link to WO ----------
 {const G='check10';await fresh();await open(5);
  await page.locator('#panel .ai .change',{hasText:'Dismiss'}).click();
  await page.locator('#panel .panelfoot .smore').click();await page.locator('#menu button',{hasText:'Link to Work Order'}).click();
  await clickDlg('Link');
  rec(G,'after Link to WO the dismissed line disappears',await page.locator('#panel .dismissed').count()===0&&await page.evaluate(()=>find(5).dismissed===null));
  rec(G,'row shows WO WO615003 · Invoice, no flag; count 5',(await line2())['5']==='WO WO615003 · Invoice'&&await flagCnt()==='5',(await line2())['5']);
  rec(G,'toast "Linked to WO615003", no Undo',await toastText()==='Linked to WO615003'&&await page.locator('#toast button').count()===0);
  // remove-all path clears dismissal too
  await open(10);await page.locator('#panel .ai .change',{hasText:'Dismiss'}).click();
  await page.locator('#linksBox .kebab').first().click();await page.locator('#menu button',{hasText:'Remove link'}).click();await clickDlg('Remove link');
  rec(G,'Remove last link on dismissed email clears dismissal and re-flags',await page.locator('#panel .dismissed').count()===0&&await flagInHead()===1&&await toastText()==='Link to WO615003 removed',await toastText());
  await closeP();
 }

 // ---------- Check 11 + Settings regression ----------
 {const G='check11';await fresh();
  await page.locator('.ps-gear').click();
  rec('settings','sign-in buttons shown first',await page.locator('#psSignMs').isVisible()&&await page.locator('#psSignG').isVisible()&&!(await page.locator('#psConnected').isVisible()));
  await page.click('#psSignMs');
  const s=await page.evaluate(()=>({h:document.querySelector('#psAiH').textContent,sr:document.querySelector('label[for=psAiSr]').textContent,srd:document.querySelector('#psAiSrD').textContent,q:document.querySelector('label[for=psAiQuote]').textContent,i:document.querySelector('label[for=psAiInv]').textContent,checked:['psAiSr','psAiQuote','psAiInv'].map(i=>document.getElementById(i).checked)}));
  rec(G,'AI Automation labels',s.h==='AI Automation'&&s.sr==='Service request creation'&&s.srd==='Create Service Requests from maintenance emails and recommend QR or WO.'&&s.q==='Link to Quote'&&s.i==='Link to Invoice'&&s.checked.every(Boolean),J(s));
  rec('settings','Microsoft connected state',await txt('#psConnLab')==='Microsoft Connected Account :'&&await page.locator('#psDisconnect').isVisible());
  const row3=await page.evaluate(()=>{const c=[...document.querySelectorAll('.ps-ai-list .ps-check')].map(x=>Math.round(x.getBoundingClientRect().top));return c;});
  rec('settings','3 AI options in one row at 1440',new Set(row3).size===1,J(row3));
  await page.click('#psMsBox');rec('settings','folders multiselect opens',await page.locator('#psMs.open').count()===1);
  await page.locator('#psMsList label',{hasText:'Archive'}).locator('input').uncheck();
  rec('settings','folders: unchecking Archive leaves Inbox + Sent Items',norm(await page.locator('#psMsBox').innerText()).replace(/×/g,'').replace(/\s+/g,' ').trim()==='Inbox Sent Items',norm(await page.locator('#psMsBox').innerText()));
  await page.mouse.click(5,400);
  await page.locator('.ps-ai').scrollIntoViewIfNeeded();await shot('settings-1440.png');
  await page.click('#psDisconnect');
  rec('settings','Disconnect returns to sign-in buttons',await page.locator('#psSignMs').isVisible()&&!(await page.locator('#psConnected').isVisible()));
  await page.click('#psSignG');
  rec('settings','Google connected state',await txt('#psConnLab')==='Google Connected Account :'&&await txt('#psConnEmail')==='developer@i4tglobal.com');
  await page.click('#navInbox');
 }

 // ---------- Regression ----------
 {const G='regression';await fresh(1440,900,false);
  rec(G,'page 1: Showing 1 to 10 of 12; groups',await txt('#count')==='Showing 1 to 10 of 12 entries'&&J(await page.locator('#rows .ib-group').evaluateAll(g=>g.map(x=>x.innerText.replace(/\s+/g,' ').trim())))===J(['October 2026 · 7 emails','September 2026 · 5 emails']));
  await page.locator('#ibPager button',{hasText:/^Next$/}).focus();await page.keyboard.press('Enter');
  rec(G,'Enter on Next → page 2, focus kept in pager',await txt('#count')==='Showing 11 to 12 of 12 entries'&&await page.evaluate(()=>document.activeElement.closest('#ibPager')!==null),await txt('#count'));
  await page.selectOption('#ibSize','25');rec(G,'25 per page → one page',await txt('#count')==='Showing 1 to 12 of 12 entries');
  await page.locator('#ibPager button',{hasText:/^Previous$/}).isDisabled();
  await page.selectOption('#ibSize','10');await page.locator('#ibPager button',{hasText:/^2$/}).click();await page.click('#ibTabFlag');
  rec(G,'tab change resets to page 1',await txt('#count')==='Showing 1 to 6 of 6 entries',await txt('#count'));
  await page.click('#ibTabUnread');
  rec(G,'Unread tab 4 entries',J(await ids())===J([12,3,4,5]));
  await open(12);rec(G,'opened unread email stays listed while panel open',(await ids()).includes(12)&&norm(await page.locator('#ibCntUnread').innerText())==='3');
  await closeP();rec(G,'after close it leaves Unread tab',J(await ids())===J([3,4,5]));
  await page.click('#ibTabAll');
  await page.fill('#search','Roofline');rec(G,'search sender',J(await ids())===J([12]));
  await page.fill('#search','switchboard');rec(G,'search subject',J(await ids())===J([11]));
  await page.fill('#search','WO615003');rec(G,'search by record id',J(await ids())===J([8,10]),J(await ids()));
  await page.fill('#search','SR0001');rec(G,'search by SR id',J(await ids())===J([3]));
  await page.fill('#search','');
  await page.selectOption('#ibSort','asc');rec(G,'sort oldest first',(await ids())[0]===10);
  await page.selectOption('#ibSort','desc');
  await page.click('#ibMarkAll');
  rec(G,'Mark all as read: pill 0, button disabled',await txt('#ibUnreadPill')==='0 unread'&&await page.locator('#ibMarkAll').isDisabled()&&norm(await page.locator('#ibCntUnread').innerText())==='0');
  await page.locator('.nav',{hasText:'Service Requests'}).click();
  rec(G,'SR register opens with 2 cards',await dlgTitle()==='Service Requests – Active and Archived'&&await page.locator('#dialogContent .sr-card').count()===2);
  await page.locator('#dialogContent .sr-card button').first().click();
  rec(G,'View SR opens SR details',await dlgTitle()==='Service Request – SR0001');
  await closeD();
  await page.locator('.nav',{hasText:'Email Integration'}).click();
  rec(G,'sidebar Email Integration dialog',await dlgTitle()==='Email Integration – Settings');
  await closeD();
  await page.click('#navWoAll');
  await page.waitForFunction(()=>typeof document.getElementById('woIntegratedFrame').contentWindow?.switchPage==='function',null,{timeout:10000});
  rec(G,'Work Orders All iframe loads',await page.locator('#woIntegratedView').isVisible()&&(await page.evaluate(()=>location.hash))==='#work-orders');
  await page.click('#navWoFuture');rec(G,'Future & Recurring',(await page.evaluate(()=>location.hash))==='#future-recurring');
  await page.click('#navCalendarMain');rec(G,'Calendar',(await page.evaluate(()=>location.hash))==='#calendar');
  await page.click('#navInbox');rec(G,'back to Inbox',await page.locator('#inboxView').isVisible()&&await page.locator('#rows .ib-row').count()===10);
 }

 // ---------- Responsive ----------
 {const G='responsive';
  for(const w of [390,700,1440]){await fresh(w,844,false);
   rec(G,`${w}px list: no horizontal scroll`,await noHScroll(),await page.evaluate(()=>document.documentElement.scrollWidth+'/'+innerWidth));
   const tabs=await page.evaluate(()=>{const r=document.querySelector('.ib-tabsrow');const t=[...r.querySelectorAll('.ib-tab')].map(b=>b.getBoundingClientRect());return {ov:r.scrollWidth<=r.clientWidth,right:Math.max(...t.map(x=>x.right))<=r.getBoundingClientRect().right+1};});
   rec(G,`${w}px tabs fit without overflow`,tabs.ov&&tabs.right,J(tabs));
   const lay=await page.evaluate(()=>{const l=document.querySelector('#rows .ib-row[data-id="3"] .ib-l2'),s=l.querySelector('.ib-subj').getBoundingClientRect(),c=l.querySelector('.ib-chips').getBoundingClientRect(),f=l.querySelector('.ib-st-need').getBoundingClientRect();return {wrap:getComputedStyle(l).flexWrap,sTop:Math.round(s.top),sBot:Math.round(s.bottom),cTop:Math.round(c.top),fTop:Math.round(f.top),cRight:Math.round(c.right),lRight:Math.round(l.getBoundingClientRect().right)};});
   if(w<=700)rec(G,`${w}px: .ib-l2 wraps; email 3 chip below subject`,lay.wrap==='wrap'&&lay.cTop>=lay.sBot-1&&lay.cRight<=lay.lRight+1,J(lay));
   else rec(G,`${w}px: email 3 subject, chip and flag on one line`,lay.wrap==='nowrap'&&Math.abs(lay.cTop-lay.sTop)<=4&&Math.abs(lay.fTop-lay.sTop)<=4,J(lay));
   if(w!==1440)await shot(`list-all-${w}.png`);
   if(w===390){await page.click('#ibTabFlag');await shot('list-actionneeded-390.png');await page.click('#ibTabAll');}
   await page.selectOption('#ibSize','100');
   await open(3);rec(G,`${w}px panel open: no horizontal scroll`,await noHScroll());
   await page.locator('#panel .ai .change',{hasText:'Dismiss'}).click();await clickDlg('Dismiss');
   const tp=await page.evaluate(()=>{const t=document.querySelector('#toast').getBoundingClientRect(),f=document.querySelector('#panel .panelfoot').getBoundingClientRect(),p=document.querySelector('#panel').getBoundingClientRect();return {tBot:Math.round(t.bottom),fTop:Math.round(f.top),tRight:Math.round(t.right),pLeft:Math.round(p.left)};});
   if(w<=1000)rec(G,`${w}px toast sits above the panel footer`,tp.tBot<=tp.fTop,J(tp));
   else rec(G,`${w}px toast offset left of the panel`,tp.tRight<=tp.pLeft,J(tp));
   if(w===390){await shot('email3-dismissed-390.png');
    await open(5);await page.locator('#panel .ai .change',{hasText:'Dismiss'}).click();await page.waitForTimeout(200);
    await page.locator('#panel .dismissed').scrollIntoViewIfNeeded();await shot('email5-dismissed-390.png');
    rec(G,'390px dismissed panel: no horizontal scroll',await noHScroll());}
   await closeP();
   if(w===390){await page.locator('.ps-gear').click();await page.click('#psSignMs');rec(G,'390px settings: no horizontal scroll',await noHScroll());
    await page.locator('.ps-ai').scrollIntoViewIfNeeded();await shot('settings-390.png');}
  }
 }

 rec('errors','no page errors / console errors',errors.length===0,J(errors));
 fs.writeFileSync('/tmp/cr02-verify/results.json',J({results,errors},null,1));
 const f=results.filter(r=>!r.ok);console.log(`\n${results.length-f.length}/${results.length} passed`);
 await browser.close();process.exit(f.length?1:0);
})().catch(e=>{console.error('SCRIPT ERROR',e);process.exit(2);});
