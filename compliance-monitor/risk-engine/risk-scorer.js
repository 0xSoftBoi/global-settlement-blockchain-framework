/**
 * Risk Scoring Engine
 * 
 * AI-powered risk scoring for blockchain transactions and addresses
 */

class RiskEngine {
  constructor(config = {}) {
    this.weights = {
      sanctions: 1.0,
      highRiskCountry: 0.7,
      suspiciousPattern: 0.6,
      largeValue: 0.5,
      newAddress: 0.3,
      highFrequency: 0.4,
      mixerInteraction: 0.8,
      darknetMarket: 0.9
    };
    
    this.thresholds = {
      low: 0.3,
      medium: 0.6,
      high: 0.8,
      critical: 0.95
    };
  }
  
  /**
   * Calculate comprehensive risk score for a transaction
   */
  async calculateRiskScore(transaction, addresses) {
    const factors = [];
    let totalScore = 0;
    
    // Check address risk factors
    for (const addressInfo of addresses) {
      if (addressInfo.sanctioned) {
        factors.push({
          type: 'SANCTIONS',
          weight: this.weights.sanctions,
          description: 'Address on sanctions list'
        });
        totalScore += this.weights.sanctions;
      }
      
      if (addressInfo.highRisk) {
        factors.push({
          type: 'HIGH_RISK_ADDRESS',
          weight: this.weights.highRiskCountry,
          description: 'Address associated with high-risk activity'
        });
        totalScore += this.weights.highRiskCountry;
      }
    }
    
    // Analyze transaction value
    const value = parseFloat(transaction.value);
    if (value > 100) {
      const valueScore = Math.min(value / 1000, 1) * this.weights.largeValue;
      factors.push({
        type: 'LARGE_VALUE',
        weight: valueScore,
        description: `Large transaction value: ${value} ETH`
      });
      totalScore += valueScore;
    }
    
    // Check for suspicious patterns
    // (In production, this would use ML models)
    const patternScore = this.detectSuspiciousPatterns(transaction);
    if (patternScore > 0) {
      factors.push({
        type: 'SUSPICIOUS_PATTERN',
        weight: patternScore,
        description: 'Transaction exhibits suspicious patterns'
      });
      totalScore += patternScore;
    }
    
    // Normalize score to 0-1 range
    const normalizedScore = Math.min(totalScore, 1.0);
    
    return {
      score: normalizedScore,
      level: this.getRiskLevel(normalizedScore),
      factors,
      recommendations: this.generateRecommendations(normalizedScore, factors)
    };
  }
  
  /**
   * Score an address based on historical behavior
   */
  async scoreAddress(address, chain, transactionHistory = []) {
    const factors = [];
    let totalScore = 0;
    
    // Check if address is new
    if (transactionHistory.length < 10) {
      factors.push({
        type: 'NEW_ADDRESS',
        weight: this.weights.newAddress,
        description: 'Address has limited transaction history'
      });
      totalScore += this.weights.newAddress;
    }
    
    // Check transaction frequency
    if (transactionHistory.length > 100) {
      const avgTimeBetween = this.calculateAverageTimeBetween(transactionHistory);
      if (avgTimeBetween < 60) { // Less than 1 minute
        factors.push({
          type: 'HIGH_FREQUENCY',
          weight: this.weights.highFrequency,
          description: 'High frequency trading detected'
        });
        totalScore += this.weights.highFrequency;
      }
    }
    
    // Check for mixer/tumbler interactions
    // (Simplified - would check against known mixer addresses)
    const mixerInteractions = transactionHistory.filter(
      tx => this.isKnownMixer(tx.to)
    ).length;
    
    if (mixerInteractions > 0) {
      const mixerScore = Math.min(mixerInteractions / 10, 1) * this.weights.mixerInteraction;
      factors.push({
        type: 'MIXER_INTERACTION',
        weight: mixerScore,
        description: `Interactions with mixing services: ${mixerInteractions}`
      });
      totalScore += mixerScore;
    }
    
    const normalizedScore = Math.min(totalScore, 1.0);
    
    return {
      address,
      chain,
      score: normalizedScore,
      level: this.getRiskLevel(normalizedScore),
      factors,
      recommendations: this.generateRecommendations(normalizedScore, factors)
    };
  }
  
  /**
   * Detect suspicious transaction patterns
   */
  detectSuspiciousPatterns(transaction) {
    let score = 0;
    
    // Check for round numbers (potential structuring)
    const value = parseFloat(transaction.value);
    if (this.isRoundNumber(value)) {
      score += 0.2;
    }
    
    // Check for unusual gas price (potential front-running)
    if (transaction.gasPrice) {
      const gasPrice = parseFloat(transaction.gasPrice);
      if (gasPrice > 500) { // > 500 gwei
        score += 0.3;
      }
    }
    
    // Check transaction data for suspicious patterns
    if (transaction.data && transaction.data !== '0x') {
      // Complex contract interaction
      if (transaction.data.length > 1000) {
        score += 0.1;
      }
    }
    
    return Math.min(score * this.weights.suspiciousPattern, this.weights.suspiciousPattern);
  }
  
  /**
   * Get risk level from score
   */
  getRiskLevel(score) {
    if (score >= this.thresholds.critical) return 'CRITICAL';
    if (score >= this.thresholds.high) return 'HIGH';
    if (score >= this.thresholds.medium) return 'MEDIUM';
    return 'LOW';
  }
  
  /**
   * Generate recommendations based on risk factors
   */
  generateRecommendations(score, factors) {
    const recommendations = [];
    
    if (score >= this.thresholds.critical) {
      recommendations.push('BLOCK_TRANSACTION');
      recommendations.push('IMMEDIATE_REVIEW');
      recommendations.push('REPORT_TO_AUTHORITIES');
    } else if (score >= this.thresholds.high) {
      recommendations.push('ENHANCED_DUE_DILIGENCE');
      recommendations.push('MANUAL_REVIEW');
      recommendations.push('MONITOR_CLOSELY');
    } else if (score >= this.thresholds.medium) {
      recommendations.push('STANDARD_DUE_DILIGENCE');
      recommendations.push('PERIODIC_REVIEW');
    } else {
      recommendations.push('PROCEED');
      recommendations.push('ROUTINE_MONITORING');
    }
    
    // Add specific recommendations based on factors
    factors.forEach(factor => {
      if (factor.type === 'SANCTIONS') {
        recommendations.push('VERIFY_SANCTIONS_LIST');
      }
      if (factor.type === 'MIXER_INTERACTION') {
        recommendations.push('INVESTIGATE_FUND_SOURCE');
      }
    });
    
    return [...new Set(recommendations)]; // Remove duplicates
  }
  
  // Helper methods
  
  isRoundNumber(value) {
    return value % 10 === 0 || value % 100 === 0 || value % 1000 === 0;
  }
  
  isKnownMixer(address) {
    // Simplified - would check against actual mixer address database
    const knownMixers = [
      '0x0000000000000000000000000000000000000000', // Placeholder
    ];
    return knownMixers.includes(address?.toLowerCase());
  }
  
  calculateAverageTimeBetween(transactions) {
    if (transactions.length < 2) return Infinity;
    
    const timestamps = transactions
      .map(tx => tx.timestamp)
      .filter(t => t)
      .sort((a, b) => a - b);
    
    let totalDiff = 0;
    for (let i = 1; i < timestamps.length; i++) {
      totalDiff += timestamps[i] - timestamps[i - 1];
    }
    
    return totalDiff / (timestamps.length - 1) / 1000; // Convert to seconds
  }
}

module.exports = RiskEngine;
