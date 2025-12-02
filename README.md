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



