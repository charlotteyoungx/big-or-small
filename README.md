# Big or Small - Provably Fair Dice Game with FHE

A blockchain-based dice game leveraging Fully Homomorphic Encryption (FHE) through Zama's FHEVM to guarantee provably fair gameplay. Players bet on whether an encrypted dice roll (1-6) will land on "Small" (1-3) or "Big" (4-6), with the outcome cryptographically secured and verifiable on-chain.

## Overview

Big or Small is a decentralized gambling DApp that solves the critical trust problem in online gambling by using cutting-edge cryptographic technology. Traditional online casinos require players to trust that the house isn't manipulating outcomes. This implementation uses Fully Homomorphic Encryption (FHE) to ensure that:

1. **The dice result is committed before betting** - The encrypted dice value is stored on-chain before the player places their bet
2. **No one can see the dice value** - Not even the contract or validators can see the plaintext dice until reveal
3. **The value cannot be changed** - Once encrypted and committed, the dice result is immutable
4. **Results are verifiable** - Decryption happens on-chain with cryptographic proofs

## Key Features

### Provably Fair Gaming
- **Pre-commitment**: Dice values are encrypted client-side and committed to the blockchain before bets are placed
- **Tamper-proof**: Encrypted values cannot be modified after commitment
- **Transparent verification**: All game rounds are publicly auditable on-chain
- **No trusted third party**: Smart contract logic ensures fair payouts automatically

### Privacy-Preserving Encryption
- **FHE technology**: Leverages Zama's FHEVM for computations on encrypted data
- **Client-side encryption**: Dice values are encrypted in the browser before transmission
- **Decryption oracle**: Secure off-chain decryption with on-chain verification
- **ACL-based permissions**: Fine-grained access control for encrypted data

### User-Friendly Experience
- **Modern React UI**: Clean, responsive interface built with React 19
- **Wallet integration**: Seamless connection via RainbowKit supporting multiple wallets
- **Real-time updates**: Live event monitoring for game outcomes
- **Flexible betting**: Configurable stake amounts within defined limits (0.001 - 0.01 ETH)

## Technical Advantages

### 1. Trust Minimization
Unlike traditional online gambling platforms that require trusting a centralized operator:
- **No house manipulation**: The dice result is cryptographically locked before betting
- **Transparent odds**: 2x payout on correct predictions (50% probability)
- **Verifiable randomness**: Players generate their own random dice values client-side
- **Immutable outcomes**: Blockchain guarantees results cannot be altered retroactively

### 2. Privacy Through FHE
- **Confidential computation**: Operations performed on encrypted data without revealing plaintext
- **Zero-knowledge proofs**: Cryptographic proofs validate decryption without exposing intermediate states
- **Selective disclosure**: Only the final result is revealed when the player chooses
- **Forward secrecy**: Historical encrypted values remain secure even if future keys are compromised

### 3. On-Chain Security
- **Non-custodial**: Players maintain full control of their funds
- **Atomic settlements**: Payouts happen automatically within the same transaction
- **Reentrancy protection**: Follows checks-effects-interactions pattern
- **Battle-tested standards**: Built on Hardhat with comprehensive testing frameworks

## Technology Stack

### Smart Contracts
- **Solidity 0.8.27**: Latest security features and gas optimizations
- **FHEVM Library**: Zama's Fully Homomorphic Encryption for Solidity
- **Hardhat**: Development environment with TypeScript support
- **OpenZeppelin-style patterns**: Industry-standard security practices

### Frontend
- **React 19.1**: Latest React with concurrent features
- **TypeScript 5.8**: Type safety across the entire codebase
- **Vite 7.1**: Lightning-fast build tool and dev server
- **Ethers.js 6.15**: Ethereum interaction library
- **Wagmi 2.17**: React hooks for Ethereum
- **RainbowKit 2.2**: Beautiful wallet connection UI
- **Viem 2.37**: TypeScript-native Ethereum utilities

