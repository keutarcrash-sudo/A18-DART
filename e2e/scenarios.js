const { chromium, devices } = require(process.env.PW);
const OUT=process.argv[2];
const D=(n,m=1)=>({type:'dart',dart:{n,m}}), N={type:'next'}, M=D(0);
const P=(names)=>names.map(n=>({name:n,members:[n]}));
const two=P(['Guillaume','Thomas']), three=P(['Guillaume','Thomas','Lea']);
const x01=(start,acts,finish='simple')=>({kind:'x01',setup:{sides:two,options:{start,finish,doubleIn:false,legs:1},firstSide:0},actions:acts});
const high=(acts,rounds=3)=>({kind:'high',setup:{sides:two,options:{rounds},firstSide:0},actions:acts});
const cricket=(acts)=>({kind:'cricket',setup:{sides:two,options:{mode:'classic'},firstSide:0},actions:acts});
const killer=(acts,lives=1)=>({kind:'killer',setup:{sides:three,options:{lives},firstSide:0},actions:acts});
const clock=(acts,opts={})=>({kind:'clock',setup:{sides:two,options:{bonus:false,bullFinish:false,...opts},firstSide:0},actions:acts});
// 301 : Guillaume à 121 (après 180), Thomas à 301
const g121=[D(20,3),D(20,3),D(20,3),N,M,M,M,N];
// Guillaume à 40
const g40=[...g121,D(20,3),D(20),D(1),N,M,M,M,N]; // 121-81=40
const g18=[...g121,D(20,3),D(20,2),D(3),N,M,M,M,N]; // 121-103=18
const T=(b)=>({b}), A=(a)=>({a}), V={v:1};
const killNums=[D(20),D(14),D(6)];
const S=[
 ['501 · 180', x01(301,[]), [T('20'),T('TRIPLE 20'),T('20'),T('TRIPLE 20'),T('20'),T('TRIPLE 20'),V], [/TCHAK/,/^180$/]],
 ['501 · ton-up 140', x01(301,[]), [T('20'),T('TRIPLE 20'),T('20'),T('TRIPLE 20'),T('20'),V], [/BOOM/,/TON-UP/]],
 ['501 · volée de 18 (plus d\'animation)', x01(301,[]), [T('6'),T('TRIPLE 6'),T('RATÉ'),T('RATÉ'),V], [/Reste|Pour finir/i], null, [/HOMMAGE/]],
 ['501 · 26', x01(301,[]), [T('20'),T('5'),T('1'),V], [/26… le classique/]],
 ['501 · trois ratés', x01(301,[]), [T('RATÉ'),T('RATÉ'),T('RATÉ'),V], [/PLOC/,/Trois à côté/]],
 ['501 · bust', x01(301,g40), [T('20'),T('TRIPLE 20'),V], [/BUST/,/On revient à 40/i]],
 ['501 · victoire', x01(301,g40), [T('20'),T('DOUBLE 20'),V], [/BULL !/,/GUILLAUME/], 'podium'],
 ['501 · fin à 18 (pas d\'hommage)', x01(301,g18), [T('18'),V], [/BULL !/], 'podium', [/HOMMAGE/]],
 ['501 · 18 restants : simple 18 puis corrigé en triple = bust', x01(301,g18), [T('18'),T('TRIPLE 18'),V], [/BUST/], null, [/BULL !/]],
 ['501 · pas de victoire sans valider', x01(301,g40), [T('20'),T('DOUBLE 20')], [/Pile ! Valide la volée/i], null, [/BULL !/, /Revanche/]],
 ['Plus gros score · ton-up', high([]), [T('20'),T('TRIPLE 20'),T('20'),T('TRIPLE 20'),T('20'),V], [/BOOM/]],
 ['Plus gros score · 18 (plus d\'animation)', high([]), [T('18'),T('RATÉ'),T('RATÉ'),V], [/Pour passer devant|Volée/i], null, [/HOMMAGE/]],
 ['Plus gros score · trois ratés', high([]), [T('RATÉ'),T('RATÉ'),T('RATÉ'),V], [/PLOC/]],
 ['Plus gros score · 180', high([]), [T('20'),T('TRIPLE 20'),T('20'),T('TRIPLE 20'),T('20'),T('TRIPLE 20'),V], [/TCHAK/]],
 ['Plus gros score · passe devant', high([D(20),M,M,N]), [T('20'),T('1'),T('RATÉ'),V], [/passe devant/]],
 ['Plus gros score · égalité', high([D(20),M,M,N,D(20),M,M,N,M,M,M,N,M,M,M,N,M,M,M,N]), [T('RATÉ'),T('RATÉ'),T('RATÉ'),V], [/ÉGALITÉ/i], 'podium'],
 ['Plus gros score · victoire', high([D(20),M,M,N,M,M,M,N,M,M,M,N,M,M,M,N,M,M,M,N]), [T('RATÉ'),T('RATÉ'),T('RATÉ'),V], [/BULL !/], 'podium'],
 ['Cricket · 20 fermé', cricket([]), [A('Touché le 20'),T('TRIPLE 20'),T('RATÉ / AUTRE'),T('RATÉ / AUTRE'),V], [/CLAC/,/20 FERMÉ/i]],
 ['Cricket · 2 fermés même volée', cricket([]), [A('Touché le 20'),T('TRIPLE 20'),A('Touché le 19'),T('TRIPLE 19'),T('RATÉ / AUTRE'),V], [/TOUCHES/i]],
 ['Cricket · 20 et 19 fermés (4 touches)', cricket([D(19,2),M,M,N,M,M,M,N]), [A('Touché le 20'),T('TRIPLE 20'),A('Touché le 19'),T('RATÉ / AUTRE'),V], [/CLAC/,/20 · 19 FERMÉS/i]],
 ['Cricket · bull fermé', cricket([]), [A('Touché le bull'),A('Touché le bull'),T('DOUBLE BULL'),T('RATÉ / AUTRE'),V], [/CLAC/,/BULL FERMÉ/i]],
 ['Cricket · 9 touches', cricket([]), [A('Touché le 20'),T('TRIPLE 20'),A('Touché le 19'),T('TRIPLE 19'),A('Touché le 18'),T('TRIPLE 18'),V], [/TCHAK/,/Neuf touches/i]],
 ['Cricket · rien (3 « raté/autre »)', cricket([]), [T('RATÉ / AUTRE'),T('RATÉ / AUTRE'),T('RATÉ / AUTRE'),V], [/Rien sur le tableau/], null, [/PLOC/]],
 ['Cricket · victoire', cricket([D(20,3),D(19,3),D(18,3),N,M,M,M,N,D(17,3),D(16,3),D(15,3),N,M,M,M,N,D(25,2)]), [A('Touché le bull'),V], [/BULL !/], 'podium'],
 ['Killer · devient tueur', killer(killNums,3), [A('Double 20 touché · Guillaume')], [/TUEUR/i]],
 ['Killer · éliminé', killer([...killNums,D(20,2)]), [A('Double 14 touché · Thomas')], [/OUT !/,/ÉLIMINÉ/i]],
 ['Killer · son propre double', killer([...killNums,D(20,2)],3), [A('Double 20 touché · Guillaume')], [/Ton propre double/]],
 ['Killer · pas encore tueur', killer(killNums,3), [A('Double 14 touché · Thomas')], [/Pas encore tueur/]],
 ['Killer · trois ratés', killer(killNums,3), [T('RATÉ / AUTRE'),T('RATÉ / AUTRE'),T('RATÉ / AUTRE'),V], [/Trois à côté/], null, [/PLOC/]],
 ['Killer · victoire', killer([...killNums,D(20,2),D(14,2)]), [A('Double 6 touché · Lea'),{w:3600},V], [/BULL !/], 'podium'],
 ['Horloge · sans faute', clock([]), [T('Touché 1'),T('Touché 2'),T('Touché 3')], [/SANS FAUTE/i]],
 ['Horloge · trois ratés', clock([]), [T('Raté'),T('Raté'),T('Raté')], [/Trois à côté/], null, [/PLOC/]],
 ['Horloge · plus que le bull', clock([...[1,2,3].map(n=>D(n)),N,M,M,M,N,...[4,5,6].map(n=>D(n)),N,M,M,M,N,...[7,8,9].map(n=>D(n)),N,M,M,M,N,...[10,11,12].map(n=>D(n)),N,M,M,M,N,...[13,14,15].map(n=>D(n)),N,M,M,M,N,...[16,17,18].map(n=>D(n)),N,M,M,M,N,D(19)],{bullFinish:true}), [T('Touché 20')], [/Plus que le bull/]],
 ['Horloge · victoire', clock([...[1,2,3].map(n=>D(n)),N,M,M,M,N,...[4,5,6].map(n=>D(n)),N,M,M,M,N,...[7,8,9].map(n=>D(n)),N,M,M,M,N,...[10,11,12].map(n=>D(n)),N,M,M,M,N,...[13,14,15].map(n=>D(n)),N,M,M,M,N,...[16,17,18].map(n=>D(n)),N,M,M,M,N,D(19)]), [T('Touché 20'),V], [/BULL !/], 'podium'],
];
(async()=>{
  const b=await chromium.launch(); const ctx=await b.newContext({...devices['iPhone 13'], locale:'fr-FR'});
  const results=[];
  let k=0;
  for(const [name,partie,steps,expect,after,forbid] of S.filter(x=>!process.env.ONLY||x[0].includes(process.env.ONLY))){
    k++;
    const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
    await p.goto('http://localhost:3018/'); await p.evaluate(a=>localStorage.setItem('a18:partie',JSON.stringify(a)),partie);
    await p.goto('http://localhost:3018/partie'); await p.waitForTimeout(1300);
    let stepErr=null;
    try{
      for(const s of steps){
        if(s.b) await p.click(`button:text-is("${s.b}")`,{timeout:3000});
        else if(s.a) await p.click(`[aria-label="${s.a}"]`,{timeout:3000});
        else if(s.v) await p.click('button:has-text("Valider la volée")',{timeout:3000});
        else if(s.w) await p.waitForTimeout(s.w);
        await p.waitForTimeout(160);
      }
    }catch(e){ stepErr=e.message.split('\n')[0]; }
    // on capte tout le texte visible pendant ~4 s
    const seen=new Set();
    for(let i=0;i<16;i++){ await p.waitForTimeout(250); const txt=await p.evaluate(()=>document.body.innerText); txt.split('\n').forEach(l=>seen.add(l.trim())); if(i===7) await p.screenshot({path:`${OUT}/${String(k).padStart(2,'0')}.png`}); }
    const all=[...seen].join(' | ');
    const ok=expect.every(r=>[...seen].some(l=>r.test(l)));
    const bad=(forbid||[]).filter(r=>[...seen].some(l=>r.test(l)));
    let podium=null;
    if(after==='podium'){ for(let w=0;w<14 && !(await p.locator('text=Revanche').isVisible());w++) await p.waitForTimeout(500); podium=await p.locator('text=Revanche').isVisible(); }
    results.push({k,name,ok:ok&&!bad.length&&!stepErr&&!errs.length&&(after!=='podium'||podium),stepErr,errs,missing:expect.filter(r=>![...seen].some(l=>r.test(l))).map(String),forbidden:bad.map(String),podium});
    await p.close();
  }
  for(const r of results) console.log((r.ok?'OK  ':'FAIL')+' '+String(r.k).padStart(2)+' '+r.name+(r.ok?'':'  '+JSON.stringify({step:r.stepErr,errs:r.errs,missing:r.missing,forbidden:r.forbidden,podium:r.podium})));
  await b.close();
})();
