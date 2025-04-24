# System Information CLI Tool

## Installation

```bash
npm install -g @alireza-mh/system-information
```

## Usage

```bash
# Full system scan
system-information
```

## Features

- **Processor**: Model, cores, speed, cache
- **Memory**: Total, used, available, swap
- **Storage**: Disks, partitions, filesystems
- **Graphics**: GPU model, VRAM, driver
- **Network**: IP, MAC, connection status
- **Battery**: Capacity, cycles, health
- **OS**: Version, architecture, uptime

## Sample Output

```
SYSTEM REPORT
-----------------------------
CPU: Intel Core i7-11800H (8C/16T @ 4.6GHz)
RAM: 16GB DDR4 (12.4GB available)
GPU: NVIDIA RTX 3060 (6GB) + Intel UHD
OS: Windows 11 Pro 23H2
Uptime: 2 days, 4 hours
Disks:
  - Samsung 980 Pro 1TB NVMe
  - WDC WD20EZBX 2TB HDD
Network:
  - Wi-Fi 6 AX201 (Connected)
  - Ethernet: 1000Mbps
```

## Technical

- Cross-platform (Windows/macOS/Linux)
- Lightweight (No dependencies)
- Real-time data collection
- Interactive and scriptable modes

## License

MIT License

## Alireza Mehdizadeh Note

Created with AI assistance (DeepSeek Chat) to test system programming capabilities.
The implementation proved AI can generate functional system utilities with minor debugging required.
