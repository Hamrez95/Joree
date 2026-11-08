using System.Diagnostics;
using System.IO.Compression;
using System.Reflection;
using System.Security.Cryptography;
using System.Security.Principal;
using System.Text.Json;
using Microsoft.Win32;

namespace Joree.Setup;

internal static class Program
{
    private static readonly string Version = Assembly.GetExecutingAssembly().GetName().Version!.ToString(3);
    private const string RegistryPath = @"Software\Microsoft\Windows\CurrentVersion\Uninstall\Joree";
    private static readonly string Local = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
    private static readonly string InstallRoot = Path.Combine(Local, "Programs", "Joree");
    private static readonly string MaintenanceRoot = Path.Combine(Local, "Joree", "Maintenance");
    private static readonly string VersionDirectory = Path.Combine(InstallRoot, "app-" + Version);
    private static readonly string Shortcut = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs), "Joree.lnk");
    private static readonly string DesktopShortcut = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), "جرعه.lnk");
    [STAThread]
    private static int Main(string[] args)
    {
        ApplicationConfiguration.Initialize();
        var quiet = args.Contains("--quiet");
        try
        {
            if (args.Contains("--inspect")) { Report(args, new { success = true, action = "inspect", version = Version, installPath = VersionDirectory, requiresAdministrator = false, files = ValidatePackage() }); return 0; }
            if (args.Contains("--uninstall")) return Uninstall(quiet);
            ValidatePackage();
            if (!quiet && MessageBox.Show($"جرعه برای همین حساب کاربری نصب شود؟\n\n{VersionDirectory}\n\nاین نصب به دسترسی ادمین نیاز ندارد.", "نصب جرعه", MessageBoxButtons.YesNo, MessageBoxIcon.Question) != DialogResult.Yes) return 0;
            var installed = Install();
            Report(args, new { success = true, action = "install", version = Version, path = installed, elevated = IsElevated(), shortcut = Shortcut });
            if (!quiet) { MessageBox.Show("جرعه نصب شد. از منوی Start با نام Joree باز می‌شود.", "جرعه"); Process.Start(new ProcessStartInfo(installed) { UseShellExecute = true }); }
            return 0;
        }
        catch (Exception error)
        {
            Report(args, new { success = false, error = error.Message });
            if (!quiet) MessageBox.Show("نصب انجام نشد:\n" + error.Message, "جرعه", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 1;
        }
    }
    private static bool IsElevated() => new WindowsPrincipal(WindowsIdentity.GetCurrent()).IsInRole(WindowsBuiltInRole.Administrator);
    private static Stream Payload() => Assembly.GetExecutingAssembly().GetManifestResourceStream("Joree.Payload.zip") ?? throw new InvalidDataException("بستهٔ برنامه یافت نشد.");
    private static Dictionary<string, string> ReadManifest(ZipArchive zip)
    {
        var entry = zip.GetEntry("package-manifest.json") ?? throw new InvalidDataException("شناسهٔ بسته موجود نیست.");
        using var stream = entry.Open();
        return JsonSerializer.Deserialize<Dictionary<string,string>>(stream) ?? throw new InvalidDataException("شناسهٔ بسته نامعتبر است.");
    }
    private static int ValidatePackage()
    {
        using var stream = Payload(); using var zip = new ZipArchive(stream); var manifest = ReadManifest(zip);
        if (!manifest.ContainsKey("Joree.exe") || !manifest.ContainsKey("web/index.html")) throw new InvalidDataException("بستهٔ برنامه کامل نیست.");
        foreach (var pair in manifest) ValidateEntry(zip, pair.Key, pair.Value);
        if (zip.Entries.Any(entry => entry.FullName != "package-manifest.json" && !manifest.ContainsKey(entry.FullName))) throw new InvalidDataException("فایل ناشناخته در بسته وجود دارد.");
        return manifest.Count;
    }
    private static void ValidateEntry(ZipArchive zip, string name, string expected)
    {
        if (Path.IsPathRooted(name) || name.Split('/','\\').Contains("..")) throw new InvalidDataException("مسیر فایل بسته نامعتبر است.");
        var entry = zip.GetEntry(name) ?? throw new InvalidDataException("فایل بسته موجود نیست: " + name);
        using var content = entry.Open(); var actual = Convert.ToHexString(SHA256.HashData(content));
        if (!actual.Equals(expected, StringComparison.OrdinalIgnoreCase)) throw new InvalidDataException("فایل بسته خراب است: " + name);
    }
    private static string Install()
    {
        Directory.CreateDirectory(InstallRoot); Directory.CreateDirectory(MaintenanceRoot);
        var executable = Path.Combine(VersionDirectory,"Joree.exe");
        if (Directory.Exists(VersionDirectory))
        {
            if (File.Exists(Path.Combine(VersionDirectory,"package-manifest.json"))) { Register(executable); return executable; }
            throw new IOException("پوشهٔ مقصد متعلق به این نصب نیست؛ نصب متوقف شد.");
        }
        var staging = Path.Combine(InstallRoot, ".staging-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(staging);
        try
        {
            using (var stream = Payload()) using (var zip = new ZipArchive(stream))
                foreach (var entry in zip.Entries) Extract(entry, staging);
            Directory.Move(staging, VersionDirectory);
            Register(executable); return executable;
        }
        catch { if (Directory.Exists(staging)) Directory.Delete(staging, true); throw; }
    }
    private static void Extract(ZipArchiveEntry entry, string staging)
    {
        var output = Path.GetFullPath(Path.Combine(staging,entry.FullName));
        if (!output.StartsWith(staging+Path.DirectorySeparatorChar,StringComparison.OrdinalIgnoreCase)) throw new InvalidDataException("مسیر بسته خارج از پوشهٔ نصب است.");
        Directory.CreateDirectory(Path.GetDirectoryName(output)!); entry.ExtractToFile(output);
    }
    private static void Register(string executable)
    {
        var maintenance = Path.Combine(MaintenanceRoot,"JoreeSetup.exe");
        if (!string.Equals(Environment.ProcessPath,maintenance,StringComparison.OrdinalIgnoreCase)) File.Copy(Environment.ProcessPath!,maintenance,true);
        CreateShortcut(executable,Shortcut);
        CreateShortcut(executable,DesktopShortcut);
        using var key=Registry.CurrentUser.CreateSubKey(RegistryPath);
        key.SetValue("DisplayName","جرعه / Joree"); key.SetValue("DisplayVersion",Version); key.SetValue("Publisher","Joree");
        key.SetValue("InstallLocation",InstallRoot); key.SetValue("DisplayIcon",executable);
        key.SetValue("UninstallString",$"\"{maintenance}\" --uninstall"); key.SetValue("NoModify",1); key.SetValue("NoRepair",1);
        File.WriteAllText(Path.Combine(InstallRoot,"install.json"),JsonSerializer.Serialize(new { version=Version, directory=VersionDirectory, userOnly=true }));
    }
    private static void CreateShortcut(string executable,string destination)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(destination)!);
        var type = Type.GetTypeFromProgID("WScript.Shell") ?? throw new IOException("ساخت میان‌بر ویندوز ممکن نیست.");
        // WScript's Save uses an ANSI path on some managed Windows installations.
        // Save to an ASCII filename, then move with .NET's Unicode filesystem API.
        var temporary=Path.Combine(Path.GetTempPath(),"Joree-shortcut-"+Guid.NewGuid().ToString("N")+".lnk");
        dynamic shell = Activator.CreateInstance(type)!; dynamic shortcut = shell.CreateShortcut(temporary);
        try { shortcut.TargetPath=executable; shortcut.WorkingDirectory=VersionDirectory; shortcut.Description="Joree learning console"; shortcut.IconLocation=executable+",0"; shortcut.Save(); File.Move(temporary,destination,true); }
        finally { if(File.Exists(temporary))File.Delete(temporary); System.Runtime.InteropServices.Marshal.FinalReleaseComObject(shortcut); System.Runtime.InteropServices.Marshal.FinalReleaseComObject(shell); }
    }
    private static int Uninstall(bool quiet)
    {
        if (!quiet && MessageBox.Show("جرعه حذف شود؟ درس‌ها و پیشرفت شما در پوشهٔ داده حفظ می‌شوند.","حذف جرعه",MessageBoxButtons.YesNo,MessageBoxIcon.Question)!=DialogResult.Yes)return 0;
        var marker=Path.Combine(InstallRoot,"install.json");
        if (!File.Exists(marker)) throw new IOException("نصب معتبر جرعه پیدا نشد.");
        EnsureNotRunning();
        if (File.Exists(Shortcut))File.Delete(Shortcut);
        if (File.Exists(DesktopShortcut))File.Delete(DesktopShortcut);
        // The target is a fixed per-user product directory, and its installation marker was verified above.
        Directory.Delete(InstallRoot,true); Registry.CurrentUser.DeleteSubKeyTree(RegistryPath,false);
        if (!quiet)MessageBox.Show("جرعه حذف شد. داده‌های یادگیری شما حفظ شدند.","جرعه"); return 0;
    }
    private static void EnsureNotRunning()
    {
        foreach (var process in Process.GetProcessesByName("Joree"))
        {
            using(process)if(process.MainModule?.FileName?.StartsWith(InstallRoot+Path.DirectorySeparatorChar,StringComparison.OrdinalIgnoreCase)==true)throw new IOException("ابتدا از منوی کنار ساعت، خروج کامل از جرعه را انتخاب کن.");
        }
    }
    private static void Report(string[] args, object result)
    {
        var index=Array.IndexOf(args,"--report");
        if(index>=0&&index+1<args.Length)File.WriteAllText(args[index+1],JsonSerializer.Serialize(result,new JsonSerializerOptions{WriteIndented=true}));
    }
}
