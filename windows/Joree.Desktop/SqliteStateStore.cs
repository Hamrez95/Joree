using System.Runtime.InteropServices;
using System.Text.Json;

namespace Joree.Desktop;

/// <summary>Stores validated application snapshots in Windows' SQLite library; exposes no general SQL interface.</summary>
internal sealed class SqliteStateStore : IDisposable
{
    private const int Success = 0, Row = 100, Done = 101;
    private readonly IntPtr database;
    public SqliteStateStore(string filename)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(filename))!);
        var status = Native.sqlite3_open_v2(filename, out database, 2 | 4 | 0x10000, IntPtr.Zero);
        if (status != Success) throw new IOException("بازکردن پایگاه داده ممکن نیست.");
        Execute("PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA user_version=1; CREATE TABLE IF NOT EXISTS application_state (id INTEGER PRIMARY KEY CHECK(id=1), payload TEXT NOT NULL, saved_at TEXT NOT NULL); ");
    }
    public string? Load()
    {
        var statement = Prepare("SELECT payload FROM application_state WHERE id=1;");
        try
        {
            var status = Native.sqlite3_step(statement);
            if (status == Done) return null;
            Check(status, Row);
            var value = Marshal.PtrToStringUTF8(Native.sqlite3_column_text(statement, 0))!;
            Validate(value);
            return value;
        }
        finally { Native.sqlite3_finalize(statement); }
    }
    public void Save(string json)
    {
        Validate(json);
        var statement = Prepare("INSERT INTO application_state(id,payload,saved_at) VALUES(1,?1,datetime('now')) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,saved_at=excluded.saved_at;");
        try
        {
            Check(Native.sqlite3_bind_text(statement, 1, json, -1, new IntPtr(-1)), Success);
            Check(Native.sqlite3_step(statement), Done);
        }
        finally { Native.sqlite3_finalize(statement); }
    }
    internal static void Validate(string json)
    {
        if (json.Length > 20_000_000) throw new InvalidDataException("حجم اطلاعات از حد مجاز بیشتر است.");
        using var document = JsonDocument.Parse(json);
        var root = document.RootElement;
        if (root.ValueKind != JsonValueKind.Object || !root.TryGetProperty("version", out var version) || version.GetInt32() != 1)
            throw new InvalidDataException("نسخهٔ اطلاعات سازگار نیست.");
        Require(root, "courses", JsonValueKind.Array); Require(root, "bookmarks", JsonValueKind.Array);
        Require(root, "studyDays", JsonValueKind.Array); Require(root, "notes", JsonValueKind.Object);
        Require(root, "reviews", JsonValueKind.Object); Require(root, "preferences", JsonValueKind.Object);
        foreach (var course in root.GetProperty("courses").EnumerateArray()) ValidateCourse(course);
    }
    private static void ValidateCourse(JsonElement course)
    {
        Require(course, "id", JsonValueKind.String); Require(course, "title", JsonValueKind.String);
        Require(course, "cards", JsonValueKind.Array);
        var length = course.GetProperty("cards").GetArrayLength();
        if (length == 0 || !course.TryGetProperty("position", out var position) || !position.TryGetInt32(out var index) || index < 0 || index >= length)
            throw new InvalidDataException("موقعیت کارت در درس نامعتبر است.");
    }
    private static void Require(JsonElement element, string name, JsonValueKind kind)
    {
        if (!element.TryGetProperty(name, out var value) || value.ValueKind != kind)
            throw new InvalidDataException($"ساختار {name} نامعتبر است.");
    }
    private IntPtr Prepare(string sql)
    {
        Check(Native.sqlite3_prepare_v2(database, sql, -1, out var statement, IntPtr.Zero), Success);
        return statement;
    }
    private void Execute(string sql)
    {
        var status = Native.sqlite3_exec(database, sql, IntPtr.Zero, IntPtr.Zero, out var message);
        if (message != IntPtr.Zero) Native.sqlite3_free(message);
        Check(status, Success);
    }
    private void Check(int actual, int expected)
    {
        if (actual != expected) throw new IOException("خطای پایگاه داده: " + Marshal.PtrToStringUTF8(Native.sqlite3_errmsg(database)));
    }
    public void Dispose() => Native.sqlite3_close_v2(database);
    private static class Native
    {
        private const string Library = "winsqlite3.dll";
        [DllImport(Library, CallingConvention = CallingConvention.Cdecl)] internal static extern int sqlite3_open_v2([MarshalAs(UnmanagedType.LPUTF8Str)] string filename, out IntPtr db, int flags, IntPtr vfs);
        [DllImport(Library, CallingConvention = CallingConvention.Cdecl)] internal static extern int sqlite3_close_v2(IntPtr db);
        [DllImport(Library, CallingConvention = CallingConvention.Cdecl)] internal static extern int sqlite3_exec(IntPtr db, [MarshalAs(UnmanagedType.LPUTF8Str)] string sql, IntPtr callback, IntPtr arg, out IntPtr error);
        [DllImport(Library, CallingConvention = CallingConvention.Cdecl)] internal static extern void sqlite3_free(IntPtr ptr);
        [DllImport(Library, CallingConvention = CallingConvention.Cdecl)] internal static extern int sqlite3_prepare_v2(IntPtr db, [MarshalAs(UnmanagedType.LPUTF8Str)] string sql, int bytes, out IntPtr statement, IntPtr tail);
        [DllImport(Library, CallingConvention = CallingConvention.Cdecl)] internal static extern int sqlite3_bind_text(IntPtr statement, int index, [MarshalAs(UnmanagedType.LPUTF8Str)] string text, int bytes, IntPtr destructor);
        [DllImport(Library, CallingConvention = CallingConvention.Cdecl)] internal static extern int sqlite3_step(IntPtr statement);
        [DllImport(Library, CallingConvention = CallingConvention.Cdecl)] internal static extern IntPtr sqlite3_column_text(IntPtr statement, int column);
        [DllImport(Library, CallingConvention = CallingConvention.Cdecl)] internal static extern int sqlite3_finalize(IntPtr statement);
        [DllImport(Library, CallingConvention = CallingConvention.Cdecl)] internal static extern IntPtr sqlite3_errmsg(IntPtr db);
    }
}
