## Ingress — All‑In‑One Money App for the Unbanked

Ingress is the all‑in‑one money app for the unbanked. Send and swap Naira, buy and send USDT, and seamlessly bridge bank rails and crypto—then stake and invest for yield—in one secure, simple platform.

### Why Ingress

- **All‑in‑one Platform**: Swap assets, stake for rewards, and invest in yield strategies—all in one place.
- **Bridging Traditional and Crypto Finance**: Send and swap Naira, buy USDT, and seamlessly bridge bank rails with blockchain.
- **Fast and Low‑Cost**: Built with performance and low fees in mind on Mantle blockchain.
- **Trust‑by‑Design**: On‑chain smart contracts, verifiable rewards, and transparent accounting.
- **Democratized Access**: Sophisticated investment strategies accessible to everyone, from beginners to experienced traders.

---

### What You Can Do

- **Send and Swap Naira**: Seamlessly exchange between Naira and cryptocurrencies with real-time conversion rates.
- **Buy and Send USDT**: Purchase USDT and other cryptocurrencies, then send them to any wallet.
- **Swap Assets Instantly**: Execute on‑chain swaps with a simple, familiar UX and minimal fees.
- **Stake & Earn**: Earn daily rewards by staking USDT, USDC, or DAI in secure staking pools with competitive APY rates.
- **Invest Strategically**: Choose from Conservative, Balanced, or Growth investment strategies via automated yield vaults.
- **Track Your Portfolio**: See balances, positions, and transaction history in real-time with comprehensive analytics.

---

### Key Features at a Glance

- **Swap Assets**: Seamlessly exchange between Naira, USDT, and other cryptocurrencies with real-time conversion rates and minimal fees.
- **Invest Strategically**: Choose from Conservative, Balanced, or Growth investment strategies tailored to your risk tolerance and financial goals.
- **Stake & Earn**: Earn daily rewards by staking your USDT, USDC, or DAI in secure staking pools with competitive APY rates.
- **Real-Time Analytics**: Track your portfolio performance with detailed analytics, charts, and insights into your investment returns.
- **Secure & Transparent**: Your assets are protected with industry-leading security protocols and full transparency in all transactions.
- **24/7 Support**: Access dedicated support anytime to help with your investments and answer questions.

---

### High‑Level Architecture

```mermaid
graph TD
  A[User] -->|Connects, Signs| B[Frontend Web App\nNext.js]
  B -->|REST/JSON| C[Backend API\nNode/Express]
  C -->|On‑chain calls| D[Smart Contracts\nSolidity]
  C -->|Persistence| E[(Database)]

  subgraph Chain Layer
    D1[Exchange\nAMM]:::sc
    D2[StakingPools]:::sc
    D3[VaultFactory & Vaults]:::sc
  end
  D -.contracts.-> D1
  D -.contracts.-> D2
  D -.contracts.-> D3

  classDef sc fill:#0e7490,stroke:#0e7490,color:#fff
```

---

### User Flow — Token Swap

```mermaid
sequenceDiagram
  participant U as User
  participant FE as Frontend (Next.js)
  participant BE as Backend (API)
  participant SC as Exchange Contract

  U->>FE: Select tokens, amount, slippage
  FE->>BE: Quote request
  BE-->>FE: Price, route, fees
  U->>FE: Confirm & sign
  FE->>SC: Submit swap txn
  SC-->>FE: Txn receipt
  FE-->>U: Success state + updated balances
```

---

### Staking Lifecycle Overview

```mermaid
flowchart LR
  A[Choose Pool] --> B[Stake Tokens]
  B --> C[Accrue Rewards]
  C --> D{Lockup Over?}
  D -- Yes --> E[Claim Rewards]
  E --> F[Unstake]
  D -- No --> C
```

---

### What’s Under the Hood

- **Frontend**: Next.js app with reusable UI components for dashboard, swaps, staking, vaults, wallet, and history.
- **Backend**: Node/Express API for quoting, orchestration, and secure off‑chain helpers.
- **Smart Contracts**: Solidity contracts for Exchange (AMM), StakingPools, VaultFactory, and RewardVault.
- **Data**: Backend persistence for user sessions, metadata, and indexing.

---

### Who It's For

- **The Unbanked**: Individuals seeking easy access to cryptocurrency and DeFi services without traditional banking requirements.
- **Nigerian Users**: People who want to send and swap Naira, buy USDT, and seamlessly bridge traditional bank rails with crypto.
- **Yield Seekers**: Individuals seeking straightforward yield across staking pools and investment vaults.
- **Power Users**: Traders who want AMM swaps, staking, and yield farming in one unified platform.
- **Institutions**: Teams needing clean, auditable flows for treasury operations and digital asset management.

### License

This project is provided under an open‑source license. See the repository for details.

---

### Contact

Questions or ideas? Open an issue or start a discussion in this repository.
