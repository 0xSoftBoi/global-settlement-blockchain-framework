# API Reference

## Compliance Monitor API

### Base URL

```
http://localhost:3000/api/v1
```

### Authentication

Currently in development mode. Production will require:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### Endpoints

#### Health Check

```http
GET /health
```

Returns service health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-25T14:30:00Z",
  "version": "1.0.0"
}
```

---

#### Screen Transaction

```http
POST /api/v1/compliance/screen
Content-Type: application/json
```

Screen a blockchain transaction for compliance.

**Request Body:**
```json
{
  "txHash": "0x742d35cc6634c0532925a3b844bc9e7fe3d4b3c8...",
  "chain": "ethereum",
  "jurisdiction": "US"
}
```

**Response:**
```json
{
  "txHash": "0x742d35cc...",
  "chain": "ethereum",
  "riskScore": 0.25,
  "riskLevel": "LOW",
  "flags": [],
  "sanctionsMatch": false,
  "amlAlerts": [],
  "compliance": true,
  "timestamp": "2026-02-25T14:30:00Z"
}
```

---

#### Batch Screen

```http
POST /api/v1/compliance/screen/batch
Content-Type: application/json
```

Screen multiple transactions at once.

**Request Body:**
```json
{
  "transactions": ["0x123...", "0x456..."],
  "chain": "ethereum",
  "jurisdiction": "US"
}
```

**Response:**
```json
{
  "summary": {
    "total": 2,
    "compliant": 2,
    "flagged": 0,
    "highRisk": 0
  },
  "results": [...]
}
```

---

#### Sanctions Screening

```http
POST /api/v1/compliance/sanctions/screen
Content-Type: application/json
```

**Request Body:**
```json
{
  "address": "0x1234567890...",
  "lists": ["OFAC", "EU", "UN"]
}
```

**Response:**
```json
{
  "address": "0x1234567890...",
  "match": false,
  "lists": [],
  "details": {},
  "timestamp": "2026-02-25T14:30:00Z"
}
```

---

#### Risk Scoring

```http
POST /api/v1/compliance/risk/score
Content-Type: application/json
```

**Request Body:**
```json
{
  "address": "0x1234567890...",
  "chain": "ethereum",
  "transactionHistory": []
}
```

**Response:**
```json
{
  "address": "0x1234567890...",
  "riskScore": 0.35,
  "riskLevel": "MEDIUM",
  "factors": [
    {
      "type": "NEW_ADDRESS",
      "weight": 0.3,
      "description": "Address has limited transaction history"
    }
  ],
  "recommendations": ["STANDARD_DUE_DILIGENCE"]
}
```

---

#### Generate Report

```http
GET /api/v1/compliance/report?period=monthly&jurisdiction=US&format=json
```

**Query Parameters:**
- `period`: daily, weekly, monthly, quarterly, yearly
- `jurisdiction`: US, EU, UK, etc.
- `format`: json, pdf, csv

**Response:**
```json
{
  "metadata": {
    "reportType": "Blockchain Compliance Report",
    "jurisdiction": "US",
    "period": "monthly",
    "generatedAt": "2026-02-25T14:30:00Z"
  },
  "executiveSummary": {...},
  "detailedFindings": {...}
}
```

---

#### Get Statistics

```http
GET /api/v1/compliance/stats?period=monthly&jurisdiction=US
```

**Response:**
```json
{
  "period": "monthly",
  "jurisdiction": "US",
  "statistics": {
    "totalTransactions": 45000,
    "screenedTransactions": 45000,
    "flaggedTransactions": 450,
    "sanctionsMatches": 2,
    "highRiskTransactions": 150,
    "averageRiskScore": "0.234",
    "complianceRate": "0.9800"
  }
}
```

---

#### Validate Smart Contract

```http
POST /api/v1/compliance/contract/validate
Content-Type: application/json
```

**Request Body:**
```json
{
  "address": "0xcontract...",
  "chain": "ethereum",
  "framework": ["ISO20022", "Wolfsberg"]
}
```

**Response:**
```json
{
  "address": "0xcontract...",
  "chain": "ethereum",
  "compliant": true,
  "frameworks": [
    {"name": "ISO20022", "status": "COMPLIANT"},
    {"name": "Wolfsberg", "status": "COMPLIANT"}
  ],
  "issues": [],
  "recommendations": []
}
```

---

#### Query Audit Trail

```http
GET /api/v1/compliance/audit?startDate=2026-01-01&type=TRANSACTION_SCREENING&page=1&limit=50
```

**Query Parameters:**
- `startDate`: ISO 8601 date
- `endDate`: ISO 8601 date
- `type`: Event type filter
- `page`: Page number
- `limit`: Results per page (max 100)

**Response:**
```json
{
  "records": [
    {
      "_id": "abc123...",
      "eventType": "TRANSACTION_SCREENING",
      "timestamp": "2026-02-25T14:30:00Z",
      "severity": "INFO",
      "metadata": {...},
      "hash": "sha256hash..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1000,
    "pages": 20
  }
}
```

---

## Cross-Chain Testing API

The Cross-Chain Testing Framework primarily uses programmatic APIs through JavaScript/TypeScript.

### JavaScript API

```javascript
const CrossChainTester = require('./cross-chain-testing/src/cross-chain-tester');

const tester = new CrossChainTester({
  // Configuration
});
```

#### Test Token Transfer

```javascript
const result = await tester.testTokenTransfer({
  sourceChain: 'ethereum',
  targetChain: 'polygon',
  token: 'USDC',
  amount: '1000',
  testMode: true
});

// Result structure
{
  test: 'token_transfer',
  success: true,
  phases: {
    lock: {...},
    verifyLock: {...},
    mint: {...},
    verifyMint: {...},
    finalitySource: {...},
    finalityTarget: {...}
  },
  totalTime: 5432
}
```

#### Test Multi-Chain Settlement

```javascript
const result = await tester.testMultiChainSettlement({
  chains: ['ethereum', 'polygon', 'arbitrum'],
  transactions: 100
});

// Result structure
{
  test: 'multi_chain_settlement',
  success: true,
  transactions: [...],
  statistics: {
    total: 100,
    successful: 98,
    failed: 2,
    successRate: 0.98,
    averageLatency: 1234
  }
}
```

#### Test Bridge Security

```javascript
const result = await tester.testBridgeSecurity({
  bridge: 'ethereum-polygon-bridge',
  testCases: [
    'reentrancy_attack',
    'double_spending',
    'unauthorized_mint'
  ]
});

// Result structure
{
  test: 'bridge_security',
  bridge: 'ethereum-polygon-bridge',
  testCases: [...],
  vulnerabilities: [],
  success: true
}
```

#### Verify Finality

```javascript
const result = await tester.verifyFinality({
  chain: 'ethereum',
  txHash: '0x123...',
  confirmations: 12
});

// Result structure
{
  final: true,
  confirmations: 15,
  required: 12,
  blockNumber: 18000000,
  status: 'success'
}
```

#### Performance Benchmark

```javascript
const result = await tester.benchmarkPerformance({
  chains: ['ethereum', 'polygon'],
  duration: 60000, // ms
  tpsTarget: 1000
});

// Result structure
{
  test: 'performance_benchmark',
  success: true,
  metrics: {
    totalTransactions: 58234,
    duration: 60000,
    tps: 970.57,
    averageLatency: 125.3,
    p95Latency: 234.5,
    p99Latency: 456.7,
    successRate: 0.987
  }
}
```

---

## Error Responses

All APIs use consistent error response format:

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "code": "ERROR_CODE",
  "timestamp": "2026-02-25T14:30:00Z"
}
```

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable

---

## Rate Limiting

Default limits:
- 100 requests per minute per IP
- Burst: 10 requests

Response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1645796400
```

---

## Pagination

All list endpoints support pagination:

**Request:**
```http
GET /api/endpoint?page=2&limit=50
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 50,
    "total": 1000,
    "pages": 20
  }
}
```

---

For more examples and detailed usage, see [Getting Started Guide](./GETTING_STARTED.md).
