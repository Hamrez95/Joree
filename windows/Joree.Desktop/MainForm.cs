using System.Drawing.Drawing2D;
using System.Runtime.InteropServices;
using System.Text.Json;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace Joree.Desktop;

internal sealed class MainForm : Form
{
    public const string WindowTitle = "جرعه – Joree";
    private const string Origin = "https://joree.local";
    private readonly WebView2 browser = new() { Dock = DockStyle.Fill, DefaultBackgroundColor = Color.Transparent };
    private readonly NotifyIcon tray;
    private readonly SqliteStateStore store;
    private readonly System.Windows.Forms.Timer placementTimer = new() { Interval = 650 };
    private bool exiting, compact, ready;
    private readonly bool forceTopMost;
    private Rectangle expandedBounds;
    protected override CreateParams CreateParams
    {
        get { var parameters = base.CreateParams; parameters.Style |= 0x00040000; return parameters; }
    }

    public MainForm(bool forceTopMost=false)
    {
        this.forceTopMost=forceTopMost; TopMost=forceTopMost;
        Text = WindowTitle; FormBorderStyle = FormBorderStyle.None; StartPosition = FormStartPosition.Manual;
        AutoScaleMode = AutoScaleMode.Dpi; MinimumSize = new Size(390, 430); BackColor = Color.FromArgb(163,185,245);
        // Color-keyed layered WinForms windows make WebView2's GPU surface click-through.
        // A shaped native region provides the outside transparency while preserving hit testing.
        TransparencyKey = Color.Empty; Opacity = 0; ShowInTaskbar = true;
        Icon = Icon.ExtractAssociatedIcon(Environment.ProcessPath!);
        Bounds = ReadPlacement(); expandedBounds = Bounds;
        store = new SqliteStateStore(AppPaths.Database);
        Controls.Add(browser); tray = CreateTray();
        Shown += async (_, _) => await InitializeBrowser();
        Move += (_, _) => SchedulePlacement(); Resize += (_, _) => SchedulePlacement();
        placementTimer.Tick += (_, _) => { placementTimer.Stop(); SavePlacement(); };
        FormClosing += (_, args) => { SavePlacement(); if (!exiting) { args.Cancel = true; Hide(); } };
    }
    private Rectangle ReadPlacement()
    {
        try { return WindowPlacement.Read(AppPaths.WindowState); }
        catch (Exception error) { AppPaths.Log(error); return WindowPlacement.Clamp(new Rectangle(120, 60, 860, 880), Screen.AllScreens.Select(screen=>screen.WorkingArea).ToArray()); }
    }
    private NotifyIcon CreateTray()
    {
        var menu = new ContextMenuStrip();
        menu.Items.Add("بازکردن کتابخانه", null, async (_, _) => await OpenPage("library"));
        menu.Items.Add("زنگ تفریح", null, async (_, _) => await OpenPage("arcade"));
        menu.Items.Add("تنظیمات", null, async (_, _) => await OpenPage("settings"));
        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add("خروج کامل", null, (_, _) => { exiting = true; Close(); });
        var icon = new NotifyIcon { Icon = Icon, Text = "جرعه — دوبار کلیک برای بازکردن", Visible = true, ContextMenuStrip = menu };
        icon.DoubleClick += (_, _) => RestoreWindow();
        return icon;
    }
    private async Task InitializeBrowser()
    {
        try
        {
            var environment = await CoreWebView2Environment.CreateAsync(null, Path.Combine(AppPaths.DataDirectory, "WebView2"));
            await browser.EnsureCoreWebView2Async(environment);
            browser.CoreWebView2.SetVirtualHostNameToFolderMapping("joree.local", Path.Combine(AppContext.BaseDirectory, "web"), CoreWebView2HostResourceAccessKind.DenyCors);
            browser.CoreWebView2.Settings.AreDevToolsEnabled = false;
            browser.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
            browser.CoreWebView2.Settings.IsStatusBarEnabled = false;
            browser.CoreWebView2.Settings.IsZoomControlEnabled = false;
            await browser.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync("window.__JOREE_DESKTOP__=true;");
            browser.CoreWebView2.WebMessageReceived += ReceiveMessage;
            browser.CoreWebView2.NavigationStarting += (_, args) => { if (!IsLocal(args.Uri)) args.Cancel = true; };
            browser.CoreWebView2.NewWindowRequested += (_, args) => { args.Handled = true; OpenReference(args.Uri); };
            browser.CoreWebView2.DownloadStarting += Download;
            browser.CoreWebView2.PermissionRequested += (_, args) => args.State = CoreWebView2PermissionState.Deny;
            browser.CoreWebView2.ProcessFailed += (_, args) => ReportFatal(new IOException("موتور نمایش متوقف شد: " + args.ProcessFailedKind));
            browser.CoreWebView2.NavigationCompleted += (_, args) => { if (!args.IsSuccess) ReportFatal(new IOException("بازکردن رابط انجام نشد: " + args.WebErrorStatus)); };
            browser.Source = new Uri(Origin + "/index.html");
        }
        catch (Exception error) { ReportFatal(error); }
    }
    private static bool IsLocal(string source) => Uri.TryCreate(source, UriKind.Absolute, out var uri) && uri.Scheme == "https" && uri.Host == "joree.local" && uri.Port == 443;
    private static void OpenReference(string source)
    {
        if (!Uri.TryCreate(source, UriKind.Absolute, out var uri) || (uri.Scheme != "https" && uri.Scheme != "http") || IsLocal(source)) return;
        try { System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(uri.AbsoluteUri) { UseShellExecute = true }); }
        catch (Exception error) { AppPaths.Log(error); MessageBox.Show("بازکردن لینک منبع انجام نشد. مرورگر پیش‌فرض را بررسی کنید.", "جرعه"); }
    }
    private void ReceiveMessage(object? sender, CoreWebView2WebMessageReceivedEventArgs args)
    {
        if (!IsLocal(args.Source) || args.WebMessageAsJson.Length > 21_000_000) return;
        string? id = null;
        try
        {
            using var message = JsonDocument.Parse(args.WebMessageAsJson);
            id = message.RootElement.GetProperty("id").GetString();
            if (id is null || id.Length > 80) return;
            var action = message.RootElement.GetProperty("action").GetString();
            var payload = message.RootElement.GetProperty("payload");
            object? result = Dispatch(action, payload);
            browser.CoreWebView2.PostWebMessageAsJson(JsonSerializer.Serialize(new { id, result }));
        }
        catch (Exception error)
        {
            AppPaths.Log(error);
            if (id is not null) browser.CoreWebView2.PostWebMessageAsJson(JsonSerializer.Serialize(new { id, error = error.Message }));
        }
    }
    private object? Dispatch(string? action, JsonElement payload)
    {
        switch (action)
        {
            case "loadState": return store.Load();
            case "saveState": store.Save(payload.GetProperty("state").GetRawText()); return true;
            case "ready": ready = true; Opacity = 1; return true;
            case "shape": UpdateShape(payload); return true;
            case "minimize": WindowState = FormWindowState.Minimized; return true;
            case "close": SavePlacement(); Hide(); return true;
            case "pin": TopMost = forceTopMost || payload.GetProperty("enabled").GetBoolean(); return true;
            case "compact": SetCompact(payload.GetProperty("enabled").GetBoolean()); return true;
            case "drag": ReleaseCapture(); SendMessage(Handle, 0xA1, new IntPtr(2), IntPtr.Zero); return true;
            case "resize": BeginResize(payload.GetProperty("edge").GetString()); return true;
            case "dataPath": return AppPaths.DataDirectory;
            default: throw new InvalidOperationException("فرمان ناشناخته است.");
        }
    }
    private void BeginResize(string? edge)
    {
        var hit = edge switch { "w" => 10, "e" => 11, "n" => 12, "nw" => 13, "ne" => 14, "s" => 15, "sw" => 16, "se" => 17, _ => 0 };
        if (hit == 0 || WindowState != FormWindowState.Normal) return;
        // Reply to WebView before entering Windows' modal size loop.
        BeginInvoke(() => {
            var point = Cursor.Position;
            var coordinates = new IntPtr((point.Y & 0xffff) << 16 | (point.X & 0xffff));
            ReleaseCapture(); SendMessage(Handle, 0xA1, new IntPtr(hit), coordinates);
        });
    }
    private void SetCompact(bool enabled)
    {
        if (compact == enabled) return;
        if (enabled) expandedBounds = Bounds;
        compact = enabled;
        var scale = DeviceDpi / 96.0;
        Bounds = enabled ? new Rectangle(Location, new Size((int)(570 * scale), (int)(465 * scale))) : expandedBounds;
        Bounds = WindowPlacement.Clamp(Bounds, Screen.AllScreens.Select(screen => screen.WorkingArea).ToArray());
    }
    private void UpdateShape(JsonElement payload)
    {
        var factor = DeviceDpi / 96f;
        var rectangle = new RectangleF(payload.GetProperty("x").GetSingle()*factor, payload.GetProperty("y").GetSingle()*factor, payload.GetProperty("width").GetSingle()*factor, payload.GetProperty("height").GetSingle()*factor);
        if (!float.IsFinite(rectangle.Width) || !float.IsFinite(rectangle.Height) || rectangle.Width < 100 || rectangle.Height < 100 || rectangle.Width > ClientSize.Width + 10 || rectangle.Height > ClientSize.Height + 10) return;
        var radius = Math.Min(rectangle.Width * .095f, rectangle.Height * .095f);
        using var path = new GraphicsPath();
        path.AddArc(rectangle.Left,rectangle.Top,radius*2,radius*2,180,90);
        path.AddArc(rectangle.Right-radius*2,rectangle.Top,radius*2,radius*2,270,90);
        path.AddArc(rectangle.Right-radius*2,rectangle.Bottom-radius*2,radius*2,radius*2,0,90);
        path.AddArc(rectangle.Left,rectangle.Bottom-radius*2,radius*2,radius*2,90,90); path.CloseFigure();
        var old = Region; Region = new Region(path); old?.Dispose();
    }
    private void Download(object? sender, CoreWebView2DownloadStartingEventArgs args)
    {
        var source = args.DownloadOperation.Uri;
        if (!(IsLocal(source) || source.StartsWith("blob:"+Origin+"/", StringComparison.Ordinal))) { args.Cancel = true; return; }
        using var deferral = args.GetDeferral();
        var filename = Path.GetFileName(args.ResultFilePath);
        var extension = Path.GetExtension(filename).ToLowerInvariant();
        if (extension is not (".json" or ".mjs" or ".md")) { args.Cancel = true; return; }
        using var dialog = new SaveFileDialog { Title = "ذخیرهٔ فایل جرعه", FileName = filename, Filter = $"Joree file (*{extension})|*{extension}", DefaultExt = extension.TrimStart('.'), AddExtension = true };
        args.Handled = true;
        if (dialog.ShowDialog(this) != DialogResult.OK) { args.Cancel = true; return; }
        args.ResultFilePath = dialog.FileName;
    }
    private void RestoreWindow() { Show(); WindowState = FormWindowState.Normal; Activate(); }
    private async Task OpenPage(string page)
    {
        RestoreWindow();
        if (ready) await browser.CoreWebView2.ExecuteScriptAsync("window.dispatchEvent(new CustomEvent('joree-navigate',{detail:"+JsonSerializer.Serialize(page)+"}));");
    }
    private void SchedulePlacement() { if (!ready) return; placementTimer.Stop(); placementTimer.Start(); }
    private void SavePlacement()
    {
        if (!ready || WindowState != FormWindowState.Normal) return;
        try { WindowPlacement.Save(AppPaths.WindowState, compact ? expandedBounds : Bounds); }
        catch (Exception error) { AppPaths.Log(error); }
    }
    private void ReportFatal(Exception error)
    {
        AppPaths.Log(error); MessageBox.Show("اجرای جرعه انجام نشد.\n"+error.Message, "جرعه", MessageBoxButtons.OK, MessageBoxIcon.Error); exiting=true; Close();
    }
    protected override void Dispose(bool disposing)
    {
        if (disposing) { placementTimer.Dispose(); tray.Visible=false; tray.ContextMenuStrip?.Dispose(); tray.Dispose(); browser.Dispose(); store.Dispose(); }
        base.Dispose(disposing);
    }
    protected override void WndProc(ref Message message)
    {
        // Retain the native size loop without drawing a standard title bar or border.
        if (message.Msg == 0x83 && message.WParam != IntPtr.Zero) { message.Result = IntPtr.Zero; return; }
        if(message.Msg==0x8042){exiting=true;Close();return;}
        base.WndProc(ref message);
    }
    [DllImport("user32.dll")] private static extern bool ReleaseCapture();
    [DllImport("user32.dll")] private static extern IntPtr SendMessage(IntPtr window, int message, IntPtr wparam, IntPtr lparam);
}
