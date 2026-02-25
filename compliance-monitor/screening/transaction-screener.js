/**
 * Transaction Screening Service
 * 
 * Screens blockchain transactions for AML/KYC compliance
 */

const { ethers } = require('ethers');
const axios = require('axios');

class TransactionScreener {
  constructor(config = {}) {
    this.ofacApiKey = config.ofacApiKey || process.env.OFAC_API_KEY;
    this.chainalysisApiKey = config.chainalysisApiKey || process.env.CHAINALYSIS_API_KEY;
    this.ellipticApiKey = config.ellipticApiKey || process.env.ELLIPTIC_API_KEY;
    
    // RPC endpoints
    this.rpcEndpoints = {
      ethereum: process.env.ETHEREUM_RPC,
      polygon: process.env.POLYGON_RPC,
      arbitrum: process.env.ARBITRUM_RPC,
      optimism: process.env.OPTIMISM_RPC,
      base: process.env.BASE_RPC
    };
    
    // Sanctions lists cache
    this.sanctionsCache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }
  
  /**
   * Screen a transaction for compliance
   */
  async screenTransaction(txHash, chain, jurisdiction = 'US') {
    // Get transaction details
    const transaction = await this.getTransactionDetails(txHash, chain);
    
    if (!transaction) {
      throw new Error(`Transaction ${txHash} not found on ${chain}`);
    }
    
    // Extract addresses
    const addresses = [
      transaction.from,
      transaction.to
    ].filter(Boolean);
    
    // Screen all addresses
    const addressScreening = await Promise.all(
      addresses.map(addr => this.screenAddress(addr, jurisdiction))
    );
    
    // Analyze transaction patterns
    const patternAnalysis = await this.analyzeTransactionPattern(transaction);
    
    // Check travel rule compliance
    const travelRuleCheck = this.checkTravelRule(transaction, jurisdiction);
    
    // Aggregate results
    const flags = [];
    const amlAlerts = [];
    let sanctionsMatch = false;
    
    addressScreening.forEach((result, idx) => {
      if (result.sanctioned) {
        sanctionsMatch = true;
        flags.push({
          type: 'SANCTIONS',
          address: addresses[idx],
          details: result.details
        });
      }
      
      if (result.highRisk) {
        flags.push({
          type: 'HIGH_RISK',
          address: addresses[idx],
          riskFactors: result.riskFactors
        });
      }
      
      amlAlerts.push(...result.amlAlerts);
    });
    
    if (patternAnalysis.suspicious) {
      flags.push({
        type: 'SUSPICIOUS_PATTERN',
        patterns: patternAnalysis.patterns
      });
    }
    
    if (!travelRuleCheck.compliant) {
      flags.push({
        type: 'TRAVEL_RULE_VIOLATION',
        details: travelRuleCheck.details
      });
    }
    
    return {
      txHash,
      chain,
      transaction,
      addresses: addressScreening,
      sanctionsMatch,
      flags,
      amlAlerts,
      patternAnalysis,
      travelRuleCompliance: travelRuleCheck.compliant,
      compliant: flags.length === 0,
      riskLevel: this.calculateRiskLevel(flags, amlAlerts),
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Get transaction details from blockchain
   */
  async getTransactionDetails(txHash, chain) {
    try {
      const rpcUrl = this.rpcEndpoints[chain.toLowerCase()];
      if (!rpcUrl) {
        throw new Error(`Unsupported chain: ${chain}`);
      }
      
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const tx = await provider.getTransaction(txHash);
      
      if (!tx) {
        return null;
      }
      
      const receipt = await provider.getTransactionReceipt(txHash);
      
      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: ethers.formatEther(tx.value),
        gasPrice: tx.gasPrice ? ethers.formatUnits(tx.gasPrice, 'gwei') : null,
        blockNumber: tx.blockNumber,
        timestamp: receipt ? await this.getBlockTimestamp(provider, tx.blockNumber) : null,
        status: receipt ? receipt.status : null,
        data: tx.data
      };
    } catch (error) {
      throw new Error(`Failed to fetch transaction: ${error.message}`);
    }
  }
  
  async getBlockTimestamp(provider, blockNumber) {
    const block = await provider.getBlock(blockNumber);
    return block ? block.timestamp : null;
  }
  
  /**
   * Screen an address against various databases
   */
  async screenAddress(address, jurisdiction) {
    const results = {
      address,
      sanctioned: false,
      highRisk: false,
      riskFactors: [],
      amlAlerts: [],
      details: {}
    };
    
    // OFAC screening
    const ofacResult = await this.screenOFAC(address);
    if (ofacResult.match) {
      results.sanctioned = true;
      results.details.ofac = ofacResult;
    }
    
    // EU sanctions screening (if applicable)
    if (jurisdiction === 'EU') {
      const euResult = await this.screenEUSanctions(address);
      if (euResult.match) {
        results.sanctioned = true;
        results.details.eu = euResult;
      }
    }
    
    // Chainalysis screening (if API available)
    if (this.chainalysisApiKey) {
      const chainalysisResult = await this.screenChainalysis(address);
      if (chainalysisResult.risk > 0.7) {
        results.highRisk = true;
        results.riskFactors.push(...chainalysisResult.factors);
      }
    }
    
    return results;
  }
  
  /**
   * Screen against OFAC sanctions list
   */
  async screenOFAC(address) {
    // Check cache first
    const cached = this.sanctionsCache.get(`ofac-${address}`);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.result;
    }
    
    // Simulate OFAC screening
    // In production, this would call the actual OFAC API
    const result = {
      match: false,
      source: 'OFAC',
      details: null
    };
    
    // Cache result
    this.sanctionsCache.set(`ofac-${address}`, {
      result,
      timestamp: Date.now()
    });
    
    return result;
  }
  
