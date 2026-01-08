# Hedera Testnet Deployment Guide

This guide explains how to deploy the Ingress contracts to Hedera testnet.

## Prerequisites

1. **Foundry installed** - Make sure you have Foundry installed
2. **Private key** - You need a private key with HBAR for gas fees
3. **Environment setup** - Configure your environment variables

## Configuration Files

### 1. Environment Variables (`.env`)
```bash
PRIVATE_KEY=0xea4627f1e2ca14f0b90163f99d4622de592d2d2487d87b2099602c9256af797e
HEDERA_NETWORK=testnet
RPC_URL=https://testnet.hashio.io/api
HEDERA_CHAIN_ID=296
```

### 2. Foundry Configuration (`foundry.toml`)
The RPC endpoints are configured for both testnet and mainnet:
```toml
[rpc_endpoints]
hedera_testnet = "https://testnet.hashio.io/api"
testnet = "${RPC_URL}"
hedera_mainnet = "https://mainnet.hashio.io/api"
mainnet = "https://mainnet.hashio.io/api"
```

## Deployment Methods

### Method 1: Using the Shell Script (Recommended)
```bash
# Make sure the script is executable
chmod +x deploy-hedera.sh

# Run the deployment
./deploy-hedera.sh
```

### Method 2: Manual Deployment
```bash
# Build contracts
forge build

# Run tests
forge test

# Deploy to Hedera testnet
forge script script/Deploy.s.sol:DeployScript \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast \
    --verify \
    --chain-id $HEDERA_CHAIN_ID \
    -vvvv
```

### Method 3: Using Named Network
```bash
# Deploy using the configured testnet endpoint
forge script script/Deploy.s.sol:DeployScript \
    --rpc-url testnet \
    --private-key $PRIVATE_KEY \
    --broadcast \
    -vvvv
```

## What Gets Deployed

The deployment script will deploy:

1. **MockERC20** - A test token for testing purposes
2. **VaultFactory** - The main factory contract for creating vaults
3. **StakingPools** - The staking pools contract

## Post-Deployment

After successful deployment:

1. **Contract addresses** will be saved to `./deployments/hedera-testnet.env`
2. **Verification** will be attempted (if supported)
3. **Test tokens** will be minted to the deployer address

## Example Output

```
🚀 Deploying to Hedera Testnet...
📋 Configuration:
   Network: testnet
   RPC URL: https://testnet.hashio.io/api
   Chain ID: 296

🔨 Building contracts...
🧪 Running tests...
🚀 Deploying to Hedera testnet...

=== Deployment Summary ===
Network: Hedera Testnet
Chain ID: 296
Deployer: 0x...
Mock Token: 0x...
VaultFactory: 0x...
StakingPools: 0x...
Factory Fee: 500 basis points

✅ Deployment successful!
📄 Check ./deployments/hedera-testnet.env for contract addresses
```

## Troubleshooting

### Common Issues

1. **Insufficient HBAR** - Make sure your account has enough HBAR for gas fees
2. **Network connectivity** - Verify the RPC URL is accessible
3. **Private key format** - Ensure the private key is in the correct format (0x...)

### Verification

To verify contracts manually:
```bash
forge verify-contract <CONTRACT_ADDRESS> <CONTRACT_NAME> \
    --chain-id 296 \
    --constructor-args $(cast abi-encode "constructor(address,uint256)" <FEE_RECIPIENT> <FEE>)
```

## Network Information

- **Network**: Hedera Testnet
- **Chain ID**: 296
- **RPC URL**: https://testnet.hashio.io/api
- **Explorer**: https://hashscan.io/testnet
- **Faucet**: https://portal.hedera.com/faucet

## Security Notes

- Never commit your private key to version control
- Use environment variables for sensitive data
- Test thoroughly on testnet before mainnet deployment
- Consider using a hardware wallet for mainnet deployments