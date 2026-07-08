namespace CoolerMonitorBR.Models;

public class SensorReading
{
    public string Name { get; set; } = string.Empty;
    public string HardwareName { get; set; } = string.Empty;
    public string SensorType { get; set; } = string.Empty;
    public string HardwareType { get; set; } = string.Empty;
    public float? Value { get; set; }
    public string Unit { get; set; } = string.Empty;
    public string Identifier { get; set; } = string.Empty;
}
