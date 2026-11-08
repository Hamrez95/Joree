namespace Joree.Desktop;

internal static class AppPaths
{
    public static string DataDirectory { get; } = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Joree");
    public static string Database => Path.Combine(DataDirectory, "learning.sqlite3");
    public static string WindowState => Path.Combine(DataDirectory, "window.json");
    public static string ErrorLog => Path.Combine(DataDirectory, "errors.log");
    public static void Log(Exception error)
    {
        Directory.CreateDirectory(DataDirectory);
        File.AppendAllText(ErrorLog, $"{DateTimeOffset.Now:O} {error.GetType().Name}: {error.Message}{Environment.NewLine}");
    }
}
