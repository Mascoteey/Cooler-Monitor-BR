using System.Drawing;
using System.Windows;
using System.Windows.Controls;
using CoolerMonitorBR.ViewModels;
using CoolerMonitorBR.Views;
using H.NotifyIcon;

namespace CoolerMonitorBR;

public partial class App : Application
{
    private TaskbarIcon? _trayIcon;
    private MainViewModel? _viewModel;

    protected override void OnStartup(StartupEventArgs e)
    {
        _viewModel = new MainViewModel();
        _viewModel.StartMonitoring();

        var mainWindow = new MainWindow
        {
            DataContext = _viewModel
        };

        _trayIcon = new TaskbarIcon
        {
            ToolTipText = "Cooler Monitor BR",
            Icon = CreateAppIcon()
        };
        _trayIcon.ForceCreate();

        var trayMenu = new System.Windows.Controls.ContextMenu();
        var openItem = new MenuItem
        {
            Header = "Abrir Cooler Monitor BR",
            Command = _viewModel.ShowWindowCommand
        };
        trayMenu.Items.Add(openItem);
        trayMenu.Items.Add(new Separator());
        var autoStartItem = new MenuItem
        {
            Header = "Auto-iniciar com Windows",
            IsCheckable = true,
            IsChecked = Services.StartupService.IsAutoStartEnabled
        };
        autoStartItem.Click += (_, _) =>
        {
            Services.StartupService.SetAutoStart(autoStartItem.IsChecked);
        };
        trayMenu.Items.Add(autoStartItem);
        trayMenu.Items.Add(new Separator());
        var exitItem = new MenuItem
        {
            Header = "Sair",
            Command = _viewModel.ExitCommand
        };
        trayMenu.Items.Add(exitItem);

        _trayIcon.ContextMenu = trayMenu;
        _trayIcon.DoubleClickCommand = _viewModel.ShowWindowCommand;

        mainWindow.Closing += (_, args) =>
        {
            args.Cancel = true;
            mainWindow.Hide();
        };

        mainWindow.Show();

        base.OnStartup(e);
    }

    protected override void OnExit(ExitEventArgs e)
    {
        _viewModel?.Dispose();
        _trayIcon?.Dispose();
        base.OnExit(e);
    }

    private static Icon CreateAppIcon()
    {
        using var bmp = new Bitmap(16, 16);
        using var g = Graphics.FromImage(bmp);
        g.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
        g.Clear(Color.Transparent);

        using var brush = new SolidBrush(Color.FromArgb(243, 139, 168));
        g.FillEllipse(brush, 2, 2, 12, 12);
        g.FillRectangle(brush, 5, 0, 6, 6);

        using var whiteBrush = new SolidBrush(Color.White);
        g.FillRectangle(whiteBrush, 7, 3, 2, 6);

        return Icon.FromHandle(bmp.GetHicon());
    }
}
