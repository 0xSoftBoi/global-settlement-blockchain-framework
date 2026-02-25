#!/usr/bin/env node

/**
 * Cross-Chain Testing Demo
 * 
 * Demonstrates cross-chain testing capabilities
 */

const CrossChainTester = require('../cross-chain-testing/src/cross-chain-tester');

async function runCrossChainDemo() {
  console.log('\n' + '='.repeat(60));
  console.log('Cross-Chain Testing Framework Demo');
  console.log('='.repeat(60) + '\n');
  
  const tester = new CrossChainTester();
  
  // Demo 1: Token Transfer Test
  console.log('1. Cross-Chain Token Transfer Test');
  console.log('-'.repeat(60));
  
  const transferResult = await tester.testTokenTransfer({
    sourceChain: 'ethereum',
    targetChain: 'polygon',
    token: 'USDC',
    amount: '1000',
    testMode: true
  });
  
  console.log(`\nResult: ${transferResult.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Total Time: ${transferResult.totalTime}ms`);
  
  if (transferResult.success) {
    console.log('\nPhases:');
    Object.entries(transferResult.phases).forEach(([phase, data]) => {
      console.log(`  ✓ ${phase}`);
      if (data.txHash) {
        console.log(`    TX: ${data.txHash.substring(0, 20)}...`);
      }
    });
  }
  
  // Demo 2: Multi-Chain Settlement
  console.log('\n\n2. Multi-Chain Settlement Test');
  console.log('-'.repeat(60));
  
  const settlementResult = await tester.testMultiChainSettlement({
    chains: ['ethereum', 'polygon', 'arbitrum'],
    transactions: 50
  });
  
  console.log(`\nResult: ${settlementResult.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`\nStatistics:`);
  console.log(`  Total: ${settlementResult.statistics.total}`);
  console.log(`  Successful: ${settlementResult.statistics.successful}`);
  console.log(`  Failed: ${settlementResult.statistics.failed}`);
  console.log(`  Success Rate: ${(settlementResult.statistics.successRate * 100).toFixed(2)}%`);
  console.log(`  Average Latency: ${settlementResult.statistics.averageLatency.toFixed(2)}ms`);
  
  // Demo 3: Bridge Security Test
  console.log('\n\n3. Bridge Security Test');
  console.log('-'.repeat(60));
  
  const securityResult = await tester.testBridgeSecurity({
    bridge: 'ethereum-polygon-bridge'
  });
  
  console.log(`\nResult: ${securityResult.success ? 'SECURE' : 'VULNERABILITIES FOUND'}`);
  console.log(`\nTest Cases: ${securityResult.testCases.length}`);
  console.log(`Passed: ${securityResult.testCases.filter(t => t.passed).length}`);
  console.log(`Failed: ${securityResult.testCases.filter(t => !t.passed).length}`);
  
  if (securityResult.vulnerabilities.length > 0) {
    console.log(`\nVulnerabilities:`);
    securityResult.vulnerabilities.forEach(vuln => {
      console.log(`  - ${vuln.type} (${vuln.severity})`);
      console.log(`    ${vuln.description}`);
    });
  } else {
    console.log(`\n✓ No vulnerabilities detected`);
  }
  
  // Demo 4: Interoperability Test
  console.log('\n\n4. Consensus Interoperability Test');
  console.log('-'.repeat(60));
  
  const interopResult = await tester.testInteroperability({
    mechanisms: ['hotstuff', 'pbft', 'raft']
  });
  
  console.log(`\nResult: ${interopResult.success ? 'COMPATIBLE' : 'ISSUES FOUND'}`);
  console.log(`\nCompatibility Tests:`);
  
  interopResult.tests.forEach(test => {
    const status = test.compatible ? '✓' : '✗';
    console.log(`  ${status} ${test.mechanism1} <-> ${test.mechanism2}`);
    console.log(`    Latency Overhead: ${test.latencyOverhead.toFixed(2)}ms`);
    console.log(`    Throughput Impact: ${test.throughputImpact.toFixed(2)}%`);
  });
  
  // Demo 5: Performance Benchmark
  console.log('\n\n5. Performance Benchmark');
  console.log('-'.repeat(60));
  
  console.log('\nRunning 10-second performance test...');
  
  const perfResult = await tester.benchmarkPerformance({
    chains: ['ethereum', 'polygon'],
    duration: 10000, // 10 seconds
    tpsTarget: 100
  });
  
  console.log(`\nResult: ${perfResult.success ? 'TARGET MET' : 'BELOW TARGET'}`);
  console.log(`\nPerformance Metrics:`);
  console.log(`  Total Transactions: ${perfResult.metrics.totalTransactions}`);
  console.log(`  Duration: ${(perfResult.metrics.duration / 1000).toFixed(2)}s`);
  console.log(`  TPS: ${parseFloat(perfResult.metrics.tps).toFixed(2)}`);
  console.log(`  Average Latency: ${perfResult.metrics.averageLatency.toFixed(2)}ms`);
  console.log(`  P95 Latency: ${perfResult.metrics.p95Latency.toFixed(2)}ms`);
  console.log(`  P99 Latency: ${perfResult.metrics.p99Latency.toFixed(2)}ms`);
  console.log(`  Success Rate: ${(perfResult.metrics.successRate * 100).toFixed(2)}%`);
  
  // Demo 6: Failure Scenarios
  console.log('\n\n6. Failure Scenario Testing');
  console.log('-'.repeat(60));
  
  const failureResult = await tester.testFailureScenarios({
    scenarios: ['network_partition', 'node_failure', 'high_latency']
  });
  
  console.log(`\nResult: ${failureResult.success ? 'RESILIENT' : 'RECOVERY ISSUES'}`);
  console.log(`\nScenarios Tested:`);
  
  failureResult.scenarios.forEach(scenario => {
    const status = scenario.recovered ? '✓' : '✗';
    console.log(`  ${status} ${scenario.scenario}`);
    if (scenario.recovered) {
      console.log(`    Recovery Time: ${scenario.recoveryTime.toFixed(2)}ms`);
    }
  });
  
  // Generate comprehensive report
  console.log('\n\n7. Test Report Summary');
  console.log('-'.repeat(60));
  
  const report = tester.generateReport();
  
  console.log(`\nOverall Results:`);
  console.log(`  Total Tests: ${report.totalTests}`);
  console.log(`  Passed: ${report.passed}`);
  console.log(`  Failed: ${report.failed}`);
  console.log(`  Success Rate: ${(report.successRate * 100).toFixed(2)}%`);
  
  console.log('\n' + '='.repeat(60));
  console.log('Cross-Chain Testing Demo Completed');
  console.log('='.repeat(60) + '\n');
}

if (require.main === module) {
  runCrossChainDemo().catch(error => {
    console.error('Demo failed:', error);
    process.exit(1);
  });
}

module.exports = runCrossChainDemo;
