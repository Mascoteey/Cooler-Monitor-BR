using System.Text.Json;
using System.Text.Json.Serialization;
using LibreHardwareMonitor.Hardware;

namespace CoolerHardwareBridge;

internal class FanControlCommand
{
    public string? Fan { get; set; }
    public double? Pwm { get; set; }
}

public class Program
{
    private static Computer _computer = null!;
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = false,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        NumberHandling = JsonNumberHandling.AllowNamedFloatingPointLiterals,
    };

    private static double Sanitize(double? value) =>
        value.HasValue && !double.IsNaN(value.Value) && !double.IsInfinity(value.Value)
            ? Math.Round(value.Value, 2)
            : 0.0;

    public static void Main()
    {
        Console.Error.WriteLine("[BRIDGE] CoolerHardwareBridge iniciado");

        _computer = new Computer
        {
            IsCpuEnabled = true,
            IsGpuEnabled = true,
            IsMemoryEnabled = true,
            IsMotherboardEnabled = true,
            IsControllerEnabled = true,
            IsNetworkEnabled = true,
            IsStorageEnabled = true,
            IsPsuEnabled = true,
        };

        _computer.Open();
        _computer.Accept(new UpdateVisitor());

        Console.Error.WriteLine("[BRIDGE] Hardware monitoramento iniciado");
        Console.Out.NewLine = "\n";

        // Thread para ler comandos de controle do stdin
        var stdinThread = new Thread(ReadStdinCommands);
        stdinThread.IsBackground = true;
        stdinThread.Start();

        var timer = new Timer(SendHardwareData, null, 0, 1000);
        Thread.Sleep(Timeout.Infinite);
    }

    private static void ReadStdinCommands()
    {
        try
        {
            string? line;
            while ((line = Console.ReadLine()) != null)
            {
                if (string.IsNullOrWhiteSpace(line)) continue;
                try
                {
                    var cmd = JsonSerializer.Deserialize<FanControlCommand>(line, JsonOptions);
                    if (cmd != null && !string.IsNullOrEmpty(cmd.Fan) && cmd.Pwm.HasValue)
                    {
                        SetFanControl(cmd.Fan, Math.Clamp(cmd.Pwm.Value, 0, 100));
                    }
                }
                catch (JsonException ex)
                {
                    Console.Error.WriteLine("[BRIDGE] Comando inválido: " + ex.Message);
                }
            }
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine("[BRIDGE] Erro no stdin: " + ex.Message);
        }
    }

    private static readonly object ComputerLock = new();

    private static void SetFanControl(string fanName, double pwm)
    {
        float val = (float)Math.Clamp(pwm, 0.0, 100.0);
        lock (ComputerLock)
        {
            foreach (var hardware in _computer.Hardware)
            {
                hardware.Update();
                foreach (var sensor in hardware.Sensors)
                {
                    if (sensor.SensorType == SensorType.Fan && sensor.Control != null)
                    {
                        if (sensor.Name.IndexOf(fanName, StringComparison.OrdinalIgnoreCase) >= 0)
                        {
                            sensor.Control.SetSoftware(val);
                            Console.Error.WriteLine($"[BRIDGE] Fan control: {sensor.Name} → {pwm}%");
                            return;
                        }
                    }
                }
                foreach (var sub in hardware.SubHardware)
                {
                    sub.Update();
                    foreach (var sensor in sub.Sensors)
                    {
                        if (sensor.SensorType == SensorType.Fan && sensor.Control != null)
                        {
                            if (sensor.Name.IndexOf(fanName, StringComparison.OrdinalIgnoreCase) >= 0)
                            {
                                sensor.Control.SetSoftware(val);
                                Console.Error.WriteLine($"[BRIDGE] Fan control: {sensor.Name} → {pwm}%");
                                return;
                            }
                        }
                    }
                }
            }
        }
        Console.Error.WriteLine($"[BRIDGE] Fan '{fanName}' não encontrado ou sem controle");
    }

    private static void SendHardwareData(object? state)
    {
        try
        {
            lock (ComputerLock)
            {
                _computer.Accept(new UpdateVisitor());
            }
            var data = CollectSensorData();
            var json = JsonSerializer.Serialize(data, JsonOptions);
            Console.Out.WriteLine(json);
            Console.Out.Flush();
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine("[BRIDGE] Error: " + ex.Message);
        }
    }

    private static HardwareDataDto CollectSensorData()
    {
        var data = new HardwareDataDto
        {
            Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            Cpu = new SensorGroupDto { Name = "CPU" },
            Gpu = new SensorGroupDto { Name = "GPU" },
            Ram = new MemoryDto(),
            Storage = new List<StorageDto>(),
            Motherboard = new MotherboardDto(),
            Fans = new List<FanDto>(),
            Network = new List<NetworkDto>(),
            Sensors = new List<GenericSensorDto>(),
        };

        foreach (var hardware in _computer.Hardware)
        {
            hardware.Update();
            ProcessHardware(hardware, data);
        }

        return data;
    }

    private static void ProcessHardware(IHardware hardware, HardwareDataDto data)
    {
        switch (hardware.HardwareType)
        {
            case HardwareType.Cpu:
                FillCpuData(hardware, data);
                break;
            case HardwareType.GpuNvidia:
            case HardwareType.GpuAmd:
            case HardwareType.GpuIntel:
                FillGpuData(hardware, data);
                break;
            case HardwareType.Memory:
                FillMemoryData(hardware, data);
                break;
            case HardwareType.Storage:
                FillStorageData(hardware, data);
                break;
            case HardwareType.Motherboard:
            case HardwareType.SuperIO:
                FillMotherboardData(hardware, data);
                break;
            case HardwareType.Psu:
                break;
        }

        foreach (var sensor in hardware.Sensors)
        {
            data.Sensors.Add(new GenericSensorDto
            {
                Name = sensor.Name,
                Value = Sanitize(sensor.Value),
                Unit = sensor.SensorType switch
                {
                    SensorType.Temperature => "°C",
                    SensorType.Load => "%",
                    SensorType.Clock => "MHz",
                    SensorType.Fan => "RPM",
                    SensorType.Voltage => "V",
                    SensorType.Power => "W",
                    SensorType.Data => "GB",
                    SensorType.Factor => "x",
                    _ => "",
                },
                Category = hardware.HardwareType.ToString(),
                Status = sensor.Value.HasValue
                    ? (Sanitize(sensor.Value) > 80 ? "critical" : Sanitize(sensor.Value) > 60 ? "warning" : "ok")
                    : "unknown",
            });
        }

        foreach (var subHardware in hardware.SubHardware)
        {
            subHardware.Update();
            ProcessHardware(subHardware, data);
        }
    }

    private static void FillCpuData(IHardware hardware, HardwareDataDto data)
    {
        data.Cpu.Name = hardware.Name;
        double temp = -1;
        foreach (var sensor in hardware.Sensors)
        {
            var v = Sanitize(sensor.Value);
            switch (sensor.SensorType)
            {
                case SensorType.Temperature:
                    if (sensor.Name.Contains("Package") || sensor.Name.Contains("Core Max") || sensor.Name.Contains("CPU"))
                        temp = temp < 0 ? v : Math.Max(temp, v);
                    break;
                case SensorType.Load:
                    if (sensor.Name.Contains("Total") && data.Cpu.Usage == 0)
                        data.Cpu.Usage = v;
                    else if (sensor.Name == "CPU Total")
                        data.Cpu.Usage = v;
                    break;
                case SensorType.Clock:
                    if (sensor.Name.Contains("Core") || sensor.Name.Contains("Bus"))
                        data.Cpu.Clock = v;
                    break;
                case SensorType.Power:
                    if (sensor.Name.Contains("Package"))
                        data.Cpu.Power = v;
                    break;
                case SensorType.Voltage:
                    if (sensor.Name.Contains("Core") || sensor.Name.Contains("Vcore"))
                        data.Cpu.Voltage = v;
                    break;
            }
        }
        if (temp >= 0) data.Cpu.Temperature = temp;
    }

    private static void FillGpuData(IHardware hardware, HardwareDataDto data)
    {
        data.Gpu.Name = hardware.Name;
        foreach (var sensor in hardware.Sensors)
        {
            var v = Sanitize(sensor.Value);
            switch (sensor.SensorType)
            {
                case SensorType.Temperature:
                    if (sensor.Name.Contains("Hotspot")) data.Gpu.Hotspot = v;
                    else data.Gpu.Temperature = v;
                    break;
                case SensorType.Load:
                    if (sensor.Name.Contains("Memory") || sensor.Name.Contains("VRAM"))
                        data.Gpu.MemoryLoad = v;
                    else if (sensor.Name.Contains("GPU Core") || sensor.Name.Contains("D3D 3D"))
                        data.Gpu.Usage = v;
                    break;
                case SensorType.Clock:
                    if (sensor.Name.Contains("Memory"))
                        data.Gpu.MemoryClock = v;
                    else
                        data.Gpu.Clock = v;
                    break;
                case SensorType.Fan:
                    data.Gpu.Fan = v;
                    break;
                case SensorType.Power:
                    data.Gpu.Power = v;
                    break;
                case SensorType.Voltage:
                    data.Gpu.Voltage = v;
                    break;
                case SensorType.Data:
                    if (sensor.Name.Contains("Total")) data.Gpu.MemoryTotal = v;
                    else if (sensor.Name.Contains("Used")) data.Gpu.MemoryUsed = v;
                    break;
            }
        }
    }

    private static void FillMemoryData(IHardware hardware, HardwareDataDto data)
    {
        const double bytesToGb = 1.0 / (1024.0 * 1024.0 * 1024.0);
        data.Ram.Name = hardware.Name;
        foreach (var sensor in hardware.Sensors)
        {
            var v = Sanitize(sensor.Value);
            switch (sensor.SensorType)
            {
                case SensorType.Load:
                    data.Ram.Usage = v;
                    break;
                case SensorType.Data:
                    if (sensor.Name.Contains("Used")) data.Ram.Used = v * bytesToGb;
                    else if (sensor.Name.Contains("Available")) data.Ram.Available = v * bytesToGb;
                    break;
            }
        }
        if (data.Ram.Used > 0 && data.Ram.Available > 0)
            data.Ram.Total = data.Ram.Used + data.Ram.Available;
    }

    private static void FillStorageData(IHardware hardware, HardwareDataDto data)
    {
        const double bytesToGb = 1.0 / (1024.0 * 1024.0 * 1024.0);
        var storage = new StorageDto { Name = hardware.Name };
        foreach (var sensor in hardware.Sensors)
        {
            var v = Sanitize(sensor.Value);
            switch (sensor.SensorType)
            {
                case SensorType.Temperature:
                    storage.Temperature = v;
                    break;
                case SensorType.Load:
                    if (sensor.Name.Contains("Used"))
                    {
                        storage.UsedPercent = v;
                    }
                    break;
                case SensorType.Data:
                    if (sensor.Name.Contains("Total")) storage.Total = v * bytesToGb;
                    else if (sensor.Name.Contains("Used")) storage.Used = v * bytesToGb;
                    break;
            }
        }
        if (storage.Total > 0 && storage.Used > 0)
            storage.UsedPercent = storage.Used / storage.Total * 100;
        data.Storage.Add(storage);
    }

    private static void FillMotherboardData(IHardware hardware, HardwareDataDto data)
    {
        data.Motherboard.Name = hardware.Name;
        foreach (var sensor in hardware.Sensors)
        {
            var v = Sanitize(sensor.Value);
            switch (sensor.SensorType)
            {
                case SensorType.Temperature:
                    if (sensor.Name.Contains("Chipset") || sensor.Name.Contains("PCH"))
                        data.Motherboard.Chipset = v;
                    else if (sensor.Name.Contains("VRM"))
                        data.Motherboard.Vrm = v;
                    else if (sensor.Name.Contains("Ambient") || sensor.Name.Contains("System"))
                        data.Motherboard.Ambient = v;
                    else if (sensor.Name.Contains("CPU"))
                        data.Motherboard.CpuTemp = v;
                    break;
                case SensorType.Fan:
                    data.Fans.Add(new FanDto
                    {
                        Name = sensor.Name,
                        Rpm = v,
                    });
                    break;
            }
        }
    }
}

