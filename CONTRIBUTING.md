# Come tinker with the little console

Thanks for stopping by. Small, focused changes are welcome.

Joree's handheld-console look is part of the product. Use the [reference map](docs/reference-map.md), preserve Persian RTL behavior, and include a screenshot for visible UI changes. For larger features or redesigns, open an issue first.

## Local setup

Use Node 24, Microsoft Edge for browser tests, PowerShell 7, and the .NET SDK in `global.json` for Windows packaging.

```powershell
npm ci
npm run dev
```

```powershell
npm run check
npm test
npx playwright test
npm run build
pwsh -NoProfile -File scripts/build-windows.ps1
```

The Playwright config starts the UI server when needed. Windows build outputs go to `release/`, which stays out of Git. The shipped host is in `windows/`; `src-tauri/` is an earlier scaffold.

The Windows package version lives in `windows/Directory.Build.props`. Release notes live in `docs/releases/vVERSION.md`. Maintainers with an existing authorized GitHub Git credential can prepare a draft with `pwsh -File scripts/publish-github-release.ps1`; add `-Publish` only when the commit is pushed and the assets are ready. The script checks existing asset hashes and won't overwrite different uploads.

Launch the built `Joree.exe --self-test` to run persistence/window-placement smoke checks. Results go to a fresh `Joree-selftest-*` folder under the Windows temporary directory.

## Pull requests

- Explain the concrete problem and resulting behavior.
- Keep lesson/review logic separate from presentation.
- Add meaningful tests for parsing, persistence, scheduling, or game changes.
- Report the checks actually run.
- Keep personal lessons, databases, credentials, and build outputs out of commits.

Bug reports should include the app/Windows versions, reproduction steps, and expected behavior. Small example Markdown files help with import bugs.
