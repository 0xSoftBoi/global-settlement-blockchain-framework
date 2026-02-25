package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"sync"
	"time"
)

// Phase represents the different phases in HotStuff
type Phase int

const (
	Prepare Phase = iota
	PreCommit
	Commit
	Decide
)

func (p Phase) String() string {
	switch p {
	case Prepare:
		return "PREPARE"
	case PreCommit:
		return "PRE-COMMIT"
	case Commit:
		return "COMMIT"
	case Decide:
		return "DECIDE"
	default:
		return "UNKNOWN"
	}
}

// Block represents a block in the blockchain
type Block struct {
	Height     int64
	Hash       string
	ParentHash string
	Timestamp  time.Time
	Proposer   int
	TxCount    int
}

// Vote represents a vote from a node
type Vote struct {
	NodeID    int
	BlockHash string
	Phase     Phase
	Signature string
}

// QC (Quorum Certificate) represents a set of votes forming a quorum
type QC struct {
	BlockHash string
	Phase     Phase
	Votes     []Vote
	Timestamp time.Time
}

// Node represents a consensus node
type Node struct {
	ID            int
	IsLeader      bool
	CurrentView   int64
	LockedQC      *QC
	PrepareQC     *QC
	PreCommitQC   *QC
	CommitQC      *QC
	Blockchain    []*Block
	VoteCollector map[string][]Vote
	mu            sync.RWMutex
}

// HotStuff represents the HotStuff consensus protocol
type HotStuff struct {
	Nodes           []*Node
	QuorumSize      int
	TotalNodes      int
	CurrentLeader   int
	CurrentView     int64
	NetworkDelay    time.Duration
	Metrics         *Metrics
	mu              sync.RWMutex
}

// Metrics tracks consensus performance
type Metrics struct {
	TotalBlocks       int64
	TotalLatency      time.Duration
	AverageLatency    time.Duration
	BlockTimes        []time.Duration
	ViewChanges       int64
	FailedProposals   int64
	mu                sync.RWMutex
}

// NewHotStuff creates a new HotStuff instance
func NewHotStuff(nodeCount int, networkDelay time.Duration) *HotStuff {
	quorumSize := 2*nodeCount/3 + 1
	nodes := make([]*Node, nodeCount)
	
	for i := 0; i < nodeCount; i++ {
		nodes[i] = &Node{
			ID:            i,
			IsLeader:      i == 0,
			CurrentView:   0,
			Blockchain:    make([]*Block, 0),
			VoteCollector: make(map[string][]Vote),
		}
	}
	
	return &HotStuff{
		Nodes:         nodes,
		QuorumSize:    quorumSize,
		TotalNodes:    nodeCount,
		CurrentLeader: 0,
		CurrentView:   0,
		NetworkDelay:  networkDelay,
		Metrics:       &Metrics{},
	}
}

// ProposeBlock proposes a new block
func (hs *HotStuff) ProposeBlock(txCount int) (*Block, error) {
	hs.mu.Lock()
	defer hs.mu.Unlock()
	
	leader := hs.Nodes[hs.CurrentLeader]
	leader.mu.Lock()
	defer leader.mu.Unlock()
	
	var parentHash string
	height := int64(0)
	
	if len(leader.Blockchain) > 0 {
		lastBlock := leader.Blockchain[len(leader.Blockchain)-1]
		parentHash = lastBlock.Hash
		height = lastBlock.Height + 1
	} else {
		parentHash = "genesis"
	}
	
	block := &Block{
		Height:     height,
		ParentHash: parentHash,
		Timestamp:  time.Now(),
		Proposer:   leader.ID,
		TxCount:    txCount,
	}
	
	// Calculate block hash
	block.Hash = calculateBlockHash(block)
	
	return block, nil
}

