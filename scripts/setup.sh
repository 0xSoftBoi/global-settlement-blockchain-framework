#!/bin/bash

# Global Settlement Blockchain Framework Setup Script

set -e

echo "================================================"
echo "Global Settlement Blockchain Framework Setup"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "${YELLOW}Checking prerequisites...${NC}"

# Node.js
if ! command -v node &> /dev/null; then
    echo "${RED}Node.js is not installed. Please install Node.js >= 18.0.0${NC}"
    exit 1
fi
echo "${GREEN}✓${NC} Node.js $(node --version)"

# Python
if ! command -v python3 &> /dev/null; then
    echo "${RED}Python is not installed. Please install Python >= 3.10${NC}"
    exit 1
fi
echo "${GREEN}✓${NC} Python $(python3 --version)"

# Docker
if ! command -v docker &> /dev/null; then
    echo "${YELLOW}Docker is not installed. Some features will be limited.${NC}"
else
    echo "${GREEN}✓${NC} Docker $(docker --version)"
fi

# Go (optional for BFT implementations)
if command -v go &> /dev/null; then
    echo "${GREEN}✓${NC} Go $(go version)"
else
    echo "${YELLOW}Go is not installed. BFT implementations will be limited.${NC}"
fi

# Foundry (optional for smart contract testing)
if command -v forge &> /dev/null; then
    echo "${GREEN}✓${NC} Foundry $(forge --version)"
else
    echo "${YELLOW}Foundry is not installed. Smart contract tests will be limited.${NC}"
    echo "Install with: curl -L https://foundry.paradigm.xyz | bash"
fi

echo ""
echo "${YELLOW}Installing dependencies...${NC}"

# Install Node.js dependencies
echo "Installing Node.js packages..."
npm install
echo "${GREEN}✓${NC} Node.js dependencies installed"

# Install Python dependencies
echo "Installing Python packages..."
pip3 install -r requirements.txt
echo "${GREEN}✓${NC} Python dependencies installed"

# Install Go dependencies for BFT implementations
if command -v go &> /dev/null; then
    echo "Installing Go dependencies..."
    cd monad-bft-research/implementations/hotstuff
    go mod download
    cd ../../..
    echo "${GREEN}✓${NC} Go dependencies installed"
fi

# Create necessary directories
echo ""
echo "${YELLOW}Creating directories...${NC}"
mkdir -p logs
mkdir -p data/papers
mkdir -p data/blog_posts
mkdir -p data/docs
mkdir -p compliance-monitor/data
mkdir -p cross-chain-testing/results
echo "${GREEN}✓${NC} Directories created"

# Set up environment file
if [ ! -f .env ]; then
    echo ""
    echo "${YELLOW}Setting up environment configuration...${NC}"
    cp .env.example .env
    echo "${GREEN}✓${NC} .env file created"
    echo "${YELLOW}Please edit .env with your configuration before running services${NC}"
else
    echo "${GREEN}✓${NC} .env file already exists"
fi

# Initialize databases (if Docker is available)
if command -v docker &> /dev/null; then
    echo ""
    echo "${YELLOW}Would you like to start Docker services now? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "Starting Docker services..."
        docker-compose up -d
        echo "${GREEN}✓${NC} Docker services started"
        echo ""
        echo "Services running:"
        echo "  - PostgreSQL: localhost:5432"
        echo "  - Redis: localhost:6379"
        echo "  - MongoDB: localhost:27017"
        echo "  - Compliance API: http://localhost:3000"
        echo "  - Compliance Dashboard: http://localhost:3001"
        echo "  - Prometheus: http://localhost:9090"
        echo "  - Grafana: http://localhost:3002"
    fi
fi

echo ""
echo "${GREEN}================================================${NC}"
echo "${GREEN}Setup completed successfully!${NC}"
echo "${GREEN}================================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Edit .env with your API keys and configuration"
echo "  2. Run tests: npm test"
echo "  3. Start services: docker-compose up -d"
echo "  4. View documentation: cat README.md"
echo ""
echo "Quick commands:"
echo "  - MonadBFT Research: npm run monad-research"
echo "  - Compliance Dashboard: npm run compliance-dashboard"
echo "  - Cross-Chain Tests: npm run test:cross-chain"
echo ""
echo "For more information, see: docs/"
echo ""
