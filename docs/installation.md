# Install Joree on Windows

Your cozy study console, with a very ordinary install process.

## Downloads

- [Windows installer](https://github.com/Hamrez95/Joree/releases/download/v0.3.0/JoreeSetup.exe)
- [Extract-and-run ZIP](https://github.com/Hamrez95/Joree/releases/download/v0.3.0/Joree-0.3.0-win-x64.zip)
- [Lesson template](https://github.com/Hamrez95/Joree/releases/download/v0.3.0/Joree-lesson-template.md)
- [Checksums](https://github.com/Hamrez95/Joree/releases/download/v0.3.0/SHA256SUMS.txt)
- [All releases](https://github.com/Hamrez95/Joree/releases)

## Before installing

You need 64-bit Windows, [.NET 10 Desktop Runtime x64](https://dotnet.microsoft.com/en-us/download/dotnet/10.0), and [Microsoft Edge WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/).

The app installer runs for your own account without requesting administrator elevation. Missing shared runtimes may still need separate installation or IT approval. The ZIP has the same requirements; it doesn't bundle either runtime.

Preview builds are unsigned. If your organization disallows the executable, obtain approval from the appropriate administrator. Joree doesn't need antivirus or other Windows protections disabled.

## Install

1. Download and run `JoreeSetup.exe` from this repository's release page.
2. Confirm the per-user installation.
3. Open **جرعه** on the desktop or **Joree** in Start.

The app installs into `%LOCALAPPDATA%\Programs\Joree\app-0.3.0`. Windows Installed apps lists it as **جرعه / Joree**.

For the ZIP, extract the entire folder and launch `Joree.exe`. Keep its supporting files and `web/` directory together. That route doesn't create shortcuts or register an uninstall entry.

## Add a lesson

Choose **کتابخانه → افزودن درس → انتخاب فایل**, pick a UTF-8 `.md` lesson, check the preview, then choose **افزودن به کتابخانه**. Keep the original anywhere you like. [Template](https://github.com/Hamrez95/Joree/blob/main/examples/template-fa.md) · [Persian walkthrough](https://github.com/Hamrez95/Joree/blob/main/docs/adding-lessons.md)

Joree stores its own imported copy; editing the original doesn't automatically update the course.

## Close, back up, or uninstall

- Closing hides the app in the tray. **خروج کامل** in the tray menu exits it.
- Export a backup with **تنظیمات → گرفتن نسخهٔ پشتیبان**; restore the JSON with **بازیابی**.
- Learning data lives in `%LOCALAPPDATA%\Joree\learning.sqlite3`.
- Quit from the tray before uninstalling through Windows Installed apps. Learning data is kept after uninstall.
- New versions use the same data directory. Keep a backup before upgrading a preview.

## Check a download

Compare the result to its line in `SHA256SUMS.txt`:

```powershell
Get-FileHash .\JoreeSetup.exe -Algorithm SHA256
```

## Getting unstuck

| What happened?                            | Try this                                                             |
| ----------------------------------------- | -------------------------------------------------------------------- |
| .NET runtime requested                    | Install/request the .NET **10 Desktop Runtime x64**.                 |
| WebView2 unavailable                      | Install/request Microsoft's WebView2 Runtime.                        |
| Window disappeared after closing          | Look for Joree's icon in the system tray.                            |
| Lesson file rejected                      | Check title/body pairs, `---` separators, UTF-8, and the 2 MB limit. |
| Browser lessons aren't in the Windows app | Export a browser backup and restore it in the app.                   |

Still stuck? [File a bug](https://github.com/Hamrez95/Joree/issues/new/choose) with the app version, Windows version, and reproduction steps.
