# Getting Started with Global Settlement Blockchain Framework

This guide will help you set up and start using the Global Settlement Blockchain Framework.

## Quick Start (5 minutes)

```bash
# 1. Clone the repository
git clone https://github.com/0xSoftBoi/global-settlement-blockchain-framework.git
cd global-settlement-blockchain-framework

# 2. Run setup
./scripts/setup.sh

# 3. Run demos
node demos/run-all-demos.js
```

## Detailed Setup

### Prerequisites

#### Required
- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **Python** >= 3.10 ([Download](https://python.org/))
- **Git** ([Download](https://git-scm.com/))

#### Optional (Recommended)
- **Docker** >= 20.10 for containerized services ([Download](https://docker.com/))
- **Go** >= 1.21 for BFT implementations ([Download](https://go.dev/))
- **Foundry** for smart contract testing ([Install](https://book.getfoundry.sh/getting-started/installation))

### Installation

#### Step 1: Install Dependencies

```bash
# Install Node.js packages
npm install

# Install Python packages
pip3 install -r requirements.txt

# Install Go dependencies (if Go is installed)
cd monad-bft-research/implementations/hotstuff
go mod download
cd ../../..

# Install Foundry (optional)
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

#### Step 2: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your configuration
nano .env  # or use your preferred editor
```

**Required Configuration:**

```env
# Blockchain RPC Endpoints
ETHEREUM_RPC=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
POLYGON_RPC=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY

# Database (if using Docker)
POSTGRES_URL=postgresql://gsf_user:password@localhost:5432/settlement
REDIS_URL=redis://localhost:6379
```

**Optional Configuration:**

```env
# Compliance APIs
OFAC_API_KEY=your_key_here
CHAINALYSIS_API_KEY=your_key_here

# Research
GITHUB_TOKEN=your_github_token
```

#### Step 3: Start Services

**Option A: Using Docker (Recommended)**

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

**Option B: Manual Setup**

```bash
# Terminal 1: Start Compliance API
cd compliance-monitor
node api/server.js

# Terminal 2: Start Dashboard
cd compliance-monitor/dashboard
npm start
```

## Usage Examples

### 1. MonadBFT Research Aggregator

#### Fetch Research Papers

```bash
# Fetch the main MonadBFT paper
python3 monad-bft-research/scrapers/arxiv_scraper.py --paper-id 2502.20692 --download-pdf

# Search for related papers
python3 monad-bft-research/scrapers/arxiv_scraper.py --search "BFT consensus"

# Scrape Category Labs blog
python3 monad-bft-research/scrapers/blog_scraper.py
```

#### Run Consensus Simulations

```bash
# HotStuff implementation
cd monad-bft-research/implementations/hotstuff
go run main.go

# MonadBFT implementation
node monad-bft-research/implementations/monadbft/monadbft.js
```

#### Run Benchmarks

```bash
# Consensus performance benchmark
node monad-bft-research/benchmarks/consensus-benchmark.js
```

### 2. Compliance Monitor

#### Screen Transactions

```bash
# Using curl
curl -X POST http://localhost:3000/api/v1/compliance/screen \
  -H "Content-Type: application/json" \
  -d '{
    "txHash": "0x...",
    "chain": "ethereum",
    "jurisdiction": "US"
  }'
```

```javascript
// Using JavaScript
const TransactionScreener = require('./compliance-monitor/screening/transaction-screener');

const screener = new TransactionScreener();
const result = await screener.screenTransaction(
  '0x742d35cc6634c0532925a3b844bc9e7fe3d4b3c8',
  'ethereum',
  'US'
);

console.log(`Risk Level: ${result.riskLevel}`);
console.log(`Compliant: ${result.compliant}`);
```

#### Generate Reports

```bash
# Monthly US report
curl "http://localhost:3000/api/v1/compliance/report?period=monthly&jurisdiction=US"

# EU MiCA report in PDF
curl "http://localhost:3000/api/v1/compliance/report?period=quarterly&jurisdiction=EU&format=pdf" \
  -o report.pdf
```

```javascript
// Using JavaScript
const ReportGenerator = require('./compliance-monitor/reporting/report-generator');

const generator = new ReportGenerator();
const report = await generator.generateReport({
  period: 'monthly',
  jurisdiction: 'US',
  format: 'json'
});

console.log(report.executiveSummary);
```

### 3. Cross-Chain Testing

#### Test Bridge Functionality

```bash
# Run bridge security tests
forge test --match-contract BridgeTest

# Run specific test
forge test --match-test testBridgeSecurity
```

```javascript
// Using JavaScript
const CrossChainTester = require('./cross-chain-testing/src/cross-chain-tester');

const tester = new CrossChainTester();

// Test token transfer
const result = await tester.testTokenTransfer({
  sourceChain: 'ethereum',
  targetChain: 'polygon',
  token: 'USDC',
  amount: '1000',
  testMode: true
});

console.log(`Success: ${result.success}`);
console.log(`Time: ${result.totalTime}ms`);
```

#### Run Performance Benchmarks

```javascript
const tester = new CrossChainTester();

const perfResult = await tester.benchmarkPerformance({
  chains: ['ethereum', 'polygon', 'arbitrum'],
  duration: 60000, // 1 minute
  tpsTarget: 1000
});

console.log(`TPS: ${perfResult.metrics.tps}`);
console.log(`P95 Latency: ${perfResult.metrics.p95Latency}ms`);
```

#### Test Failure Scenarios

```javascript
const result = await tester.testFailureScenarios({
  scenarios: [
    'network_partition',
    'node_failure',
    'high_latency',
    'bridge_downtime'
  ]
});

console.log(`Resilience: ${result.success}`);
```

## Running Demos

### All Demos

```bash
node demos/run-all-demos.js
```

### Individual Demos

```bash
# MonadBFT Research Demo
node monad-bft-research/implementations/monadbft/monadbft.js

# Compliance Monitor Demo
node demos/compliance-demo.js

# Cross-Chain Testing Demo
node demos/cross-chain-demo.js
```

## Testing

### Run All Tests

```bash
npm test
```

### Module-Specific Tests

```bash
# MonadBFT Research
npm run test:monad-research

# Compliance Monitor
npm run test:compliance

# Cross-Chain Testing
npm run test:cross-chain
```

### With Coverage

```bash
npm run test:coverage
```

## Monitoring and Observability

### Access Dashboards

- **Compliance Dashboard**: http://localhost:3001
- **Prometheus Metrics**: http://localhost:9090
- **Grafana**: http://localhost:3002 (admin/admin)

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f compliance-api

# Application logs
tail -f logs/combined.log
```

## Common Tasks

### Update Dependencies

```bash
# Node.js
npm update

# Python
pip3 install -r requirements.txt --upgrade

# Go
cd monad-bft-research/implementations/hotstuff
go get -u
```

### Backup Data

```bash
# PostgreSQL
docker exec gsf-postgres pg_dump -U gsf_user settlement > backup.sql

# MongoDB
docker exec gsf-mongodb mongodump --out /backup
```

### Clean Up

```bash
# Stop services
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# Clean logs
rm -rf logs/*
```

## Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :3000  # or any port number

# Kill the process
kill -9 <PID>

# Or change the port in .env
PORT=3001
```

### Database Connection Errors

```bash
# Check if containers are running
docker-compose ps

# Restart database services
docker-compose restart postgres mongodb redis

# Check logs
docker-compose logs postgres
```

### RPC Connection Issues

1. Verify RPC endpoints in `.env`
2. Check API key limits
3. Test endpoint manually:

```bash
curl -X POST YOUR_RPC_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Module Not Found Errors

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

1. **Explore the Codebase**
   - Browse `monad-bft-research/` for consensus research
   - Check `compliance-monitor/` for compliance tools
   - Review `cross-chain-testing/` for testing frameworks

2. **Read Documentation**
   - [API Reference](./api-reference.md)
   - [Architecture Guide](./architecture.md)
   - [Deployment Guide](./deployment.md)

3. **Customize for Your Needs**
   - Add custom compliance rules
   - Implement new test scenarios
   - Extend consensus implementations

4. **Contribute**
   - See [CONTRIBUTING.md](../CONTRIBUTING.md)
   - Report issues on GitHub
   - Submit pull requests

## Getting Help

- **Documentation**: Check the `docs/` directory
- **Issues**: https://github.com/0xSoftBoi/global-settlement-blockchain-framework/issues
- **Email**: support@globalsettlement.io
- **Discord**: [Join our community](https://discord.gg/globalsettlement)

## Additional Resources

### MonadBFT Research
- [ArXiv Paper](https://arxiv.org/abs/2502.20692)
- [Category Labs Blog](https://blog.categorylabs.xyz)
- [Monad Documentation](https://docs.monad.xyz)

### Compliance Frameworks
- [MiCA Regulation](https://ec.europa.eu/info/business-economy-euro/banking-and-finance/financial-markets/crypto-assets_en)
- [FinCEN Guidance](https://www.fincen.gov/)
- [FATF Standards](https://www.fatf-gafi.org/)

### Cross-Chain Resources
- [Ethereum Bridge Best Practices](https://ethereum.org/en/developers/docs/bridges/)
- [LayerZero Documentation](https://layerzero.network/)
- [Chainlink CCIP](https://chain.link/cross-chain)

---

**Happy Building!** 🚀