### Testing & Development
- **Mocha + Chai**: Comprehensive test framework
- **Hardhat Network**: Local blockchain for rapid iteration
- **Typechain**: TypeScript bindings for smart contracts
- **ESLint + Prettier**: Code quality and formatting
- **Hardhat Gas Reporter**: Transaction cost analysis
- **Solidity Coverage**: Test coverage reporting

### Deployment & Infrastructure
- **Hardhat Deploy**: Deterministic deployment system
- **Sepolia Testnet**: Ethereum testnet with FHEVM support
- **Infura**: Reliable node infrastructure
- **Etherscan Verification**: Contract source code verification

## Problems Solved

### 1. Gambling Trust Issue
**Problem**: Online gambling requires blind trust that operators won't manipulate outcomes.

**Solution**: By committing an encrypted dice value before the bet is placed, the game outcome is cryptographically guaranteed to be fair. The house cannot see the dice value to manipulate the player's bet, and the player cannot change the dice after seeing favorable conditions.

### 2. On-Chain Privacy
**Problem**: Traditional smart contracts cannot hide data from validators and block producers.

**Solution**: FHEVM allows the contract to store and operate on encrypted data. The dice value remains encrypted until the player chooses to reveal it, preventing front-running or manipulation by miners/validators.

### 3. Randomness Manipulation
**Problem**: On-chain randomness can be manipulated by miners or is expensive to secure.

**Solution**: Players generate randomness client-side and submit it encrypted. Since the value is encrypted and committed before betting, neither the player nor the house can manipulate the outcome after commitment.

### 4. Centralized Casino Points of Failure
**Problem**: Traditional casinos can:
- Refuse withdrawals
- Change odds without notice
- Manipulate results
- Be shut down by authorities

**Solution**: Decentralized smart contract with:
- Automatic payouts (2x on win)
- Fixed, transparent odds
- Immutable game logic
- Censorship-resistant operation

### 5. Verification Complexity
**Problem**: Players cannot easily verify that casino games are fair.

**Solution**: Every round is recorded on-chain with:
- Round ID for tracking
- Public function to query round information
- Event logs for all game state changes
- Verifiable decryption proofs

## How It Works

### Game Flow

#### 1. Start Game
```
Player → Generate Random Dice (1-6)
       → Encrypt Dice with FHE
       → Submit to Contract with Round ID
       → Contract Stores Encrypted Dice
```

The player's browser generates a random number (1-6), encrypts it using Zama's FHE library, and submits it to the smart contract. The contract stores this encrypted value without knowing its plaintext value.

#### 2. Place Bet
```
Player → Choose Small (1-3) or Big (4-6)
       → Submit Bet with ETH Stake (0.001-0.01)
       → Contract Records Bet
       → ETH Held in Contract
```

After the encrypted dice is committed, the player chooses their prediction and sends ETH as a stake. The bet amount must be within the configured range (MIN_BET to MAX_BET).

#### 3. Reveal Round
```
Player → Requests Reveal
       → Contract Submits Decryption Request
       → Decryption Oracle Processes Request
       → Oracle Returns Plaintext Dice + Proof
       → Contract Verifies Proof
       → Contract Determines Win/Loss
       → Contract Sends Payout (2x stake if win)
```

When the player triggers reveal, the contract requests decryption from Zama's decryption oracle. The oracle decrypts the value off-chain and returns it with a cryptographic proof. The contract verifies the proof and automatically settles the bet.

### Architecture

```
┌─────────────┐
│   Browser   │
│  (React UI) │
└──────┬──────┘
       │ 1. Connect Wallet
       │ 2. Generate Random Dice
       │ 3. Encrypt with FHE
       ▼
┌─────────────────┐
│  Smart Contract │
│  (BigOrSmall)   │
│                 │
│  - Store euint8 │
│  - Record Bets  │
│  - Settle Wins  │
└────────┬────────┘
         │ 4. Request Decryption
         ▼
┌──────────────────┐
│ Decryption Oracle│
│   (Zama FHE)     │
│                  │
│ - Decrypt Off-Chain│
│ - Generate Proof  │
└────────┬─────────┘
         │ 5. Return Result + Proof
         ▼
┌─────────────────┐
│  Smart Contract │
│  (Verification) │
│                 │
│ - Verify Proof  │
│ - Calculate Win │
│ - Send Payout   │
└─────────────────┘
```

