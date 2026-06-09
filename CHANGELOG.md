# Changelog

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
