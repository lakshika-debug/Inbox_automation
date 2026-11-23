// Link to QR modal verification
const {chromium}=require('/tmp/inbox-v2-verify/node_modules/playwright');
const fs=require('fs');
const OUT=process.env.OUT||'/tmp/linkqr-verify/cur/';
const SHOTS='/Users/arjuna/Documents/inbox automation/Inbox_automation/.agents/tasks/link-qr-modal/shots/';
const URL='http://127.0.0.1:3000/';
const results=[],errors=[];
const rec=(g,n,ok,d='')=>{results.push({g,n,ok:!!ok,d:String(d)});console.log(`${ok?'PASS':'FAIL'} [${g}] ${n}${d!==''?' :: '+d:''}`);};
const norm=s=>String(s??'').replace(/\s+/g,' ').trim(),J=JSON.stringify;
(async()=>{fs.mkdirSync(SHOTS,{recursive:true});fs.mkdirSync(OUT,{recursive:true});
 const browser=await chromium.launch({channel:'chrome'});const page=await browser.newPage({viewport:{width:1440,height:900}});
 page.on('console',m=>{if(m.type()==='error'&&!/favicon\.ico/.test(m.location().url||''))errors.push('console: '+m.text()+' @ '+J(m.location()));});
 page.on('pageerror',e=>errors.push('pageerror: '+e.message));
 const fresh=async(w=1440,h=900)=>{await page.setViewportSize({width:w,height:h});await page.goto('about:blank');await page.goto(URL+'#inbox');await page.waitForSelector('#rows .ib-row');await page.selectOption('#ibSize','100');};
 const row=id=>page.locator(`#rows .ib-row[data-id="${id}"]`);
 const open=async id=>{if(await page.locator('#panel.visible').count())await page.locator('#panel .close').click();await row(id).locator('.ib-subj').click();};
 const modalOpen=()=>page.evaluate(()=>!document.querySelector('#lqrShade').hidden&&!!document.querySelector('#lqrShade .lqr-modal'));
 const shadeOpen=()=>page.evaluate(()=>document.querySelector('#shade').classList.contains('visible'));
 const toastText=async()=>norm(await page.locator('#toast span').first().innerText());
 const st=()=>page.evaluate(()=>({sel:document.querySelector('#lqrSelTxt')?.innerText.replace(/\s+/g,' ').trim()||null,input:!!document.querySelector('#lqrInput'),q:document.querySelector('#lqrInput')?.value??null,
  ai:(document.querySelector('#lqrAiTag')?.textContent||'').replace(/\s+/g,' ').trim(),submit:!document.querySelector('#lqrSubmit').disabled,view:!document.querySelector('#lqrView').disabled,
  listOpen:!!document.querySelector('#lqrList:not([hidden])'),items:[...document.querySelectorAll('#lqrList .lqr-opt')].map(o=>({id:o.querySelector('b').textContent,dis:o.getAttribute('aria-disabled')==='true',used:o.querySelector('.lqr-used')?.textContent||'',act:o.classList.contains('lqr-act'),o2:o.querySelector('.lqr-o2').textContent})),
  none:document.querySelector('#lqrList .lqr-none')?.textContent||'',expanded:document.querySelector('#lqrInput')?.getAttribute('aria-expanded')||null,
  tiles:[...document.querySelectorAll('#lqrTiles .lqr-tile')].map(t=>({name:t.querySelector('.lqr-tname').textContent,chk:t.querySelector('.lqr-chk').checked,tag:t.querySelector('.lqr-tag')?.textContent||'',on:t.classList.contains('lqr-on'),kind:t.querySelector('.lqr-thumb').className.replace('lqr-thumb ','')})),
  thumbs:document.querySelectorAll('#lqrViewer .lqr-pg').length,thumbOn:[...document.querySelectorAll('#lqrViewer .lqr-pg')].findIndex(t=>t.classList.contains('lqr-on')),
  zoom:document.querySelector('#lqrZv')?.textContent,zout:!document.querySelector('#lqrZout')?.disabled,zin:!document.querySelector('#lqrZin')?.disabled,
  pane:document.querySelector('#lqrScroll')?.innerText.replace(/\s+/g,' ').trim().slice(0,4000)||'',pageW:document.querySelector('#lqrPage0')?.getBoundingClientRect().width||0,
  focusIn:!!document.activeElement.closest('#lqrShade'),focusId:document.activeElement.id||document.activeElement.className}));
 const typeQ=async q=>{await page.locator('#lqrInput').fill('');await page.locator('#lqrInput').type(q);};
 const ids=s=>J(s.items.map(i=>i.id));
 const linkRows=()=>page.evaluate(()=>[...document.querySelectorAll('#linksBox .lrow')].map(r=>({chip:r.querySelector('.rec')?.innerText.replace(/\s+/g,' ').trim(),meta:r.querySelector('.meta2')?.textContent})));
 const flagCnt=async()=>+(await page.locator('#ibCntFlag').innerText());
 const rowChips=id=>row(id).locator('.ib-links .rec').evaluateAll(a=>a.map(x=>x.innerText.replace(/\s+/g,' ').trim()));

 // ---------- email 12 default state ----------
 {const G='open12';await fresh();await open(12);const f0=await flagCnt();
  await page.locator('#panel .ai .smain').click();let s=await st();
  rec(G,'✦ Link to QR opens the Link to QR modal (not the old pop-up)',await modalOpen()&&!(await shadeOpen())&&norm(await page.locator('#lqrTitle').innerText())==='Link to QR');
  rec(G,'modal is role=dialog aria-modal, labelled by title',await page.evaluate(()=>{const m=document.querySelector('.lqr-modal');return m.getAttribute('role')==='dialog'&&m.getAttribute('aria-modal')==='true'&&m.getAttribute('aria-labelledby')==='lqrTitle';}));
  rec(G,'label "Quote Request *" with red asterisk',await page.evaluate(()=>{const l=document.querySelector('#lqrLab');return l.textContent.trim()==='Quote Request *'&&getComputedStyle(l.querySelector('.lqr-req')).color==='rgb(217, 45, 32)';}));
  rec(G,'AI-suggested QR002208 pre-selected with property and address',s.sel==='QR002208 Roof membrane repair HARBOUR VIEW SP4852 18 Harbour View Parade, Kirribilli NSW 2061',s.sel);
  rec(G,'"Suggested by AI" tag shown',s.ai==='✦Suggested by AI',s.ai);
  rec(G,'Submit and View Quote Request enabled',s.submit&&s.view);
  rec(G,'body scroll locked, focus inside modal',await page.evaluate(()=>document.body.classList.contains('lqr-lock')&&getComputedStyle(document.body).overflow==='hidden')&&s.focusIn,s.focusId);
  rec(G,'tiles: Roofline_Quote_311.pdf (Quote tag, PDF, selected) and photos.zip (file), both ticked',J(s.tiles)===J([{name:'Roofline_Quote_311.pdf',chk:true,tag:'Quote',on:true,kind:'lqr-k-pdf'},{name:'photos.zip',chk:true,tag:'',on:false,kind:'lqr-k-file'}]),J(s.tiles));
  rec(G,'Upload tile with allowed types',norm(await page.locator('#lqrTiles .lqr-up').innerText())==='Upload (Allowed File Types: PDF, JPG, PNG)');
  rec(G,'preview: 3 page thumbnails, page 1 highlighted',s.thumbs===3&&s.thumbOn===0,s.thumbs+' '+s.thumbOn);
  rec(G,'preview shows sample quote Q-311 from Roofline (roof membrane items, subtotal/GST/total)',['QUOTATION','Roofline Contractors','Q-311','Quote date','30/10/2026','Valid until','HARBOUR VIEW SP4852','Supply and install torch-on membrane','Subtotal','$4,500.00','GST (10%)','$450.00','Total (inc. GST)','$4,950.00'].every(t=>s.pane.includes(t)),s.pane.slice(0,300));
  rec(G,'table header is blue',await page.evaluate(()=>getComputedStyle(document.querySelector('#lqrPage0 .lqr-dtbl th')).backgroundColor==='rgb(26, 109, 255)'));
  const tools=await page.locator('#lqrViewer .lqr-tools button').evaluateAll(b=>b.map(x=>x.getAttribute('aria-label')));
  rec(G,'toolbar: Zoom out, 100%, Zoom in, Download, Print',J(tools)===J(['Zoom out','Zoom in','Download','Print'])&&s.zoom==='100%',J(tools)+' '+s.zoom);
  rec(G,'footer has only Submit',J(await page.locator('.lqr-foot button').allInnerTexts())===J(['Submit']));
  await page.screenshot({path:SHOTS+'modal-1440-email12-default.png'});
  // zoom
  const w0=s.pageW;await page.locator('#lqrZin').click();s=await st();
  rec(G,'zoom in → 125%, page wider',s.zoom==='125%'&&Math.abs(s.pageW-w0*1.25)<2,s.zoom+' '+w0+'→'+s.pageW);
  await page.locator('#lqrZout').click();await page.locator('#lqrZout').click();s=await st();rec(G,'zoom out twice → 75%',s.zoom==='75%'&&Math.abs(s.pageW-w0*.75)<2,s.zoom);
  await page.locator('#lqrZout').click();s=await st();rec(G,'50% is the minimum (zoom out disabled)',s.zoom==='50%'&&!s.zout&&s.zin);
  for(let i=0;i<6;i++)if(!(await page.locator('#lqrZin').isDisabled()))await page.locator('#lqrZin').click();s=await st();rec(G,'200% is the maximum (zoom in disabled)',s.zoom==='200%'&&!s.zin&&s.zout,s.zoom);
  for(let i=0;i<4;i++)await page.locator('#lqrZout').click();
  // thumbnails
  await page.locator('#lqrViewer .lqr-pgb').nth(2).click();await page.waitForTimeout(150);s=await st();
  const sc=await page.evaluate(()=>{const c=document.querySelector('#lqrScroll'),p=document.querySelector('#lqrPage2');return {top:c.scrollTop,pt:p.offsetTop};});
  rec(G,'thumbnail 3 jumps to page 3 and highlights it',s.thumbOn===2&&sc.top>0&&Math.abs(sc.top-(sc.pt-52))<3||s.thumbOn===2&&sc.top>0,J(sc)+' on='+s.thumbOn);
  await page.locator('#lqrViewer .lqr-pgb').nth(0).click();await page.waitForTimeout(150);s=await st();rec(G,'thumbnail 1 jumps back',s.thumbOn===0);
  // download / print
  await page.locator('#lqrViewer .lqr-tools button[aria-label="Download"]').click();rec(G,'Download toast',await toastText()==='Downloading Roofline_Quote_311.pdf (prototype)',await toastText());
  await page.locator('#lqrViewer .lqr-tools button[aria-label="Print"]').click();rec(G,'Print toast',await toastText()==='Printing Roofline_Quote_311.pdf (prototype)',await toastText());
  // zip preview
  await page.locator('#lqrTiles .lqr-tbtn').nth(1).click();s=await st();
  rec(G,'clicking photos.zip tile previews it: "Preview not available", no thumbnails, zoom disabled; ticks unchanged',s.pane.startsWith('Preview not available')&&s.thumbs===0&&!s.zout&&!s.zin&&s.tiles[1].on&&!s.tiles[0].on&&s.tiles.every(t=>t.chk),s.pane+' '+J(s.tiles));
  await page.locator('#lqrTiles .lqr-tbtn').nth(0).click();
  await page.locator('#lqrTiles .lqr-chk').nth(1).click();s=await st();rec(G,'checkbox toggles the tick only, preview stays on the PDF',!s.tiles[1].chk&&s.tiles[0].on&&s.thumbs===3);
  await page.locator('#lqrTiles .lqr-chk').nth(1).click();
  // view / upload
  await page.locator('#lqrView').click();rec(G,'View Quote Request toast',await toastText()==='Opens QR002208 (prototype)',await toastText());
  await page.locator('#lqrTiles .lqr-up').click();rec(G,'Upload toast',await toastText()==='Upload is not available in this prototype',await toastText());
  rec(G,'still open, nothing changed yet',await modalOpen()&&await page.evaluate(()=>find(12).links.length===0)&&await flagCnt()===f0);
  // search
  await page.locator('#lqrSelBtn').click();s=await st();
  rec(G,'clicking the selector opens the search with all 6 QRs, current one highlighted',s.input&&s.listOpen&&s.items.length===6&&s.items.find(i=>i.act)?.id==='QR002208'&&s.expanded==='true'&&s.focusId==='lqrInput',ids(s));
  await typeQ('QR002201');s=await st();rec(G,'search by QR number',ids(s)===J(['QR002201']),ids(s));
  await typeQ('2208');s=await st();rec(G,'search by partial QR number',ids(s)===J(['QR002208']),ids(s));
  await typeQ('SP12345');s=await st();rec(G,'search by plan name SP12345',ids(s)===J(['QR002204','QR002201']),ids(s));
  await typeQ('harbour view');s=await st();rec(G,'search by property name "harbour view"',ids(s)===J(['QR002208','QR002212']),ids(s));
  await typeQ('RESVU ESTATE');s=await st();rec(G,'search "RESVU ESTATE" matches RESVU – ESTATE',ids(s)===J(['QR002210','QR002206']),ids(s));
  await typeQ('Roofline');s=await st();rec(G,'search by supplier Roofline Contractors',ids(s)===J(['QR002208']),ids(s));
  await typeQ('spark');s=await st();rec(G,'search by supplier Spark Electrical',ids(s)===J(['QR002210','QR002206']),ids(s));
  await typeQ('topcover');s=await st();rec(G,'search by supplier TopCover Roofing',ids(s)===J(['QR002208','QR002212'])&&s.items.every(i=>/TopCover Roofing/.test(i.o2)),ids(s));
  rec(G,'items show bold id + title and property · suppliers',J(await page.locator('#lqrList .lqr-opt').first().evaluate(o=>[o.querySelector('b').textContent,o.querySelector('.lqr-o1 span').textContent,o.querySelector('.lqr-o2').textContent]))===J(['QR002208','Roof membrane repair','HARBOUR VIEW SP4852 · Roofline Contractors, TopCover Roofing']));
  await page.screenshot({path:SHOTS+'dropdown-supplier-search-1440.png'});
  await typeQ('roof membrane');s=await st();rec(G,'title text is not a search key (QR number / property / supplier only)',s.items.length===0&&s.none==='No matching Quote Requests',ids(s));
  await typeQ('zzz');s=await st();rec(G,'no match message',s.none==='No matching Quote Requests');
  // keyboard
  await typeQ('facilities');s=await st();rec(G,'typing highlights the first match',ids(s)===J(['QR002212','QR002210','QR002201'])&&s.items[0].act,ids(s));
  await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowUp');s=await st();rec(G,'arrow keys move the highlight',s.items[1].act&&await page.locator('#lqrInput').getAttribute('aria-activedescendant')==='lqrOpt1');
  await page.keyboard.press('Escape');s=await st();rec(G,'Esc closes the list only, modal stays',!s.listOpen&&await modalOpen()&&s.expanded==='false');
  await page.keyboard.press('ArrowDown');s=await st();rec(G,'ArrowDown reopens the list',s.listOpen&&s.items[0].act);
  await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');s=await st();
  rec(G,'Enter selects QR002210; AI tag hidden; focus on the selector',/^QR002210 Switchboard upgrade RESVU – ESTATE/.test(s.sel)&&s.ai===''&&!s.listOpen&&s.focusId==='lqrSelBtn',s.sel+' | '+s.ai+' | '+s.focusId);
  // blur back to selection
  await page.locator('#lqrSelBtn').click();await typeQ('spark');await page.locator('.lqr-head h2').click();await page.waitForTimeout(50);s=await st();
  rec(G,'leaving the search keeps the selected QR',/^QR002210/.test(s.sel)&&!s.input,s.sel);
  // clear
  await page.locator('.lqr-clear').click();s=await st();rec(G,'× clears: empty search field, Submit and View disabled, list closed',s.input&&s.q===''&&!s.submit&&!s.view&&!s.listOpen&&s.sel===null);
  await page.locator('#lqrInput').click();s=await st();rec(G,'clicking the empty field opens the list (6 QRs)',s.listOpen&&s.items.length===6);
  await page.locator('#lqrList .lqr-opt',{hasText:'QR002208'}).click();s=await st();rec(G,'mouse selection of QR002208 brings back the AI tag',/^QR002208/.test(s.sel)&&s.ai.includes('Suggested by AI')&&s.submit);
  // ticks
  await page.locator('#lqrTiles .lqr-chk').nth(0).uncheck();await page.locator('#lqrTiles .lqr-chk').nth(1).uncheck();s=await st();rec(G,'unticking all files disables Submit',!s.submit);
  await page.locator('#lqrTiles .lqr-chk').nth(0).check();s=await st();rec(G,'ticking the PDF enables Submit',s.submit);
  // focus trap
  await page.locator('#lqrSubmit').focus();await page.keyboard.press('Tab');rec(G,'Tab from Submit wraps to ×',await page.evaluate(()=>document.activeElement.classList.contains('lqr-x')));
  await page.keyboard.press('Shift+Tab');rec(G,'Shift+Tab from × wraps to Submit',await page.evaluate(()=>document.activeElement.id==='lqrSubmit'));
  // submit (only PDF ticked)
  await page.locator('#lqrSubmit').click();
  rec(G,'Submit closes the modal and unlocks the page',!(await modalOpen())&&await page.evaluate(()=>!document.body.classList.contains('lqr-lock')));
  rec(G,'toast "Quote linked to QR002208"',await toastText()==='Quote linked to QR002208',await toastText());
  rec(G,'email 12 row shows the QR chip, flag cleared',J(await rowChips(12))===J(['QR QR002208 · Quote'])&&await row(12).locator('.ib-st-need').count()===0,J(await rowChips(12)));
  rec(G,'Action needed count drops by 1',await flagCnt()===f0-1,f0+'→'+await flagCnt());
  const lr=await linkRows();rec(G,'Linked records shows QR002208 · Quote, Linked by Jane Thornton - 18/11/2026 h:mm',lr.length===1&&lr[0].chip==='QR QR002208 · Quote'&&/^Linked by Jane Thornton - 18\/11\/2026 \d{1,2}:\d{2} (AM|PM)$/.test(lr[0].meta),J(lr));
  const L12=await page.evaluate(()=>find(12).links[0]);rec(G,'link data: QR / Quote / Received, docs = only the PDF',L12.type==='QR'&&L12.id==='QR002208'&&L12.role==='Quote'&&L12.status==='Received'&&J(L12.docs)===J(['Roofline_Quote_311.pdf']),J(L12));
  rec(G,'pending/recommended/dismissed cleared',await page.evaluate(()=>{const e=find(12);return e.pending===null&&e.recommended===null&&e.dismissed===null;}));
  const ai=await page.evaluate(()=>({p:document.querySelector('#panel .ai .ai-head p').innerText.trim(),b:[...document.querySelectorAll('#panel .ai .ai-head p b')].map(x=>x.innerText.trim()),flag:!!document.querySelector('#panel .tags .badge.needs')}));
  rec(G,'bold outcome "Quote linked to QR002208", panel flag gone',ai.p==='Quote linked to QR002208'&&J(ai.b)===J([ai.p])&&!ai.flag,J(ai));
  rec(G,'focus returned into the panel',await page.evaluate(()=>!!document.activeElement.closest('#panel')));
  await page.screenshot({path:SHOTS+'after-submit-email12-1440.png'});
  await page.locator('#panel .close').click();await row(12).screenshot({path:SHOTS+'after-submit-row12-1440.png'});rec(G,'row 12 chip visible with panel closed',J(await rowChips(12))===J(['QR QR002208 · Quote'])&&await row(12).locator('.ib-links .rec').isVisible());await open(12);
  // Already linked
  await page.locator('#panel .ai .smore').click();await page.locator('#menu button',{hasText:'Link to Quote Request'}).click();s=await st();
  rec(G,'reopen on email 12: no suggestion (already linked), field empty',await modalOpen()&&s.input&&s.sel===null&&s.ai===''&&!s.submit);
  await page.locator('#lqrInput').click();s=await st();const d=s.items.find(i=>i.id==='QR002208');
  rec(G,'QR002208 shown disabled "Already linked"',d&&d.dis&&d.used==='Already linked'&&s.items.filter(i=>i.dis).length===1,J(d));
  await page.locator('#lqrList .lqr-opt',{hasText:'QR002208'}).click({force:true});s=await st();rec(G,'clicking the disabled QR does nothing',s.sel===null&&s.input);
  await page.keyboard.press('ArrowDown');s=await st();rec(G,'ArrowDown skips the disabled QR',s.items.find(i=>i.act)?.id==='QR002212',J(s.items.map(i=>i.act)));
  await page.keyboard.press('Escape');await page.keyboard.press('Escape');rec(G,'Esc, Esc closes the modal',!(await modalOpen()));
 }
 // ---------- Esc / × close without changes; focus return ----------
 {const G='close';await fresh();await open(12);const f0=await flagCnt();
  await page.locator('#panel .ai .smain').click();await page.locator('#lqrTiles .lqr-chk').nth(1).uncheck();await page.keyboard.press('Escape');
  rec(G,'Esc closes without changes; panel stays open; focus back on ✦ Link to QR',!(await modalOpen())&&await page.evaluate(()=>find(12).links.length===0&&!!find(12).pending)&&await flagCnt()===f0&&await page.locator('#panel.visible').count()===1&&await page.evaluate(()=>document.activeElement.classList.contains('smain')));
  await page.locator('#panel .ai .smain').click();let s=await st();rec(G,'reopening starts fresh (all ticked, AI pick)',s.tiles.every(t=>t.chk)&&/^QR002208/.test(s.sel));
  await page.locator('.lqr-x').click();rec(G,'× closes without changes',!(await modalOpen())&&await page.evaluate(()=>find(12).links.length===0)&&await flagCnt()===f0);
  await page.locator('#shade').evaluate(()=>0);
  await page.locator('#panel .ai .smain').click();await page.mouse.click(5,450);rec(G,'clicking the backdrop does not close the modal',await modalOpen());
 }
 // ---------- email 5 via ▾ ----------
 {const G='email5';await fresh();await open(5);await page.locator('#panel .ai .smore').click();await page.locator('#menu button',{hasText:'Link to Quote Request'}).click();let s=await st();
  rec(G,'▾ → Link to Quote Request opens the modal with an empty field, no AI tag, Submit disabled',await modalOpen()&&s.input&&s.q===''&&s.ai===''&&!s.submit&&!s.view);
  rec(G,'tile security_door.jpg (image thumb, ticked, no Quote tag), image preview with 1 thumbnail',J(s.tiles)===J([{name:'security_door.jpg',chk:true,tag:'',on:true,kind:'lqr-k-img'}])&&s.thumbs===1&&s.pane.includes('security_door.jpg')&&s.zin,J(s.tiles)+' '+s.thumbs);
  await page.locator('#lqrInput').type('abc');await page.keyboard.press('Enter');s=await st();
  rec(G,'type "abc" + Enter selects QR002204 (ABC Plumbing)',/^QR002204/.test(s.sel)&&s.submit,s.sel);
  await page.locator('#lqrSubmit').click();
  rec(G,'submit links QR002204 with the image; toast',J(await rowChips(5))===J(['QR QR002204 · Quote'])&&await page.evaluate(()=>J=JSON.stringify,0)===undefined&&J(await page.evaluate(()=>find(5).links[0].docs))===J(['security_door.jpg'])&&await toastText()==='Quote linked to QR002204',J(await rowChips(5)));
 }
 // ---------- email 11 via Add link: Already linked ----------
 {const G='email11';await fresh();await open(11);await page.locator('#panel .addlink').click();await page.locator('#menu button',{hasText:'Link to Quote Request'}).click();
  await page.locator('#lqrInput').click();const s=await st();const d=s.items.find(i=>i.id==='QR002210');
  rec(G,'＋ Add link → Link to Quote Request: modal, QR002210 disabled "Already linked"',await modalOpen()&&d&&d.dis&&d.used==='Already linked',J(d));
  rec(G,'tile Quote_Q-8812.pdf tagged Quote with a Spark Electrical sample quote',s.tiles[0]?.tag==='Quote'&&s.pane.includes('Spark Electrical')&&s.pane.includes('Q-8812'));
  await page.keyboard.press('Escape');await page.keyboard.press('Escape');
 }
 // ---------- Replace with… ----------
 {const G='replace';await fresh();await open(3);
  await page.locator('#linksBox .kebab').first().click();await page.locator('#menu button',{hasText:'Replace with…'}).click();await page.locator('#menu button:not([disabled])',{hasText:'Link to Quote Request'}).click();
  rec(G,'Replace SR0001 → Link to Quote Request shows the confirm first, no modal',await shadeOpen()&&!(await modalOpen())&&norm(await page.locator('#dialogContent').innerText()).includes('Service Request SR0001 will be cancelled (created in error). Then: Link to Quote Request.'),norm(await page.locator('#dialogContent').innerText()));
  await page.locator('#dialogFoot button',{hasText:'Cancel'}).click();rec(G,'Cancel: no modal, SR0001 still open',!(await modalOpen())&&!(await shadeOpen())&&await page.evaluate(()=>find(3).links[0].status==='Open'));
  await page.locator('#linksBox .kebab').first().click();await page.locator('#menu button',{hasText:'Replace with…'}).click();await page.locator('#menu button:not([disabled])',{hasText:'Link to Quote Request'}).click();
  await page.locator('#dialogFoot button',{hasText:'Confirm'}).click();let s=await st();
  rec(G,'Confirm opens the modal (empty field, ceiling_leak.jpg tile)',await modalOpen()&&!(await shadeOpen())&&s.input&&J(s.tiles.map(t=>t.name))===J(['ceiling_leak.jpg']));
  await page.locator('#lqrInput').type('QR002206');await page.keyboard.press('Enter');await page.locator('#lqrSubmit').click();
  const r=await page.evaluate(()=>({links:find(3).links.map(l=>l.id+':'+l.status),reg:srRegistry.SR0001.status,flag:isFlagged(find(3))}));
  rec(G,'Submit: SR0001 cancelled (as today), QR002206 linked, flag cleared',J(r.links)===J(['SR0001:Cancelled','QR002206:Received'])&&r.reg==='Cancelled'&&!r.flag,J(r));
  await open(1);await page.locator('#linksBox .kebab').first().click();await page.locator('#menu button',{hasText:'Replace with…'}).click();await page.locator('#menu button:not([disabled])',{hasText:'Link to Quote Request'}).click();
  rec(G,'blocked link (WO619624 Invoice submitted) still shows "Change not possible", no modal',await shadeOpen()&&norm(await page.locator('#dialogTitle').innerText())==='Change not possible'&&!(await modalOpen()));
  await page.locator('#shade .dhead .close').click();
 }
 // ---------- Link to WO unchanged ----------
 {const G='linkWO';await fresh();await open(8);await page.locator('#panel .ai .smain').click();
  const d=await page.evaluate(()=>({t:document.querySelector('#dialogTitle').textContent,q:!!document.querySelector('#lk-q'),ph:document.querySelector('#lk-q')?.placeholder,lab:document.querySelector('#dialogContent label').textContent,res:[...document.querySelectorAll('#lk-results input')].map(i=>i.value),use:[...document.querySelectorAll('#dialogContent .field>label:not(.opt)')].map(l=>l.textContent),from:!!document.querySelector('#lk-c'),btn:[...document.querySelectorAll('#dialogFoot button')].map(b=>b.textContent)}));
  rec(G,'Link to WO opens the old pop-up unchanged',await shadeOpen()&&!(await modalOpen())&&d.t==='Link to Work Order'&&d.q&&d.ph==='e.g. WO615003'&&d.lab==='Search Work Order by number or property'&&J(d.res)===J(['WO615003','WO620021','WO619624','WO613048'])&&J(d.use)===J(['Search Work Order by number or property','Results','Use as invoice'])&&!d.from&&J(d.btn)===J(['Cancel','Link']),J(d));
  await page.locator('#dialogFoot button',{hasText:'Link'}).click();
  rec(G,'Link to WO submit unchanged (Invoice submitted, toast "Linked to WO615003")',await page.evaluate(()=>{const l=find(8).links[0];return l.id==='WO615003'&&l.role==='Invoice'&&l.status==='Invoice submitted'&&JSON.stringify(l.docs)==='["INV-2045.pdf"]';})&&await toastText()==='Linked to WO615003',await toastText());
 }
 // ---------- responsive ----------
 for(const [w,h] of [[390,844],[700,900],[1440,900]]){const G='w'+w;await fresh(w,h);await open(12);await page.locator('#panel .ai .smain').click();await page.waitForTimeout(150);
  const m=await page.evaluate(()=>{const r=document.querySelector('.lqr-modal').getBoundingClientRect(),de=document.documentElement,strip=document.querySelector('#lqrTiles');
   return {x:r.x,y:r.y,w:r.width,h:r.height,vw:innerWidth,vh:innerHeight,sw:de.scrollWidth,bsw:document.body.scrollWidth,thumbs:getComputedStyle(document.querySelector('.lqr-thumbs')).display,stripOx:getComputedStyle(strip).overflowX,stripWrap:getComputedStyle(strip).flexWrap,
    bodyOv:Math.max(...[...document.querySelectorAll('.lqr-modal *')].filter(e=>!e.closest('.lqr-scroll,.lqr-strip,.lqr-mini')).map(e=>e.getBoundingClientRect().right))};});
  rec(G,'no page-level horizontal scroll with modal open',m.sw<=m.vw&&m.bsw<=m.vw,J(m));
  rec(G,'modal content stays inside the viewport (outside scroll areas)',m.bodyOv<=m.vw+0.5,m.bodyOv);
  rec(G,'tiles strip scrolls horizontally (nowrap)',m.stripOx==='auto'&&m.stripWrap==='nowrap');
  if(w<=700)rec(G,'full-screen sheet; thumbnail column hidden',m.x===0&&m.y===0&&m.w===m.vw&&m.h===m.vh&&m.thumbs==='none',J(m));
  else rec(G,'centred 1000px modal, ~90vh, thumbnail column shown',m.w===1000&&Math.abs(m.h-m.vh*.9)<1&&m.thumbs==='flex',J(m));
  if(w===390){await page.screenshot({path:SHOTS+'modal-390.png'});await page.locator('.lqr-body').evaluate(b=>b.scrollTop=b.scrollHeight);await page.screenshot({path:SHOTS+'modal-390-scrolled.png'});
   await page.locator('#lqrSelBtn').click();await page.locator('#lqrInput').type('facil');await page.screenshot({path:SHOTS+'dropdown-390.png'});
   const lw=await page.evaluate(()=>{const r=document.querySelector('#lqrList').getBoundingClientRect();return r.right<=innerWidth&&r.left>=0;});rec(G,'dropdown fits the viewport',lw);}
  if(w===700)await page.screenshot({path:SHOTS+'modal-700.png'});
  await page.keyboard.press('Escape');await page.keyboard.press('Escape');
  rec(G,'after close no horizontal scroll',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 rec('errors','no page errors / console errors',errors.length===0,J(errors));
 const p=results.filter(r=>r.ok).length;fs.writeFileSync(OUT+'linkqr-results.json',J({results,errors},null,1));console.log(`LINKQR: ${p}/${results.length} passed`);await browser.close();})();
