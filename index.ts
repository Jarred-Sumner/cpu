#!/usr/bin/env bun
/**
 * @jarred/cpu - Process resource usage measurement utility
 *
 * A tool that runs another process and reports detailed resource usage statistics
 */

import pkg from "./package.json";

// Import the os module to get system information
import { totalmem } from "node:os";

// Get the total system memory in bytes
const TOTAL_SYSTEM_MEMORY = totalmem();
let verbose = false;

// Check if colors are supported
const useColors = Bun.enableANSIColors;

// ANSI color codes (only used if colors are supported)
const RESET = useColors ? "\x1b[0m" : "";
const BOLD = useColors ? "\x1b[1m" : "";
const DIM = useColors ? "\x1b[2m" : "";
const RED = useColors ? "\x1b[31m" : "";
const GREEN = useColors ? "\x1b[32m" : "";
const YELLOW = useColors ? "\x1b[33m" : "";
const BLUE = useColors ? "\x1b[34m" : "";
const MAGENTA = useColors ? "\x1b[35m" : "";
const CYAN = useColors ? "\x1b[36m" : "";
const GRAY = useColors ? "\x1b[90m" : "";

// Handle help and version flags
if (
  process.argv.length < 3 ||
  process.argv[2] === "-h" ||
  process.argv[2] === "--help"
) {
  console.log(`
${BOLD}${CYAN}cpu${RESET} - ${BLUE}Process resource usage measurement utility${RESET} ${GREEN}v${pkg.version}${RESET}

${BOLD}Usage:${RESET} ${CYAN}cpu${RESET} <command> [args...]

${DIM}Measures and displays resource usage statistics of the specified command.${RESET}

${BOLD}Options:${RESET}
  ${YELLOW}-v, --verbose${RESET}  Enable detailed metrics output  
  ${YELLOW}-h, --help${RESET}     Display this help message
  ${YELLOW}--version${RESET}      Display version information

${BOLD}Examples:${RESET}
  ${CYAN}cpu${RESET} ${MAGENTA}sleep 1${RESET}
  ${CYAN}cpu${RESET} ${MAGENTA}bun -e "console.log('Hello')"${RESET}
  ${CYAN}cpu${RESET} ${MAGENTA}node -e "console.log('Hello')"${RESET}
  ${CYAN}cpu${RESET} ${MAGENTA}./my-script.sh${RESET}
`);
  process.exit(0);
}

if (process.argv[2] === "--version") {
  console.log(`cpu v${pkg.version}`);
  process.exit(0);
}

if (process.argv[2] === "-v" || process.argv[2] === "--verbose") {
  verbose = true;
  process.argv.splice(2, 1);
}

// Extract the command and arguments
const command = process.argv[2];
const args = process.argv.slice(3);

// Helper function to format bytes to a human-readable format
function formatBytes(bytes: number): string {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "unit",
    unit:
      bytes < 1024
        ? "byte"
        : bytes < 1024 * 1024
        ? "kilobyte"
        : bytes < 1024 * 1024 * 1024
        ? "megabyte"
        : "gigabyte",
    unitDisplay: "short",
    maximumFractionDigits: 2,
  });

  const value =
    bytes < 1024
      ? bytes
      : bytes < 1024 * 1024
      ? bytes / 1024
      : bytes < 1024 * 1024 * 1024
      ? bytes / (1024 * 1024)
      : bytes / (1024 * 1024 * 1024);

  return formatter.format(value);
}