  /**
   * Screen against EU sanctions list
   */
  async screenEUSanctions(address) {
    const cached = this.sanctionsCache.get(`eu-${address}`);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.result;
    }
    
    // Simulate EU sanctions screening
    const result = {
      match: false,
      source: 'EU',
      details: null
    };
    
    this.sanctionsCache.set(`eu-${address}`, {
      result,
      timestamp: Date.now()
    });
    
    return result;
  }
  
  /**
   * Screen using Chainalysis
   */
  async screenChainalysis(address) {
    if (!this.chainalysisApiKey) {
      return { risk: 0, factors: [] };
    }
    
    // Simulate Chainalysis screening
    // In production, this would call the Chainalysis API
    return {
      risk: Math.random() * 0.5, // Random risk score 0-0.5
      factors: []
    };
  }
  
  /**
   * Analyze transaction patterns for suspicious activity
   */
  async analyzeTransactionPattern(transaction) {
    const patterns = [];
    let suspicious = false;
    
    // Check for large value transactions
    const value = parseFloat(transaction.value);
    if (value > 100) { // > 100 ETH
      patterns.push({
        type: 'LARGE_VALUE',
        value,
        threshold: 100
      });
    }
    
    // Check for structured transactions (potential structuring)
    // This would require historical data analysis
    
    // Check for unusual gas prices (potential front-running)
    if (transaction.gasPrice) {
      const gasPrice = parseFloat(transaction.gasPrice);
      if (gasPrice > 500) { // > 500 gwei
        patterns.push({
          type: 'HIGH_GAS_PRICE',
          gasPrice,
          threshold: 500
        });
      }
    }
    
    suspicious = patterns.length > 0;
    
    return {
      suspicious,
      patterns,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Check Travel Rule compliance
   */
  checkTravelRule(transaction, jurisdiction) {
    const value = parseFloat(transaction.value);
    const threshold = jurisdiction === 'US' ? 3000 : 1000; // USD equivalent
    
    // Simplified check - in production would check for actual compliance data
    const requiresCompliance = value > threshold;
    const hasCompliance = false; // Would check for actual VASP data exchange
    
    return {
      compliant: !requiresCompliance || hasCompliance,
      required: requiresCompliance,
      threshold,
      details: requiresCompliance && !hasCompliance
        ? `Transaction exceeds ${threshold} USD threshold, requires Travel Rule compliance`
        : null
    };
  }
  
  /**
   * Screen sanctions lists
   */
  async screenSanctions(address, lists = ['OFAC', 'EU', 'UN']) {
    const results = {
      match: false,
      matchedLists: [],
      details: {}
    };
    
    for (const list of lists) {
      let listResult;
      
      switch (list) {
        case 'OFAC':
          listResult = await this.screenOFAC(address);
          break;
        case 'EU':
          listResult = await this.screenEUSanctions(address);
          break;
        case 'UN':
          // Implement UN sanctions screening
          listResult = { match: false };
          break;
        default:
          continue;
      }
      
      if (listResult.match) {
        results.match = true;
        results.matchedLists.push(list);
        results.details[list] = listResult.details;
      }
    }
    
    return results;
  }
  
  /**
   * Calculate overall risk level
   */
  calculateRiskLevel(flags, amlAlerts) {
    if (flags.some(f => f.type === 'SANCTIONS')) {
      return 'CRITICAL';
    }
    
    if (flags.length >= 3 || amlAlerts.length >= 5) {
      return 'HIGH';
    }
    
    if (flags.length >= 1 || amlAlerts.length >= 2) {
      return 'MEDIUM';
    }
    
    return 'LOW';
  }
}

module.exports = TransactionScreener;
