using System.Text.Json;

namespace Joree.Desktop;

internal sealed record WindowPlacement(int X, int Y, int Width, int Height)
{
    public static Rectangle Read(string path)
    {
        var working = Screen.PrimaryScreen!.WorkingArea;
        if (!File.Exists(path)) return Centered(working, 860, 880);
        var saved = JsonSerializer.Deserialize<WindowPlacement>(File.ReadAllText(path));
        if (saved is null) return Centered(working, 860, 880);
        return Clamp(new Rectangle(saved.X, saved.Y, saved.Width, saved.Height), Screen.AllScreens.Select(screen => screen.WorkingArea).ToArray());
    }
    internal static Rectangle Clamp(Rectangle saved, Rectangle[] monitors)
    {
        var monitor = monitors.OrderByDescending(area => IntersectionArea(area, saved)).First();
        if (!monitors.Any(area => area.IntersectsWith(saved))) return Centered(monitor, saved.Width, saved.Height);
        var width = Math.Clamp(saved.Width, 390, Math.Max(390, monitor.Width));
        var height = Math.Clamp(saved.Height, 430, Math.Max(430, monitor.Height));
        return new Rectangle(Math.Clamp(saved.X, monitor.Left, Math.Max(monitor.Left, monitor.Right - width)), Math.Clamp(saved.Y, monitor.Top, Math.Max(monitor.Top, monitor.Bottom - height)), width, height);
    }
    private static long IntersectionArea(Rectangle first, Rectangle second)
    {
        var overlap = Rectangle.Intersect(first, second);
        return (long)overlap.Width * overlap.Height;
    }
    private static Rectangle Centered(Rectangle area, int width, int height)
    {
        width = Math.Min(width, area.Width); height = Math.Min(height, area.Height);
        return new Rectangle(area.Left + (area.Width - width) / 2, area.Top + (area.Height - height) / 2, width, height);
    }
    public static void Save(string path, Rectangle bounds)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        var snapshot = new WindowPlacement(bounds.X, bounds.Y, bounds.Width, bounds.Height);
        File.WriteAllText(path + ".tmp", JsonSerializer.Serialize(snapshot));
        File.Move(path + ".tmp", path, true);
    }
}
