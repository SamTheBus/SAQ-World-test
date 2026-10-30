// Loading screen controller: a classic script that runs before the game code loads. It shows a short
// status, a bar that moves through the game's real startup checkpoints and one game tip at a time.
// Presentation and timing diagnostics only: it never reads or writes campaigns, saves or game RNG.
(() => {
  'use strict';
  const doc = document;
  const root = doc.getElementById('saq-startup-scene');
  if (!root) return;
  const label = doc.getElementById('saq-startup-stage');
  const percent = doc.getElementById('saq-startup-percent');
  const bar = doc.getElementById('saq-startup-progress');
  const fill = doc.getElementById('saq-startup-fill');
  const tip = doc.getElementById('saq-startup-tip');
  const tipText = doc.getElementById('saq-startup-tip-text');
  const build = doc.getElementById('saq-startup-build');
  const copyButton = doc.getElementById('saq-startup-copy');
  // One slice of the bar per checkpoint, sized from measured startups. Inside a slice the bar eases
  // toward the slice's end and only reaches it when the checkpoint really happens.
  const STEPS = [
    {label: 'Loading the game', end: .1, expectMs: 1500},
    {label: 'Reading the map', end: .16, expectMs: 500},
    {label: 'Opening your world', end: .2, expectMs: 300},
    {label: 'Opening your world', end: .8, expectMs: 8000},
    {label: 'Setting the scene', end: .83, expectMs: 300},
    {label: 'Setting the scene', end: .98, expectMs: 3000}
  ];
  const TIPS = [
    'Hold Attack to keep swinging.',
    'Hold the spin button to rearrange your skill wheel.',
    'Every class has a move: Knights Guard, Rogues Dash and Mages Blink.',
    'Each block a Knight makes takes a second off Shield Bash.',
    'Armor you equip shows on your hero. Higher stars brighten the trim.',
    'Change your hero’s look any time from Bag, then Stats.',
    'Your offhand shapes your class skill: a Kris makes every Flurry cut Bleed.'
  ];
  const SLOW_MS = 45000, TIP_MS = 6000;
  const now = () => (typeof performance !== 'undefined' && typeof performance.now === 'function') ? performance.now() : Date.now();
  const started = now();
  const records = [{step: 0, stage: 'Loading game files', atMs: 0}];
  let step = 0, stepAt = started, from = 0, shown = 0, complete = false, building = false, timer = null;
  let tipIndex = Math.floor(Math.random() * TIPS.length), tipAt = started;

  const release = doc.documentElement.dataset.worldRelease || '';
  const commit = /-([0-9a-f]{7,})$/.exec(release);
  if (build && commit) build.textContent = 'Build ' + commit[1].slice(0, 7);
  if (tipText) tipText.textContent = TIPS[tipIndex];

  function setText(element, text) { if (element && element.textContent !== text) element.textContent = text; }
  function show(value) {
    const pct = Math.round(value * 100);
    if (fill) fill.style.width = (value * 100).toFixed(1) + '%';
    setText(percent, pct + '%');
    if (bar) bar.setAttribute('aria-valuenow', String(pct));
  }
  function redraw() {
    const t = now();
    if (!complete) {
      const {end, expectMs} = STEPS[step];
      shown = Math.max(shown, from + (end - from) * (1 - Math.exp(-2.3 * (t - stepAt) / expectMs)));
      setText(label, step === 3 && building ? 'Building your world' : STEPS[step].label);
      show(shown);
      if (t - started >= SLOW_MS && copyButton && copyButton.hidden) {
        copyButton.hidden = false;
        setText(build, 'Still loading');
      }
    }
    if (t - tipAt >= TIP_MS && tip && tipText) {
      tipAt = t;
      tip.classList.add('saq-camp-tip-out');
      setTimeout(() => { tipIndex = (tipIndex + 1) % TIPS.length; tipText.textContent = TIPS[tipIndex]; tip.classList.remove('saq-camp-tip-out'); }, 350);
    }
  }
  const record = (name) => records.push({step, stage: name, atMs: Math.round(now() - started)});
  function stage(nextIndex, description) {
    if (complete || !Number.isInteger(nextIndex) || nextIndex < step || nextIndex > 5) return;
    if (nextIndex > step) { from = STEPS[nextIndex - 1].end; shown = Math.max(shown, from); step = nextIndex; stepAt = now(); }
    record(description || STEPS[step].label);
    redraw();
  }
  // Detailed progress notes go to the load report; a new world changes the status wording.
  function note(message) {
    if (complete || !message) return;
    if (message === 'Preparing a new world…') building = true;
    record(message);
    redraw();
  }
  function stop() { clearInterval(timer); timer = null; }
  function timings(extra) {
    window.__SAQ_WORLD_STARTUP_TIMINGS__ = Object.freeze({totalMs: Math.round(now() - started), ...extra, events: Object.freeze(records.map((x) => Object.freeze({...x})))});
  }
  function finish() {
    if (complete) return;
    complete = true; step = STEPS.length - 1;
    record('First playable frame rendered');
    setText(label, 'Ready'); show(1); stop();
    timings({});
    console.info('[SAQ World] Startup timings', window.__SAQ_WORLD_STARTUP_TIMINGS__);
    // Fade out over the first frames of play, then get out of the way entirely.
    root.classList.add('saq-camp-done');
    setTimeout(() => { root.hidden = true; }, 450);
  }
  function fail() {
    if (complete) return;
    complete = true; record('Startup interrupted'); stop();
    root.hidden = true; // The retry and recovery dialog must be reachable.
    timings({failed: true});
  }
  function report() {
    const byStage = records.map((item) => `${Math.round(item.atMs / 1000)}s — ${item.stage}`);
    return ['SAQ World startup diagnostics', 'Build: ' + (release || 'unknown'), `Elapsed: ${Math.round((now() - started) / 1000)} seconds`, ...byStage].join('\n');
  }
  if (copyButton) copyButton.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(report()); copyButton.textContent = 'Copied'; }
    catch { copyButton.textContent = 'Copy failed. Take a screenshot instead.'; }
  });
  redraw();
  timer = setInterval(redraw, 200);
  window.__SAQ_STARTUP_LOADING_V1__ = Object.freeze({stage, note, finish, fail, report, events: () => records.map((x) => ({...x}))});
})();
