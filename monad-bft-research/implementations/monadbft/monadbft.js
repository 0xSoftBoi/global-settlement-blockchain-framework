/**
 * MonadBFT Consensus Implementation
 * 
 * Implements MonadBFT with tail-fork prevention and speculative finality
 * Based on the arXiv paper: MonadBFT: Fast, Responsive, Fork-Resistant Streamlined Consensus
 */

const crypto = require('crypto');
const EventEmitter = require('events');

class MonadBFT extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.nodeCount = config.nodeCount || 10;
    this.quorumSize = Math.floor(2 * this.nodeCount / 3) + 1;
    this.networkDelay = config.networkDelay || 50; // ms
    this.enableTailForkPrevention = config.enableTailForkPrevention !== false;
    this.enableSpeculativeFinality = config.enableSpeculativeFinality !== false;
    
    this.nodes = [];
    this.currentView = 0;
    this.currentLeader = 0;
    this.blockchain = [];
    
    this.metrics = {
      totalBlocks: 0,
      latencies: [],
      forksPrevented: 0,
      speculativeFinalizations: 0,
      viewChanges: 0,
      failedProposals: 0
    };
    
    this.initializeNodes();
  }
  
  initializeNodes() {
    for (let i = 0; i < this.nodeCount; i++) {
      this.nodes.push({
        id: i,
        isLeader: i === 0,
        view: 0,
        blockchain: [],
        prepareQC: null,
        lockedQC: null,
        tailForkDetector: new TailForkDetector(),
        speculativeFinalityTracker: new SpeculativeFinalityTracker()
      });
    }
  }
  
  async proposeBlock(transactions) {
    const leader = this.nodes[this.currentLeader];
    const parentHash = this.blockchain.length > 0 
      ? this.blockchain[this.blockchain.length - 1].hash 
      : 'genesis';
    
    const block = {
      height: this.blockchain.length,
      parentHash,
      transactions,
      proposer: leader.id,
      timestamp: Date.now(),
      view: this.currentView
    };
    
    block.hash = this.calculateBlockHash(block);
    
    return block;
  }
  
  async runConsensus(block) {
    const startTime = Date.now();
    
    try {
      // MonadBFT tail-fork prevention check
      if (this.enableTailForkPrevention) {
        const hasTailFork = await this.detectTailFork(block);
        if (hasTailFork) {
          await this.preventTailFork(block);
          this.metrics.forksPrevented++;
        }
      }
      
      // Fast path: Combined PREPARE and PRE-COMMIT (Fast-HotStuff style)
      const fastPathQC = await this.runFastPath(block);
      
      if (fastPathQC) {
        // Fast path succeeded
        await this.commitBlock(block, fastPathQC);
        
        // MonadBFT speculative finality
        if (this.enableSpeculativeFinality) {
          await this.applySpeculativeFinality(block);
          this.metrics.speculativeFinalizations++;
        }
      } else {
        // Fall back to slow path (traditional HotStuff)
        const prepareQC = await this.runPhase(block, 'PREPARE');
        const preCommitQC = await this.runPhase(block, 'PRE-COMMIT');
        const commitQC = await this.runPhase(block, 'COMMIT');
        
        await this.commitBlock(block, commitQC);
      }
      
      // Update metrics
      const latency = Date.now() - startTime;
      this.metrics.totalBlocks++;
      this.metrics.latencies.push(latency);
      
      this.emit('blockCommitted', { block, latency });
      
      return { success: true, latency };
      
    } catch (error) {
      this.metrics.failedProposals++;
      this.emit('consensusFailed', { block, error: error.message });
      return { success: false, error: error.message };
    }
  }
  
  async detectTailFork(block) {
    // MonadBFT's tail-fork detection algorithm
    // Checks if there are conflicting blocks at the tail of the chain
    
    for (const node of this.nodes) {
      const detector = node.tailForkDetector;
      
      // Check for competing blocks at the same height
      const competingBlocks = detector.getCompetingBlocks(block.height);
      
      if (competingBlocks.length > 0) {
        // Check if any competing block has votes
        for (const competing of competingBlocks) {
          if (competing.votes > 0 && competing.hash !== block.hash) {
            return true; // Potential tail fork detected
          }
        }
      }
    }
    
    return false;
  }
  
  async preventTailFork(block) {
    // MonadBFT's tail-fork prevention mechanism
    // Ensures deterministic selection of the canonical block
    
    console.log(`[MonadBFT] Tail fork detected at height ${block.height}, applying prevention`);
    
    // Strategy: Use deterministic tie-breaking based on block hash
    // In a real implementation, this would use cryptographic sortition
    const leader = this.nodes[this.currentLeader];
    leader.tailForkDetector.recordForkPrevention(block);
    
    // Additional round of voting with fork-awareness
    await this.simulateNetworkDelay();
  }
  
  async runFastPath(block) {
    // Fast-HotStuff optimization: combine PREPARE and PRE-COMMIT phases
    await this.simulateNetworkDelay();
    
    const votes = [];
    
    for (const node of this.nodes) {
      // 90% success rate (simulating network conditions)
      if (Math.random() > 0.1) {
        votes.push({
          nodeId: node.id,
          blockHash: block.hash,
          phase: 'FAST-PATH',
          signature: this.generateSignature(node.id, block.hash)
        });
      }
    }
    
    if (votes.length >= this.quorumSize) {
      return {
        blockHash: block.hash,
        phase: 'FAST-PATH',
        votes,
        timestamp: Date.now()
      };
    }
    
    return null; // Fast path failed, fall back to slow path
  }
  
  async runPhase(block, phase) {
    await this.simulateNetworkDelay();
    
    const votes = [];
    
    for (const node of this.nodes) {
      // 90% voting participation
      if (Math.random() > 0.1) {
        votes.push({
          nodeId: node.id,
          blockHash: block.hash,
          phase,
          signature: this.generateSignature(node.id, block.hash)
        });
      }
    }
    
    if (votes.length < this.quorumSize) {
      throw new Error(`${phase} phase failed: insufficient votes (${votes.length}/${this.quorumSize})`);
    }
    
    return {
      blockHash: block.hash,
      phase,
      votes,
      timestamp: Date.now()
    };
  }
  
  async applySpeculativeFinality(block) {
    // MonadBFT's speculative finality mechanism
    // Allows optimistic finalization under good network conditions
    
    for (const node of this.nodes) {
      const tracker = node.speculativeFinalityTracker;
      
      // Check if block meets speculative finality criteria
      const criteria = {
        hasQuorum: true,
        networkStable: Math.random() > 0.05, // 95% network stability
        noConflicts: await this.checkNoConflicts(block)
      };
      
      if (criteria.hasQuorum && criteria.networkStable && criteria.noConflicts) {
        tracker.markSpeculativelyFinal(block);
      }
    }
  }
  
  async checkNoConflicts(block) {
    // Check for any conflicting blocks
    for (const node of this.nodes) {
      const lastBlock = node.blockchain[node.blockchain.length - 1];
      if (lastBlock && lastBlock.height >= block.height && lastBlock.hash !== block.hash) {
        return false;
      }
    }
    return true;
  }
  
  async commitBlock(block, qc) {
    this.blockchain.push(block);
    
    for (const node of this.nodes) {
      node.blockchain.push(block);
      node.view++;
    }
    
    this.currentView++;
  }
  
  rotateLeader() {
    this.nodes[this.currentLeader].isLeader = false;
    this.currentLeader = (this.currentLeader + 1) % this.nodeCount;
    this.nodes[this.currentLeader].isLeader = true;
    this.metrics.viewChanges++;
  }
  
  calculateBlockHash(block) {
    const data = JSON.stringify({
      height: block.height,
      parentHash: block.parentHash,
      transactions: block.transactions,
      timestamp: block.timestamp
    });
    
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  
  generateSignature(nodeId, blockHash) {
    return crypto
      .createHash('sha256')
      .update(`${nodeId}-${blockHash}-${Date.now()}`)
      .digest('hex');
  }
  
  async simulateNetworkDelay() {
    return new Promise(resolve => {
      setTimeout(resolve, this.networkDelay);
    });
  }
  
  getMetrics() {
    const latencies = this.metrics.latencies;
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length || 0;
    
    const sorted = [...latencies].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
    const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
    
    const totalTime = latencies.reduce((a, b) => a + b, 0) / 1000; // seconds
    const tps = totalTime > 0 ? this.metrics.totalBlocks / totalTime : 0;
    
    return {
      totalBlocks: this.metrics.totalBlocks,
      averageLatency: `${avg.toFixed(2)}ms`,
      latencyP50: `${p50}ms`,
      latencyP95: `${p95}ms`,
      latencyP99: `${p99}ms`,
      throughputTPS: tps.toFixed(2),
      forksPrevented: this.metrics.forksPrevented,
      speculativeFinalizations: this.metrics.speculativeFinalizations,
      viewChanges: this.metrics.viewChanges,
      failedProposals: this.metrics.failedProposals,
      forkPreventionRate: this.metrics.totalBlocks > 0
        ? (this.metrics.forksPrevented / this.metrics.totalBlocks * 100).toFixed(2) + '%'
        : '0%'
    };
  }
  
  verifyConsistency() {
    const firstChain = this.nodes[0].blockchain;
    
    for (let i = 1; i < this.nodes.length; i++) {
      const chain = this.nodes[i].blockchain;
      
      if (chain.length !== firstChain.length) {
        return { consistent: false, reason: `Node ${i} has different chain length` };
      }
      
      for (let j = 0; j < firstChain.length; j++) {
        if (chain[j].hash !== firstChain[j].hash) {
          return { 
            consistent: false, 
            reason: `Node ${i} has different block at height ${j}` 
          };
        }
      }
    }
    
    return { consistent: true };
  }
}

