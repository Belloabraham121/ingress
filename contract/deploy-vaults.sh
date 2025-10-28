#!/bin/bash

# Vault Deployment Script for Hedera Testnet
# This script deploys USDT, USDC, DAI tokens and their respective vaults

set -e

echo "=========================================="
echo "TOKEN & VAULT DEPLOYMENT SCRIPT"
echo "=========================================="
echo ""

# Load environment variables
if [ -f .env ]; then
    source .env
else
    echo "❌ Error: .env file not found"
    echo "Create a .env file with PRIVATE_KEY and RPC_URL"
    exit 1
fi

# Configuration
VAULT_FACTORY="0x29021eaeb230bc84120c0f05fdd83c446270c4f7"
RPC_URL="${RPC_URL:-https://testnet.hashio.io/api}"
DEPLOYER=$(cast wallet address $PRIVATE_KEY)

echo "Configuration:"
echo "  Deployer: $DEPLOYER"
echo "  VaultFactory: $VAULT_FACTORY"
echo "  RPC URL: $RPC_URL"
echo ""

echo "This script will:"
echo "  1. Deploy 3 ERC20 tokens (USDT, USDC, DAI)"
echo "  2. Mint 1,000,000 of each token to deployer"
echo "  3. Deploy 3 vaults (USDT 18%, USDC 12%, DAI 15%)"
echo "  4. Use 100,000 tokens per vault as initial rewards"
echo ""

# Ask for confirmation
read -p "Continue with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Run the forge script
echo ""
echo "Starting deployment..."
echo ""

forge script script/DeployVaults.s.sol:DeployVaults \
    --rpc-url $RPC_URL \
    --broadcast \
    --legacy \
    -vvv

echo ""
echo "=========================================="
echo "DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "Check the broadcast/ folder for deployment details:"
echo "  contract/broadcast/DeployVaults.s.sol/296/run-latest.json"
echo ""
echo "Next steps:"
echo "  1. Save the deployed token and vault addresses"
echo "  2. Update your frontend configuration"
echo "  3. Test deposits and withdrawals"
echo ""

