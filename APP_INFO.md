# Krish — Time Tracker App

This document summarizes the app, how it stores data, how to run it locally, and deployment details (GitHub Pages).

## App purpose and functionality
- A lightweight Time Tracker built with React (Create React App).
- Key features:
  - Start/stop a timer associated with a selected Company and Function.
  - Add manual time logs by specifying Company, Function, Start and End datetimes.
  - Manage Companies and their Functions (add, rename, delete).
  - View a chronological list of logs.
  - Export logs to an Excel file (`timesheet.xlsx`) using `xlsx` + `file-saver`.
  - Auto-export attempt every 5 minutes (if logs exist).

## Important files
- `src/TimeTrackerApp.jsx` (main app component: UI, timer, manual logs, management, export)
- `src/TimeTrackerApp_backup.jsx` (older backup of the same component)
- `src/App.js` (mounts `TimeTrackerApp`)
- `src/index.js` (entry file)
- `src/components/ui/*` (UI primitives used by the app)
- `package.json` (project metadata, scripts)

## Data persistence (localStorage keys)
- `companies` — JSON object mapping companyName => array of function names
- `timeTrackerLogs` — JSON array of log objects
- `ttStartTime` — ISO string of running timer start (or removed if none)
- `ttIsTracking` — boolean for whether the timer is running

Log object shape example:

```json
{
  "company": "Acme",
  "function": "Development",
  "start": "2026-05-16T10:00:00.000Z",
  "end": "2026-05-16T10:35:00.000Z",
  "duration": "2100.00",
  "units": 2
}
```

- `duration` is stored as seconds (string).
- `units` is the number of 20-minute blocks (computed with `Math.ceil(duration_seconds / (20*60))`).

## How to run locally (PowerShell)
```powershell
cd 'C:\Users\rajki\krish'
npm install
npm start
```
- `npm start` runs the Create React App dev server on http://localhost:3000.
- `npm run build` creates a production `build/` folder.

## Deployment (GitHub Pages)
- This repository is configured to publish to GitHub Pages at:

  https://tholapi.github.io/Krish

- `package.json` includes:
  - `homepage`: `https://tholapi.github.io/Krish`
  - `predeploy`: `npm run build`
  - `deploy`: `gh-pages -d build`

- To deploy from this repository locally (will build and publish the `build/` folder to the `gh-pages` branch):
```powershell
npm install
npm run deploy
```
- The repo already uses the `gh-pages` package; the `gh-pages` branch will be created/updated by the deploy script.

## Notes about the current repo state
- `file-saver` dependency is required by `TimeTrackerApp.jsx` for Excel export. It has been installed and recorded.
- `package-lock.json` and `package.json` were updated and committed.
- The site was deployed and `origin/gh-pages` was updated.

## Maintenance suggestions
- Commit any local changes before running `npm run deploy` so the published build reflects committed source.
- Consider disabling the Start button until a Company & Function are selected to avoid empty logs.
- Improve the auto-export logic to set up the interval only once on mount (current implementation recreates it when logs change).
- Run `npx update-browserslist-db@latest` regularly to keep Browserslist data current.
- Run `npm audit fix` (and review `npm audit`) to address reported vulnerabilities.

## Troubleshooting
- If build fails with `Module not found: Can't resolve 'file-saver'`, run:
```powershell
npm install file-saver --save
```
- If the site does not show latest changes after deploy:
  - Confirm `main` has the commit you expect, then run `npm run deploy`.
  - Check GitHub Pages settings in the repo to confirm it serves from `gh-pages` branch.

---
Generated on 2026-05-16 — keep this file with the repository for quick reference.
