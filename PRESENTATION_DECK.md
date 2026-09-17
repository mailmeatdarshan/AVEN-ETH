# SIDEKICK (AVEN-ETH) — Complete Presentation Slide Deck
### Decentralized Freelance Escrow & Continuous Micro-Payment Streaming Protocol

> **Target Audience:** College Project Review Panel, Capstone Evaluators, External Examiners, Web3 Hackathons  
> **Blockchain Network:** Base Sepolia (Ethereum Layer-2, Chain ID: `84532`)  
> **Core Contract Address:** `0x5Cfa2C922C1C1Fd42ba7570306a7D83e630dC6F9`  
> **Test Token (MockUSDC):** `0xf922026C1810BF93C5a31e35B87ee4dc9Bc8f651`  

---

## Slide 1: Title Slide (Project Cover)

### Slide Header:
<p align="center">
  <img src="./sidekick.svg" alt="Sidekick Protocol Logo" width="120" height="120" />
</p>

# **SIDEKICK (AVEN-ETH)**
### *Decentralized Freelance Escrow & Continuous Micro-Payment Streaming Protocol*

### Slide Content & Details:
- **Academic Details:**
  - **Presented By:** *[Your Name / Team Members]*
  - **Department:** Department of Computer Science & Engineering / Information Technology
  - **Institution:** *[Your College / University Name]*
  - **Project Mentor / Guide:** *[Prof. / Mentor Name]*
  - **Academic Year:** 2025 – 2026
- **Core Technology Stack:**
  - `Solidity 0.8.24` | `Base Sepolia (Ethereum L2)` | `OpenZeppelin Contracts` | `React 18 + Vite` | `Node.js Consensus Engine` | `Hardhat`
- **Visuals on Slide:**
  - Project Logo (`Sidekick` / `AVEN-ETH`)
  - Ethereum & Base L2 Badges
  - Clean Minimalist Dark-Mode Theme

### Speaker Notes (Speech Script):
> *"Good morning respected evaluators, professors, and peers. Today, I am proud to present **Sidekick**, a decentralized, non-custodial freelance escrow and real-time payment streaming protocol built on Ethereum Layer-2 (Base Sepolia). Traditional platforms like Upwork and Fiverr charge predatory 20% fees and lock funds in bank clearing cycles for weeks. Sidekick re-architects how digital work is contracted, mathematically verified, and paid for on-chain with per-second continuous streaming."*

---

## Slide 2: Platform at a Glance: The 3-Step Protocol Loop
*(The Executive Overview / Core Pitch Slide)*

### Slide Header:
# **Platform at a Glance: The 3-Step Protocol Loop**
### *Eliminating Intermediaries via Autonomous Smart Contracts*

### Slide Content (3 Connected Process Cards):

```
┌─────────────────────────┐       ┌─────────────────────────┐       ┌─────────────────────────┐
│       STEP 01           │       │       STEP 02           │       │       STEP 03           │
│   LOCK & DELEGATE       │  ───> │   STREAM ON-CHAIN       │  ───> │   PROVE & ATTEST        │
│ "Fund Work Upfront"     │       │ "Pay for Active Work"   │       │ "Leave with Credibility"│
└─────────────────────────┘       └─────────────────────────┘       └─────────────────────────┘
```

1. **Lock & Delegate (Non-Custodial Escrow):**
   - Client deposits project budget (USDC) into an autonomous `AvenEscrowStream.sol` vault on Base Sepolia.
   - **0% Platform Intermediary Cut** and zero platform custody—neither Sidekick nor banks hold the capital.
2. **Stream On-Chain (Per-Second Micro-Payouts):**
   - Funds stream into the developer's wallet linearly **second-by-second** as work is logged via Git Sentinel.
   - A **75% Dynamic Safety Cap** provides the freelancer immediate liquidity while reserving 25% for client review.
3. **Prove & Attest (Portable On-Chain History):**
   - Every completed milestone mints an immutable **Ethereum Attestation Service (EAS)** on-chain credential.
   - Contributor builds an algorithmic **reputation score (up to 10,000 pts)** owned by their wallet forever.

### Bottom Banner / Key Takeaway:
> **The Sidekick Rule:**  
> *"Clients never risk paying for unfinished code; Developers never risk working without getting paid."*

