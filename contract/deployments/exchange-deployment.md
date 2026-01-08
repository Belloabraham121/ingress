# Exchange Contract Deployment Details

## Network

- **Network:** Hedera Testnet
- **Chain ID:** 296
- **Deployment Date:** October 29, 2025

## Contract Addresses

### Exchange Contract

- **Address:** `0x1938C3345f2B6B2Fa3538713DB50f80ebA3a61d5`
- **Owner:** `0xE416db11FB2568434E7A86F33762E37CaCd48469`
- **Authorized Withdrawer:** `0xE416db11FB2568434E7A86F33762E37CaCd48469`

### Supported Tokens

- **USDC:** `0x125D3f690f281659Dd7708D21688BC83Ee534aE6`
- **USDT:** `0xd4E61131Ed9C3dd610727655aE8254B286deE95c`
- **DAI:** `0x3814F5Cf6c4Aa63EdDF8A79c82346a163c7E7C53`
- **HBAR:** Native token

## Transaction Hash

- **Deployment TX:** `0xffee5ef66e062480f1fc64cc4e41bdcac41a0c5a5a73cd5ab74f5c50b62f96e9`

## Next Steps

### 1. Add Liquidity to Exchange

```bash
# Run the add liquidity script
forge script script/AddExchangeLiquidity.s.sol --rpc-url https://testnet.hashio.io/api --broadcast
```

### 2. Configure Backend

Add these addresses to your backend `.env` file:

```env
EXCHANGE_CONTRACT=0x1938C3345f2B6B2Fa3538713DB50f80ebA3a61d5
USDC_TOKEN=0x125D3f690f281659Dd7708D21688BC83Ee534aE6
USDT_TOKEN=0xd4E61131Ed9C3dd610727655aE8254B286deE95c
DAI_TOKEN=0x3814F5Cf6c4Aa63EdDF8A79c82346a163c7E7C53
```

### 3. Listen to Events

Backend should listen to these events:

- `TokenDeposited(address indexed user, address indexed token, uint256 amount)`
- `HbarDeposited(address indexed user, uint256 amount)`
- `TokenWithdrawn(address indexed to, address indexed token, uint256 amount, address indexed withdrawer)`
- `HbarWithdrawn(address indexed to, uint256 amount, address indexed withdrawer)`

## Use Cases

### Token → Naira (User Cash Out)

1. User calls `depositToken(token, amount)` on Exchange contract
2. Backend listens to `TokenDeposited` event
3. Backend transfers naira via PayStack API to user's bank account
4. Deposited tokens remain in Exchange contract as liquidity

### Naira → Token (User Buy Crypto)

1. User pays naira via PayStack
2. PayStack webhook notifies backend
3. Backend calls `transferToUser(token, userAddress, amount)` on Exchange contract
4. User receives tokens from Exchange liquidity pool

### Naira → HBAR

1. User pays naira via PayStack
2. PayStack webhook notifies backend
3. Backend calls `transferHbarToUser(userAddress, amount)` on Exchange contract
4. User receives HBAR from Exchange liquidity pool
