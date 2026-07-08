namespace CoolerMonitorBR.Models;

public class HardwareSnapshot
{
    public DateTime Timestamp { get; set; }
    public List<SensorReading> Sensors { get; set; } = [];
}