let printed = false;
async function print() {
  if (printed) return;
  printed = true;

  const endTime = performance.now();

  // Calculate execution time in seconds
  const execTimeMs = endTime - startTime;
  const execTimeSeconds = execTimeMs / 1000;

  // Get resource usage metrics
  const resourceUsage = result.resourceUsage()!;

  // Calculate CPU percentage (user + system time divided by total execution time)
  const cpuTimeUser = Number(resourceUsage.cpuTime.user);
  const cpuTimeSystem = Number(resourceUsage.cpuTime.system);
  const cpuTimeMs = (cpuTimeUser + cpuTimeSystem) / 1000;

  // Get memory usage and format appropriately (MB or GB)
  const memoryUsageBytes = resourceUsage.maxRSS;
  const memoryUsageMB = memoryUsageBytes / (1024 * 1024);
  const memoryUsageGB = memoryUsageMB / 1024;

  // Calculate memory usage as percentage of total system memory
  const memoryUsagePercentage = (memoryUsageBytes / TOTAL_SYSTEM_MEMORY) * 100;

  // Format memory display with appropriate unit
  let memoryDisplay: string;

  if (memoryUsageMB < 1024) {
    // Display in MB if less than 1GB, rounding to whole number
    memoryDisplay = `${Math.round(memoryUsageMB)} MB`;
  } else {
    // Display in GB if 1GB or more, with 1 decimal place
    memoryDisplay = `${memoryUsageGB.toFixed(1)} GB`;
  }

  // Get more detailed metrics
  const voluntaryContextSwitches = resourceUsage.contextSwitches.voluntary;
  const involuntaryContextSwitches = resourceUsage.contextSwitches.involuntary;
  const totalContextSwitches =
    voluntaryContextSwitches + involuntaryContextSwitches;

  // Format the user and system time in seconds with appropriate precision
  const userSeconds = (cpuTimeUser / 1000000).toFixed(2);
  const systemSeconds = (cpuTimeSystem / 1000000).toFixed(2);

  // Format memory with appropriate unit
  let memValue: string;
  let memUnit: string;

  if (memoryUsageMB >= 1024) {
    // Display in GB if 1GB or more
    memValue = memoryUsageGB.toFixed(1);
    memUnit = "GB";
  } else if (memoryUsageMB >= 1) {
    // Display in MB if 1MB or more
    memValue = Math.round(memoryUsageMB).toString();
    memUnit = "MB";
  } else {
    // Display in KB if less than 1MB
    memValue = Math.round(memoryUsageBytes / 1024).toString();
    memUnit = "KB";
  }

  // Color for memory based on amount and usage percentage
  let memColor = "";
  // Only use green for very small memory usage (less than 100MB)
  if (memoryUsageMB < 100) memColor = GREEN;
  // Use warning colors for high percentages of total memory
  if (memoryUsagePercentage > 50) memColor = YELLOW;
  if (memoryUsagePercentage > 80) memColor = RED;

  // Get the components of our output to calculate proper spacing
  const timeStr = `${execTimeSeconds.toFixed(2)}s`;
  const userStr = `${userSeconds}s user`;
  const sysStr = `${systemSeconds}s sys`;
  const memStr = `${memValue} ${memUnit} mem`;

  // Define column padding for better readability
  const paddingSize = 2;
  const padding = " ".repeat(paddingSize);

  // Measure the actual width of each component including formatting
  // (color codes don't contribute to visual width)
  const timeTextWidth = Bun.stringWidth(timeStr);
  const userTextWidth = Bun.stringWidth(userStr);
  const sysTextWidth = Bun.stringWidth(sysStr);
  const memTextWidth = Bun.stringWidth(memStr);

  // Calculate total column widths including padding
  const timeColWidth = timeTextWidth + paddingSize * 2;
  const userColWidth = userTextWidth + paddingSize * 2;
  const sysColWidth = sysTextWidth + paddingSize * 2;
  const memColWidth = memTextWidth + paddingSize * 2;

  // Use box-drawing unicode characters for a connected look
  const topLeftCorner = `${DIM}┌${RESET}`; // U+250C (Box Drawings Light Down and Right)
  const topMiddleT = `${DIM}┬${RESET}`; // U+252C (Box Drawings Light Down and Horizontal)
  const topRightCorner = `${DIM}┐${RESET}`; // U+2510 (Box Drawings Light Down and Left)
  const botLeftCorner = `${DIM}└${RESET}`; // U+2514 (Box Drawings Light Up and Right)
  const botMiddleT = `${DIM}┴${RESET}`; // U+2534 (Box Drawings Light Up and Horizontal)
  const botRightCorner = `${DIM}┘${RESET}`; // U+2518 (Box Drawings Light Up and Left)
  const horizontalLine = `${DIM}─${RESET}`; // U+2500 (Box Drawings Light Horizontal)
  const verticalLine = `${DIM}│${RESET}`; // U+2502 (Box Drawings Light Vertical)

  // Create the top border with connecting points for the vertical separators
  const topBorder =
    topLeftCorner +
    horizontalLine.repeat(timeColWidth) +
    topMiddleT +
    horizontalLine.repeat(userColWidth) +
    topMiddleT +
    horizontalLine.repeat(sysColWidth) +
    topMiddleT +
    horizontalLine.repeat(memColWidth) +
    topRightCorner;

  // Create the bottom border for verbose mode
  const bottomBorder =
    botLeftCorner +
    horizontalLine.repeat(timeColWidth) +
    botMiddleT +
    horizontalLine.repeat(userColWidth) +
    botMiddleT +
    horizontalLine.repeat(sysColWidth) +
    botMiddleT +
    horizontalLine.repeat(memColWidth) +
    botRightCorner;

  // Create the simple summary output with time and memory metrics
  console.log(topBorder);
  console.log(
    `${verticalLine}${padding}${BOLD}${timeStr}${RESET}${padding}${verticalLine}` +
      `${padding}${BLUE}${userStr}${RESET}${padding}${verticalLine}` +
      `${padding}${MAGENTA}${sysStr}${RESET}${padding}${verticalLine}` +
      `${padding}${memColor}${memStr}${RESET}${padding}${verticalLine}`
  );

  // Add bottom border if not in verbose mode
  if (!verbose) {
    console.log(bottomBorder);
  }

  // Add verbose verbose is set
  if (verbose) {
    console.log(`\n${BOLD}Detailed metrics:${RESET}`);

    // Time metrics
    console.log(`  ${CYAN}Time:${RESET}`);
    console.log(
      `    Total:      ${BOLD}${execTimeSeconds.toFixed(3)}s${RESET}`
    );
    console.log(
      `    User CPU:   ${BLUE}${userSeconds}s${RESET} ${DIM}(${(
        (Number(userSeconds) / execTimeSeconds) *
        100
      ).toFixed(1)}% of total)${RESET}`
    );
    console.log(
      `    System CPU: ${MAGENTA}${systemSeconds}s${RESET} ${DIM}(${(
        (Number(systemSeconds) / execTimeSeconds) *
        100
      ).toFixed(1)}% of total)${RESET}`
    );

    // Memory metrics
    let memPercentStr = memoryUsagePercentage.toFixed(2);
    if (memoryUsagePercentage > 50)
      memPercentStr = `${YELLOW}${memPercentStr}${RESET}`;
    if (memoryUsagePercentage > 80)
      memPercentStr = `${RED}${memPercentStr}${RESET}`;

    console.log(`  ${CYAN}Memory:${RESET}`);
    console.log(`    Peak:       ${memColor}${memValue} ${memUnit}${RESET}`);
    console.log(
      `    System:     ${formatBytes(
        TOTAL_SYSTEM_MEMORY
      )} total ${DIM}(${memPercentStr}% used)${RESET}`
    );

    // Process metrics
    console.log(`  ${CYAN}Process:${RESET}`);
    console.log(
      `    Context switches: ${totalContextSwitches} ${DIM}(voluntary: ${voluntaryContextSwitches}, involuntary: ${involuntaryContextSwitches})${RESET}`
    );
    console.log(
      `    IO operations:    ${DIM}in: ${resourceUsage.ops.in}, out: ${resourceUsage.ops.out}${RESET}`
    );
    console.log(
      `    Exit code:        ${
        result.exitCode === 0
          ? `${GREEN}0${RESET}`
          : `${RED}${result.exitCode}${RESET}`
      }`
    );

    // Add bottom border after verbose output
    console.log(bottomBorder);
  }

  // Pass through the command's exit code
  process.exit(result.exitCode);
}

process.on("SIGINT", async () => {
  if (result) {
    console.log();
    try {
      result.kill();
    } catch (e) {}
  }
  await Promise.race([result.exited, Bun.sleep(10)]);
  if (result?.resourceUsage()) {
    await print();
  }

  process.exit(result.exitCode);
});
process.once("beforeExit", async () => {
  if (result) {
    console.log();
    result?.kill?.();
  }
  await print();
});

// Execute the process and measure its resource usage
var startTime = performance.now();
var result = Bun.spawn({
  stdout: "inherit",
  stderr: "inherit",
  stdin: "inherit",
  cmd: [command, ...args],
});
await result.exited;
await print();
