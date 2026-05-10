const DEFAULT_ADMIN_SECTION = "workspace";

function setActiveAdminSection(sectionName) {
  const panels = document.querySelectorAll("[data-admin-section-panel]");
  const buttons = document.querySelectorAll("[data-admin-section]");
  const adminContent = document.querySelector("#admin-content");
  const panelSectionName = sectionName === "workspace" ? "recipes" : sectionName;

  for (const panel of panels) {
    panel.hidden = panel.dataset.adminSectionPanel !== panelSectionName;
  }

  for (const button of buttons) {
    button.setAttribute("aria-pressed", String(button.dataset.adminSection === sectionName));
  }

  if (adminContent) {
    adminContent.dataset.activeAdminSection = sectionName;
  }
}

export function initializeAdminSections() {
  const buttons = document.querySelectorAll("[data-admin-section]");

  for (const button of buttons) {
    button.addEventListener("click", () => {
      setActiveAdminSection(button.dataset.adminSection || DEFAULT_ADMIN_SECTION);
    });
  }

  setActiveAdminSection(DEFAULT_ADMIN_SECTION);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeAdminSections, { once: true });
} else {
  initializeAdminSections();
}
