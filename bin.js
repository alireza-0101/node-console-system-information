#!/usr/bin/env node

const chalk = require("chalk").default
const table = require("chalk-table")
const figlet = require("figlet")
const inquirer = require("inquirer").default
const boxen = require("boxen").default
const si = require("systeminformation")

function showBanner() {
  process.stdout.write("\x1Bc")
  console.clear()

  console.log(
    boxen(
      chalk.hex("#FFA500").bold(
        figlet.textSync("System Information", {
          font: "Standard",
          horizontalLayout: "full",
          verticalLayout: "default",
        })
      ),
      { margin: { bottom: 2 }, borderStyle: "none" }
    )
  )
}

async function getSystemInfo() {
  try {
    const [system, cpu, mem, graphics, osInfo, diskLayout, battery, networkInterfaces] =
      await Promise.all([
        si.system(),
        si.cpu(),
        si.mem(),
        si.graphics(),
        si.osInfo(),
        si.diskLayout(),
        si.battery(),
        si.networkInterfaces(),
      ])

    const wifiInterface =
      networkInterfaces.find(
        (intf) =>
          intf.iface.toLowerCase().includes("wi-fi") || intf.iface.toLowerCase().includes("wlan")
      ) || networkInterfaces[0]

    return {
      system,
      cpu,
      memory: mem,
      graphics,
      osInfo,
      diskLayout,
      battery,
      network: wifiInterface,
    }
  } catch (error) {
    console.error(chalk.red("Error fetching system info:"), error)
    process.exit(1)
  }
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm) + " " + sizes[i])
}

async function displaySpecs() {
  try {
    const info = await getSystemInfo()

    const data = [
      {
        Category: "System",
        Specification: chalk.bold.green(
          `${info.system.manufacturer || "Unknown"} ${info.system.model || "Laptop"}`
        ),
      },
      {
        Category: "Processor",
        Specification: `${info.cpu.manufacturer} ${info.cpu.brand} (${info.cpu.cores} cores, ${info.cpu.speed} GHz)`,
      },
      { Category: "Memory", Specification: `${formatBytes(info.memory.total)}` },
      {
        Category: "Graphics",
        Specification: info.graphics.controllers
          .map((g) => `${g.vendor} ${g.model}${g.vram ? ` (${g.vram}MB VRAM)` : ""}`)
          .join("\n"),
      },
      {
        Category: "Operating System",
        Specification: `${info.osInfo.distro} ${info.osInfo.release} (${info.osInfo.arch})`,
      },
      {
        Category: "Storage",
        Specification: info.diskLayout
          .map((d) => `${d.type} ${d.name} - ${formatBytes(d.size)}`)
          .join("\n"),
      },
      {
        Category: "Battery",
        Specification: info.battery.hasBattery
          ? `${info.battery.type}, ${info.battery.percent}% (${
              info.battery.isCharging ? "Charging" : "Discharging"
            })`
          : "No battery detected",
      },
      {
        Category: "Network",
        Specification: info.network
          ? `${info.network.iface}: ${info.network.ip4 || "No IP"}, MAC: ${info.network.mac}`
          : "No network interface found",
      },
    ]

    const options = {
      columns: [
        { field: "Category", name: chalk.cyan.bold("CATEGORY") },
        { field: "Specification", name: chalk.green.bold("SPECIFICATION") },
      ],
      drawHorizontalLine: (index, size) => index === 0 || index === 1 || index === size,
    }

    console.log(table(data, options))
  } catch (error) {
    console.error(chalk.red("Error displaying specs:"), error)
  }
}

async function detailedViewMenu() {
  showBanner()

  const choices = [
    { name: "CPU Details", value: "cpu" },
    { name: "Memory Details", value: "memory" },
    { name: "Disk Details", value: "disk" },
    { name: "Graphics Details", value: "graphics" },
    { name: "Battery Details", value: "battery" },
    { name: "Network Details", value: "network" },
    new inquirer.Separator(),
    { name: "Return to Main Menu", value: "back" },
  ]

  const answer = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: "Select detailed view:",
      choices: choices,
      pageSize: 10,
    },
  ])

  if (answer.choice === "back") {
    await mainMenu()
    return
  }

  await showDetailedInfo(answer.choice)
  await inquirer
    .prompt([
      {
        type: "confirm",
        name: "continue",
        message: "View another detailed section?",
        default: true,
      },
    ])
    .then(async (response) => {
      if (response.continue) {
        await detailedViewMenu()
      } else {
        await mainMenu()
      }
    })
}

