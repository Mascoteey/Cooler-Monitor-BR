using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows;
using CoolerMonitorBR.Models;
using CoolerMonitorBR.Services;
using OxyPlot;
using OxyPlot.Series;

namespace CoolerMonitorBR.ViewModels;

public class MainViewModel : INotifyPropertyChanged, IDisposable
{
    private readonly HardwareMonitorService _monitorService;
    private readonly CsvLogService? _csvLog;
    private bool _isMonitoring;
    private const int MaxChartPoints = 120;

    public ObservableCollection<SensorItem> Sensors { get; } = [];
    public ObservableCollection<SensorItem> CpuSensors { get; } = [];
    public ObservableCollection<SensorItem> GpuSensors { get; } = [];
    public ObservableCollection<SensorItem> DiskSensors { get; } = [];
    public ObservableCollection<SensorItem> MotherboardSensors { get; } = [];
    public PlotModel ChartModel { get; private set; }

    public RelayCommand ToggleMonitoringCommand { get; }
    public RelayCommand ShowWindowCommand { get; }
    public RelayCommand ExitCommand { get; }

    private string _statusText = "Pronto";
    public string StatusText
    {
        get => _statusText;
        set { _statusText = value; OnPropertyChanged(); }
    }

    private string _cpuTemp = "--";
    public string CpuTemp
    {
        get => _cpuTemp;
        set { _cpuTemp = value; OnPropertyChanged(); }
    }

    private string _gpuTemp = "--";
    public string GpuTemp
    {
        get => _gpuTemp;
        set { _gpuTemp = value; OnPropertyChanged(); }
    }

    public MainViewModel()
    {
        _monitorService = new HardwareMonitorService();

        try
        {
            var logDir = System.IO.Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
                "CoolerMonitorBR", "logs");
            _csvLog = new CsvLogService(logDir);
        }
        catch
        {
        }

        ChartModel = CreateChartModel();

