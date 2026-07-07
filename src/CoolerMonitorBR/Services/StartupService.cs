using Microsoft.Win32;

namespace CoolerMonitorBR.Services;

public static class StartupService
{
    private const string AppName = "CoolerMonitorBR";

    public static bool IsAutoStartEnabled
    {
        get
        {
            using var key = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run");
            return key?.GetValue(AppName) is not null;
        }
    }

    public static void SetAutoStart(bool enable)
    {
        using var key = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run", writable: true);
        if (key is null) return;

        if (enable)
        {
            var exePath = Environment.ProcessPath;
            if (exePath is not null)
                key.SetValue(AppName, $"\"{exePath}\"");
        }
        else
        {
            if (key.GetValue(AppName) is not null)
                key.DeleteValue(AppName);
        }
    }
}
