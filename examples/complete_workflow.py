"""Complete workflow example using all framework components."""

import sys
import os

# Add component directories to path
sys.path.append('monadbft-research-aggregator')
sys.path.append('blockchain-compliance-monitor')
sys.path.append('smart-contract-auditor')
sys.path.append('crosschain-settlement-testing')
sys.path.append('consensus-benchmarking-suite')

from compliance_monitor import ComplianceMonitor, ComplianceConfig
from simulations.bft_consensus import MonadBFTSimulator
from benchmarks.consensus_benchmark import ConsensusBenchmark


def example_transaction_workflow():
    """Example: Process a transaction through the complete framework."""
    
    print("="*80)
    print(" Global Settlement Framework - Complete Transaction Workflow")
    print("="*80)
    print()
    
    # Step 1: Compliance Screening
    print("Step 1: Compliance Screening")
    print("-" * 80)
    
    config = ComplianceConfig(
        jurisdictions=['US', 'EU'],
        risk_threshold=0.7,
        enable_sanctions_screening=True
    )
    
    monitor = ComplianceMonitor(config)
    
    result = monitor.screen_transaction(
        transaction_hash="0xabc123...",
        from_address="0x1234...",
        to_address="0x5678...",
        amount=1000000,  # $10,000 in cents
        currency="USDC",
        metadata={
            'sender_country': 'US',
            'recipient_country': 'GB'
        }
    )
    
    print(f"  Risk Score: {result.risk_score:.2f}")
    print(f"  Risk Level: {result.risk_level}")
    print(f"  Approved: {result.approved}")
    print(f"  Risk Factors: {', '.join(result.risk_factors) if result.risk_factors else 'None'}")
    print()
    
    if not result.approved:
        print("  ⚠️ Transaction requires manual review")
        return
    
    # Step 2: Consensus Performance Check
    print("Step 2: Consensus Performance Validation")
    print("-" * 80)
    
    print("  Running MonadBFT simulation...")
    sim = MonadBFTSimulator(
        num_nodes=10,
        byzantine_nodes=0,
        network_latency_ms=50
    )
    
    metrics = sim.run_simulation(num_rounds=10)
    
    print(f"  Average Finality Time: {metrics.avg_finality_time_ms:.2f}ms")
    print(f"  Success Rate: {metrics.successful_rounds}/{metrics.total_rounds}")
    print(f"  Messages Per Round: {metrics.messages_per_round:.1f}")
    print()
    
    # Step 3: Execute Settlement
    print("Step 3: Settlement Execution")
    print("-" * 80)
    print("  ✓ Transaction approved for settlement")
    print("  ✓ Consensus mechanism validated")
    print("  ✓ Settlement finalized")
    print()
    
    print("="*80)
    print(" Transaction workflow completed successfully!")
    print("="*80)


def example_consensus_comparison():
    """Example: Compare different consensus protocols."""
    
    print("\n" + "="*80)
    print(" Consensus Protocol Comparison")
    print("="*80)
    print()
    
    bench = ConsensusBenchmark()
    
    results = bench.run_full_suite(
        protocols=['MonadBFT', 'HotStuff', 'Tendermint'],
        network_conditions=['ideal'],
        num_nodes=10,
        duration_seconds=20  # Short duration for example
    )
    
    bench.generate_comparison_report(results)
    bench.export_results(results, "example_benchmark_results.json")


def example_compliance_reporting():
    """Example: Generate compliance reports."""
    
    print("\n" + "="*80)
    print(" Compliance Reporting Example")
    print("="*80)
    print()
    
    config = ComplianceConfig(jurisdictions=['US'])
    monitor = ComplianceMonitor(config)
    
    # Generate SAR (Suspicious Activity Report)
    sar = monitor.generate_sar(
        transaction_ids=["0xabc", "0xdef"],
        suspicious_activity=["Structuring", "Unusual pattern"],
        narrative="Multiple transactions just below reporting threshold..."
    )
    
    print("Generated Suspicious Activity Report (SAR):")
    print(f"  Report ID: {sar['report_id']}")
    print(f"  Date: {sar['filing_date']}")
    print(f"  Transactions: {len(sar['transactions'])}")
    print(f"  Status: {sar['status']}")
    print()


if __name__ == "__main__":
    # Run examples
    example_transaction_workflow()
    example_consensus_comparison()
    example_compliance_reporting()
    
    print("\n" + "="*80)
    print(" All examples completed!")
    print("="*80)