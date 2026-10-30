// src/entrypoints/browser_boot.js
function reportStartupFailure(error) {
  window.__SAQ_STARTUP_LOADING_V1__?.fail();
  document.getElementById("saq-startup-scene")?.setAttribute("hidden", "");
  const message = error?.message ?? String(error);
  console.error(error?.stack ?? message);
  const status = document.getElementById("world-status");
  const location = document.getElementById("space-label");
  const recovery = document.getElementById("startup-recovery");
  if (status) status.textContent = "Unable to start: " + message;
  if (location) location.textContent = "Unable to start";
  if (recovery) {
    recovery.hidden = false;
    recovery.dataset.busy = "false";
    const title = document.getElementById("startup-recovery-title");
    const detail = document.getElementById("startup-recovery-detail");
    if (title) title.textContent = "World could not start";
    if (detail) detail.textContent = message + " \u2014 please retry. Your saved campaigns have not been deleted.";
    const retry = document.getElementById("startup-retry");
    if (retry) retry.onclick = () => window.location.reload();
    for (const id of ["startup-new", "startup-forget", "startup-reset"]) {
      const action = document.getElementById(id);
      if (action) action.hidden = true;
    }
  }
  const attack = document.getElementById("primary-attack");
  if (attack) attack.hidden = true;
}
function prefetchArt() {
  let urls = [];
  try {
    urls = JSON.parse(document.getElementById("saq-art-prefetch")?.textContent || "[]");
  } catch {
  }
  for (const url of urls) fetch(url, { priority: "low" }).then((r) => r.ok ? r.arrayBuffer() : null).catch(() => null);
}
var inspection = document.getElementById("world-boundary-status");
if (inspection) {
  import("../chunks/world_browser-PV22I4IS.js").then(({ mountWorldBoundary }) => mountWorldBoundary(inspection)).catch(reportStartupFailure);
} else {
  import("../chunks/playable_browser-QAAAJ4NH.js").then(({ startWorldClient }) => {
    window.__SAQ_STARTUP_LOADING_V1__?.stage(1, "Reading the world map\u2026");
    prefetchArt();
    return startWorldClient(window);
  }).catch(reportStartupFailure);
}
