using System.Timers;
using CoolerMonitorBR.Models;
using LibreHardwareMonitor.Hardware;
using Timer = System.Timers.Timer;

namespace CoolerMonitorBR.Services;

public class HardwareMonitorService : IDisposable
{
    private readonly Computer _computer;
    private readonly Timer _timer;
    private readonly object _lock = new();
    private HardwareSnapshot? _lastSnapshot;

    public event Action<HardwareSnapshot>? OnSensorDataUpdated;

    public IReadOnlyList<IHardware> Hardware => _computer.Hardware.AsReadOnly();

    public HardwareMonitorService()
    {
        _computer = new Computer
        {
            IsCpuEnabled = true,
            IsGpuEnabled = true,
            IsStorageEnabled = true,
            IsMotherboardEnabled = true,
            IsMemoryEnabled = true,
            IsControllerEnabled = true,
            IsNetworkEnabled = true
        };

        _computer.Open();

        _timer = new Timer(1000);
        _timer.Elapsed += OnTimerElapsed;
    }

    public void Start() => _timer.Start();
    public void Stop() => _timer.Stop();

    private void OnTimerElapsed(object? sender, ElapsedEventArgs e)
    {
        var snapshot = CollectSnapshot();
        _lastSnapshot = snapshot;
        OnSensorDataUpdated?.Invoke(snapshot);
    }

    private HardwareSnapshot CollectSnapshot()
    {
        var snapshot = new HardwareSnapshot
        {
            Timestamp = DateTime.Now,
            Sensors = []
        };

        lock (_lock)
        {
            foreach (var hardware in _computer.Hardware)
            {
                hardware.Update();
                CollectSensors(hardware, snapshot.Sensors);
            }
        }

        return snapshot;
    }

    private static void CollectSensors(IHardware hardware, List<SensorReading> sensors)
    {
        foreach (var sensor in hardware.Sensors)
        {
            if (sensor.Value is null)
                continue;

            sensors.Add(new SensorReading
            {
                Name = sensor.Name,
                HardwareName = hardware.Name,
                SensorType = sensor.SensorType.ToString(),
                HardwareType = hardware.HardwareType.ToString(),
                Value = sensor.Value,
                Identifier = sensor.Identifier?.ToString() ?? string.Empty,
                Unit = GetUnit(sensor.SensorType)
            });
        }

        foreach (var subHardware in hardware.SubHardware)
        {
            subHardware.Update();
            CollectSensors(subHardware, sensors);
        }
    }

    private static string GetUnit(SensorType sensorType) => sensorType switch
    {
        SensorType.Temperature => "°C",
        SensorType.Load => "%",
        SensorType.Fan => "RPM",
        SensorType.Voltage => "V",
        SensorType.Clock => "MHz",
        SensorType.Power => "W",
        SensorType.Data => "GB",
        _ => ""
    };

    public float? GetLastValue(string identifier)
    {
        if (_lastSnapshot is null) return null;
        return _lastSnapshot.Sensors.Find(s => s.Identifier == identifier)?.Value;
    }

    public void Dispose()
    {
        _timer?.Stop();
        _timer?.Dispose();
        _computer?.Close();
    }
}