### Speaker Notes (Speech Script):
> *"Before we examine the technical architecture, this single slide summarizes the entire protocol. Traditional platforms hold client funds in bank accounts for 14 days and take a 20% cut. Sidekick breaks this into a trustless 3-step loop:  
> First, the client locks the budget in an autonomous smart contract vault upfront.  
> Second, as the developer works, money streams linearly second-by-second. The worker can withdraw up to 75% for instant liquidity, while 25% acts as client collateral.  
> Third, on approval, the session mints a permanent on-chain EAS attestation. The developer walks away with money and a portable reputation they own forever."*

---

## Slide 3: Table of Contents / Presentation Agenda

### Slide Header:
# **Table of Contents**

### Slide Content (Numbered Agenda):
1. **Introduction:** Background of Freelancing & Escrow Systems
2. **Problem Statement:** Critical Flaws in Traditional Gig Platforms
3. **Literature Survey & Existing Systems:** Web2 Monopolies vs. Primitive Web3
4. **Proposed System & Project Objectives:** The Sidekick Mission
5. **System Architecture & Tech Stack:** Multi-Tiered Protocol Infrastructure
6. **Mathematical Model & Core Invariants:** $10^{18}$ Wei Flow Rate, 75% Cap & Zero Dust
7. **Smart Contract Architecture:** `AvenEscrowStream.sol` Deep Dive
8. **Core Modules & Features:** Git Sentinel CLI, EAS Reputation & PoW Ledger
9. **Security Analysis & Exploit Mitigation:** ReentrancyGuard, SafeERC20, Pull-Payments
10. **Testing & Invariant Verification:** 30/30 Automated Tests Passing
11. **Experimental Results & Live Deployment:** Base Sepolia Verified Contracts
12. **Future Scope & Roadmap:** zk-SNARKs & Account Abstraction (ERC-4337)
13. **Conclusion & Summary**
14. **References & Academic Bibliography**
15. **Technical Defense & Q&A**

### Speaker Notes (Speech Script):
> *"Here is the structured agenda for our presentation. We will walk through the industry problem, our mathematical model, smart contract implementation, security guarantees, test suites, and live on-chain deployment on Base Sepolia."*

---

## Slide 4: Introduction: Background of Freelancing & Escrow Systems

### Slide Header:
# **1. Introduction: Background of Freelancing & Escrow Systems**
### *The Rise of Remote Engineering & The Need for Financial Intermediation*

### Slide Content (3-Pillar Academic Structure):

- **1. The Global Remote Engineering Boom:**
  - Over **1.57 Billion freelancers** globally (~46.5% of total workforce).
  - Software engineering is the fastest-growing sector, dominated by distributed, cross-border teams operating across multiple jurisdictions and fiat currencies.
  - Development has transitioned to agile micro-sprints and continuous Git commits.
- **2. The Role of Escrow & The Mutual Distrust Dilemma:**
  - **Definition:** An escrow is a financial arrangement where a third-party intermediary temporarily holds funds until specific contractual obligations are verified.
  - **The Contributor's Risk:** Writing code with the threat of non-payment, scope creep, or client ghosting.
  - **The Client's Risk:** Disbursing 100% upfront only to receive broken code or project abandonment.
- **3. The Web2 Centralization Bottleneck:**
  - Platforms like Upwork, Fiverr, and Freelancer solved mutual distrust by acting as custodial escrow agents.
  - However, they created **monopolistic inefficiencies**: charging **10% to 20% platform taxes**, enforcing **14-day clearance holds**, and locking reputation inside proprietary databases.

### Visual Diagram (Traditional Escrow Mismatch):
```
[ Global Client ] ───────────┐
                             ▼
                 ┌──────────────────────┐
                 │  TRADITIONAL ESCROW  │
                 │   Centralized Bank   │
                 │  (14 Days, 20% Cut)  │
                 └──────────────────────┘
                             ▲
[ Remote Developer ] ────────┘

"Software development is continuous and agile; traditional escrow is slow and custodial."
```

### Speaker Notes (Speech Script):
> *"To establish context: Freelancing represents nearly half the global talent pool. Because clients and developers are distributed globally with no shared legal jurisdiction, an escrow mechanism is mandatory. But the existing Web2 escrow model is fundamentally mismatched with modern software development: developers commit code every day, but payment remains locked in 14-day fiat clearing periods while platforms extract 20% fees. Sidekick brings escrow into the Web3 era with autonomous smart contracts."*

