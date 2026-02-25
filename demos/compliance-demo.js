#!/usr/bin/env node

/**
 * Compliance Monitor Demo
 * 
 * Demonstrates compliance monitoring capabilities
 */

const TransactionScreener = require('../compliance-monitor/screening/transaction-screener');
const RiskEngine = require('../compliance-monitor/risk-engine/risk-scorer');
const ReportGenerator = require('../compliance-monitor/reporting/report-generator');

async function runComplianceDemo() {
  console.log('\n' + '='.repeat(60));
  console.log('Institutional Blockchain Compliance Monitor Demo');
  console.log('='.repeat(60) + '\n');
  
  // Initialize services
  const screener = new TransactionScreener();
  const riskEngine = new RiskEngine();
  const reportGenerator = new ReportGenerator();
  
  // Demo 1: Transaction Screening
  console.log('1. Transaction Screening');
  console.log('-'.repeat(60));
  
  const mockTransaction = {
    hash: '0x742d35cc6634c0532925a3b844bc9e7fe3d4b3c8fc1c3e4f5c6e7f8a9b0c1d2e',
    from: '0x1234567890123456789012345678901234567890',
    to: '0x0987654321098765432109876543210987654321',
    value: '150.5',
    gasPrice: '50',
    blockNumber: 18000000,
    timestamp: Date.now() / 1000,
    data: '0x'
  };
  
  console.log(`\nScreening transaction: ${mockTransaction.hash}`);
  console.log(`Value: ${mockTransaction.value} ETH`);
  
  const screeningResult = {
    txHash: mockTransaction.hash,
    chain: 'ethereum',
    transaction: mockTransaction,
    addresses: [
      { address: mockTransaction.from, sanctioned: false, highRisk: false, riskFactors: [], amlAlerts: [] },
      { address: mockTransaction.to, sanctioned: false, highRisk: false, riskFactors: [], amlAlerts: [] }
    ],
    sanctionsMatch: false,
    flags: [],
    amlAlerts: [],
    compliant: true
  };
  
  // Calculate risk score
  const riskScore = await riskEngine.calculateRiskScore(
    mockTransaction,
    screeningResult.addresses
  );
  
  console.log(`\nRisk Assessment:`);
  console.log(`  Score: ${(riskScore.score * 100).toFixed(2)}%`);
  console.log(`  Level: ${riskScore.level}`);
  console.log(`  Factors: ${riskScore.factors.length}`);
  
  if (riskScore.factors.length > 0) {
    console.log(`\n  Risk Factors:`);
    riskScore.factors.forEach(factor => {
      console.log(`    - ${factor.type}: ${factor.description}`);
    });
  }
  
  console.log(`\n  Recommendations:`);
  riskScore.recommendations.forEach(rec => {
    console.log(`    - ${rec}`);
  });
  
  // Demo 2: Sanctions Screening
  console.log('\n\n2. Sanctions Screening');
  console.log('-'.repeat(60));
  
  const testAddresses = [
    '0x1111111111111111111111111111111111111111',
    '0x2222222222222222222222222222222222222222',
    '0x3333333333333333333333333333333333333333'
  ];
  
  console.log(`\nScreening ${testAddresses.length} addresses...`);
  
  for (const address of testAddresses) {
    const sanctionsResult = await screener.screenSanctions(address, ['OFAC', 'EU']);
    console.log(`\n  ${address}:`);
    console.log(`    Match: ${sanctionsResult.match ? 'YES' : 'NO'}`);
    console.log(`    Lists checked: ${['OFAC', 'EU'].join(', ')}`);
  }
  
  // Demo 3: Regulatory Reporting
  console.log('\n\n3. Regulatory Reporting');
  console.log('-'.repeat(60));
  
  console.log('\nGenerating compliance reports...');
  
  const jurisdictions = ['US', 'EU'];
  
  for (const jurisdiction of jurisdictions) {
    console.log(`\n  ${jurisdiction} Regulatory Report:`);
    
    const report = await reportGenerator.generateReport({
      period: 'monthly',
      jurisdiction,
      format: 'json'
    });
    
    console.log(`    Status: ${report.executiveSummary.overallStatus}`);
    console.log(`    Total Transactions: ${report.detailedFindings.summary.totalTransactions}`);
    console.log(`    Flagged: ${report.detailedFindings.summary.flaggedTransactions}`);
    console.log(`    Compliance Rate: ${(report.detailedFindings.summary.complianceRate * 100).toFixed(2)}%`);
    console.log(`    Sanctions Matches: ${report.detailedFindings.sanctions.matches}`);
  }
  
  // Demo 4: Compliance Statistics
  console.log('\n\n4. Compliance Statistics');
  console.log('-'.repeat(60));
  
  const stats = await reportGenerator.getStatistics('monthly', 'US');
  
  console.log('\n  Monthly Statistics:');
  console.log(`    Total Transactions: ${stats.totalTransactions}`);
  console.log(`    Screened: ${stats.screenedTransactions}`);
  console.log(`    Flagged: ${stats.flaggedTransactions}`);
  console.log(`    Sanctions Matches: ${stats.sanctionsMatches}`);
  console.log(`    High Risk: ${stats.highRiskTransactions}`);
  console.log(`    Average Risk Score: ${stats.averageRiskScore}`);
  console.log(`    Compliance Rate: ${(parseFloat(stats.complianceRate) * 100).toFixed(2)}%`);
  
  console.log('\n' + '='.repeat(60));
  console.log('Compliance Demo Completed Successfully');
  console.log('='.repeat(60) + '\n');
}

if (require.main === module) {
  runComplianceDemo().catch(error => {
    console.error('Demo failed:', error);
    process.exit(1);
  });
}

module.exports = runComplianceDemo;
