# ⚡ Quick Start Guide

Get started with the Global Settlement Blockchain Framework in **5 minutes**.

## 🚀 One-Command Setup

```bash
# Clone and setup
git clone https://github.com/0xSoftBoi/global-settlement-blockchain-framework.git
cd global-settlement-blockchain-framework
./scripts/setup.sh

# Run demos
node demos/run-all-demos.js
```

## 📦 What You Get

### 1️⃣ MonadBFT Research Aggregator
Research tools for fast, fork-resistant blockchain consensus protocols.

**Try it:**
```bash
# Fetch MonadBFT paper
python3 monad-bft-research/scrapers/arxiv_scraper.py --paper-id 2502.20692

# Run consensus simulation
node monad-bft-research/implementations/monadbft/monadbft.js
```

**Output:**
- Paper metadata and PDF
- Consensus simulation with performance metrics
- TPS, latency, and fork resistance analysis

---

### 2️⃣ Institutional Compliance Monitor
Real-time AML/KYC monitoring and regulatory reporting.

**Try it:**
```bash
# Start compliance API
docker-compose up -d

# Run demo
node demos/compliance-demo.js
```

**Features:**
- Transaction screening (OFAC, EU sanctions)
- Risk scoring engine
- Automated regulatory reports (US, EU)
- Audit trail with immutable records

---

### 3️⃣ Cross-Chain Testing Framework
Automated testing for multi-chain settlement operations.

**Try it:**
```bash
# Run cross-chain tests
node demos/cross-chain-demo.js
```

**Capabilities:**
- Bridge security testing
- Multi-chain transaction simulation
- Finality verification
- Performance benchmarking
- Failure scenario testing

---

## 🎯 Common Use Cases

### Scenario 1: Screen a Transaction
```javascript
const TransactionScreener = require('./compliance-monitor/screening/transaction-screener');

const screener = new TransactionScreener();
const result = await screener.screenTransaction('0x123...', 'ethereum', 'US');

console.log(`Risk Level: ${result.riskLevel}`);
console.log(`Compliant: ${result.compliant}`);
```

### Scenario 2: Test Cross-Chain Bridge
```javascript
const CrossChainTester = require('./cross-chain-testing/src/cross-chain-tester');

const tester = new CrossChainTester();
const result = await tester.testTokenTransfer({
  sourceChain: 'ethereum',
  targetChain: 'polygon',
  token: 'USDC',
  amount: '1000',
  testMode: true
});

console.log(`Success: ${result.success}`);
```

### Scenario 3: Generate Compliance Report
```javascript
const ReportGenerator = require('./compliance-monitor/reporting/report-generator');

const generator = new ReportGenerator();
const report = await generator.generateReport({
  period: 'monthly',
  jurisdiction: 'US',
  format: 'json'
});

console.log(report.executiveSummary);
```

---

## 🐳 Docker Quick Start

```bash
# Start all services
docker-compose up -d

# Access dashboards
open http://localhost:3001  # Compliance Dashboard
open http://localhost:9090  # Prometheus
open http://localhost:3002  # Grafana
```

---

## 📚 Next Steps

1. **Explore Examples**: Check the `demos/` directory
2. **Read Documentation**: See `docs/GETTING_STARTED.md`
3. **API Reference**: See `docs/API_REFERENCE.md`
4. **Contribute**: See `CONTRIBUTING.md`

---

## 🆘 Need Help?

- **Issues**: https://github.com/0xSoftBoi/global-settlement-blockchain-framework/issues
- **Docs**: Check the `docs/` directory
- **Email**: support@globalsettlement.io

---

## 🎬 Demo Videos

Run these commands to see live demos:

```bash
# All demos
node demos/run-all-demos.js

# Individual demos
node demos/compliance-demo.js
node demos/cross-chain-demo.js
node monad-bft-research/implementations/monadbft/monadbft.js
```

---

## 📊 Sample Output

### MonadBFT Consensus
```
Block 90 committed (height: 90, hash: a3f5c7e9...)
Average Latency: 847ms
Throughput: 11.8 TPS
Fork Prevention: 3 tail forks prevented
✓ All nodes have consistent blockchain
```

### Compliance Screening
```
Risk Assessment:
  Score: 25.50%
  Level: LOW
  Factors: 1
Recommendations:
  - PROCEED
  - ROUTINE_MONITORING
```

### Cross-Chain Testing
```
Multi-Chain Settlement Test
Statistics:
  Total: 50
  Successful: 49
  Failed: 1
  Success Rate: 98.00%
  Average Latency: 1234.56ms
```

---

**Built for Global Settlement's institutional blockchain infrastructure** 🏦⚡