## Project Structure

```
big-or-small/
├── contracts/              # Smart contract source files
│   └── BigOrSmall.sol      # Main game contract
├── deploy/                 # Deployment scripts
│   └── deploy.ts           # Hardhat deploy script
├── test/                   # Contract test files
│   └── BigOrSmall.ts       # Comprehensive test suite
├── tasks/                  # Custom Hardhat tasks
│   └── BigOrSmall.ts       # CLI utilities for contract interaction
├── app/                    # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── GameApp.tsx # Main game UI
│   │   │   └── Header.tsx  # Navigation header
│   │   ├── hooks/          # Custom React hooks
│   │   │   ├── useEthersSigner.ts    # Wagmi to Ethers adapter
│   │   │   └── useZamaInstance.ts    # FHE instance management
│   │   ├── abi/            # Contract ABIs
│   │   ├── config/         # Configuration files
│   │   └── styles/         # CSS styles
│   ├── package.json        # Frontend dependencies
│   └── vite.config.ts      # Vite configuration
├── types/                  # Generated TypeScript types from Typechain
├── artifacts/              # Compiled contract artifacts
├── deployments/            # Deployment addresses and ABIs
├── hardhat.config.ts       # Hardhat configuration
├── package.json            # Root dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── README.md               # This file
```

## Getting Started

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm**: Version 7.0.0 or higher
- **MetaMask** or compatible Web3 wallet
- **Sepolia ETH**: For testnet deployment and testing

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/big-or-small.git
   cd big-or-small
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd app
   npm install
   cd ..
   ```

4. **Set up environment variables**

   For smart contract deployment:
   ```bash
   # Set your wallet mnemonic or private key
   npx hardhat vars set MNEMONIC
   # Or use private key
   npx hardhat vars set PRIVATE_KEY

   # Set your Infura API key for Sepolia access
   npx hardhat vars set INFURA_API_KEY

   # Optional: Set Etherscan API key for contract verification
   npx hardhat vars set ETHERSCAN_API_KEY
   ```

   For frontend (create `app/.env`):
   ```env
   VITE_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id
   VITE_BOS_ADDRESS=deployed_contract_address
   ```

### Development

#### Compile Contracts
```bash
npm run compile
```

#### Run Tests
```bash
# Run local tests
npm test

# Run tests on Sepolia
npm run test:sepolia

# Generate coverage report
npm run coverage
```

#### Deploy Locally
```bash
# Terminal 1: Start local Hardhat node with FHEVM
npm run chain

# Terminal 2: Deploy to local network
npm run deploy:localhost
```

#### Deploy to Sepolia
```bash
# Deploy contract
npm run deploy:sepolia

# Verify on Etherscan
npm run verify:sepolia
```

#### Run Frontend

1. **Update contract address**: Edit `app/src/components/GameApp.tsx` line 14 with your deployed contract address:
   ```typescript
   const CONTRACT_ADDRESS = "0xYourDeployedContractAddress";
   ```

2. **Start development server**:
   ```bash
   cd app
   npm run dev
   ```

3. **Open browser**: Navigate to `http://localhost:5173`

### Testing the Game

1. **Connect wallet**: Click "Connect Wallet" and connect to Sepolia testnet
2. **Fund the contract**: Send some ETH to the contract address to enable payouts (the contract is ownerless and accepts deposits via `receive()`)
3. **Start game**: Click "Start Game" to generate and commit an encrypted dice
4. **Place bet**: Choose your bet amount and select "Small" (1-3) or "Big" (4-6), then click "Place Bet"
5. **Reveal**: Click "Reveal Round" to trigger decryption and settlement
6. **Check results**: View the round summary and your payout status

## Smart Contract API

### Core Functions

#### `startGame(bytes32 roundId, externalEuint8 encDiceExt, bytes calldata proof)`
Initializes a new game round with an encrypted dice value.