public class UpdateVisitor : IVisitor
{
    public void VisitComputer(IComputer computer) => computer.Traverse(this);
    public void VisitHardware(IHardware hardware) => hardware.Update();
    public void VisitSensor(ISensor sensor) { }
    public void VisitParameter(IParameter parameter) { }
}

public class HardwareDataDto
{
    [JsonPropertyName("timestamp")] public long Timestamp { get; set; }
    [JsonPropertyName("cpu")] public SensorGroupDto Cpu { get; set; } = new();
    [JsonPropertyName("gpu")] public SensorGroupDto Gpu { get; set; } = new();
    [JsonPropertyName("ram")] public MemoryDto Ram { get; set; } = new();
    [JsonPropertyName("storage")] public List<StorageDto> Storage { get; set; } = new();
    [JsonPropertyName("motherboard")] public MotherboardDto Motherboard { get; set; } = new();
    [JsonPropertyName("fans")] public List<FanDto> Fans { get; set; } = new();
    [JsonPropertyName("network")] public List<NetworkDto> Network { get; set; } = new();
    [JsonPropertyName("sensors")] public List<GenericSensorDto> Sensors { get; set; } = new();
}

public class SensorGroupDto
{
    [JsonPropertyName("name")] public string Name { get; set; } = "";
    [JsonPropertyName("temperature")] public double Temperature { get; set; }
    [JsonPropertyName("usage")] public double Usage { get; set; }
    [JsonPropertyName("clock")] public double Clock { get; set; }
    [JsonPropertyName("power")] public double Power { get; set; }
    [JsonPropertyName("voltage")] public double Voltage { get; set; }
    [JsonPropertyName("hotspot")] public double Hotspot { get; set; }
    [JsonPropertyName("memoryClock")] public double MemoryClock { get; set; }
    [JsonPropertyName("memoryLoad")] public double MemoryLoad { get; set; } = 0;
    [JsonPropertyName("memoryTotal")] public double MemoryTotal { get; set; }
    [JsonPropertyName("memoryUsed")] public double MemoryUsed { get; set; }
    [JsonPropertyName("fan")] public double Fan { get; set; }
}