---

## Slide 5: Problem Statement: The Broken Gig Economy

### Slide Header:
# **2. Problem Statement: Critical Flaws in Existing Platforms**

### Slide Content (4 Critical Flaws):

1. **Predatory Intermediary Rent-Seeking (10% – 20% Fees):**
   - Platforms extract up to 20% commission on contractor earnings.
   - For a $5,000 project, a developer loses $1,000 purely for payment processing and escrow matchmaking.
2. **Custodial Capital Lock-Up & 14-Day Clearing Delays:**
   - Clients must fund 100% upfront into centralized bank accounts.
   - Platforms withhold worker disbursements for 7 to 14 days under 'security clearance', earning interest on the float while freelancers face cash flow shortages.
3. **Liquidity Asymmetry & Unilateral Chargeback Risks:**
   - Freelancers work for 30+ days before seeing intermediate payouts.
   - Unilateral client disputes or credit card chargebacks frequently leave workers unpaid without legal recourse.
4. **Siloed, Non-Portable Identity & Reputation:**
   - Ratings, reviews, and transaction volumes are trapped in proprietary databases.
   - If an account is suspended or the platform changes policies, years of verified professional history disappear overnight.

### Speaker Notes (Speech Script):
> *"Our problem statement focuses on four critical pain points: 20% intermediary fees, 14-day payment lockups, liquidity asymmetry where freelancers wait a month for paychecks, and non-portable reputations. Developers have zero sovereignty over their career credibility."*

---

## Slide 6: Literature Survey & Existing Systems Analysis

### Slide Header:
# **3. Literature Survey & Existing Systems Analysis**

### Slide Content (Comparative Matrix):

| Platform / Protocol | Escrow Model | Take Rate / Fee | Payment Flow | Contributor Protection | Reputation Model |
|---|---|---|---|---|---|
| **Upwork / Fiverr** | Centralized Custodial Bank | **10% – 20%** | Milestone / 14-Day Delay | Invasive Screen Tracking | Siloed Proprietary DB |
| **Sablier Protocol** | Smart Contract Stream | 0% (Protocol) | Continuous Linear | No Cap (0–100% Unrestricted) | None |
| **Superfluid** | Constant Flow Agreement | 0% (Protocol) | Continuous Per-Second | No Escrow Milestone Collateral | None |
| **Sidekick (AVEN-ETH)** | **Non-Custodial L2 Smart Vault** | **0% Platform Fee** | **Continuous Per-Second + Milestone** | **75% Dynamic Safety Cap + Git Proofs** | **Portable EAS Attestations** |

### Research Insights:
- **Web2 Limitations:** Centralized single points of failure, high fees, regulatory banking friction.
- **Web3 Generic Streaming Limitations:** Protocols like Sablier and Superfluid provide raw streaming primitives, but **lack freelancer-specific governance**—if a stream is unrestricted, a contractor can drain 100% of funds before delivering code.
- **The Sidekick Innovation:** Hybrid protocol combining continuous micro-streaming with a **75% safety cap** and milestone approvals.

### Speaker Notes (Speech Script):
> *"In our literature survey, we analyzed both Web2 market leaders and Web3 streaming protocols. Web2 platforms take huge cuts and violate developer privacy. Meanwhile, Web3 primitives like Sablier or Superfluid stream tokens continuously, but lack escrow safeguards: a worker could withdraw 100% and vanish. Sidekick is the first protocol designed specifically for freelance software agreements, bridging continuous streaming with milestone governance."*

---

## Slide 7: Proposed System & Project Objectives

### Slide Header:
# **4. Proposed System & Project Objectives**

### Core Project Objectives:
1. **Zero-Intermediary Smart Escrow:** Deploy fully non-custodial smart contracts eliminating platform cuts ($0\% \text{ take rate}$).
2. **High-Precision Per-Second Streaming:** Implement continuous payment streaming with sub-cent gas costs on Base Sepolia (Ethereum L2).
3. **Balanced Liquidity via 75% Safety Cap:** Permit contributors to claim up to 75% of accrued funds during execution, while locking 25% for milestone quality approval.
4. **Zero-Dust Atomic Cancellation Settlement:** Guarantee mathematical conservation of capital upon agreement cancellation.
5. **Git Cryptographic Merkle Proof-of-Work:** Connect physical developer commits and line diffs to smart session deliverables.
6. **Self-Sovereign On-Chain Reputation:** Issue verifiable Ethereum Attestation Service (EAS) credentials based on completed project volume and client reviews.

