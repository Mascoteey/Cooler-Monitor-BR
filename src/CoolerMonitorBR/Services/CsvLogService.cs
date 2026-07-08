using System.Globalization;
using System.IO;
using CoolerMonitorBR.Models;

namespace CoolerMonitorBR.Services;

public class CsvLogService : IDisposable
{
    private readonly string _filePath;
    private readonly StreamWriter _writer;
    private readonly object _lock = new();
    private bool _headerWritten;

    public CsvLogService(string directory)
    {
        Directory.CreateDirectory(directory);
        _filePath = Path.Combine(directory, $"temps_{DateTime.Now:yyyy-MM-dd_HH-mm-ss}.csv");
        _writer = new StreamWriter(_filePath, append: true);
    }

    public void WriteSnapshot(HardwareSnapshot snapshot)
    {
        lock (_lock)
        {
            var tempSensors = snapshot.Sensors
                .Where(s => s.SensorType == "Temperature" && s.Value.HasValue)
                .ToList();

            if (tempSensors.Count == 0) return;

            if (!_headerWritten)
            {
                var headers = "Timestamp," + string.Join(",",
                    tempSensors.Select(s => $"\"{s.HardwareName} - {s.Name}\""));
                _writer.WriteLine(headers);
                _headerWritten = true;
            }

            var values = snapshot.Timestamp.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture) + "," +
                         string.Join(",", tempSensors.Select(s => s.Value!.Value.ToString("F1", CultureInfo.InvariantCulture)));
            _writer.WriteLine(values);
            _writer.Flush();
        }
    }

    public void Dispose()
    {
        _writer?.Flush();
        _writer?.Dispose();
    }
}
