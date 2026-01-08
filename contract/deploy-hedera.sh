#!/bin/bash

# Deploy to Hedera Testnet Script
echo "🚀 Deploying to Hedera Testnet..."

# Load environment variables
source .env

# Check if required environment variables are set
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY not set in .env file"
    exit 1
fi

if [ -z "$RPC_URL" ]; then
    echo "❌ Error: RPC_URL not set in .env file"
    exit 1
fi

echo "📋 Configuration:"
echo "   Network: $HEDERA_NETWORK"
echo "   RPC URL: $RPC_URL"
echo "   Chain ID: $HEDERA_CHAIN_ID"

# Build the contracts
echo "🔨 Building contracts..."
forge build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Run tests before deployment
echo "🧪 Running tests..."
forge test

if [ $? -ne 0 ]; then
    echo "❌ Tests failed! Aborting deployment."
    exit 1
fi

# Deploy to Hedera testnet
echo "🚀 Deploying to Hedera testnet..."
forge script script/Deploy.s.sol:DeployScript \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast \
    --verify \
    --chain-id $HEDERA_CHAIN_ID \
    -vvvv

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "📄 Check ./deployments/hedera-testnet.env for contract addresses"
else
    echo "❌ Deployment failed!"
    exit 1
fi