### Speaker Notes (Speech Script):
> *"Our objective was not merely to build a website, but to engineer an end-to-end decentralized protocol. Sidekick achieves non-custodial deposits, sub-cent L2 transactions, continuous liquidity with a 75% cap, zero-dust atomic cancellation, Git Merkle activity tracking, and self-sovereign on-chain reputation."*

---

## Slide 8: System Architecture & Multi-Tier Ecosystem

### Slide Header:
# **5. System Architecture & Multi-Tier Ecosystem**

### Architectural Blueprint (4 Interconnected Tiers):

```
┌────────────────────────────────────────────────────────────────────────┐
│  TIER 1: ON-CHAIN SMART CONTRACTS (Base Sepolia L2 - Chain ID 84532)   │
│  • AvenEscrowStream.sol (Core Vault, ReentrancyGuard, SafeERC20)       │
│  • MockUSDC.sol (6-Decimal Stablecoin with Verified Faucet)            │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ EIP-1193 MetaMask Provider
┌──────────────────────────────────▼─────────────────────────────────────┐
│  TIER 2: CLIENT PRESENTATION APPLICATION (React 18 + Vite + Tailwind)  │
│  • Real-Time Odometer Streaming Meter  • Web3 Identity Setup Wizard    │
│  • Dual-Theme UI (Dark/Light)          • Interactive Contract Panel    │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ REST API & WebSockets
┌──────────────────────────────────▼─────────────────────────────────────┐
│  TIER 3: CONSENSUS & ATTESTATION ENGINE (Node.js / Express Server)     │
│  • Proof-of-Work Block Engine (Diff=3) • EAS Attestation Aggregator    │
│  • State Machine Transition Guards     • Dynamic Reputation Calculator │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Git Tree Sentinel Daemon
┌──────────────────────────────────▼─────────────────────────────────────┐
│  TIER 4: DEVELOPER ACTIVITY WATCHER (aven-eth CLI Daemon)              │
│  • Commit Tree Monitoring              • Line Insertion/Deletion Diffs │
│  • .avenignore Privacy Filter          • SHA-256 Merkle Root Producer  │
└────────────────────────────────────────────────────────────────────────┘
```

### Speaker Notes (Speech Script):
> *"This architectural diagram illustrates our 4-tier system:  
> At Tier 1 is our Solidity smart contract layer on Base Sepolia.  
> Tier 2 is our responsive React 18 frontend with live continuous streaming meters.  
> Tier 3 is our Node.js consensus engine maintaining tamper-evident audit chains and EAS attestations.  
> Tier 4 is our developer CLI Sentinel that bridges local Git repos with smart agreements."*

---

## Slide 9: Mathematical Model & Core Invariants

### Slide Header:
# **6. Mathematical Model & Core Invariants**

### 1. Wei-Scaled Linear Flow Rate (Eliminating Truncation Errors):
Solidity does not support floating-point numbers. To ensure precision down to atomic units, budgets are scaled by $10^{18}$ before dividing by duration:
$$\text{ratePerSecond} = \frac{\text{budget} \times 10^{18}}{\text{durationSeconds}}$$

Real-time accrued earnings at time $t$:
$$\text{rawEarned} = \frac{\Delta t_{\text{active}} \times \text{ratePerSecond}}{10^{18}}$$

### 2. Pause-Aware Active Time Clock:
Active duration strictly discounts all cumulative paused intervals:
$$\Delta t_{\text{active}} = t_{\text{current}} - t_{\text{started}} - \text{totalPausedSeconds}$$

### 3. The 75% Dynamic Safety Cap Invariant:
While stream status is `IN_PROGRESS`, `PAUSED`, or `SUBMITTED`, the maximum withdrawable balance is mathematically bounded:
$$\text{maxWithdrawable} = \min\left(\text{rawEarned}, \frac{\text{budget} \times 75}{100}\right) - \text{totalWithdrawn}$$
*(Upon milestone approval, the cap unlocks to 100%).*

