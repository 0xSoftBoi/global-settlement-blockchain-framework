#!/bin/bash
# Setup script for all framework components

set -e

echo "================================================"
echo "Global Settlement Blockchain Framework Setup"
echo "================================================"
echo ""

# Check Python version
echo "Checking Python version..."
python_version=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
if (( $(echo "$python_version < 3.8" | bc -l) )); then
    echo "Error: Python 3.8 or higher required"
    exit 1
fi
echo "✓ Python $python_version OK"

# Check Node.js
echo "Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "Warning: Node.js not found. Some features may not work."
else
    echo "✓ Node.js OK"
fi

# Install Python dependencies
echo ""
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Setup individual components
echo ""
echo "Setting up individual components..."
echo ""

components=(
    "monadbft-research-aggregator"
    "blockchain-compliance-monitor"
    "smart-contract-auditor"
    "crosschain-settlement-testing"
    "consensus-benchmarking-suite"
)

for component in "${components[@]}"; do
    if [ -d "$component" ]; then
        echo "Setting up $component..."
        cd "$component"
        
        if [ -f "requirements.txt" ]; then
            pip install -r requirements.txt
        fi
        
        if [ -f "package.json" ]; then
            npm install
        fi
        
        if [ -f "Makefile" ]; then
            make setup 2>/dev/null || true
        fi
        
        cd ..
        echo "✓ $component setup complete"
    fi
done

# Create necessary directories
echo ""
echo "Creating directories..."
mkdir -p data logs reports config
echo "✓ Directories created"

# Setup configuration
echo ""
echo "Setting up configuration..."
if [ ! -f "config/framework.yaml" ]; then
    cp config/framework.yaml.example config/framework.yaml 2>/dev/null || echo "# Add your configuration" > config/framework.yaml
fi
echo "✓ Configuration ready"

echo ""
echo "================================================"
echo "Setup complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Configure your settings in config/framework.yaml"
echo "2. Run tests: ./scripts/test-all.sh"
echo "3. Start using the framework!"
echo ""