// RunConsensus runs the HotStuff consensus for a block
func (hs *HotStuff) RunConsensus(block *Block) error {
	startTime := time.Now()
	
	// Phase 1: PREPARE
	prepareQC, err := hs.runPhase(block, Prepare)
	if err != nil {
		return fmt.Errorf("PREPARE phase failed: %w", err)
	}
	
	// Phase 2: PRE-COMMIT
	preCommitQC, err := hs.runPhase(block, PreCommit)
	if err != nil {
		return fmt.Errorf("PRE-COMMIT phase failed: %w", err)
	}
	
	// Phase 3: COMMIT
	commitQC, err := hs.runPhase(block, Commit)
	if err != nil {
		return fmt.Errorf("COMMIT phase failed: %w", err)
	}
	
	// Phase 4: DECIDE
	err = hs.finalizeBlock(block, commitQC)
	if err != nil {
		return fmt.Errorf("DECIDE phase failed: %w", err)
	}
	
	// Update metrics
	latency := time.Since(startTime)
	hs.Metrics.mu.Lock()
	hs.Metrics.TotalBlocks++
	hs.Metrics.TotalLatency += latency
	hs.Metrics.BlockTimes = append(hs.Metrics.BlockTimes, latency)
	hs.Metrics.AverageLatency = hs.Metrics.TotalLatency / time.Duration(hs.Metrics.TotalBlocks)
	hs.Metrics.mu.Unlock()
	
	// Store QCs in leader
	leader := hs.Nodes[hs.CurrentLeader]
	leader.mu.Lock()
	leader.PrepareQC = prepareQC
	leader.PreCommitQC = preCommitQC
	leader.CommitQC = commitQC
	leader.mu.Unlock()
	
	return nil
}

// runPhase executes a single phase of the consensus
func (hs *HotStuff) runPhase(block *Block, phase Phase) (*QC, error) {
	// Simulate network delay
	time.Sleep(hs.NetworkDelay)
	
	// Collect votes from all nodes
	votes := make([]Vote, 0, hs.TotalNodes)
	
	for _, node := range hs.Nodes {
		// Simulate Byzantine behavior (10% chance of not voting)
		if rand.Float64() < 0.1 {
			continue
		}
		
		vote := Vote{
			NodeID:    node.ID,
			BlockHash: block.Hash,
			Phase:     phase,
			Signature: fmt.Sprintf("sig-%d-%s-%s", node.ID, block.Hash, phase),
		}
		votes = append(votes, vote)
	}
	
	// Check if we have a quorum
	if len(votes) < hs.QuorumSize {
		return nil, fmt.Errorf("insufficient votes: got %d, need %d", len(votes), hs.QuorumSize)
	}
	
	qc := &QC{
		BlockHash: block.Hash,
		Phase:     phase,
		Votes:     votes,
		Timestamp: time.Now(),
	}
	
	return qc, nil
}

// finalizeBlock adds the block to all nodes' blockchains
func (hs *HotStuff) finalizeBlock(block *Block, qc *QC) error {
	for _, node := range hs.Nodes {
		node.mu.Lock()
		node.Blockchain = append(node.Blockchain, block)
		node.CurrentView++
		node.mu.Unlock()
	}
	
	hs.CurrentView++
	return nil
}

// RotateLeader rotates to the next leader
func (hs *HotStuff) RotateLeader() {
	hs.mu.Lock()
	defer hs.mu.Unlock()
	
	hs.Nodes[hs.CurrentLeader].IsLeader = false
	hs.CurrentLeader = (hs.CurrentLeader + 1) % hs.TotalNodes
	hs.Nodes[hs.CurrentLeader].IsLeader = true
	hs.Metrics.ViewChanges++
}

// GetMetrics returns current consensus metrics
func (hs *HotStuff) GetMetrics() map[string]interface{} {
	hs.Metrics.mu.RLock()
	defer hs.Metrics.mu.RUnlock()
	
	p50, p95, p99 := calculatePercentiles(hs.Metrics.BlockTimes)
	
	return map[string]interface{}{
		"total_blocks":      hs.Metrics.TotalBlocks,
		"average_latency":   hs.Metrics.AverageLatency.String(),
		"latency_p50":       p50.String(),
		"latency_p95":       p95.String(),
		"latency_p99":       p99.String(),
		"view_changes":      hs.Metrics.ViewChanges,
		"failed_proposals":  hs.Metrics.FailedProposals,
		"throughput_tps":    float64(hs.Metrics.TotalBlocks) / hs.Metrics.TotalLatency.Seconds(),
	}
}