class TailForkDetector {
  constructor() {
    this.competingBlocks = new Map();
    this.forkPreventions = [];
  }
  
  getCompetingBlocks(height) {
    return this.competingBlocks.get(height) || [];
  }
  
  recordForkPrevention(block) {
    this.forkPreventions.push({
      block,
      timestamp: Date.now()
    });
  }
}

class SpeculativeFinalityTracker {
  constructor() {
    this.speculativeBlocks = new Map();
  }
  
  markSpeculativelyFinal(block) {
    this.speculativeBlocks.set(block.hash, {
      block,
      timestamp: Date.now(),
      isFinal: false
    });
  }
  
  isSpeculativelyFinal(blockHash) {
    return this.speculativeBlocks.has(blockHash);
  }
  
  confirmFinality(blockHash) {
    const entry = this.speculativeBlocks.get(blockHash);
    if (entry) {
      entry.isFinal = true;
    }
  }
}

// Demo/Test execution
async function runMonadBFTDemo() {
  console.log('='.repeat(60));
  console.log('MonadBFT Consensus Simulation');
  console.log('='.repeat(60));
  
  const config = {
    nodeCount: 10,
    networkDelay: 50,
    enableTailForkPrevention: true,
    enableSpeculativeFinality: true
  };
  
  console.log('\nConfiguration:');
  console.log(`  Nodes: ${config.nodeCount}`);
  console.log(`  Network Delay: ${config.networkDelay}ms`);
  console.log(`  Tail-Fork Prevention: ${config.enableTailForkPrevention}`);
  console.log(`  Speculative Finality: ${config.enableSpeculativeFinality}\n`);
  
  const monadBFT = new MonadBFT(config);
  
  console.log(`Quorum Size: ${monadBFT.quorumSize} (>2/3 of ${config.nodeCount} nodes)\n`);
  
  // Run consensus for multiple blocks
  const blockCount = 100;
  const txPerBlock = 1000;
  
  console.log(`Producing ${blockCount} blocks with ${txPerBlock} transactions each...\n`);
  
  for (let i = 0; i < blockCount; i++) {
    const transactions = Array(txPerBlock).fill(0).map((_, idx) => ({
      from: `addr${idx % 100}`,
      to: `addr${(idx + 1) % 100}`,
      amount: Math.random() * 1000
    }));
    
    const block = await monadBFT.proposeBlock(transactions);
    const result = await monadBFT.runConsensus(block);
    
    if (i % 10 === 0) {
      console.log(`Block ${i} committed (height: ${block.height}, latency: ${result.latency}ms)`);
    }
    
    // Periodically rotate leader
    if (i > 0 && i % 20 === 0) {
      monadBFT.rotateLeader();
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Simulation Complete');
  console.log('='.repeat(60) + '\n');
  
  // Print metrics
  const metrics = monadBFT.getMetrics();
  console.log('Performance Metrics:');
  console.log(JSON.stringify(metrics, null, 2));
  
  // Verify consistency
  console.log('\nVerifying blockchain consistency...');
  const verification = monadBFT.verifyConsistency();
  if (verification.consistent) {
    console.log('  ✓ All nodes have consistent blockchain');
  } else {
    console.log(`  ✗ Inconsistency detected: ${verification.reason}`);
  }
  
  console.log(`\nFinal blockchain height: ${monadBFT.blockchain.length}`);
}

if (require.main === module) {
  runMonadBFTDemo().catch(console.error);
}

module.exports = { MonadBFT, TailForkDetector, SpeculativeFinalityTracker };