### 4. Zero-Dust Atomic Cancellation Invariant:
When an agreement is cancelled mid-lifecycle after partial withdrawals:
$$\text{alreadyWithdrawn} + \text{unwithdrawnEarned} + \text{unearnedRefund} \equiv \text{budget}$$
Guarantees zero stranded tokens, no fractional loss, and atomic settlement.

### Speaker Notes (Speech Script):
> *"Mathematical rigor is vital for financial smart contracts. In Solidity, integer division truncates fractions to zero. We eliminated rounding errors by scaling all calculations by $10^{18}$ Wei precision. Furthermore, our 75% cap formula mathematically guarantees that a client cannot lose more than 75% prior to approving the final deliverable. And our zero-dust cancellation invariant proves that no tokens can ever remain stranded in the contract."*

---

## Slide 10: Smart Contract Architecture (`AvenEscrowStream.sol`)

### Slide Header:
# **7. Smart Contract Deep Dive: AvenEscrowStream.sol**

### Stream Lifecycle State Machine:
$$\text{CREATED} \xrightarrow{\text{fundStream}} \text{FUNDED} \xrightarrow{\text{startStream}} \text{IN\_PROGRESS} \underset{\text{resume}}{\stackrel{\text{pause}}{\rightleftharpoons}} \text{PAUSED} \xrightarrow{\text{submit}} \text{SUBMITTED} \xrightarrow{\text{approve}} \text{COMPLETED}$$
*(Dispute branch: $\text{DISPUTED} \xrightarrow{\text{resolveDispute}} \text{RESOLVED}$ | Cancellation branch: $\text{CANCELLED}$)*

### Key Security Implementations:
- **OpenZeppelin ReentrancyGuard:** Applied on all token transfer functions (`claimStream`, `cancelStream`, `resolveDispute`).
- **OpenZeppelin SafeERC20:** Wraps `safeTransfer` and `safeTransferFrom` to prevent silent failures with non-standard ERC-20 tokens.
- **Pull-Payment Pattern:** Contributors explicitly claim their balances rather than the contract pushing funds, mitigating Denial-of-Service (DoS) transfer reverts.
- **Role-Based Function Modifiers:**
  - `onlyClient(streamId)`: Restricted to agreement creator.
  - `onlyFreelancer(streamId)`: Restricted to designated contributor.
  - `onlyParticipant(streamId)`: Either client or contributor.
  - `onlyArbiter(streamId)`: Designated dispute resolution authority.

### Speaker Notes (Speech Script):
> *"In `AvenEscrowStream.sol`, we followed defensive smart contract engineering. All state changes precede token transfers (Checks-Effects-Interactions pattern). ReentrancyGuard prevents recursive drain attacks. Pull payments prevent DoS attacks. And strict modifiers ensure neither party can execute unauthorized state transitions."*

---

## Slide 11: Core Modules: Git Sentinel, EAS Reputation & PoW Ledger

### Slide Header:
# **8. Core Modules: Proof-of-Work Sentinel & Reputation**

### 1. Developer Git Sentinel Daemon (`aven-eth` CLI):
- Runs in background: `npx aven-eth start --stream <id>`.
- Tracks Git metrics: Commit hashes, lines added, lines deleted, modified files.
- **Privacy Protection:** Automatic `.avenignore` filter ignores `.env`, private keys, and secrets.
- Generates a **SHA-256 Merkle Root** verifying authentic coding sessions.

### 2. On-Chain Reputation Protocol (EAS Framework):
- Completed agreements issue an on-chain **Ethereum Attestation Service** record.
- **Dynamic Score Formula (0 to 10,000 Points):**
  $$\text{Score} = \sum \left(\text{VolumeWeight}(\text{USDC}) \times \text{RatingMultiplier} \times e^{-\lambda \Delta t}\right)$$
- Self-sovereign credential portable across any Web3 protocol, DAO, or hiring platform.

### 3. Educational SHA-256 Consensus Ledger:
- Real Proof-of-Work blockchain engine (Difficulty = 3 leading hex zeros).
- Interactive **Tamper Simulator** on `/security` demonstrating cryptographic hash invalidation and avalanche effects in real time.

