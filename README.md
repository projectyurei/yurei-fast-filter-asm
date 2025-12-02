# Yurei Fast Filter (Assembly)

**Project Yurei** - High-Performance On-Chain Intelligence Layer.

This repository serves as a proof-of-concept for Yurei's "Geyser-based ingestion" pipeline. It demonstrates a hyper-optimized, pure SBF Assembly program designed to filter raw Solana event data at the microsecond level.

## Overview

The `yurei-fast-filter-asm` program performs a raw byte-level scan of input data to detect specific signatures (e.g., "YUREI"). By bypassing the standard Rust/C entrypoint and serialization overhead, we achieve minimal Compute Unit (CU) usage, allowing for maximum throughput in our intelligence pipeline.

## Benchmarks

Real-world performance results from local validator tests:

| Scenario | Status | Compute Units (CU) |
| :--- | :--- | :--- |
| **Scan (No Match)** | Success (0) | **56 CU** |
| **Scan (Match Found)** | Logged "Pattern Found" | **141 CU** |

*Compared to standard Rust programs which typically consume >5,000 CU for similar operations, this represents a ~99% reduction in compute costs.*

## Directory Structure

- `src/filter/filter.s`: Pure SBF Assembly source code.
- `src/filter/filter.ld`: Linker script for memory layout.
- `tests/test.js`: Pure JavaScript (Mocha/Chai) verification suite.
- `Makefile`: Build and deployment automation.

## Installation

### 1. Install Dependencies (WSL/Linux)
```bash
sudo apt-get update
sudo apt-get install -y \
    build-essential \
    pkg-config \
    libudev-dev llvm libclang-dev \
    protobuf-compiler libssl-dev
```

### 2. Quick Setup (Rust + Solana + Anchor)
```bash
curl --proto '=https' --tlsv1.2 -sSfL https://solana-install.solana.workers.dev | bash
```
*Restart your terminal after installation.*

### Uninstallation
If you need to remove the tools later, use these commands:

**1. Remove Rust:**
```bash
rustup self uninstall
```

**2. Remove Solana:**
```bash
rm -rf ~/.local/share/solana-install
rm -rf ~/.local/share/solana
```

**3. Remove Anchor:**
```bash
rm -rf ~/.avm
cargo uninstall anchor-cli
```

**4. Remove Surfpool:**
```bash
rm ~/.local/bin/surfpool
```

## Usage

### Prerequisites
- Solana Tool Suite (installed via above script)
- Node.js & NPM
- Make

### Build
Compile the assembly code into a shared object (`.so`):
```bash
make build
```

### Deploy
Deploy the program to your local validator:
```bash
# Ensure your local validator is running
solana-test-validator

# Deploy
make deploy
```
*Note: This will output a Program ID. Ensure `dist/filter-keypair.json` is generated.*

### Test
Run the verification suite:
```bash
npm install
npm test
```

## License
Proprietary - Project Yurei.