        ToggleMonitoringCommand = new RelayCommand(ToggleMonitoring);
        ShowWindowCommand = new RelayCommand(_ => ShowWindow());
        ExitCommand = new RelayCommand(_ => ExitApplication());
    }

    public void StartMonitoring()
    {
        if (_isMonitoring) return;
        _isMonitoring = true;
        _monitorService.OnSensorDataUpdated += OnDataUpdated;
        _monitorService.Start();
        StatusText = "Monitorando...";
    }

    public void StopMonitoring()
    {
        if (!_isMonitoring) return;
        _isMonitoring = false;
        _monitorService.OnSensorDataUpdated -= OnDataUpdated;
        _monitorService.Stop();
        StatusText = "Parado";
    }

    private void ToggleMonitoring(object? parameter)
    {
        if (_isMonitoring)
            StopMonitoring();
        else
            StartMonitoring();
    }

    private void OnDataUpdated(HardwareSnapshot snapshot)
    {
        _csvLog?.WriteSnapshot(snapshot);

        var tempSensors = snapshot.Sensors
            .Where(s => s.SensorType == "Temperature" && s.Value.HasValue)
            .ToList();

        var cpuTemps = tempSensors.Where(s => s.HardwareType.Contains("Cpu")).ToList();
        var gpuTemps = tempSensors.Where(s => s.HardwareType.Contains("Gpu")).ToList();
        var diskTemps = tempSensors.Where(s => s.HardwareType.Contains("Storage")).ToList();
        var moboTemps = tempSensors.Where(s =>
            s.HardwareType is "Motherboard" or "SuperIO" or "Mainboard").ToList();

        Application.Current.Dispatcher.Invoke(() =>
        {
            UpdateSensorList(CpuSensors, cpuTemps);
            UpdateSensorList(GpuSensors, gpuTemps);
            UpdateSensorList(DiskSensors, diskTemps);
            UpdateSensorList(MotherboardSensors, moboTemps);

            CpuTemp = cpuTemps.Count > 0
                ? $"{cpuTemps.Max(s => s.Value!.Value):F1}°C"
                : "--";
            GpuTemp = gpuTemps.Count > 0
                ? $"{gpuTemps.Max(s => s.Value!.Value):F1}°C"
                : "--";

            UpdateChart(snapshot.Timestamp, cpuTemps, gpuTemps);
        });
    }

    private static void UpdateSensorList(ObservableCollection<SensorItem> list, List<SensorReading> readings)
    {
        for (int i = 0; i < readings.Count; i++)
        {
            if (i < list.Count)
            {
                list[i].Value = readings[i].Value;
                list[i].DisplayValue = $"{readings[i].Value:F1}°C";
            }
            else
            {
                list.Add(new SensorItem
                {
                    Name = $"{readings[i].HardwareName} - {readings[i].Name}",
                    Value = readings[i].Value,
                    DisplayValue = $"{readings[i].Value:F1}°C"
                });
            }
        }

        while (list.Count > readings.Count)
            list.RemoveAt(list.Count - 1);
    }

    private static PlotModel CreateChartModel()
    {
        var model = new PlotModel
        {
            Title = "Temperaturas",
            TitleFontSize = 12,
            TitleFontWeight = 700,
            TextColor = OxyColors.White,
            TitleColor = OxyColors.White,
            PlotAreaBorderColor = OxyColor.FromArgb(80, 255, 255, 255),
            Background = OxyColors.Transparent,
            IsLegendVisible = true
        };
        return model;
    }

    private void UpdateChart(DateTime timestamp, List<SensorReading> cpuTemps, List<SensorReading> gpuTemps)
    {
        var seriesToUpdate = new List<(string seriesName, float value)>();

        if (cpuTemps.Count > 0)
            seriesToUpdate.Add(("CPU", cpuTemps.Max(s => s.Value!.Value)));
        if (gpuTemps.Count > 0)
            seriesToUpdate.Add(("GPU", gpuTemps.Max(s => s.Value!.Value)));

        foreach (var (name, value) in seriesToUpdate)
        {
            var series = ChartModel.Series.OfType<LineSeries>()
                .FirstOrDefault(s => s.Title == name);

            if (series is null)
            {
                series = new LineSeries
                {
                    Title = name,
                    StrokeThickness = 2,
                    MarkerSize = 0,
                    InterpolationAlgorithm = InterpolationAlgorithms.CanonicalSpline,
                    CanTrackerInterpolatePoints = false
                };

                var color = name switch
                {
                    "CPU" => OxyColors.OrangeRed,
                    "GPU" => OxyColors.DodgerBlue,
                    _ => OxyColors.LimeGreen
                };
                series.Color = color;

                ChartModel.Series.Add(series);
            }

            var xVal = OxyPlot.Axes.DateTimeAxis.ToDouble(timestamp);
            series.Points.Add(new DataPoint(xVal, value));

            while (series.Points.Count > MaxChartPoints)
                series.Points.RemoveAt(0);
        }

        if (ChartModel.Axes.Count == 0)
        {
            ChartModel.Axes.Add(new OxyPlot.Axes.DateTimeAxis
            {
                Position = OxyPlot.Axes.AxisPosition.Bottom,
                StringFormat = "HH:mm:ss",
                MajorGridlineStyle = LineStyle.Dot,
                MajorGridlineColor = OxyColor.FromArgb(30, 255, 255, 255),
                TextColor = OxyColors.White,
                TicklineColor = OxyColors.White
            });

            ChartModel.Axes.Add(new OxyPlot.Axes.LinearAxis
            {
                Position = OxyPlot.Axes.AxisPosition.Left,
                Title = "Temperatura (°C)",
                MajorGridlineStyle = LineStyle.Dot,
                MajorGridlineColor = OxyColor.FromArgb(30, 255, 255, 255),
                TextColor = OxyColors.White,
                TitleColor = OxyColors.White,
                TicklineColor = OxyColors.White,
                Minimum = 20
            });
        }

        ChartModel.InvalidatePlot(true);
    }

    private static void ShowWindow()
    {
        if (Application.Current.MainWindow is not null)
        {
            Application.Current.MainWindow.Show();
            Application.Current.MainWindow.WindowState = WindowState.Normal;
            Application.Current.MainWindow.Activate();
        }
    }

    private static void ExitApplication()
    {
        Application.Current.Shutdown();
    }

    public void Dispose()
    {
        StopMonitoring();
        _monitorService.Dispose();
        _csvLog?.Dispose();
    }

    public event PropertyChangedEventHandler? PropertyChanged;

    protected void OnPropertyChanged([CallerMemberName] string? name = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
    }
}

public class SensorItem : INotifyPropertyChanged
{
    private string _name = "";
    private float? _value;
    private string _displayValue = "";

    public string Name
    {
        get => _name;
        set { _name = value; OnPropertyChanged(); }
    }

    public float? Value
    {
        get => _value;
        set { _value = value; OnPropertyChanged(); }
    }

    public string DisplayValue
    {
        get => _displayValue;
        set { _displayValue = value; OnPropertyChanged(); }
    }

    public event PropertyChangedEventHandler? PropertyChanged;
    protected void OnPropertyChanged([CallerMemberName] string? name = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
    }
}