async function showDetailedInfo(category) {
  let data
  let title

  switch (category) {
    case "cpu":
      const cpu = await si.cpu()
      title = "CPU Details"
      data = [
        { Category: "Manufacturer", Specification: cpu.manufacturer },
        { Category: "Brand", Specification: cpu.brand },
        { Category: "Model", Specification: cpu.model },
        {
          Category: "Cores",
          Specification: `${cpu.cores} (Physical: ${cpu.physicalCores}, Performance: ${
            cpu.performanceCores || "N/A"
          })`,
        },
        {
          Category: "Speed",
          Specification: `${cpu.speed} GHz (Min: ${cpu.speedMin} GHz, Max: ${cpu.speedMax} GHz)`,
        },
        {
          Category: "Cache",
          Specification: `${cpu.cache?.l1d ? `L1d: ${cpu.cache.l1d} KB, ` : ""}${
            cpu.cache?.l1i ? `L1i: ${cpu.cache.l1i} KB, ` : ""
          }L2: ${cpu.cache?.l2 || "N/A"} KB, L3: ${cpu.cache?.l3 || "N/A"} KB`,
        },
        {
          Category: "Virtualization",
          Specification: cpu.virtualization ? "Supported" : "Not supported",
        },
      ]
      break

    case "memory":
      const mem = await si.mem()
      title = "Memory Details"
      data = [
        { Category: "Total", Specification: formatBytes(mem.total) },
        { Category: "Free", Specification: formatBytes(mem.free) },
        { Category: "Used", Specification: formatBytes(mem.used) },
        { Category: "Active", Specification: formatBytes(mem.active) },
        { Category: "Available", Specification: formatBytes(mem.available) },
        { Category: "Swap Total", Specification: formatBytes(mem.swaptotal) },
        { Category: "Swap Used", Specification: formatBytes(mem.swapused) },
      ]
      break

    case "disk":
      const disks = await si.diskLayout()
      title = "Storage Details"
      data = disks.map((disk) => ({
        Category: disk.name,
        Specification: `${disk.type} - ${formatBytes(disk.size)} (${disk.vendor} ${disk.model})`,
      }))
      break

    case "graphics":
      const graphics = await si.graphics()
      title = "Graphics Details"
      data = graphics.controllers.map((g, i) => ({
        Category: `GPU ${i + 1}`,
        Specification: `${g.vendor} ${g.model}${g.vram ? ` (${g.vram} MB VRAM)` : ""}${
          g.driverVersion ? `\nDriver: ${g.driverVersion}` : ""
        }`,
      }))
      break

    case "battery":
      const battery = await si.battery()
      title = "Battery Details"
      data = battery.hasBattery
        ? [
            { Category: "Type", Specification: battery.type },
            { Category: "Model", Specification: battery.model || "N/A" },
            { Category: "Manufacturer", Specification: battery.manufacturer || "N/A" },
            { Category: "Cycle Count", Specification: battery.cycleCount || "N/A" },
            { Category: "Current Level", Specification: `${battery.percent}%` },
            { Category: "Status", Specification: battery.isCharging ? "Charging" : "Discharging" },
            {
              Category: "Current Capacity",
              Specification: `${battery.currentCapacity || "N/A"} mAh`,
            },
            { Category: "Max Capacity", Specification: `${battery.maxCapacity || "N/A"} mAh` },
            {
              Category: "Designed Capacity",
              Specification: `${battery.designedCapacity || "N/A"} mAh`,
            },
          ]
        : [{ Category: "Status", Specification: "No battery detected" }]
      break

    case "network":
      const networks = await si.networkInterfaces()
      const primaryNet =
        networks.find(
          (n) => n.iface.toLowerCase().includes("wi-fi") || n.iface.toLowerCase().includes("wlan")
        ) || networks[0]
      title = "Network Details"
      data = primaryNet
        ? [
            { Category: "Interface", Specification: primaryNet.iface },
            { Category: "Type", Specification: primaryNet.type },
            { Category: "MAC Address", Specification: primaryNet.mac },
            { Category: "IPv4", Specification: primaryNet.ip4 || "Not connected" },
            { Category: "IPv6", Specification: primaryNet.ip6 || "Not connected" },
            { Category: "Internal", Specification: primaryNet.internal ? "Yes" : "No" },
            {
              Category: "Speed",
              Specification: primaryNet.speed ? `${primaryNet.speed} Mbps` : "N/A",
            },
          ]
        : [{ Category: "Status", Specification: "No active network interfaces found" }]
      break
  }

  console.log(chalk.bold.yellow(`\n${title}`))
  const options = {
    columns: [
      { field: "Category", name: chalk.cyan.bold("PROPERTY") },
      { field: "Specification", name: chalk.green.bold("VALUE") },
    ],
    drawHorizontalLine: (index, size) => index === 0 || index === size,
  }
  console.log(table(data, options))
}

async function mainMenu() {
  showBanner()

  const answer = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: "Select an option:",
      choices: [
        { name: "View All Specifications", value: "all" },
        { name: "Detailed View (By Category)", value: "detailed" },
        new inquirer.Separator(),
        { name: "Exit", value: "exit" },
      ],
      pageSize: 10,
    },
  ])

  switch (answer.choice) {
    case "all":
      await displaySpecs()
      await inquirer
        .prompt([
          {
            type: "confirm",
            name: "back",
            message: "Return to main menu?",
            default: true,
          },
        ])
        .then((response) => {
          if (response.back) {
            mainMenu()
          } else {
            console.log(chalk.yellow("\nThank you for using My Laptop Specs Viewer!"))
            process.exit(0)
          }
        })
      break

    case "detailed":
      await detailedViewMenu()
      break

    case "exit":
      console.log(chalk.yellow("\nThank you for using My Laptop Specs Viewer!"))
      process.exit(0)
  }
}

mainMenu().catch((err) => {
  console.error(chalk.red("An error occurred:"), err)
  process.exit(1)
})
