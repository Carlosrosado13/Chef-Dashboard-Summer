# Chef Dashboard Summer

A static GitHub Pages dashboard project for organizing summer menu information, recipe references, ingredient data, and future update workflows.

## Project Purpose

This repository is the foundation for a lightweight chef dashboard that can be hosted directly from GitHub Pages. The project will use plain HTML, CSS, and JavaScript so it stays simple to maintain, easy to deploy, and independent of build tooling.

Dashboard functionality has not been implemented yet. The current structure is intentionally minimal and ready for future development.

## Architecture Overview

The project is organized as a static site:

- `index.html` is the default GitHub Pages entry point.
- `summer.html` is reserved for the summer dashboard view.
- `css/` contains site-wide styling.
- `js/` contains browser-side JavaScript.
- `data/` will hold static dashboard data files.
- `schemas/` will hold data validation schemas and documentation.
- `worker/` is reserved for future automation scripts or data preparation logic.
- `.github/workflows/` is reserved for GitHub Actions workflow definitions.

The site should remain framework-free and should not require a build step unless a future maintenance need clearly justifies one.

## Future Update System

Future updates can be designed around structured data files stored in `data/`, with schemas documented in `schemas/`. Automation can later be added in `worker/` to prepare or validate data before it is committed.

Potential future workflow:

1. Update source menu or recipe data.
2. Validate the data against schema rules.
3. Commit the updated static data files.
4. Let GitHub Pages publish the updated dashboard.

## GitHub Pages Deployment Strategy

The project is intended to deploy as a static GitHub Pages site from the repository branch selected in the repository Pages settings.

Recommended deployment strategy:

- Keep all public site files in the repository root and supporting folders.
- Use `index.html` as the primary landing page.
- Enable GitHub Pages from the main branch once the first usable dashboard screen is ready.
- Add GitHub Actions later only if validation, scheduled updates, or generated data files become necessary.
