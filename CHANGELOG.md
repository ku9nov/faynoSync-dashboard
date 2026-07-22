# Changelog

## v1.2.4

### Fixed

- Reports page no longer crashes with `Cannot read properties of undefined (reading 'split')` when a report group is returned with a missing `event.type`, `event.reason`, or `status` field; label and badge helpers now handle null/undefined values.

## v1.2.3

### Added

- Highlight published versions with an incomplete staged rollout (`RolloutPercent < 100`).

## v1.2.2

- Added reports managment.
- Added staged rollouts to telemetry.

## v1.2.1

### Added

- Added `velopack` updater, added `velopack` applications to TUF bootstrap script.

## v1.2.0

### Added

- Filtering on the Reports page (by application, channel, platform, architecture, and date range).

### Fixed

- Modals (create, edit, delete, upload) no longer close when a click starts inside the modal and is dragged onto the backdrop (e.g. selecting text past the modal edge); only a genuine backdrop click closes them.
- Report key field and page layout on mobile: the report key now scrolls within its field instead of stretching the page, and content areas no longer overflow horizontally on narrow screens.
- Dropdowns in the Create User modal now close the previously open dropdown when another one is opened.

## v1.1.0

### Added

- Reports page with download statistics, including a modal for viewing report blobs.
- Sidebar navigation entry and route for the Reports page.

### Changed

- Restructured the project: grouped components into `cards`, `layout`, and `modals` directories and standardized page/route filenames to PascalCase.
- Updated import paths, `vite.config.ts`, and `tsconfig.app.json` to match the new structure.

### Fixed

- Dropdown colors across Dashboard, Upload, Edit Version, Create User modals, and the Statistics page for correct theming.

## v1.0.3

### Features

- Added `cdn` parameter to `POST /app/create` and `POST /app/update` endpoints.
- Added `CDN` status badge for applications with CDN enabled.

## v1.0.2

### Features

- Added `reports` parameter to `POST /apps/create` and `POST /apps/update` endpoints.
- Added report key management to the dashboard.

## v1.0.1

### Changed

- Hide sensitive or secondary info in the UI where appropriate.
- Add blur styling to key type and TUF settings dropdown areas for clearer visual hierarchy.

### Added

- Rotate delegated role keys flow, including check-status and delete-metadata actions on the rotation UI.
- User-facing information about the key rotation process.

### Removed

- TUF-related tasks from the bootstrap window to reduce noise during initial setup.

## v1.0.0

Initial stable release of `faynoSync-dashboard`.

This version includes the core product functionality, major security-focused workflows, and the first complete set of dashboard and management features for production use.
