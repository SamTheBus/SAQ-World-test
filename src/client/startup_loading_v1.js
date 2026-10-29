// Lightweight classic script: renders before the expensive game module graph loads.
// Presentation/diagnostics only. Never reads or writes campaigns, RNG, or save state.
(() => {
  'use strict';
  const doc = document;
  const root = doc.getElementById('saq-startup-scene');
  if (!root) return;
  const label = doc.getElementById('saq-startup-stage');
  const detail = doc.getElementById('saq-startup-detail');
  const steps = doc.getElementById('saq-startup-steps');
  const elapsed = doc.getElementById('saq-startup-elapsed');
  const bar = doc.getElementById('saq-startup-progress');
  const activity = doc.getElementById('saq-startup-activity');
  const copyButton = doc.getElementById('saq-startup-copy');
  const phaseNames = ['Game modules', 'World map', 'Saved campaign', 'World simulation', 'Asset verification', 'First playable frame'];
  const now = () => (typeof performance !== 'undefined' && typeof performance.now === 'function') ? performance.now() : Date.now();
  const started = now();
  const records = [{step:0,stage:'Loading game files',atMs:0}];
  let stepIndex = 0;
  let complete = false;
  let timer = null;

  function elapsedText() {
    const seconds = Math.floor(Math.max(0,now()-started)/1000);
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2,'0')}`;
  }
  function redraw() {
    if (elapsed) elapsed.textContent = elapsedText();
    if (steps) steps.textContent = `${Math.min(stepIndex,6)} of 6 setup steps completed`;
    if (bar) {bar.value = stepIndex;bar.setAttribute('aria-valuetext',`${stepIndex} of 6 setup steps completed`);}
    if (activity) activity.textContent = stepIndex >= 6 ? 'World ready' : 'Working';
    if (detail && stepIndex < 6 && now()-started >= 30000) {
      detail.dataset.slow = 'true';
    }
  }
  const record=(name)=>records.push({step:stepIndex,stage:name,atMs:Math.round(now()-started)});
  function stage(nextIndex,description) {
    if (complete || !Number.isInteger(nextIndex) || nextIndex < stepIndex || nextIndex > 5) return;
    stepIndex = nextIndex;
    const fallback = phaseNames[stepIndex] ?? 'Loading';
    if (label) label.textContent = description || fallback;
    if (detail) {detail.textContent = 'Please keep SAQ World open while the nearby world is prepared.';delete detail.dataset.slow;}
    record(description || fallback);
    redraw();
  }
  function note(message) {
    if (complete || !message) return;
    if (label) label.textContent = message;
    record(message);
    redraw();
  }
  function finish() {
    if (complete) return;
    stepIndex = 6;complete = true;
    record('First playable frame rendered');
    if (label) label.textContent = 'Adventure awaits';
    if (detail) detail.textContent = 'Ready to explore';
    redraw();clearInterval(timer);timer=null;
    root.hidden = true;
    window.__SAQ_WORLD_STARTUP_TIMINGS__ = Object.freeze({totalMs:Math.round(now()-started),events:Object.freeze(records.map(x=>Object.freeze({...x})))});
    console.info('[SAQ World] Startup timings',window.__SAQ_WORLD_STARTUP_TIMINGS__);
  }
  function fail() {
    if (complete) return;
    complete = true;record('Startup interrupted');clearInterval(timer);timer=null;
    root.hidden = true; // Existing retry/recovery dialog must be accessible.
    window.__SAQ_WORLD_STARTUP_TIMINGS__ = Object.freeze({totalMs:Math.round(now()-started),failed:true,events:Object.freeze(records.map(x=>Object.freeze({...x})))});
  }
  function report() {
    const end=now()-started;
    const byStage=records.map((item,i)=>`${Math.round(item.atMs/1000)}s — ${item.stage}`);
    return ['SAQ World startup diagnostics','Build: '+(doc.documentElement.dataset.worldRelease || 'unknown'),`Elapsed: ${Math.round(end/1000)} seconds`,...byStage].join('\n');
  }
  if(copyButton)copyButton.addEventListener('click',async()=>{
    try {await navigator.clipboard.writeText(report());copyButton.textContent='Copied!';}
    catch {copyButton.textContent='Unable to copy — take a screenshot';}
  });
  redraw();
  timer=setInterval(redraw,1000);
  window.__SAQ_STARTUP_LOADING_V1__ = Object.freeze({stage,note,finish,fail,report,events:()=>records.map(x=>({...x}))});
})();
