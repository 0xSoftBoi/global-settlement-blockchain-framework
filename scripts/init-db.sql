-- Initialize database schema for Global Settlement Framework

-- Create compliance schema
CREATE SCHEMA IF NOT EXISTS compliance;

-- Transaction screening results
CREATE TABLE IF NOT EXISTS compliance.screening_results (
    id SERIAL PRIMARY KEY,
    tx_hash VARCHAR(66) NOT NULL,
    chain VARCHAR(50) NOT NULL,
    jurisdiction VARCHAR(10),
    risk_score DECIMAL(5,2),
    risk_level VARCHAR(20),
    sanctioned BOOLEAN DEFAULT FALSE,
    compliant BOOLEAN DEFAULT TRUE,
    flags JSONB,
    aml_alerts JSONB,
    screened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tx_hash (tx_hash),
    INDEX idx_chain (chain),
    INDEX idx_screened_at (screened_at),
    INDEX idx_risk_level (risk_level)
);

-- Address screening cache
CREATE TABLE IF NOT EXISTS compliance.address_screening (
    id SERIAL PRIMARY KEY,
    address VARCHAR(42) NOT NULL,
    sanctioned BOOLEAN DEFAULT FALSE,
    risk_score DECIMAL(5,2),
    sanctions_lists JSONB,
    screening_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    UNIQUE(address),
    INDEX idx_address (address),
    INDEX idx_sanctioned (sanctioned)
);

-- Compliance reports
CREATE TABLE IF NOT EXISTS compliance.reports (
    id SERIAL PRIMARY KEY,
    period VARCHAR(50) NOT NULL,
    jurisdiction VARCHAR(10) NOT NULL,
    report_type VARCHAR(50),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data JSONB,
    file_path TEXT,
    INDEX idx_period (period),
    INDEX idx_jurisdiction (jurisdiction),
    INDEX idx_generated_at (generated_at)
);

-- Audit trail
CREATE TABLE IF NOT EXISTS compliance.audit_trail (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    user_id VARCHAR(100),
    ip_address INET,
    details JSONB,
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_type (event_type),
    INDEX idx_occurred_at (occurred_at)
);

-- Cross-chain test results
CREATE SCHEMA IF NOT EXISTS testing;

CREATE TABLE IF NOT EXISTS testing.test_results (
    id SERIAL PRIMARY KEY,
    test_type VARCHAR(100) NOT NULL,
    test_name VARCHAR(200),
    source_chain VARCHAR(50),
    target_chain VARCHAR(50),
    success BOOLEAN,
    duration_ms INTEGER,
    error TEXT,
    metadata JSONB,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_test_type (test_type),
    INDEX idx_success (success),
    INDEX idx_executed_at (executed_at)
);

-- Performance benchmarks
CREATE TABLE IF NOT EXISTS testing.benchmarks (
    id SERIAL PRIMARY KEY,
    benchmark_type VARCHAR(100) NOT NULL,
    protocol VARCHAR(50),
    node_count INTEGER,
    tps DECIMAL(10,2),
    latency_avg_ms DECIMAL(10,2),
    latency_p95_ms DECIMAL(10,2),
    latency_p99_ms DECIMAL(10,2),
    success_rate DECIMAL(5,4),
    metadata JSONB,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_benchmark_type (benchmark_type),
    INDEX idx_protocol (protocol),
    INDEX idx_executed_at (executed_at)
);

-- MonadBFT research data
CREATE SCHEMA IF NOT EXISTS research;

CREATE TABLE IF NOT EXISTS research.papers (
    id SERIAL PRIMARY KEY,
    paper_id VARCHAR(50) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    authors JSONB,
    abstract TEXT,
    published_date DATE,
    pdf_url TEXT,
    arxiv_url TEXT,
    categories JSONB,
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_paper_id (paper_id),
    INDEX idx_published_date (published_date)
);

CREATE TABLE IF NOT EXISTS research.blog_posts (
    id SERIAL PRIMARY KEY,
    url TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    author VARCHAR(200),
    content TEXT,
    published_date TIMESTAMP,
    source VARCHAR(100),
    tags JSONB,
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_source (source),
    INDEX idx_published_date (published_date)
);

-- Create views for common queries
CREATE OR REPLACE VIEW compliance.high_risk_transactions AS
SELECT 
    tx_hash,
    chain,
    risk_score,
    risk_level,
    sanctioned,
    flags,
    screened_at
FROM compliance.screening_results
WHERE risk_level IN ('HIGH', 'CRITICAL') OR sanctioned = TRUE
ORDER BY screened_at DESC;

CREATE OR REPLACE VIEW testing.test_summary AS
SELECT 
    test_type,
    COUNT(*) as total_tests,
    SUM(CASE WHEN success THEN 1 ELSE 0 END) as passed,
    SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed,
    AVG(duration_ms) as avg_duration_ms,
    MAX(executed_at) as last_run
FROM testing.test_results
GROUP BY test_type;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA compliance TO gsf_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA compliance TO gsf_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA compliance TO gsf_user;

GRANT ALL PRIVILEGES ON SCHEMA testing TO gsf_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA testing TO gsf_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA testing TO gsf_user;

GRANT ALL PRIVILEGES ON SCHEMA research TO gsf_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA research TO gsf_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA research TO gsf_user;

-- Insert sample data for testing
INSERT INTO research.papers (paper_id, title, authors, abstract, published_date, arxiv_url)
VALUES (
    '2502.20692',
    'MonadBFT: Fast, Responsive, Fork-Resistant Streamlined Consensus',
    '["Author 1", "Author 2"]'::jsonb,
    'MonadBFT is a novel consensus protocol that provides fast finality, responsiveness, and fork resistance.',
    '2025-02-01',
    'https://arxiv.org/abs/2502.20692'
) ON CONFLICT (paper_id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_screening_results_composite 
    ON compliance.screening_results(chain, risk_level, screened_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_results_composite 
    ON testing.test_results(test_type, success, executed_at DESC);

COMMIT;
