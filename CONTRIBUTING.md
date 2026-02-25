# Contributing to Global Settlement Blockchain Framework

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

This project adheres to a code of conduct that all contributors are expected to follow:

- Be respectful and inclusive
- Focus on constructive feedback
- Prioritize the project's goals
- Maintain professional communication

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- Python >= 3.10
- Docker >= 20.10 (optional)
- Go >= 1.21 (for BFT implementations)
- Foundry (for smart contract testing)

### Setup

```bash
# Clone the repository
git clone https://github.com/0xSoftBoi/global-settlement-blockchain-framework.git
cd global-settlement-blockchain-framework

# Run setup script
./scripts/setup.sh

# Or manually:
npm install
pip install -r requirements.txt
```

## Development Workflow

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/global-settlement-blockchain-framework.git
cd global-settlement-blockchain-framework

# Add upstream remote
git remote add upstream https://github.com/0xSoftBoi/global-settlement-blockchain-framework.git
```

### 2. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 3. Make Changes

- Write clean, documented code
- Follow the coding standards
- Add tests for new features
- Update documentation as needed

### 4. Test Your Changes

```bash
# Run all tests
npm test

# Run specific module tests
npm run test:monad-research
npm run test:compliance
npm run test:cross-chain

# Run with coverage
npm run test:coverage
```

### 5. Commit Changes

Follow conventional commit messages:

```bash
git add .
git commit -m "feat: add new feature"
# or
git commit -m "fix: resolve bug in compliance monitor"
# or
git commit -m "docs: update API documentation"
```

Commit types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### 6. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Coding Standards

### JavaScript/Node.js

- Use ES6+ features
- Follow ESLint configuration
- Use async/await for async operations
- Document functions with JSDoc
- Use meaningful variable names

```javascript
/**
 * Screen a blockchain transaction for compliance
 * @param {string} txHash - Transaction hash
 * @param {string} chain - Blockchain name
 * @param {string} jurisdiction - Regulatory jurisdiction
 * @returns {Promise<Object>} Screening result
 */
async function screenTransaction(txHash, chain, jurisdiction) {
  // Implementation
}
```

### Python

- Follow PEP 8 style guide
- Use type hints
- Document functions with docstrings
- Use meaningful variable names

```python
def fetch_paper(paper_id: str) -> Optional[ArxivPaper]:
    """
    Fetch paper metadata from arXiv API
    
    Args:
        paper_id: arXiv paper ID (e.g., '2502.20692')
        
    Returns:
        ArxivPaper object or None if not found
    """
    # Implementation
```

### Go

- Follow effective Go guidelines
- Use gofmt for formatting
- Document exported functions
- Handle errors explicitly

```go
// ProposeBlock proposes a new block to the network
func (hs *HotStuff) ProposeBlock(txCount int) (*Block, error) {
    // Implementation
}
```

### Solidity

- Use Solidity >= 0.8.0
- Follow best practices for security
- Document contracts with NatSpec
- Use OpenZeppelin contracts where applicable

## Testing Guidelines

### Unit Tests

- Write tests for all new functions
- Aim for >80% code coverage
- Use descriptive test names
- Test edge cases and error conditions

```javascript
describe('TransactionScreener', () => {
  it('should detect sanctioned addresses', async () => {
    const screener = new TransactionScreener();
    const result = await screener.screenAddress('0x...');
    expect(result.sanctioned).toBe(true);
  });
});
```

### Integration Tests

- Test interactions between modules
- Use test databases/networks
- Clean up after tests

### Performance Tests

- Benchmark critical paths
- Test under load
- Document performance requirements

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] Branch is up to date with main

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe testing performed

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Process

1. Automated checks must pass
2. At least one maintainer approval required
3. Address review comments
4. Squash commits if requested
5. Merge will be performed by maintainer

## Issue Reporting

### Bug Reports

Include:
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Relevant logs/screenshots

### Feature Requests

Include:
- Clear description of feature
- Use case and benefits
- Proposed implementation (optional)
- Any breaking changes

### Security Issues

For security vulnerabilities:
- Do NOT open public issues
- Email security@globalsettlement.io
- Provide detailed description
- Allow time for fix before disclosure

## Module-Specific Guidelines

### MonadBFT Research

- Verify paper citations
- Test consensus implementations thoroughly
- Document performance characteristics
- Include comparison with existing protocols

### Compliance Monitor

- Follow regulatory requirements strictly
- Test with various jurisdictions
- Ensure audit trail completeness
- Validate against compliance frameworks

### Cross-Chain Testing

- Test on all supported chains
- Include failure scenarios
- Document gas costs
- Verify finality across chains

## Questions?

For questions:
- Open a discussion on GitHub
- Join our Discord community
- Email: dev@globalsettlement.io

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
