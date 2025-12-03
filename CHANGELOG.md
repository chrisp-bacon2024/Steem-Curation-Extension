# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.5.2-beta] - 2025-10-17
- Updated payout display to include beneficiary payouts
- Added circle display around profile picture representing user current voting power
- Added mutation safeguard to avoid recursive loop from vp display updates to interface

## [0.5.1-beta] - 2025-04-25]
### Added

- Promoted post language handling for all locales in condenser (Issue 16)
- Updated chart.js version to version 4.4.9 (https://www.jsdelivr.com/package/npm/chart.js?path=dist)

### Fixed

- Character case typo in file naming that effected non-Windows platforms (Issue 17)

## [0.5.0-beta] - 2025-04-21
### Added

- Workflow checklists
- Preparation for Chrome webstore review & publication

### Changed

- Versioning info

### Fixed

- n/a

## [0.4.0-alpha] - 2025-04-12

### Added
- Individual post metrics: word count, enhanced voter info, resteem list, vote & payout charts

### Changed
- n/a

### Fixed
- Redundant buttons to show/hide resteems

## [20240516] - 2024-05-16

### Added
- Curation info overlay pane triggered on hover over new 'CURATION INFO' link.
- Resteem visibility toggle control in header for feed/blog pages.
- Voting power display in user dropdown menu.

### Changed
- Improved performance of DOM manipulation in `main.js`.

### Fixed
- Corrected calculation for organic value in overlay.
- Ensured resteem dropdown menu appears correctly in dark mode.

## [20240412] - 2024-04-12

### Added
- Initial release.
- Highlighting for promoted posts and posts with @null beneficiaries.
- Fetching promotion data from Steemworld.