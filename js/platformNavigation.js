const DEFAULT_VIEW = "dashboard";

function setActiveView(viewName) {
  const panels = document.querySelectorAll("[data-platform-panel]");
  const buttons = document.querySelectorAll("[data-platform-view]");
  const adminFrame = document.querySelector("#admin-frame");

  for (const panel of panels) {
    panel.hidden = panel.dataset.platformPanel !== viewName;
  }

  for (const button of buttons) {
    const isActive = button.dataset.platformView === viewName;
    button.setAttribute("aria-pressed", String(isActive));
  }

  if (viewName === "admin" && adminFrame && !adminFrame.src) {
    adminFrame.src = adminFrame.dataset.src || "admin.html";
  }

  if (window.location.hash !== `#${viewName}`) {
    history.replaceState(null, "", `#${viewName}`);
  }
}

function getInitialView() {
  const hashView = window.location.hash.replace("#", "");
  return hashView === "admin" ? "admin" : DEFAULT_VIEW;
}

export function initializePlatformNavigation() {
  const buttons = document.querySelectorAll("[data-platform-view]");

  for (const button of buttons) {
    button.addEventListener("click", () => {
      setActiveView(button.dataset.platformView || DEFAULT_VIEW);
    });
  }

  window.addEventListener("hashchange", () => {
    setActiveView(getInitialView());
  });

  setActiveView(getInitialView());
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializePlatformNavigation, { once: true });
} else {
  initializePlatformNavigation();
}
