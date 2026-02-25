# MonadBFT Research Aggregator

Comprehensive research aggregation and analysis tools for MonadBFT consensus protocol.

## Overview

This module aggregates research papers, technical documentation, and implementation examples for MonadBFT - a fast, responsive, and fork-resistant streamlined consensus protocol based on Fast-HotStuff and HotStuff lineage.

## Features

- **Paper Scraping**: Automated scraping of arXiv papers, especially arXiv:2502.20692
- **Documentation Aggregation**: Category Labs blog posts and official Monad docs
- **BFT Implementations**: Working implementations of HotStuff, Fast-HotStuff, and MonadBFT
- **Benchmarking Tools**: Performance analysis for latency, throughput, and fork resistance
- **Code Analysis**: Framework for analyzing BFT implementations
- **Documentation Generation**: Automated research summaries

## Quick Start

```bash
# Install dependencies
cd monad-bft-research
npm install
pip install -r requirements.txt

# Run paper scraper
python scrapers/arxiv_scraper.py --paper-id 2502.20692

# Run BFT consensus simulation
go run implementations/hotstuff/main.go

# Execute benchmarks
node benchmarks/consensus-benchmark.js
```

## Key Sources

- arXiv:2502.20692 - "MonadBFT: Fast, Responsive, Fork-Resistant Streamlined Consensus"
- [Category Labs Blog](https://blog.categorylabs.xyz)
- [Monad Documentation](https://docs.monad.xyz)
- [monad-viz Demo](https://github.com/category-labs/monad-viz)
- [monad-bft Implementation](https://github.com/category-labs/monad-bft)

## Architecture

```
monad-bft-research/
├── scrapers/
│   ├── arxiv_scraper.py        # ArXiv paper scraper
│   ├── blog_scraper.py         # Category Labs blog scraper
│   └── docs_scraper.py         # Official docs scraper
├── implementations/
│   ├── hotstuff/               # HotStuff implementation
│   ├── fast-hotstuff/          # Fast-HotStuff implementation
│   └── monadbft/               # MonadBFT simulation
├── benchmarks/
│   ├── consensus-benchmark.js  # Consensus performance tests
│   ├── latency-test.js         # Latency measurements
│   └── fork-resistance.js      # Fork resistance analysis
├── analysis/
│   ├── code-analyzer.py        # Code analysis tools
│   └── performance-analyzer.js # Performance analysis
└── docs/
    └── generator.py            # Documentation generator
```

## Usage Examples

### Scrape Research Papers

```python
from scrapers.arxiv_scraper import ArxivScraper

scraper = ArxivScraper()
paper = scraper.fetch_paper('2502.20692')
print(paper.title)
print(paper.abstract)
print(paper.pdf_url)
```

### Run Consensus Simulation

```javascript
const { HotStuffConsensus } = require('./implementations/hotstuff');

const consensus = new HotStuffConsensus({
  nodes: 10,
  faultTolerance: 3,
  networkDelay: 50
});

await consensus.run(1000); // 1000 blocks
console.log(consensus.getMetrics());
```

### Benchmark Performance

```bash
node benchmarks/consensus-benchmark.js \
  --protocol monadbft \
  --nodes 100 \
  --duration 60 \
  --output results.json
```

## Research Focus Areas

### 1. Tail-Forking Prevention

MonadBFT's novel approach to preventing tail forks:

```javascript
// Tail-fork prevention demo
const demo = require('./implementations/monadbft/tail-fork-prevention');
demo.demonstrateTailForkPrevention();
```

### 2. Speculative Finality

Understanding MonadBFT's speculative finality mechanism:

```javascript
const { SpeculativeFinalityEngine } = require('./implementations/monadbft');

const engine = new SpeculativeFinalityEngine();
engine.processBlock(block);
if (engine.isSpeculativelyFinal(block)) {
  console.log('Block achieved speculative finality');
}
```

### 3. Performance Characteristics

Key metrics for settlement layer research:

- **Latency**: Time to finality
- **Throughput**: Transactions per second
- **Fork Resistance**: Probability of chain reorganization
- **Network Resilience**: Performance under partition

## Benchmarking

### Consensus Latency

```javascript
const { LatencyBenchmark } = require('./benchmarks');

const benchmark = new LatencyBenchmark({
  protocols: ['hotstuff', 'fast-hotstuff', 'monadbft'],
  nodeCount: [10, 50, 100],
  networkConditions: ['optimal', 'degraded', 'partition']
});

const results = await benchmark.run();
benchmark.generateReport(results);
```

### Throughput Testing

```bash
# Test throughput under load
python benchmarks/throughput_test.py \
  --protocol monadbft \
  --tps-target 10000 \
  --duration 300
```

### Fork Resistance Analysis

```javascript
const { ForkResistanceAnalyzer } = require('./analysis');

const analyzer = new ForkResistanceAnalyzer();
const results = await analyzer.simulateForkScenarios({
  adversaryPower: 0.33,
  networkPartitionProb: 0.1,
  simulationRuns: 1000
});

console.log(`Fork probability: ${results.forkProbability}`);
```

## Implementation Details

### HotStuff Consensus

Classic HotStuff protocol implementation:

```go
package hotstuff

type HotStuff struct {
    ViewNumber int
    Phase      Phase
    Nodes      []*Node
    QuorumSize int
}

func (hs *HotStuff) Propose(block *Block) error {
    // Send PREPARE message
    votes := hs.broadcast(PrepareMsg{Block: block})
    if len(votes) >= hs.QuorumSize {
        // Move to PRE-COMMIT phase
        return hs.preCommit(block, votes)
    }
    return errors.New("insufficient votes")
}
```

### Fast-HotStuff Optimization

Optimized Fast-HotStuff with reduced latency:

```go
package fasthotstuff

type FastHotStuff struct {
    *hotstuff.HotStuff
    OptimisticPath bool
}

func (fhs *FastHotStuff) Propose(block *Block) error {
    // Fast path: combine phases
    votes := fhs.broadcastCombined(PreparePreCommitMsg{Block: block})
    if len(votes) >= fhs.QuorumSize {
        return fhs.commit(block, votes)
    }
    return fhs.fallbackToSlowPath(block)
}
```

### MonadBFT Innovations

MonadBFT with tail-fork prevention:

```go
package monadbft

type MonadBFT struct {
    *fasthotstuff.FastHotStuff
    TailForkPrevention *TailForkPreventor
    SpeculativeFinality bool
}

func (mb *MonadBFT) Propose(block *Block) error {
    // Check for tail forks
    if mb.TailForkPrevention.DetectPotentialFork(block) {
        mb.preventTailFork(block)
    }
    
    // Process with speculative finality
    return mb.processWithSpeculativeFinality(block)
}
```

## Code Analysis Framework

```python
from analysis.code_analyzer import BFTCodeAnalyzer

analyzer = BFTCodeAnalyzer()
analyzer.analyze_repository('category-labs/monad-bft')

report = analyzer.generate_report()
print(f"Total consensus implementations: {report.consensus_count}")
print(f"Average function complexity: {report.avg_complexity}")
print(f"Test coverage: {report.test_coverage}%")
```

## Documentation Generation

Automatic research summary generation:

```python
from docs.generator import ResearchDocGenerator

generator = ResearchDocGenerator()
generator.add_paper('arxiv:2502.20692')
generator.add_blog_posts(['category-labs'])
generator.add_implementations(['monad-bft'])

markdown = generator.generate_markdown()
html = generator.generate_html()
pdf = generator.generate_pdf()
```

## Integration with Global Settlement

MonadBFT research is specifically relevant for:

1. **Settlement Finality**: Fast, deterministic finality for payment settlements
2. **Fork Resistance**: Critical for institutional financial transactions
3. **High Throughput**: Supporting large-scale payment processing
4. **Network Resilience**: Maintaining consensus under adverse conditions

## Performance Targets

| Metric | HotStuff | Fast-HotStuff | MonadBFT |
|--------|----------|---------------|----------|
| Latency (p95) | ~3s | ~1.5s | **<1s** |
| Throughput | 5K TPS | 8K TPS | **>10K TPS** |
| Fork Probability | 0.1% | 0.05% | **<0.01%** |
| Network Overhead | High | Medium | **Low** |

## Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:implementations
npm run test:benchmarks

# Run with coverage
npm run test:coverage
```

## Contributing

Contributions welcome! Focus areas:

- Additional BFT protocol implementations
- Performance optimization benchmarks
- Real-world network simulation scenarios
- Documentation improvements

## References

1. Yin, M., et al. (2025). "MonadBFT: Fast, Responsive, Fork-Resistant Streamlined Consensus." arXiv:2502.20692
2. Yin, M., et al. (2019). "HotStuff: BFT Consensus with Linearity and Responsiveness."
3. Abraham, I., et al. (2020). "Sync HotStuff: Simple and Practical Synchronous BFT."

## License

MIT License - See LICENSE file for details.
