#!/bin/bash
# Test script for all framework components

set -e

echo "================================================"
echo "Running Global Settlement Framework Tests"
echo "================================================"
echo ""

test_failed=0

components=(
    "monadbft-research-aggregator"
    "blockchain-compliance-monitor"
    "smart-contract-auditor"
    "crosschain-settlement-testing"
    "consensus-benchmarking-suite"
)

for component in "${components[@]}"; do
    if [ -d "$component" ]; then
        echo "Testing $component..."
        cd "$component"
        
        if [ -d "tests" ]; then
            if ! pytest tests/ -v; then
                echo "✗ Tests failed for $component"
                test_failed=1
            else
                echo "✓ Tests passed for $component"
            fi
        else
            echo "⊘ No tests found for $component"
        fi
        
        cd ..
        echo ""
    fi
done

echo "================================================"
if [ $test_failed -eq 0 ]; then
    echo "All tests passed! ✓"
    echo "================================================"
    exit 0
else
    echo "Some tests failed ✗"
    echo "================================================"
    exit 1
fi