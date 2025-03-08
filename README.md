A simple, readable alternative to the Unix `time` command.

```sh
$ cpu bun --print '123'
123
┌─────────┬──────────────┬─────────────┬─────────────┐
│  0.01s  │  0.01s user  │  0.00s sys  │  20 MB mem  │
└─────────┴──────────────┴─────────────┴─────────────┘
```

This tool runs commands and shows their execution time and memory usage in an easy-to-read format. It works just like the standard `time` command, but with a cleaner display.

## Installation

```bash
# Install globally
bun install -g @jarred/cpu

# Or use directly
bunx @jarred/cpu <command>
```

## Usage

```bash
# Basic usage
cpu sleep 1
┌─────────┬──────────────┬─────────────┬────────────┐
│  1.00s  │  0.00s user  │  0.00s sys  │  2 MB mem  │
└─────────┴──────────────┴─────────────┴────────────┘
```

### Verbose output

```bash
# With verbose output
cpu -v node -e "console.log('Hello')"
┌─────────┬──────────────┬─────────────┬─────────────┐
│  0.03s  │  0.02s user  │  0.01s sys  │  30 MB mem  │

Detailed metrics:
  Time:
    Total:      0.035s
    User CPU:   0.02s (57.5% of total)
    System CPU: 0.01s (28.8% of total)
  Memory:
    Peak:       30 MB
    System:     64 GB total (0.05% used)
  Process:
    Context switches: 62 (voluntary: 1, involuntary: 61)
    IO operations:    in: 0, out: 0
    Exit code:        0
└─────────┴──────────────┴─────────────┴─────────────┘
```

More examples:

```bash
# Time a script
cpu ./my-script.sh

# Compare Bun & Node.js
cpu bun -e "console.log('Hello world')"
cpu node -e "console.log('Hello world')"


# Time a build process
cpu bun run build
cpu npm run build
```

## Comparison with time command

**Standard time command output:**

```sh
real    0m1.007s
user    0m0.003s
sys     0m0.003s
```

**cpu command output:**

```sh
┌─────────┬──────────────┬─────────────┬─────────────┐
│  0.01s  │  0.01s user  │  0.00s sys  │  20 MB mem  │
└─────────┴──────────────┴─────────────┴─────────────┘
```

Differences:

- Includes memory usage
- Uses a simple table format
- Has a verbose mode for additional details
- Adds basic color coding when supported

## How it works

This tool uses Bun's `Bun.spawn`'s `resourceUsage()` API, which accesses the same underlying `getrusage` system call that the standard Unix `time` command uses. This means you get the same accurate metrics, just displayed in a more readable format. The implementation is efficient with minimal overhead to the process being measured.

### Options

- `-v, --verbose`: Show additional metrics
- `-h, --help`: Show help message
- `--version`: Show version information

## Output explained

### Standard output shows:

- Total execution time
- User CPU time
- System CPU time
- Peak memory usage

### Verbose output (-v) adds:

- CPU percentages
- Memory usage percentages
- Context switch counts
- I/O operation counts
- Process exit code

## Development

```bash
# Clone the repository
git clone https://github.com/jarred/cpu.git
cd cpu

# Install dependencies
bun install

# Run locally
bun run index.ts <command>
```

## License

MIT © Jarred Sumner
