/* SAQ World startup vignette — canonical World hero + Rust Nibbler artwork.
 * Reuses the drawWorldHero/primaryPose geometry from hero_presentation.js,
 * rust_nibbler geometry from creature_presentation_d11.js, and the worn sword
 * SVG from equipment_art.js (not generated or invented character art).
 * Standalone classic script: shows art before the expensive ESM game graph.
 * Absolutely no simulation, combat, RNG, save, or campaign side effects. */
(() => {
  'use strict';
  const root = document.getElementById('saq-startup-scene');
  const canvas = document.getElementById('saq-startup-duel');
  const ctx = canvas?.getContext?.('2d', {alpha:true});
  if (!root || !canvas || !ctx) return;
  // This preview always uses the baseline SAQ World hero and a real Woodland
  // enemy, not an impersonation of a player's equipped character.
  const WEAPON_ART_KEYS={worn:'worn-sword'};
  const itemArtKey=()=>null;
  const drawBaseSubweapon=()=>{}; // Preview actor has no subweapon.
  const sword=new Image();
  sword.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 34 34\" width=\"136\" height=\"136\"><defs> <linearGradient id=\"wp_hilt_worn-sword\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"0\"> <stop offset=\"0%\" stop-color=\"#8d5b38\"/> <stop offset=\"45%\" stop-color=\"#5c3a21\"/> <stop offset=\"45%\" stop-color=\"#2d1d0b\"/> <stop offset=\"100%\" stop-color=\"#1c0f07\"/> </linearGradient> </defs> <defs> <linearGradient id=\"grad_weap_worn-sword\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"0\"> <stop offset=\"0%\" stop-color=\"#ffffff\"/> <stop offset=\"35%\" stop-color=\"#ffffff\"/> <stop offset=\"35%\" stop-color=\"#95a5a6\"/> <stop offset=\"65%\" stop-color=\"#95a5a6\"/> <stop offset=\"65%\" stop-color=\"#2a3240\"/> <stop offset=\"100%\" stop-color=\"#121820\"/> </linearGradient> </defs> <path d=\"M16 3 L19 8 L18 21 L14 21 L13 8 Z\" fill=\"url(#grad_weap_worn-sword)\" stroke=\"#000\" stroke-width=\"1.8\" /> <rect x=\"11\" y=\"21\" width=\"10\" height=\"2.5\" rx=\"0.5\" fill=\"#f1c40f\" stroke=\"#000\" stroke-width=\"1.2\" /> <rect x=\"14.5\" y=\"23.5\" width=\"3\" height=\"5\" fill=\"url(#wp_hilt_worn-sword)\" stroke=\"#000\" stroke-width=\"1\" /> <circle cx=\"16\" cy=\"29.5\" r=\"1.5\" fill=\"#f1c40f\" stroke=\"#000\" stroke-width=\"1\" /></svg>");
  const equipmentArt=()=>sword.complete && sword.naturalWidth>0 ? sword : null;

function primaryPose(primary,tick) {
  const a=primary?.current;if(!a)return {body:0,sword:-0.6,weight:0,active:false,aim:primary?.facing??{x:1,y:0}};
  const progress=Math.max(0,Math.min(1,(tick-a.phaseStartedTick)/Math.max(1,a.phaseEndsTick-a.phaseStartedTick)));
  const reverse=a.comboStep===2?-1:1,heavy=a.comboStep===3;
  const wind=heavy?-2.35:-1.35,follow=heavy?1.35:1.05;
  const sword=a.phase==="startup"?-.6+(wind+.6)*progress:a.phase==="active"?wind+(follow-wind)*progress:follow+(-.6-follow)*progress;
  return {body:reverse*(a.phase==="startup"?-.18*progress:a.phase==="active"?.24:.24*(1-progress))*(heavy?1.8:1),
    sword:sword*reverse,weight:heavy?3:1,active:a.phase==="active",aim:a.aim};
}
function drawWorldHero(ctx, actor, facing, presentationTime, primary=null,tick=0,hurtFlash=false,equipmentArt=()=>null) {
  if(actor.subType==='shield'&&actor.guard?.raised){facing=actor.guard.direction.x<0?-1:1;primary={...primary,facing:actor.guard.direction};}
  const pose=primaryPose(primary,tick),visual=actor.weaponVisual??'worn';
  const bounce = actor.movedLastTick ? Math.sin(presentationTime/90)*1.5 : 0;
  ctx.save();
  ctx.translate(actor.position.x, actor.position.y-8);
  ctx.scale(0.8*facing, 0.8);
  if(primary)ctx.rotate(pose.body);
  const subweapon=()=>drawBaseSubweapon(ctx,actor.subType,presentationTime,bounce,equipmentArt,actor.guard,facing,tick-actor.shieldRiposteTick,tick-actor.shieldBlockTick,actor.equipmentAppearance?.subweapon);
  if(actor.subType&&facing===-1)subweapon();
  ctx.strokeStyle = "#000000"; ctx.lineWidth = 1.5;
  ctx.fillStyle = "#c0392b";
  ctx.beginPath(); ctx.moveTo(-6, bounce); ctx.lineTo(-18, 15); ctx.lineTo(-2, 18); ctx.closePath(); ctx.fill(); ctx.stroke();
  for (const [color, x, y, w, h] of [["#95a5a6", -8, bounce, 14, 16], ["#bdc3c7", -10, -14+bounce, 18, 16],
    ["#2c3e50", 0, -8+bounce, 6, 4], ["#e74c3c", -5, -20+bounce, 4, 6], ["#e74c3c", -9, -16+bounce, 8, 4]]) {
    ctx.fillStyle = hurtFlash&&(color==="#95a5a6"||color==="#bdc3c7")?"#ffe1d4":color; ctx.beginPath(); ctx.rect(x, y, w, h); ctx.fill(); ctx.stroke();
  }
  if(primary) {
    // Body lean, shoulder and weapon actually articulate; the trail is secondary.
    ctx.save();ctx.translate(5,bounce+4);ctx.rotate(Math.atan2(pose.aim.y,pose.aim.x*facing)+pose.sword);
    ctx.fillStyle="#95a5a6";ctx.fillRect(0,-3,12,6);ctx.strokeRect(0,-3,12,6);
    // Reuse Dungeon's actual sword vector artwork. Its 34-unit viewBox is
    // rotated around the grip into the existing World Primary pose; authority is unchanged.
    const weapon=equipmentArt(itemArtKey(actor.equipmentAppearance?.weapon)??WEAPON_ART_KEYS[visual]);if(weapon){ctx.save();ctx.translate(12,0);ctx.rotate(Math.PI/2);ctx.drawImage(weapon,-19,-31,38,38);ctx.restore();}
    if(pose.active){ctx.strokeStyle="#fff0bba0";ctx.lineWidth=pose.weight+1;ctx.beginPath();ctx.arc(8,0,32,-.75,.3);ctx.stroke();}
    ctx.restore();
    if(actor.subType){if(facing!==-1)subweapon();}else {
    // H4A hero_renderer.js DEFAULT / HEATER SHIELD geometry, neutral framing tint.
    ctx.save();ctx.translate(-10,9+bounce);ctx.fillStyle='#7f8c8d';ctx.strokeStyle='#000';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(-6,-8);ctx.lineTo(6,-8);ctx.lineTo(8,0);ctx.lineTo(0,10);ctx.lineTo(-8,0);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(-4,-6.5);ctx.lineTo(4,-6.5);ctx.lineTo(5.5,-.5);ctx.lineTo(0,7.5);ctx.lineTo(-5.5,-.5);ctx.closePath();ctx.strokeStyle='#bdc3c7';ctx.lineWidth=1.2;ctx.stroke();ctx.restore();}
  }
  ctx.restore();
}


const attackPose=m=>{const phase=m.meleePhase?.phase??(m.meleeAction?'impact':'idle'),p=m.phaseProgress??0;return {phase,p,windup:phase==='windup'?p:0,impact:phase==='impact'?1-p*.28:0,recovery:phase==='recovery'?1-p:0,active:phase!=='idle'};};

function draw_rust_nibbler(c,m,presentationTime,seed){
  const time=presentationTime,pose=attackPose(m),active=Boolean(m.movedLastTick||pose.active),cx=m.x+m.w/2+(m.familyAttack?0:pose.impact*4-pose.windup*2),cy=m.y+m.h-9;
  const flash=m.flashTimer>0,outline='#11151a',dark=flash?'#fff':'#804122',rust=flash?'#fff':'#f27926';
  // The beetle is drawn at .68 scale. A 2.65px contour gives the same
  // world-space weight as the approved slime and mushroom's 1.8px contour.
  c.save();c.lineJoin='round';c.lineCap='round';c.strokeStyle=outline;c.lineWidth=2.65;
  // Keep all six articulated legs, with one readable dark silhouette each.
  for(let side=-1;side<=1;side+=2)for(let j=0;j<3;j++){
    const phase=time/75+j*1.4+side,step=active?Math.sin(phase)*3:Math.sin(phase)*.45;
    const rootX=cx+side*(5+j*2.5),rootY=cy+1+j*.7,jointX=rootX+side*(6+j),jointY=cy+5+j*1.2;
    c.strokeStyle=outline;c.lineWidth=2.8;c.beginPath();c.moveTo(rootX,rootY);c.lineTo(jointX+step*side,jointY);c.lineTo(jointX+side*6+step*side,cy+10);c.stroke();
  }
  // Broad orange shell, a curved underside shadow and one restrained glint.
  // Their shape follows the carapace; small panel stripes are unnecessary.
  c.fillStyle=rust;c.beginPath();c.ellipse(cx,cy,14,8.5,0,0,Math.PI*2);c.fill();
  if(!flash){
    c.save();c.beginPath();c.ellipse(cx,cy,14,8.5,0,0,Math.PI*2);c.clip();
    c.fillStyle='#c74c21';c.beginPath();c.moveTo(cx-15,cy+1);c.quadraticCurveTo(cx-1,cy+8,cx+15,cy);c.lineTo(cx+15,cy+10);c.lineTo(cx-15,cy+10);c.closePath();c.fill();c.restore();
    c.fillStyle='rgba(255,255,255,.5)';c.beginPath();c.ellipse(cx-4.5,cy-3.3,4.2,1.65,-.2,0,Math.PI*2);c.fill();
  }
  c.strokeStyle=outline;c.lineWidth=2.65;c.beginPath();c.ellipse(cx,cy,14,8.5,0,0,Math.PI*2);c.stroke();
  // One shell seam, a solid head and clear eyes keep the beetle's identity.
  if(!flash){c.lineWidth=1.4;c.beginPath();c.moveTo(cx-10,cy);c.quadraticCurveTo(cx-1,cy-2,cx+8,cy);c.stroke();}
  c.fillStyle=dark;c.lineWidth=2.65;c.beginPath();c.ellipse(cx+12,cy,6,5.5,0,0,Math.PI*2);c.fill();c.stroke();
  if(!m.familyAttack){c.fillStyle=outline;c.beginPath();c.moveTo(cx+16,cy+1);c.lineTo(cx+21+pose.impact*4,cy+(pose.windup?-1:pose.impact?6:2));c.lineTo(cx+16,cy+4);c.closePath();c.fill();}
  if(!flash){c.fillStyle='#ffedb3';c.beginPath();c.arc(cx+13.5,cy-2,1.6,0,Math.PI*2);c.arc(cx+13,cy+1.5,1,0,Math.PI*2);c.fill();}
  const twitch=Math.sin(time/85+(seed%7))*(active?3:1.2);c.strokeStyle=outline;c.lineWidth=2.4;
  for(let side=-1;side<=1;side+=2){c.beginPath();c.moveTo(cx+13,cy-3);c.quadraticCurveTo(cx+19,cy-10+side*twitch,cx+24,cy-7+side*twitch);c.stroke();}
  c.restore();
}



  let width=0,height=0,dpr=1,frameId=0,lastDraw=-1000,stopped=false;
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const player={position:{x:0,y:0},movedLastTick:false,weaponVisual:'worn',equipmentAppearance:{},subType:null};
  const frame={x:-14,y:-24,w:28,h:24,flashTimer:0,movedLastTick:false};
  const BASE_PERIOD=2800;
  const safety=(v,min,max)=>Math.max(min,Math.min(max,v));
  function resize(){
    const rect=canvas.getBoundingClientRect();
    width=Math.max(1,rect.width);height=Math.max(1,rect.height);
    dpr=Math.min(1.5,window.devicePixelRatio||1);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
  }
  function draw(elapsed){
    if (!width || !height) resize();
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,width,height);
    const phase=(elapsed%BASE_PERIOD)/BASE_PERIOD;
    const xGap=Math.min(205,Math.max(112,width*.42));
    const heroX=width*.5-xGap*.53;
    const enemyX=width*.5+xGap*.47;
    const feetY=height*.73;
    const scale=safety(width/100,3.0,4.25);
    const inWindup=phase>=.27&&phase<.40;
    const inStrike=phase>=.40&&phase<.55;
    const inRecover=phase>=.55&&phase<.72;
    const phaseMin=inWindup?.27:inStrike?.40:.55;
    const phaseMax=inWindup?.40:inStrike?.55:.72;
    const primaryPhase=inWindup?'startup':inStrike?'active':inRecover?'recovery':null;
    const pseudoTick=elapsed/(1000/60);
    const attack=primaryPhase?{phase:primaryPhase,comboStep:1,
      phaseStartedTick:(Math.floor(elapsed/BASE_PERIOD)*BASE_PERIOD + BASE_PERIOD*phaseMin)/(1000/60),
      phaseEndsTick:(Math.floor(elapsed/BASE_PERIOD)*BASE_PERIOD + BASE_PERIOD*phaseMax)/(1000/60),
      aim:{x:1,y:-.1}}:null;
    const primary={current:attack,facing:{x:1,y:-.1}};
    // Contact shadows are taken from World presentation conventions.
    ctx.fillStyle='rgba(8,18,17,.42)';
    ctx.beginPath();ctx.ellipse(heroX,feetY+5,21*scale/3,5*scale/3,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(enemyX,feetY+3,16*scale/3,4*scale/3,0,0,Math.PI*2);ctx.fill();

    // Actual World player renderer (World's standard red cloak + steel armor),
    // with the exact default worn sword texture supplied to its sword socket.
    ctx.save();ctx.translate(heroX+(inStrike?Math.sin((phase-.4)/.15*Math.PI)*5:0),feetY);
    ctx.scale(scale,scale);
    player.movedLastTick=Boolean(phase>.17&&phase<.25);
    drawWorldHero(ctx,player,1,elapsed,primary,pseudoTick,false,equipmentArt);
    ctx.restore();

    // Actual World rust_nibbler painter, including articulated legs/antennae.
    ctx.save();
    const stagger=inStrike?Math.sin((phase-.40)/.15*Math.PI)*7:0;
    ctx.translate(enemyX+stagger,feetY+(phase>.15&&phase<.31?Math.sin((phase-.15)/.16*Math.PI)*-3:0));
    ctx.scale(scale,scale);ctx.translate(-1,0);ctx.scale(.68,.68);
    frame.flashTimer=inStrike&&phase>.45&&phase<.53?1:0;
    frame.movedLastTick=Boolean(phase>.15&&phase<.30);
    draw_rust_nibbler(ctx,frame,elapsed,7);
    ctx.restore();

    // One quiet, in-game-size health tick and strike glint, no generic damage UI.
    if(inStrike){
      const hit=safety((phase-.45)/.05,0,1);
      ctx.strokeStyle=`rgba(244,231,191,${.65*(1-hit)+.05})`;
      ctx.lineWidth=1.6;ctx.beginPath();
      ctx.moveTo(enemyX-9,feetY-43);ctx.lineTo(enemyX+7,feetY-52);ctx.stroke();
      if(phase>.46&&phase<.52){
        ctx.fillStyle='#e2e8d5';ctx.fillRect(enemyX-12,feetY-62,24,2);
        ctx.fillStyle='#db8748';ctx.fillRect(enemyX-12,feetY-62,14,2);
      }
    }
  }
  function frameLoop(stamp){
    if(root.hidden||!root.isConnected){stopped=true;frameId=0;return;}
    if(!width||!height)resize();
    if(stamp-lastDraw>=65){draw(stamp);lastDraw=stamp;}
    frameId=requestAnimationFrame(frameLoop);
  }
  function start(){
    if(!width||!height)resize();
    if(reduced?.matches){draw(1520);return;}
    frameId=requestAnimationFrame(frameLoop);
  }
  window.addEventListener('resize',()=>{resize();if(reduced?.matches)draw(1520);},{passive:true});
  reduced?.addEventListener?.('change',()=>{
    if(frameId){cancelAnimationFrame(frameId);frameId=0;}
    if(reduced.matches)draw(1520);else if(!stopped)start();
  });
  sword.addEventListener('load',()=>{if(reduced?.matches)draw(1520);});
  window.__SAQ_STARTUP_DUEL_V1__=Object.freeze({drawForTest:draw, source:'World hero_presentation + creature_presentation_d11 rust_nibbler'});
  start();
})();