// calculateBlockHash calculates the hash of a block
func calculateBlockHash(block *Block) string {
	data := fmt.Sprintf("%d%s%d%d",
		block.Height,
		block.ParentHash,
		block.Proposer,
		block.Timestamp.Unix(),
	)
	
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}

// calculatePercentiles calculates p50, p95, p99 latencies
func calculatePercentiles(times []time.Duration) (time.Duration, time.Duration, time.Duration) {
	if len(times) == 0 {
		return 0, 0, 0
	}
	
	// Sort times (simple bubble sort for small arrays)
	sorted := make([]time.Duration, len(times))
	copy(sorted, times)
	
	for i := 0; i < len(sorted); i++ {
		for j := i + 1; j < len(sorted); j++ {
			if sorted[i] > sorted[j] {
				sorted[i], sorted[j] = sorted[j], sorted[i]
			}
		}
	}
	
	p50 := sorted[len(sorted)*50/100]
	p95 := sorted[len(sorted)*95/100]
	p99 := sorted[len(sorted)*99/100]
	
	return p50, p95, p99
}

func main() {
	log.Println("Starting HotStuff Consensus Simulation")
	log.Println("======================================")
	
	// Configuration
	nodeCount := 10
	networkDelay := 50 * time.Millisecond
	blockCount := 100
	txPerBlock := 1000
	
	log.Printf("Configuration:")
	log.Printf("  Nodes: %d", nodeCount)
	log.Printf("  Network Delay: %v", networkDelay)
	log.Printf("  Blocks to produce: %d", blockCount)
	log.Printf("  Transactions per block: %d\n", txPerBlock)
	
	// Create HotStuff instance
	hs := NewHotStuff(nodeCount, networkDelay)
	log.Printf("Quorum size: %d (>2/3 of %d nodes)\n", hs.QuorumSize, nodeCount)
	
	// Run consensus for multiple blocks
	startTime := time.Now()
	
	for i := 0; i < blockCount; i++ {
		// Propose new block
		block, err := hs.ProposeBlock(txPerBlock)
		if err != nil {
			log.Fatalf("Failed to propose block: %v", err)
		}
		
		// Run consensus
		err = hs.RunConsensus(block)
		if err != nil {
			log.Printf("Consensus failed for block %d: %v", i, err)
			hs.Metrics.FailedProposals++
			continue
		}
		
		if i%10 == 0 {
			log.Printf("Block %d committed (height: %d, hash: %s...)",
				i, block.Height, block.Hash[:16])
		}
		
		// Periodically rotate leader
		if i > 0 && i%20 == 0 {
			hs.RotateLeader()
		}
	}
	
	totalTime := time.Since(startTime)
	
	log.Println("\n======================================")
	log.Println("Simulation Complete")
	log.Println("======================================\n")
	
	// Print metrics
	metrics := hs.GetMetrics()
	log.Println("Performance Metrics:")
	
	metricsJSON, _ := json.MarshalIndent(metrics, "", "  ")
	log.Println(string(metricsJSON))
	
	log.Printf("\nTotal simulation time: %v", totalTime)
	log.Printf("Effective TPS: %.2f transactions/second",
		float64(blockCount*txPerBlock)/totalTime.Seconds())
	
	// Verify blockchain consistency
	log.Println("\nVerifying blockchain consistency...")
	consistent := true
	firstChain := hs.Nodes[0].Blockchain
	
	for i := 1; i < len(hs.Nodes); i++ {
		if len(hs.Nodes[i].Blockchain) != len(firstChain) {
			log.Printf("  Node %d: INCONSISTENT (length mismatch)", i)
			consistent = false
			continue
		}
		
		for j := 0; j < len(firstChain); j++ {
			if hs.Nodes[i].Blockchain[j].Hash != firstChain[j].Hash {
				log.Printf("  Node %d: INCONSISTENT (hash mismatch at height %d)", i, j)
				consistent = false
				break
			}
		}
	}
	
	if consistent {
		log.Println("  ✓ All nodes have consistent blockchain")
	} else {
		log.Println("  ✗ Blockchain inconsistency detected")
	}
	
	log.Println("\nFinal blockchain height:", len(firstChain))
}