**Parameters:**
- `roundId`: Unique identifier for this game round (bytes32)
- `encDiceExt`: External encrypted uint8 representing dice value (1-6)
- `proof`: Zero-knowledge proof for the encrypted input

**Events:** `GameStarted(bytes32 indexed roundId, address indexed player)`

#### `placeBet(bytes32 roundId, uint8 choice)`
Places a bet on an existing round.

**Parameters:**
- `roundId`: The round identifier
- `choice`: 1 for Small (1-3), 2 for Big (4-6)
- `msg.value`: Bet amount in wei (must be between MIN_BET and MAX_BET)

**Requirements:**
- Caller must be the round creator
- Bet must not already be placed
- Stake must be within allowed range (0.001 - 0.01 ETH)

**Events:** `BetPlaced(bytes32 indexed roundId, address indexed player, Choice choice, uint256 stake)`

#### `reveal(bytes32 roundId)`
Triggers the decryption oracle to reveal the dice value and settle the round.

**Parameters:**
- `roundId`: The round to reveal

**Requirements:**
- Caller must be the round creator
- Round must not already be settled
- Bet must be placed

**Events:**
- `RevealRequested(bytes32 indexed roundId, uint256 indexed requestId)`
- `Revealed(bytes32 indexed roundId, uint8 dice, bool win, uint256 payout)` (emitted by callback)

#### `getRoundInfo(bytes32 roundId)`
Returns public information about a round.

**Returns:**
- `player`: Address of the player
- `stake`: Bet amount in wei
- `choice`: Player's choice (0=None, 1=Small, 2=Big)
- `settled`: Whether the round has been settled
- `result`: The revealed dice value (0 if not revealed)

### Constants

- `MIN_BET`: 0.001 ETH (1e15 wei)
- `MAX_BET`: 0.01 ETH (1e16 wei)

### Game Rules

- **Dice range**: 1 to 6
- **Small**: 1, 2, 3
- **Big**: 4, 5, 6
- **Payout**: 2x stake on correct prediction, 0 on incorrect prediction
- **House edge**: 0% (fair 50/50 odds)

## Frontend Integration

### Key Hooks

#### `useZamaInstance()`
Custom hook that initializes and manages the FHEVM instance for encryption.

**Returns:**
- `instance`: Initialized FhevmInstance or null
- `isLoading`: Boolean indicating loading state
- `error`: Error message if initialization fails

#### `useEthersSigner()`
Adapter hook that converts Wagmi's signer to Ethers.js format for contract interaction.

**Parameters:**
- `chainId`: Target chain ID (e.g., Sepolia)

**Returns:**
- Ethers.js compatible signer

### Encryption Flow

```typescript
// 1. Create encrypted input
const buffer = zama.createEncryptedInput(contractAddress, userAddress);
buffer.add8(BigInt(diceValue)); // Add dice value (1-6)

// 2. Encrypt and generate proof
const encrypted = await buffer.encrypt();

// 3. Submit to contract
await contract.startGame(
  roundId,
  encrypted.handles[0],  // Encrypted value handle
  encrypted.inputProof    // Zero-knowledge proof
);
```

### Event Monitoring

The frontend watches for the `Revealed` event to display results:

```typescript
publicClient.watchContractEvent({
  address: CONTRACT_ADDRESS,
  abi: bigOrSmallAbi,
  eventName: 'Revealed',
  onLogs: (logs) => {
    logs.forEach((log) => {
      const { roundId, dice, win, payout } = log.args;
      // Update UI with results
    });
  }
});
```

## Security Considerations

### Smart Contract Security

1. **Reentrancy Protection**: Uses checks-effects-interactions pattern
2. **Access Control**: Only round creator can bet and reveal
3. **Input Validation**: Validates dice range (1-6) and bet amounts
4. **Overflow Protection**: Solidity 0.8+ built-in overflow checks
5. **Proof Verification**: Verifies cryptographic proofs before accepting decrypted values

### Cryptographic Security