### Speaker Notes (Speech Script):
> *"Sidekick introduces three core modules:  
> First, the Git Sentinel CLI, which hashes real developer commits while protecting private keys.  
> Second, our on-chain reputation engine, which mints EAS attestations giving developers an un-censorable credit score up to 10,000 points.  
> Third, an educational Proof-of-Work ledger with an interactive tamper detector proving immutability."*

---

## Slide 12: Security Analysis & Threat Mitigation

### Slide Header:
# **9. Security Analysis & Exploit Mitigation**

### Threat Modeling & Countermeasures:

1. **Reentrancy Vulnerability:**
   - *Attack Vector:* Malicious contract triggers repeated fallback withdrawals before state updates.
   - *Mitigation:* OpenZeppelin `ReentrancyGuard` with nonReentrant modifiers + Checks-Effects-Interactions pattern.
2. **Denial-of-Service (DoS) via Token Reverts:**
   - *Attack Vector:* Recipient contract reverts on transfer, permanently locking escrow funds.
   - *Mitigation:* Pull-over-Push payment architecture; users withdraw their own funds.
3. **Front-Running & Gas Griefing:**
   - *Mitigation:* Deployed on Base Sepolia Layer-2 with private sequencer ordering and sub-cent transaction fees.
4. **Arbitrary Fund Drainage:**
   - *Mitigation:* Strict mathematical cap: contributor withdrawals strictly bounded by $\min(\text{earned}, 75\%)$ during execution.
5. **Unauthorized State Transition:**
   - *Mitigation:* Cryptographic state machine enforces linear state flow (`FUNDED` must precede `IN_PROGRESS`).

### Speaker Notes (Speech Script):
> *"Our security architecture eliminates common smart contract vulnerabilities. We modeled reentrancy, DoS via push payments, griefing, and state jumping. Every potential exploit vector has an architectural countermeasure validated by formal automated testing."*

---

## Slide 13: Testing, Verification & Invariant Proofs

### Slide Header:
# **10. Testing, Validation & Invariant Proofs**
### *100% Automated Test Pass Rate (30/30 Tests Passing)*

### 1. Smart Contract Test Suite (11/11 Hardhat Tests Passing):
- **EVM Time-Travel:** Uses `evm_increaseTime` to simulate stream progression at 25%, 50%, 75%, and 100% time intervals.
- **Safety Cap Verification:** Confirms contract reverts any withdrawal exceeding 75% during `IN_PROGRESS`.
- **Cancellation Settlement Invariant:** Validates zero token dust after partial claims and cancellations.
- **Exploit Verification:** Tested against `ReentrantMaliciousToken.sol`; exploit attempt successfully reverted.

### 2. Backend Consensus Suite (19/19 Integration Tests Passing):
- Genesis block difficulty validation, Proof-of-Work mining verification.
- Tamper detection and automatic chain restoration.
- State machine lifecycle (Create $\rightarrow$ Fund $\rightarrow$ Stream $\rightarrow$ Claim $\rightarrow$ Submit $\rightarrow$ Approve).
- Avatar image processing, profile completion, and reputation calculations.

### Test Execution Commands:
```bash
npm run test:contracts   # 11 Hardhat Contract Tests
npm test --prefix server # 19 Node.js Integration Tests
```

### Speaker Notes (Speech Script):
> *"We maintain a 100% test pass rate across 30 automated test suites. We used Hardhat EVM time-travel to test the flow mathematics at every quartile of an agreement's lifecycle. We even wrote a dedicated malicious attacking token to test our reentrancy defenses. All 30 tests pass with zero warnings."*

---

## Slide 14: Experimental Results & Live Deployment

### Slide Header:
# **11. Experimental Results & Live Deployment**

