using System.Runtime.InteropServices;

namespace Joree.Desktop;

internal static class Program
{
    [STAThread]
    private static int Main(string[] args)
    {
        ApplicationConfiguration.Initialize();
        if (args.Contains("--self-test")) return NativeSelfTest.Run();
        using var instance = new Mutex(true, @"Local\Joree.Desktop." + Environment.UserName, out var created);
        if (!created)
        {
            var existing = FindWindow(null, MainForm.WindowTitle);
            if (existing != IntPtr.Zero) { if(args.Contains("--exit"))SendMessage(existing,0x8042,IntPtr.Zero,IntPtr.Zero);else { ShowWindow(existing, 9); SetForegroundWindow(existing); } }
            return 0;
        }
        if(args.Contains("--exit"))return 0;
        try { using var window = new MainForm(args.Contains("--always-on-top")); Application.Run(window); return 0; }
        catch (Exception error)
        {
            AppPaths.Log(error);
            MessageBox.Show("جرعه اجرا نشد. " + error.Message, "جرعه", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 1;
        }
    }
    [DllImport("user32.dll", CharSet=CharSet.Unicode)] private static extern IntPtr FindWindow(string? className, string title);
    [DllImport("user32.dll")] private static extern bool ShowWindow(IntPtr window, int command);
    [DllImport("user32.dll")] private static extern bool SetForegroundWindow(IntPtr window);
    [DllImport("user32.dll")] private static extern IntPtr SendMessage(IntPtr window,int message,IntPtr wparam,IntPtr lparam);
}