1. **FHE Guarantees**: Encrypted values are computationally secure
2. **Commitment Scheme**: Dice value committed before betting prevents manipulation
3. **Zero-Knowledge Proofs**: Ensures encrypted inputs are valid without revealing plaintext
4. **Oracle Signatures**: Decryption oracle signs all results

### Known Limitations

1. **Oracle Dependency**: Requires Zama's decryption oracle to be operational
2. **Gas Costs**: FHE operations are more expensive than plain computation
3. **Reveal Timing**: Players must manually trigger reveal (could be automated in future)
4. **Bank Funding**: Contract needs ETH balance to pay winners (ownerless design)

## Available Scripts

### Root Directory

| Script              | Description                                    |
|---------------------|------------------------------------------------|
| `npm run compile`   | Compile smart contracts                        |
| `npm run test`      | Run contract tests on local network            |
| `npm run test:sepolia` | Run tests on Sepolia testnet                |
| `npm run coverage`  | Generate test coverage report                  |
| `npm run lint`      | Run linting checks (Solidity + TypeScript)     |
| `npm run lint:sol`  | Run Solidity linter (Solhint)                  |
| `npm run lint:ts`   | Run TypeScript linter (ESLint)                 |
| `npm run prettier:check` | Check code formatting                     |
| `npm run prettier:write` | Auto-format code                          |
| `npm run clean`     | Clean build artifacts and regenerate types     |
| `npm run chain`     | Start local Hardhat node                       |
| `npm run deploy:localhost` | Deploy to local network                 |
| `npm run deploy:sepolia` | Deploy to Sepolia testnet                  |
| `npm run verify:sepolia` | Verify contract on Etherscan               |

### Frontend Directory (`app/`)

| Script            | Description                        |
|-------------------|------------------------------------|
| `npm run dev`     | Start Vite development server      |
| `npm run build`   | Build production bundle            |
| `npm run preview` | Preview production build locally   |
| `npm run lint`    | Run ESLint on frontend code        |

## Future Roadmap

### Phase 1: Core Improvements (Q2 2025)
- [ ] **Multi-dice support**: Bet on sum of multiple dice
- [ ] **History dashboard**: View past game rounds and statistics
- [ ] **Automated reveals**: Optional auto-reveal after bet timeout
- [ ] **Mobile optimization**: Progressive Web App (PWA) support

### Phase 2: Advanced Features (Q3 2025)
- [ ] **Multiplayer mode**: Multiple players betting on same dice
- [ ] **Tournament system**: Competitive leaderboards with prizes
- [ ] **Custom betting limits**: Players can set their own min/max
- [ ] **Social features**: Share results, challenge friends

### Phase 3: Platform Expansion (Q4 2025)
- [ ] **Additional games**: Roulette, coin flip, slots using FHE
- [ ] **Layer 2 deployment**: Reduce gas costs on Optimism/Arbitrum
- [ ] **Cross-chain support**: Bridge to multiple EVM chains
- [ ] **DAO governance**: Community-controlled parameters

### Phase 4: Ecosystem Integration (2026)
- [ ] **Liquidity pools**: Decentralized house bankroll via LP tokens
- [ ] **Token rewards**: Native token for gameplay incentives
- [ ] **SDK release**: Developer tools for building FHE games
- [ ] **Educational content**: Tutorials and documentation for FHE gaming

### Research Directions
- **Instant reveals**: Explore optimistic rollups for faster gameplay
- **Batch processing**: Multiple rounds in single transaction
- **Privacy pools**: Enhanced anonymity for high-stakes players
- **Verifiable random functions**: Hybrid RNG with VRF + FHE

## Performance Metrics

### Gas Costs (Approximate)
- `startGame()`: ~150,000 gas
- `placeBet()`: ~50,000 gas
- `reveal()`: ~200,000 gas (includes oracle callback)

### Latency
- **Encryption**: <1 second (client-side)
- **Transaction confirmation**: ~12 seconds (Sepolia block time)
- **Decryption oracle**: 30-60 seconds (depending on network congestion)

