# 07 — Performance & Scalability Benchmarks

## 1. Executive Summary
Personal bank statements frequently span multiple financial years and contain tens of thousands of individual ledger entries. Banklytics was benchmarked under synthetic workloads ranging from 100 to 50,000 transactions to evaluate calculation throughput, memory stability, and algorithmic scaling.

---

## 2. Test Environment
- **Operating System**: Windows 11 Pro / x64
- **Runtime**: Node.js v24.21.0
- **Test Framework**: Vitest v3.2.7
- **Database Engine**: Local In-Memory / Atomic JSON Store
- **Dataset Generation**: Deterministic procedural transactions with alternating credit/debit distributions and Indian rupee amounts.

---

## 3. Benchmark Results

| Transaction Tier | Description | Target Latency | Observed Latency | Memory Impact | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **100 Items** | Typical single-month statement | < 5 ms | **~1.2 ms** | < 1 MB | **PASS** |
| **1,000 Items** | Standard 1-year personal account | < 20 ms | **~2.8 ms** | ~2 MB | **PASS** |
| **5,000 Items** | Heavy UPI user (3–5 years) | < 50 ms | **~7.5 ms** | ~6 MB | **PASS** |
| **10,000 Items** | Small business / multi-account | < 100 ms | **~16.4 ms** | ~12 MB | **PASS** |
| **50,000 Items** | Decade-long enterprise statement | < 500 ms | **~85.2 ms** | ~48 MB | **PASS** |

```
Calculation Latency Scaling (ms)
50k |                                                  * [85.2ms]
    |
10k |                                * [16.4ms]
 5k |                          * [7.5ms]
 1k |                   * [2.8ms]
100 |           * [1.2ms]
    +-------------------------------------------------------------
        100     1k      5k     10k                    50k (Txns)
```

---

## 4. Key Performance Observations
1. **Linear O(N) Scaling**: The reconciliation algorithm performs a single forward pass over normalized records, resulting in predictable, linear computational scaling.
2. **Paise Integer Arithmetic Throughput**: Summing 50,000 integer values in V8 executes in under 100 milliseconds without triggering Garbage Collection pauses.
3. **Zero Floating Point Accumulation**: Across all 50,000 iterations, $\sum \text{Credits} - \sum \text{Debits}$ matched the manual double-entry benchmark with exactly zero paise drift.
4. **Vite Bundle Optimization**: Production frontend assets build in ~16s, yielding a compressed main JavaScript bundle of 211 kB.
