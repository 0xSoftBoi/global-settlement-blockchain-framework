#!/usr/bin/env node

/**
 * Comprehensive Demo Runner
 * 
 * Runs demonstrations of all three major framework components
 */

const path = require('path');
const { spawn } = require('child_process');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [new winston.transports.Console()]
});

class DemoRunner {
  constructor() {
    this.results = [];
  }
  
  async runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      logger.info(`Running: ${command} ${args.join(' ')}`);
      
      const proc = spawn(command, args, {
        stdio: 'inherit',
        shell: true,
        ...options
      });
      
      proc.on('close', (code) => {
        if (code === 0) {
          resolve(code);
        } else {
          reject(new Error(`Command failed with code ${code}`));
        }
      });
      
      proc.on('error', (error) => {
        reject(error);
      });
    });
  }
  
  async runMonadBFTDemo() {
    logger.info('\n' + '='.repeat(70));
    logger.info('1. MonadBFT Research Aggregator Demo');
    logger.info('='.repeat(70));
    
    try {
      // Run paper scraper
      logger.info('\nFetching MonadBFT paper from arXiv...');
      await this.runCommand('python3', [
        'monad-bft-research/scrapers/arxiv_scraper.py',
        '--paper-id', '2502.20692'
      ]);
      
      // Run MonadBFT consensus simulation
      logger.info('\nRunning MonadBFT consensus simulation...');
      await this.runCommand('node', [
        'monad-bft-research/implementations/monadbft/monadbft.js'
      ]);
      
      this.results.push({
        demo: 'MonadBFT Research',
        status: 'SUCCESS'
      });
      
      logger.info('\n✓ MonadBFT demo completed successfully');
    } catch (error) {
      logger.error(`MonadBFT demo failed: ${error.message}`);
      this.results.push({
        demo: 'MonadBFT Research',
        status: 'FAILED',
        error: error.message
      });
    }
  }
  
  async runComplianceDemo() {
    logger.info('\n' + '='.repeat(70));
    logger.info('2. Institutional Compliance Monitor Demo');
    logger.info('='.repeat(70));
    
    try {
      logger.info('\nStarting compliance demo...');
      await this.runCommand('node', [
        'demos/compliance-demo.js'
      ]);
      
      this.results.push({
        demo: 'Compliance Monitor',
        status: 'SUCCESS'
      });
      
      logger.info('\n✓ Compliance demo completed successfully');
    } catch (error) {
      logger.error(`Compliance demo failed: ${error.message}`);
      this.results.push({
        demo: 'Compliance Monitor',
        status: 'FAILED',
        error: error.message
      });
    }
  }
  
  async runCrossChainDemo() {
    logger.info('\n' + '='.repeat(70));
    logger.info('3. Cross-Chain Testing Framework Demo');
    logger.info('='.repeat(70));
    
    try {
      logger.info('\nRunning cross-chain tests...');
      await this.runCommand('node', [
        'demos/cross-chain-demo.js'
      ]);
      
      this.results.push({
        demo: 'Cross-Chain Testing',
        status: 'SUCCESS'
      });
      
      logger.info('\n✓ Cross-chain demo completed successfully');
    } catch (error) {
      logger.error(`Cross-chain demo failed: ${error.message}`);
      this.results.push({
        demo: 'Cross-Chain Testing',
        status: 'FAILED',
        error: error.message
      });
    }
  }
  
  printSummary() {
    logger.info('\n' + '='.repeat(70));
    logger.info('Demo Summary');
    logger.info('='.repeat(70) + '\n');
    
    this.results.forEach(result => {
      const status = result.status === 'SUCCESS' ? '✓' : '✗';
      const color = result.status === 'SUCCESS' ? '\x1b[32m' : '\x1b[31m';
      logger.info(`${color}${status} ${result.demo}\x1b[0m`);
      if (result.error) {
        logger.info(`  Error: ${result.error}`);
      }
    });
    
    const successCount = this.results.filter(r => r.status === 'SUCCESS').length;
    const totalCount = this.results.length;
    
    logger.info(`\n${successCount}/${totalCount} demos completed successfully\n`);
  }
  
  async runAll() {
    logger.info('\n' + '='.repeat(70));
    logger.info('Global Settlement Blockchain Framework');
    logger.info('Comprehensive Demo Suite');
    logger.info('='.repeat(70));
    
    await this.runMonadBFTDemo();
    await this.runComplianceDemo();
    await this.runCrossChainDemo();
    
    this.printSummary();
  }
}

if (require.main === module) {
  const runner = new DemoRunner();
  runner.runAll().catch(error => {
    logger.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = DemoRunner;