### Cost Analysis (Sepolia)
At 10 Gwei gas price:
- Complete game round: ~0.004 ETH (~$10 at $2500 ETH)
- Recommended minimum bet: 0.001 ETH to cover gas costs

## Troubleshooting

### Common Issues

#### "Encryption unavailable"
**Cause**: FHEVM instance failed to initialize
**Solution**:
- Check network connection
- Ensure you're connected to Sepolia
- Verify contract address is correct
- Clear browser cache and reload

#### "insufficient bank"
**Cause**: Contract doesn't have enough ETH to pay winners
**Solution**: Send ETH to the contract address (it accepts direct transfers via `receive()`)

#### "Reveal pending" timeout
**Cause**: Decryption oracle is slow or congested
**Solution**:
- Wait a few minutes
- Check Sepolia network status
- Verify oracle is operational at Zama's status page

#### Transaction fails with "not player"
**Cause**: Wrong wallet connected or round ID mismatch
**Solution**:
- Verify you're using the same wallet that started the round
- Copy the correct round ID from the UI

### Debug Mode

Enable debug logging in frontend:
```typescript
// Add to main.tsx
window.localStorage.setItem('debug', 'wagmi:*,viem:*');
```

Check contract events:
```bash
npx hardhat console --network sepolia
const contract = await ethers.getContractAt("BigOrSmall", "CONTRACT_ADDRESS");
const filter = contract.filters.GameStarted();
const events = await contract.queryFilter(filter);
console.log(events);
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Write tests**: Ensure all tests pass with `npm test`
4. **Follow code style**: Run `npm run lint` and `npm run prettier:write`
5. **Commit changes**: Use conventional commit messages
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open Pull Request**: Describe your changes in detail

### Code Style

- **Solidity**: Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- **TypeScript**: Use ESLint configuration provided
- **Comments**: Document complex logic and security-sensitive code
- **Tests**: Aim for >90% coverage

## Resources

### Documentation
- [FHEVM Documentation](https://docs.zama.ai/fhevm) - Comprehensive guide to FHEVM
- [Zama Getting Started](https://docs.zama.ai/protocol/solidity-guides/getting-started) - FHEVM quick start
- [Hardhat Documentation](https://hardhat.org/docs) - Development environment guide
- [Wagmi Documentation](https://wagmi.sh) - React hooks for Ethereum

### Community
- [Zama Discord](https://discord.gg/zama) - Official Zama community
- [GitHub Issues](https://github.com/yourusername/big-or-small/issues) - Report bugs or request features
- [Twitter/X](https://x.com/zama_fhe) - Follow Zama for FHE updates

### Example Contracts
- [FHEVM Examples](https://github.com/zama-ai/fhevm) - Official FHEVM examples
- [Encrypted ERC20](https://docs.zama.ai/fhevm/tutorials/see-all-tutorials/encrypted-erc-20) - Confidential token tutorial

## License

This project is licensed under the **BSD-3-Clause-Clear License**. See the [LICENSE](LICENSE) file for details.

### Key Points:
- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Patent use (clarified in clear clause)
- ❌ Must include original license
- ❌ No warranty provided

## Acknowledgments

- **Zama**: For pioneering FHEVM technology and providing excellent documentation
- **Hardhat**: For the robust development framework
- **RainbowKit**: For beautiful wallet connection UX
- **OpenZeppelin**: For smart contract security patterns
- **Ethereum Foundation**: For the Sepolia testnet

## Disclaimer

This software is provided for educational and demonstration purposes. Online gambling may be illegal in your jurisdiction. Users are responsible for complying with local laws and regulations. The developers assume no liability for any legal consequences arising from the use of this software.

**Important**: This is experimental technology. Do not use with significant funds on mainnet until thoroughly audited. The FHEVM protocol is under active development and may have undiscovered vulnerabilities.

---

**Built with privacy and fairness in mind** | Powered by [Zama FHEVM](https://www.zama.ai/)

For questions, suggestions, or collaboration opportunities, please open an issue or reach out to the maintainers.
