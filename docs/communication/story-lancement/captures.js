const { chromium } = require(process.env.PW);
const D=(n,m=1)=>({type:'dart',dart:{n,m}}), N={type:'next'}, M=D(0);
const sides=[{name:'François',members:['François']},{name:'Sarah',members:['Sarah']}];
const x01=(acts)=>({kind:'x01',setup:{sides,options:{start:301,finish:'simple',doubleIn:false,legs:1},firstSide:0},actions:acts});
(async()=>{
  const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,locale:'fr-FR'});
  const p=await ctx.newPage();
  // Reste 2 pour François
  await p.goto('http://localhost:3018/'); await p.evaluate(a=>localStorage.setItem('a18:partie',JSON.stringify(a)),
    x01([D(20,3),D(20,3),D(20,3),N,M,M,M,N,D(20,3),D(17,3),D(4,2),N,M,M,M,N]));
  await p.goto('http://localhost:3018/partie'); await p.waitForTimeout(1800);
  await p.screenshot({path:'story/08-501-reste2.png'});
  // 180 de François
  await p.goto('http://localhost:3018/'); await p.evaluate(a=>localStorage.setItem('a18:partie',JSON.stringify(a)), x01([]));
  await p.goto('http://localhost:3018/partie'); await p.waitForTimeout(1500);
  for(let i=0;i<3;i++){ await p.click('button:text-is("20")'); await p.waitForTimeout(150); await p.click('button:text-is("TRIPLE 20")'); await p.waitForTimeout(150); }
  await p.click('button:has-text("Valider la volée")');
  for(const ms of [2000,2300,2600]){ await p.waitForTimeout(ms===2000?2000:300); await p.screenshot({path:`story/c180-${ms}.png`}); }
  await b.close();
})();