public class MemoryDto
{
    [JsonPropertyName("name")] public string Name { get; set; } = "";
    [JsonPropertyName("usage")] public double Usage { get; set; }
    [JsonPropertyName("used")] public double Used { get; set; }
    [JsonPropertyName("available")] public double Available { get; set; }
    [JsonPropertyName("total")] public double Total { get; set; }
}

public class StorageDto
{
    [JsonPropertyName("name")] public string Name { get; set; } = "";
    [JsonPropertyName("temperature")] public double Temperature { get; set; }
    [JsonPropertyName("usedPercent")] public double UsedPercent { get; set; }
    [JsonPropertyName("used")] public double Used { get; set; }
    [JsonPropertyName("total")] public double Total { get; set; }
}

public class MotherboardDto
{
    [JsonPropertyName("name")] public string Name { get; set; } = "";
    [JsonPropertyName("chipset")] public double Chipset { get; set; }
    [JsonPropertyName("vrm")] public double Vrm { get; set; }
    [JsonPropertyName("pch")] public double Pch { get; set; }
    [JsonPropertyName("ambient")] public double Ambient { get; set; }
    [JsonPropertyName("cpuTemp")] public double CpuTemp { get; set; }
}

public class FanDto
{
    [JsonPropertyName("name")] public string Name { get; set; } = "";
    [JsonPropertyName("rpm")] public double Rpm { get; set; }
}

public class NetworkDto
{
    [JsonPropertyName("name")] public string Name { get; set; } = "";
    [JsonPropertyName("downloadSpeed")] public double DownloadSpeed { get; set; }
    [JsonPropertyName("uploadSpeed")] public double UploadSpeed { get; set; }
}

public class GenericSensorDto
{
    [JsonPropertyName("name")] public string Name { get; set; } = "";
    [JsonPropertyName("value")] public double Value { get; set; }
    [JsonPropertyName("unit")] public string Unit { get; set; } = "";
    [JsonPropertyName("category")] public string Category { get; set; } = "";
    [JsonPropertyName("status")] public string Status { get; set; } = "ok";
}
