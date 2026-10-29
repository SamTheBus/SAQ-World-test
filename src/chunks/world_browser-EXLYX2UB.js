import {
  createLocalIndexedDbCampaignStore,
  createWorldSimulation
} from "./chunk-SR2JQSB6.js";

// src/host/local_authority_host.js
function createLocalAuthorityHost(initialState) {
  const simulation = createWorldSimulation(initialState);
  const clientView = Object.freeze({
    getInspection: simulation.getInspection
  });
  return Object.freeze({
    advanceOneTick: simulation.advanceOneTick,
    setMovementIntent: simulation.setMovementIntent,
    resolveDirectAttack: simulation.resolveDirectAttack,
    clientView
  });
}

// src/client/world_browser_client.js
function mountWorldBrowserClient({ view, statusElement }) {
  if (typeof view?.getInspection !== "function") {
    throw new TypeError("A World inspection read port is required.");
  }
  if (!statusElement || typeof statusElement.textContent !== "string") {
    throw new TypeError("A browser status element is required.");
  }
  function refresh() {
    const inspection = view.getInspection();
    statusElement.textContent = `Empty simulation: tick ${inspection.tick}; no active space.`;
  }
  refresh();
  return Object.freeze({ refresh });
}

// src/entrypoints/world_browser.js
function mountWorldBoundary(statusElement) {
  const authority = createLocalAuthorityHost();
  return mountWorldBrowserClient({
    view: authority.clientView,
    statusElement
  });
}
export {
  createLocalIndexedDbCampaignStore,
  mountWorldBoundary
};
