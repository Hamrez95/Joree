using System.Security.Principal;
using System.Text.Json;

namespace Joree.Desktop;

internal static class NativeSelfTest
{
    public static int Run()
    {
        var directory = Path.Combine(Path.GetTempPath(), "Joree-selftest-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(directory);
        var checks = new List<string>();
        try
        {
            var database = Path.Combine(directory, "test.sqlite3");
            const string snapshot = "{\"version\":1,\"courses\":[],\"bookmarks\":[],\"studyDays\":[],\"notes\":{},\"reviews\":{},\"preferences\":{}}";
            using (var store = new SqliteStateStore(database))
            {
                if (store.Load() is not null) throw new Exception("New database must be empty");
                store.Save(snapshot); checks.Add("sqlite-write");
                try { store.Save("{\"version\":99}"); throw new Exception("Invalid data accepted"); }
                catch (InvalidDataException) { checks.Add("reject-invalid-state"); }
            }
            using (var reopened = new SqliteStateStore(database))
            { if (reopened.Load() != snapshot) throw new Exception("State was not persisted"); checks.Add("sqlite-reopen"); }
            var monitors = new[] { new Rectangle(0,0,1920,1080) };
            var position = WindowPlacement.Clamp(new Rectangle(-3000,10,860,880), monitors);
            if (!monitors[0].Contains(position)) throw new Exception("Missing-monitor recovery failed");
            checks.Add("missing-monitor-recovery");
            var placement = Path.Combine(directory, "window.json"); WindowPlacement.Save(placement, position);
            var expectedPlacement=WindowPlacement.Clamp(position,Screen.AllScreens.Select(screen=>screen.WorkingArea).ToArray());
            if (WindowPlacement.Read(placement) != expectedPlacement) throw new Exception("Window persistence failed");
            checks.Add("window-persistence");
            var elevated = new WindowsPrincipal(WindowsIdentity.GetCurrent()).IsInRole(WindowsBuiltInRole.Administrator);
            File.WriteAllText(Path.Combine(directory, "result.json"), JsonSerializer.Serialize(new { success=true, elevated, checks }));
            Console.WriteLine(directory); return 0;
        }
        catch (Exception error) { File.WriteAllText(Path.Combine(directory, "result.json"), JsonSerializer.Serialize(new { success=false,error=error.Message,checks })); return 1; }
    }
}
