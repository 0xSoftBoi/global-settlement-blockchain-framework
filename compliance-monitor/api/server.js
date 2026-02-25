/**
 * Compliance Monitoring API Server
 * 
 * REST API for institutional blockchain compliance monitoring
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const winston = require('winston');

const TransactionScreener = require('../screening/transaction-screener');
const RiskEngine = require('../risk-engine/risk-scorer');
const AuditLogger = require('../audit/audit-logger');
const ReportGenerator = require('../reporting/report-generator');

// Logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Initialize app
const app = express();
const port = process.env.PORT || 3000;

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));

// Rate limiting middleware
app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (error) {
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.round(error.msBeforeNext / 1000)
    });
  }
});

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Initialize services
const transactionScreener = new TransactionScreener();
const riskEngine = new RiskEngine();
const auditLogger = new AuditLogger();
const reportGenerator = new ReportGenerator();

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ==================== TRANSACTION SCREENING ====================

/**
 * Screen a blockchain transaction for compliance
 * POST /api/v1/compliance/screen
 */
app.post('/api/v1/compliance/screen', async (req, res) => {
  try {
    const { txHash, chain, jurisdiction } = req.body;
    
    if (!txHash || !chain) {
      return res.status(400).json({
        error: 'Missing required fields: txHash and chain'
      });
    }
    
    logger.info(`Screening transaction: ${txHash} on ${chain}`);
    
    // Screen transaction
    const screeningResult = await transactionScreener.screenTransaction(
      txHash, 
      chain,
      jurisdiction || 'US'
    );
    
    // Calculate risk score
    const riskScore = await riskEngine.calculateRiskScore(
      screeningResult.transaction,
      screeningResult.addresses
    );
    
    // Log to audit trail
    await auditLogger.logScreening({
      txHash,
      chain,
      jurisdiction,
      riskScore,
      result: screeningResult,
      timestamp: new Date()
    });
    
    res.json({
      txHash,
      chain,
      riskScore: riskScore.score,
      riskLevel: riskScore.level,
      flags: screeningResult.flags,
      sanctionsMatch: screeningResult.sanctionsMatch,
      amlAlerts: screeningResult.amlAlerts,
      compliance: screeningResult.compliant,
      details: screeningResult,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Transaction screening failed', { error: error.message });
    res.status(500).json({
      error: 'Screening failed',
      message: error.message
    });
  }
});

/**
 * Batch screen multiple transactions
 * POST /api/v1/compliance/screen/batch
 */
app.post('/api/v1/compliance/screen/batch', async (req, res) => {
  try {
    const { transactions, chain, jurisdiction } = req.body;
    
    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({
        error: 'transactions must be an array'
      });
    }
    
    logger.info(`Batch screening ${transactions.length} transactions`);
    
    const results = await Promise.all(
      transactions.map(txHash => 
        transactionScreener.screenTransaction(txHash, chain, jurisdiction)
      )
    );
    
    const summary = {
      total: results.length,
      compliant: results.filter(r => r.compliant).length,
      flagged: results.filter(r => r.flags.length > 0).length,
      highRisk: results.filter(r => r.riskLevel === 'HIGH').length
    };
    
    res.json({
      summary,
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Batch screening failed', { error: error.message });
    res.status(500).json({
      error: 'Batch screening failed',
      message: error.message
    });
  }
});

// ==================== SANCTIONS SCREENING ====================

/**
 * Screen address against sanctions lists
 * POST /api/v1/compliance/sanctions/screen
 */
app.post('/api/v1/compliance/sanctions/screen', async (req, res) => {
  try {
    const { address, lists } = req.body;
    
    if (!address) {
      return res.status(400).json({
        error: 'address is required'
      });
    }
    
    const sanctionLists = lists || ['OFAC', 'EU', 'UN'];
    
    const results = await transactionScreener.screenSanctions(
      address,
      sanctionLists
    );
    
    await auditLogger.logSanctionsCheck({
      address,
      lists: sanctionLists,
      results,
      timestamp: new Date()
    });
    
    res.json({
      address,
      match: results.match,
      lists: results.matchedLists,
      details: results.details,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Sanctions screening failed', { error: error.message });
    res.status(500).json({
      error: 'Sanctions screening failed',
      message: error.message
    });
  }
});

// ==================== RISK SCORING ====================

/**
 * Calculate risk score for an address
 * POST /api/v1/compliance/risk/score
 */
app.post('/api/v1/compliance/risk/score', async (req, res) => {
  try {
    const { address, chain, transactionHistory } = req.body;
    
    if (!address) {
      return res.status(400).json({
        error: 'address is required'
      });
    }
    
    const riskScore = await riskEngine.scoreAddress(
      address,
      chain,
      transactionHistory
    );
    
    res.json({
      address,
      riskScore: riskScore.score,
      riskLevel: riskScore.level,
      factors: riskScore.factors,
      recommendations: riskScore.recommendations,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Risk scoring failed', { error: error.message });
    res.status(500).json({
      error: 'Risk scoring failed',
      message: error.message
    });
  }
});

// ==================== REGULATORY REPORTING ====================

/**
 * Generate regulatory report
 * GET /api/v1/compliance/report
 */
app.get('/api/v1/compliance/report', async (req, res) => {
  try {
    const { period, jurisdiction, format } = req.query;
    
    if (!period || !jurisdiction) {
      return res.status(400).json({
        error: 'period and jurisdiction are required'
      });
    }
    
    logger.info(`Generating ${jurisdiction} report for period: ${period}`);
    
    const report = await reportGenerator.generateReport({
      period,
      jurisdiction,
      format: format || 'json'
    });
    
    await auditLogger.logReportGeneration({
      period,
      jurisdiction,
      format,
      timestamp: new Date()
    });
    
    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="report-${period}.pdf"`);
      res.send(report);
    } else {
      res.json(report);
    }
    
  } catch (error) {
    logger.error('Report generation failed', { error: error.message });
    res.status(500).json({
      error: 'Report generation failed',
      message: error.message
    });
  }
});

/**
 * Get compliance statistics
 * GET /api/v1/compliance/stats
 */
app.get('/api/v1/compliance/stats', async (req, res) => {
  try {
    const { period, jurisdiction } = req.query;
    
    const stats = await reportGenerator.getStatistics(period, jurisdiction);
    
    res.json({
      period: period || 'all-time',
      jurisdiction: jurisdiction || 'all',
      statistics: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Failed to retrieve statistics', { error: error.message });
    res.status(500).json({
      error: 'Failed to retrieve statistics',
      message: error.message
    });
  }
});

// ==================== SMART CONTRACT VALIDATION ====================

/**
 * Validate smart contract compliance
 * POST /api/v1/compliance/contract/validate
 */
app.post('/api/v1/compliance/contract/validate', async (req, res) => {
  try {
    const { address, chain, framework } = req.body;
    
    if (!address || !chain) {
      return res.status(400).json({
        error: 'address and chain are required'
      });
    }
    
    // Import validator
    const ContractValidator = require('../validators/contract-validator');
    const validator = new ContractValidator();
    
    const validation = await validator.validate(
      address,
      chain,
      framework || ['ISO20022', 'Wolfsberg']
    );
    
    res.json({
      address,
      chain,
      compliant: validation.compliant,
      frameworks: validation.frameworks,
      issues: validation.issues,
      recommendations: validation.recommendations,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Contract validation failed', { error: error.message });
    res.status(500).json({
      error: 'Contract validation failed',
      message: error.message
    });
  }
});

// ==================== AUDIT TRAIL ====================

/**
 * Query audit trail
 * GET /api/v1/compliance/audit
 */
app.get('/api/v1/compliance/audit', async (req, res) => {
  try {
    const { startDate, endDate, type, page, limit } = req.query;
    
    const auditRecords = await auditLogger.query({
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      type,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 100
    });
    
    res.json({
      records: auditRecords.records,
      pagination: auditRecords.pagination,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Audit trail query failed', { error: error.message });
    res.status(500).json({
      error: 'Audit trail query failed',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path
  });
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// Start server
if (require.main === module) {
  app.listen(port, () => {
    logger.info(`Compliance API server started on port ${port}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`API Documentation: http://localhost:${port}/docs`);
  });
}

module.exports = app;
