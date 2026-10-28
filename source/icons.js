const {chromium}=require('playwright');
const star='<path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z"/>';
const page=(pad,rad)=>`<html><body style="margin:0;background:transparent"><div style="width:512px;height:512px;border-radius:${rad}px;overflow:hidden;background:linear-gradient(160deg,#4FA9F2,#1F4FE0);display:grid;place-items:center;position:relative">
<div style="position:absolute;inset:0;background:radial-gradient(circle at 30% 20%,rgba(255,255,255,.35),transparent 55%)"></div>
<svg viewBox="0 0 24 24" width="${512-pad*2}" height="${512-pad*2}" style="filter:drop-shadow(0 14px 0 rgba(120,70,0,.45)) drop-shadow(0 0 30px rgba(255,214,60,.8))"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE45C"/><stop offset="1" stop-color="#FFB800"/></linearGradient></defs><g fill="url(#g)" stroke="#fff" stroke-width=".9" stroke-linejoin="round">${star}</g></svg></div></body></html>`;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:512,height:512}});
 const shots=[['icon-512.png',512,90,0,true],['icon-maskable-512.png',512,130,0,false],['icon-192.png',192,90,0,true],['apple-touch-icon.png',180,80,0,false]];
 for(const [n,s,pad,rad,round] of shots){await p.setContent(page(pad,round?110:0));const buf=await p.screenshot({clip:{x:0,y:0,width:512,height:512},omitBackground:true});
   const p2=await b.newPage({viewport:{width:s,height:s}});await p2.setContent(`<body style="margin:0"><img src="data:image/png;base64,${buf.toString('base64')}" width="${s}" height="${s}">`);await p2.screenshot({path:'site/icons/'+n,omitBackground:true});await p2.close()}
 await b.close()})();
