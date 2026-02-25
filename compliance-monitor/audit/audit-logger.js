/**
 * Audit Trail Logger
 * 
 * Immutable audit logging for compliance events
 */

const { MongoClient } = require('mongodb');
const crypto = require('crypto');

class AuditLogger {
  constructor(config = {}) {
    this.mongoUrl = config.mongoUrl || process.env.MONGODB_URL;
    this.dbName = 'compliance';
    this.collectionName = 'audit_trail';
    this.client = null;
    this.collection = null;
  }
  
  /**
   * Initialize MongoDB connection
   */
  async connect() {
    if (this.client) return;
    
    try {
      this.client = new MongoClient(this.mongoUrl);
      await this.client.connect();
      const db = this.client.db(this.dbName);
      this.collection = db.collection(this.collectionName);
      
      // Create indexes
      await this.collection.createIndex({ timestamp: -1 });
      await this.collection.createIndex({ eventType: 1 });
      await this.collection.createIndex({ 'metadata.txHash': 1 });
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error.message);
      // Fallback to in-memory storage for development
      this.inMemoryStorage = [];
    }
  }
  
  /**
   * Log a compliance screening event
   */
  async logScreening(data) {
    return await this.log({
      eventType: 'TRANSACTION_SCREENING',
      metadata: data,
      severity: this.getSeverityFromRiskScore(data.riskScore)
    });
  }
  
  /**
   * Log a sanctions check
   */
  async logSanctionsCheck(data) {
    return await this.log({
      eventType: 'SANCTIONS_CHECK',
      metadata: data,
      severity: data.results.match ? 'HIGH' : 'INFO'
    });
  }
  
  /**
   * Log report generation
   */
  async logReportGeneration(data) {
    return await this.log({
      eventType: 'REPORT_GENERATION',
      metadata: data,
      severity: 'INFO'
    });
  }
  
  /**
   * Log a generic compliance event
   */
  async log(event) {
    await this.connect();
    
    const auditEntry = {
      _id: this.generateId(),
      eventType: event.eventType,
      timestamp: new Date(),
      severity: event.severity || 'INFO',
      metadata: event.metadata || {},
      hash: null // Will be calculated
    };
    
    // Calculate hash for immutability
    auditEntry.hash = this.calculateHash(auditEntry);
    
    try {
      if (this.collection) {
        await this.collection.insertOne(auditEntry);
      } else if (this.inMemoryStorage) {
        this.inMemoryStorage.push(auditEntry);
      }
      
      return auditEntry;
    } catch (error) {
      console.error('Failed to log audit entry:', error.message);
      throw error;
    }
  }
  
  /**
   * Query audit trail
   */
  async query(options = {}) {
    await this.connect();
    
    const {
      startDate,
      endDate,
      type,
      severity,
      page = 1,
      limit = 100
    } = options;
    
    const filter = {};
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = startDate;
      if (endDate) filter.timestamp.$lte = endDate;
    }
    
    if (type) {
      filter.eventType = type;
    }
    
    if (severity) {
      filter.severity = severity;
    }
    
    try {
      if (this.collection) {
        const total = await this.collection.countDocuments(filter);
        const records = await this.collection
          .find(filter)
          .sort({ timestamp: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .toArray();
        
        return {
          records,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        };
      } else if (this.inMemoryStorage) {
        // Filter in-memory storage
        let filtered = this.inMemoryStorage.filter(entry => {
          if (type && entry.eventType !== type) return false;
          if (severity && entry.severity !== severity) return false;
          if (startDate && entry.timestamp < startDate) return false;
          if (endDate && entry.timestamp > endDate) return false;
          return true;
        });
        
        filtered.sort((a, b) => b.timestamp - a.timestamp);
        
        const start = (page - 1) * limit;
        const end = start + limit;
        
        return {
          records: filtered.slice(start, end),
          pagination: {
            page,
            limit,
            total: filtered.length,
            pages: Math.ceil(filtered.length / limit)
          }
        };
      }
    } catch (error) {
      console.error('Failed to query audit trail:', error.message);
      throw error;
    }
  }
  
  /**
   * Verify audit trail integrity
   */
  async verifyIntegrity(entryId) {
    await this.connect();
    
    try {
      let entry;
      
      if (this.collection) {
        entry = await this.collection.findOne({ _id: entryId });
      } else if (this.inMemoryStorage) {
        entry = this.inMemoryStorage.find(e => e._id === entryId);
      }
      
      if (!entry) {
        return { valid: false, reason: 'Entry not found' };
      }
      
      const storedHash = entry.hash;
      const calculatedHash = this.calculateHash({
        ...entry,
        hash: null
      });
      
      return {
        valid: storedHash === calculatedHash,
        reason: storedHash === calculatedHash ? null : 'Hash mismatch'
      };
    } catch (error) {
      console.error('Failed to verify integrity:', error.message);
      throw error;
    }
  }
  
  /**
   * Close connection
   */
  async close() {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.collection = null;
    }
  }
  
  // Helper methods
  
  generateId() {
    return crypto.randomBytes(16).toString('hex');
  }
  
  calculateHash(entry) {
    const data = JSON.stringify({
      _id: entry._id,
      eventType: entry.eventType,
      timestamp: entry.timestamp,
      severity: entry.severity,
      metadata: entry.metadata
    });
    
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  
  getSeverityFromRiskScore(riskScore) {
    if (!riskScore || !riskScore.level) return 'INFO';
    
    switch (riskScore.level) {
      case 'CRITICAL':
        return 'CRITICAL';
      case 'HIGH':
        return 'HIGH';
      case 'MEDIUM':
        return 'MEDIUM';
      default:
        return 'INFO';
    }
  }
}

module.exports = AuditLogger;