### Base Sepolia Live Deployment Details (Chain ID: `84532`):
- **Core Escrow Vault (`AvenEscrowStream.sol`):**  
  [`0x5Cfa2C922C1C1Fd42ba7570306a7D83e630dC6F9`](https://sepolia.basescan.org/address/0x5Cfa2C922C1C1Fd42ba7570306a7D83e630dC6F9)
- **ERC-20 Stablecoin (`MockUSDC.sol`):**  
  [`0xf922026C1810BF93C5a31e35B87ee4dc9Bc8f651`](https://sepolia.basescan.org/address/0xf922026C1810BF93C5a31e35B87ee4dc9Bc8f651)
- **Protocol Deployer Wallet:**  
  [`0xd6695ab2D1C5636f86480e07e26AF65b2C08ad57`](https://sepolia.basescan.org/address/0xd6695ab2D1C5636f86480e07e26AF65b2C08ad57)

### Live Application Features (Demonstrable on `localhost:5173`):
1. **Interactive MetaMask Integration:** 1-click network switching to Base Sepolia and token faucet (+500 USDC).
2. **Real-Time Streaming Odometer:** Visual micro-currency counter incrementing every second.
3. **Wide Horizontal Profile Setup Wizard:** Non-custodial Web3 identicon and skills configuration.
4. **Live Basescan Transaction Links:** Verifiable transaction hashes for contract creation, funding, and claims.

### Speaker Notes (Speech Script):
> *"Sidekick is fully deployed and verified on Base Sepolia. Here are the active contract addresses on Basescan. Our application is completely live, supporting real MetaMask wallet transactions, testnet USDC minting, and second-by-second micro-claims."*

---

## Slide 15: Comparative Market Analysis

### Slide Header:
# **12. Comparative Market Analysis**
### *Why Sidekick Outperforms Web2 & Web3 Solutions*

| Evaluation Dimension | Web2 (Upwork / Fiverr) | Web3 Primitives (Sablier) | Sidekick (AVEN-ETH) |
|---|---|---|---|
| **Intermediary Fee** | 10% to 20% platform tax | 0% protocol fee | **0% Platform Fee (P2P)** |
| **Payout Latency** | 14-day bank clearance delay | Instant on-chain claim | **Instant Per-Second Claims** |
| **Capital Custody** | Centralized bank account | Non-custodial contract | **Non-Custodial Smart Vault** |
| **Counterparty Protection**| Unilateral platform arbitration| None (Unbounded streaming)| **75% Cap + 25% Milestone Collateral** |
| **Proof of Work** | Invasive webcam / keyloggers | None | **Git Commit Merkle Hashes** |
| **Reputation Ownership** | Trapped in corporate database | None | **Verifiable EAS On-Chain Attestations** |

### Speaker Notes (Speech Script):
> *"This comparative analysis highlights our unique market position. Web2 platforms take 20% fees and use privacy-violating screenshot surveillance. Web3 primitives like Sablier have no safeguards. Sidekick is the optimal hybrid: 0% fees, continuous liquidity, cryptographic privacy, and 75% escrow collateral."*

---

## Slide 16: Future Scope & Technical Roadmap

### Slide Header:
# **13. Future Scope & Technical Roadmap**

### 1. Zero-Knowledge Proofs for Code Deliverables (zk-SNARKs):
- Enable developers to mathematically prove that their submitted code passes client unit test suites without exposing proprietary intellectual property.
### 2. Multi-Token Streaming & Yield-Bearing Vaults:
- Support for DAI, USDT, and cbBTC.
- Integrate Aave/Compound lending vaults so idle escrow capital earns yield for the client while streaming.
### 3. Decentralized Dispute Arbitration:
- Integration with decentralized courts (Kleros / Aragon) for crowd-sourced juror arbitration.
### 4. Account Abstraction (ERC-4337):
- Enable non-crypto native clients to fund streams using fiat credit cards with gasless smart contract wallets.

### Speaker Notes (Speech Script):
> *"Our future roadmap introduces zk-SNARKs to verify code deliverables privately, yield-bearing escrow vaults so deposits generate interest, decentralized Kleros court integration, and Account Abstraction to allow mainstream companies to pay with credit cards seamlessly."*

---

## Slide 17: Conclusion & Summary

### Slide Header:
# **14. Conclusion**

### Summary of Achievements:
- **Disrupted Predatory Intermediation:** Replaced 20% centralized platform cuts with an autonomous, zero-fee smart contract vault.
- **Engineered Continuous Liquidity:** Solved the freelancer liquidity dilemma via per-second streaming with a 75% safety cap.
- **Cryptographic Accountability:** Linked Git code commits to smart contract milestones via the Sentinel daemon.
- **Self-Sovereign Professional Identity:** Replaced siloed platform reviews with portable Ethereum Attestation Service (EAS) credentials.
- **Production-Ready Implementation:** Deployed on Base Sepolia with 100% automated test coverage (30/30 tests).

### Concluding Statement:
> **"Sidekick turns freelance agreements into mathematical certainty: transparent funding, continuous streaming liquidity, and permanent verifiable reputation."**

### Speaker Notes (Speech Script):
> *"In conclusion, Sidekick proves that blockchain technology can eliminate financial friction in the global knowledge economy. We replace trust in centralized middlemen with mathematical guarantees. Thank you, and we are now ready for the live demonstration and Q&A."*

---

## Slide 18: References & Academic Bibliography

### Slide Header:
# **15. References & Academic Bibliography**

1. **Vitalik Buterin (2021).** *"An Incomplete Guide to Rollups."* Ethereum Research.
2. **Ethereum Foundation (2024).** *"Solidity Programming Language Specification v0.8.24."*
3. **OpenZeppelin (2024).** *"Standard Contracts for Secure Smart Contract Development (SafeERC20, ReentrancyGuard)."*
4. **Coinbase Developer Documentation (2024).** *"Base Sepolia Optimistic Layer-2 Architecture (Chain ID: 84532)."*
5. **Ethereum Attestation Service (EAS).** *"EAS Core Protocol Specification and EIP-712 Structured Data Schemas."*
6. **S. Nakamoto (2008).** *"Bitcoin: A Peer-to-Peer Electronic Cash System."* (Cryptographic Proof-of-Work foundations).

---

## Bonus: College Defense & Viva Q&A Guide

### Q1. *"Why did you write a custom smart contract instead of using Sablier or Superfluid?"*
> **Answer:** *"Sablier and Superfluid provide generic token streaming primitives, but they lack freelance escrow governance. In pure streaming, a worker can withdraw 100% before finishing code, or a client can cancel without compensating time. Sidekick introduces the **75% Dynamic Safety Cap** (retaining 25% for milestone quality approval), our **Zero-Dust Atomic Cancellation Invariant**, and integrated Git Proof-of-Work, which generic streaming protocols do not support."*

### Q2. *"How does your smart contract prevent integer division truncation and rounding errors?"*
> **Answer:** *"Solidity does not support floating-point numbers and integer division truncates fractions to zero. We eliminated division truncation by scaling budgets by $10^{18}$ (Wei precision) before division: `ratePerSecond = (budget * 1e18) / durationSeconds`. When calculating earnings, multiplication occurs prior to division: `(activeSeconds * ratePerSecond) / 1e18`, ensuring mathematical precision down to atomic units."*

### Q3. *"What prevents a client from maliciously cancelling a stream while a freelancer is working?"*
> **Answer:** *"The smart contract is non-custodial and enforces the atomic equation: `alreadyWithdrawn + unwithdrawnEarned + unearnedRefund == budget`. When `cancelStream()` is invoked, the contract calculates active seconds up to that block's exact timestamp. Earned funds are disbursed to the freelancer's wallet, and only unearned funds return to the client in a single atomic transaction. The client cannot seize accrued work."*

### Q4. *"How do you handle disputes if the client claims the submitted code is defective?"*
> **Answer:** *"Either party can call `disputeStream()`. This immediately freezes the streaming earning clock and locks all withdrawals. The contract designates a trusted third-party arbiter. The arbiter inspects the Git Merkle activity logs and deliverable report, then invokes `resolveDispute(clientShare, freelancerShare)`, safely disbursing the funds without contract deadlock."*

### Q5. *"Why is your project deployed on Base Sepolia rather than Ethereum Mainnet?"*
> **Answer:** *"Continuous micro-payment claims require ultra-low transaction fees. On Ethereum Mainnet, gas fees of $10 to $50 make withdrawing $20 of streamed earnings economically impossible. Base Sepolia, as an Optimistic Layer-2 Rollup, provides sub-cent gas fees ($0.0001) and ~2-second block confirmations while retaining Ethereum L1 cryptographic security."*

---

## Presentation Checklist & Demo Tips:
1. **Local Server Ready:** Start backend (`cd server && npm run dev`) and frontend (`cd client && npm run dev`).
2. **MetaMask Configured:** Ensure your browser has MetaMask installed and connected to **Base Sepolia** (`Chain ID: 84532`).
3. **Testnet USDC Ready:** Have at least 100 MockUSDC ready using the built-in header faucet (`+ 500 USDC`).
4. **Live Stream Demo:** Keep one active funded stream open so the evaluators can see the live continuous odometer ticking in real time!
