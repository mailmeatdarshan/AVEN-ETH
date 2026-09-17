---
theme: default
title: "Sidekick: Autonomous Freelance Escrow"
titleTemplate: "%s"
favicon: /sidekick.svg
info: false
colorSchema: auto
transition: slide-left
class: text-left
fonts:
  sans: Radio Canada Big
  serif: Source Serif 4
  mono: Geist Mono
---

<ThemeToggle class="abs-tr m-5 z-50" />

<div class="title-hero pt-4">
  <div class="pill mb-4 border-blue-200 text-blue-600 bg-blue-50">
    <img src="/base.svg" class="w-3.5 h-3.5 inline-block mr-1" />
    BASE SEPOLIA LAYER-2 &bull; FINAL CAPSTONE DEFENSE 2026
  </div>

# Sidekick:<br>Autonomous Freelance Escrow

</div>

<div class="subtitle text-xl mt-3 text-stone-600 font-light max-w-2xl">
  Continuous linear micro-payment streaming, cryptographic Git proof-of-work, and zero-fee non-custodial smart contracts.
</div>

<div class="flex items-center gap-2.5 mt-6 flex-wrap">
  <span class="pill bg-white shadow-sm border border-stone-200 text-stone-800">
    <img src="/solidity.svg" class="w-3.5 h-3.5 mr-1 inline-block" /> Solidity 0.8.24
  </span>
  <span class="pill bg-emerald-50 text-emerald-700 border border-emerald-200">
    <img src="/usdc.svg" class="w-3.5 h-3.5 mr-1 inline-block" /> 0% Protocol Fee
  </span>
  <span class="pill bg-indigo-50 text-indigo-700 border border-indigo-200">
    <img src="/ethereum.svg" class="w-3.5 h-3.5 mr-1 inline-block" /> EAS Attestations
  </span>
  <span class="pill bg-purple-50 text-purple-700 border border-purple-200">
    75% Dynamic Safety Cap
  </span>
</div>

<div class="abs-br m-10 flex items-center gap-4">
  <a href="https://github.com/mailmeatdarshan/AVEN-ETH" target="_blank" class="flex items-center gap-2 text-stone-500 hover:text-stone-900 font-mono text-xs">
    <carbon-logo-github class="text-lg" /> github.com/mailmeatdarshan/AVEN-ETH
  </a>
</div>

<style>
.title-hero h1 {
  font-family: "Source Serif 4", Georgia, serif;
  font-size: 4.4rem;
  line-height: 1.04;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: var(--ink);
}
.subtitle {
  font-family: "Radio Canada Big", sans-serif;
  color: var(--ink-dim);
}
</style>

<!--
Good morning respected evaluators and peers. Today, we present Sidekick (AVEN-ETH), an autonomous freelance escrow and real-time payment streaming protocol on Base Sepolia.
Traditional platforms extract 20% fees and lock funds in bank clearing for 14 days. Sidekick solves this with second-by-second streaming and cryptographic proof-of-work.
-->

---
layout: center
title: Part 1 - The Broken Gig Economy
---

<ThemeToggle class="abs-tr m-5 z-50" />

<SectionCard
  kicker="Part one"
  title="The Broken Gig Economy"
  art="/sidekick.svg"
>
  <div class="sc-list">
    <span>The $450B market failure in traditional freelance platforms</span>
    <span>Literature survey: Web2 custody vs uncapped Web3 streaming</span>
    <span>The 3-Step Protocol Loop: Lock, Stream, Prove</span>
  </div>
</SectionCard>

<!--
In part one, we analyze the structural flaws in existing platforms, survey Web2 and Web3 alternatives, and introduce Sidekick's core state machine.
-->

---
layout: center
class: text-center
title: The Broken Economy
---

<ThemeToggle class="abs-tr m-5 z-50" />

<div class="but">The freelance economy is structurally broken.</div>

<div class="claims">
  <div
    v-click="1"
    v-motion
    :initial="{ x: -40, opacity: 0 }"
    :enter="{ x: 0, opacity: 1, transition: { duration: 400 } }"
    class="claim-row"
  >
    <span class="narrow" v-mark.strike-through.red="1">Upwork / Fiverr 20% Tax</span>
    <span class="arrow">is re-engineered into</span>
    <span class="broad" v-mark.underline.blue="1">0% Protocol Take-Rate</span>
  </div>

  <div
    v-click="2"
    v-motion
    :initial="{ x: -40, opacity: 0 }"
    :enter="{ x: 0, opacity: 1, transition: { duration: 400 } }"
    class="claim-row"
  >
    <span class="narrow" v-mark.strike-through.red="2">14-Day Bank Clearing Holds</span>
    <span class="arrow">is re-engineered into</span>
    <span class="broad" v-mark.underline.emerald="2">Per-Second Continuous Streaming</span>
  </div>

  <div
    v-click="3"
    v-motion
    :initial="{ x: -40, opacity: 0 }"
    :enter="{ x: 0, opacity: 1, transition: { duration: 400 } }"
    class="claim-row"
  >
    <span class="narrow" v-mark.strike-through.red="3">Invasive Webcam Spyware</span>
    <span class="arrow">is re-engineered into</span>
    <span class="broad" v-mark.underline.amber="3">Cryptographic Git Sentinel PoW</span>
  </div>

  <div
    v-click="4"
    v-motion
    :initial="{ x: -40, opacity: 0 }"
    :enter="{ x: 0, opacity: 1, transition: { duration: 400 } }"
    class="claim-row"
  >
    <span class="narrow" v-mark.strike-through.red="4">Siloed Walled-Garden Reviews</span>
    <span class="arrow">is re-engineered into</span>
    <span class="broad" v-mark.underline.purple="4">Portable EAS On-Chain Attestations</span>
  </div>
</div>

<style>
.but {
  font-family: "Source Serif 4", Georgia, serif;
  font-size: 2.2rem;
  margin-bottom: 2.2rem;
  color: var(--ink);
}
</style>

<!--
Traditional platforms exploit their monopoly. We address every pain point: 20% fee becomes 0%, 14-day hold becomes per-second streaming, invasive spyware becomes Git Merkle verification.
-->

---

<ThemeToggle class="abs-tr m-5 z-50" />

# Literature Survey: Web2 vs Web3 Primitives

Why existing Web2 platforms and existing Web3 streaming protocols both fall short:

<div class="mt-4 overflow-x-auto">
<table class="w-full text-xs text-left border border-stone-200 rounded-xl overflow-hidden shadow-sm bg-white">
  <thead class="bg-stone-100 text-stone-700 uppercase font-mono text-[10px] tracking-wider border-b border-stone-200">
    <tr>
      <th class="p-3">Platform / Protocol</th>
      <th class="p-3">Escrow Model</th>
      <th class="p-3">Take Rate</th>
      <th class="p-3">Payout Frequency</th>
      <th class="p-3">Client Protection</th>
      <th class="p-3">Reputation Model</th>
    </tr>
  </thead>
  <tbody class="divide-y divide-stone-100 text-stone-700 text-xs">
    <tr v-click="1" class="hover:bg-stone-50">
      <td class="p-3 font-semibold text-red-600">Upwork / Fiverr</td>
      <td class="p-3">Centralized Bank Custody</td>
      <td class="p-3 text-red-600 font-bold">10% &ndash; 20%</td>
      <td class="p-3">14-Day Clearing Delay</td>
      <td class="p-3">Invasive Keyloggers</td>
      <td class="p-3 text-stone-500">Siloed Proprietary DB</td>
    </tr>
    <tr v-click="2" class="hover:bg-stone-50">
      <td class="p-3 font-semibold text-blue-600">Sablier Protocol</td>
      <td class="p-3">Generic ERC-20 Stream</td>
      <td class="p-3 text-emerald-600 font-bold">0%</td>
      <td class="p-3">Per-Second Linear</td>
      <td class="p-3 text-red-600 font-semibold">None (0&ndash;100% Uncapped)</td>
      <td class="p-3 text-stone-400">None</td>
    </tr>
    <tr v-click="3" class="hover:bg-stone-50">
      <td class="p-3 font-semibold text-indigo-600">Superfluid</td>
      <td class="p-3">Constant Flow Agreement</td>
      <td class="p-3 text-emerald-600 font-bold">0%</td>
      <td class="p-3">Continuous Flow</td>
      <td class="p-3 text-red-600 font-semibold">No Milestone Collateral</td>
      <td class="p-3 text-stone-400">None</td>
    </tr>
    <tr v-click="4" class="bg-blue-50/70 border-2 border-blue-500 font-medium">
      <td class="p-3 font-bold text-blue-900 flex items-center gap-1.5">
        <img src="/sidekick.svg" class="w-4 h-4" />
        Sidekick (AVEN-ETH)
      </td>
      <td class="p-3 text-blue-900 font-semibold">Non-Custodial L2 Vault</td>
      <td class="p-3 text-emerald-700 font-black"><span v-mark.box.emerald="4">0% Protocol Fee</span></td>
      <td class="p-3 text-blue-900">Per-Second $10^{18}$ Stream</td>
      <td class="p-3 text-blue-900 font-bold"><span v-mark.circle.blue="4">75% Cap + 25% Collateral</span></td>
      <td class="p-3 text-purple-900 font-bold">Portable EAS Attestation</td>
    </tr>
  </tbody>
</table>
</div>

<div class="grid grid-cols-2 gap-4 mt-5 text-xs">
  <div v-click="5" class="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900">
    <strong class="font-bold text-red-700 block mb-1">The Web3 Streaming Dilemma:</strong>
    Protocols like Sablier provide raw streams but lack escrow governance. An uncapped developer can drain 100% of funds before pushing code.
  </div>
  <div v-click="6" class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
    <strong class="font-bold text-emerald-700 block mb-1">The Sidekick Solution:</strong>
    Bridges continuous micro-streaming with a mathematical <strong>75% dynamic safety cap</strong> and milestone quality approvals.
  </div>
</div>

<!--
In our literature survey, we found that Web2 platforms charge exorbitant fees while Web3 streaming protocols lack escrow safeguards. Sidekick combines the best of both worlds.
-->

---

<ThemeToggle class="abs-tr m-5 z-50" />

# The 3-Step Protocol Loop

How agreements move trustlessly through autonomous smart contract state transitions:

<div class="grid grid-cols-3 gap-5 mt-6">
  <div
    v-click="1"
    v-motion
    :initial="{ y: 50, opacity: 0, scale: 0.95 }"
    :enter="{ y: 0, opacity: 1, scale: 1, transition: { duration: 400 } }"
    class="card-editorial hover:border-blue-400 transition"
  >
    <div class="flex items-center justify-between mb-2">
      <span class="text-3xl font-serif text-blue-600 font-bold">01</span>
      <span class="pill bg-blue-50 text-blue-700 text-[10px]">ESCROW</span>
    </div>
    <h3 class="text-base font-bold text-stone-900 mb-1">Lock &amp; Delegate</h3>
    <p class="text-xs text-blue-700 font-mono mb-3">Client Funds Vault Upfront</p>
    <ul class="text-xs text-stone-600 space-y-2 list-disc list-inside">
      <li>Client deposits USDC into <code class="text-[11px] bg-stone-100 px-1 py-0.5 rounded">AvenEscrowStream.sol</code></li>
      <li><strong class="text-emerald-700"><span v-mark.underline.blue="1">0% Protocol Fee</span></strong> deducted</li>
      <li>Non-custodial smart vault on Base Sepolia</li>
    </ul>
  </div>

  <div
    v-click="2"
    v-motion
    :initial="{ y: 50, opacity: 0, scale: 0.95 }"
    :enter="{ y: 0, opacity: 1, scale: 1, transition: { delay: 100, duration: 400 } }"
    class="card-editorial hover:border-indigo-400 transition"
  >
    <div class="flex items-center justify-between mb-2">
      <span class="text-3xl font-serif text-indigo-600 font-bold">02</span>
      <span class="pill bg-indigo-50 text-indigo-700 text-[10px]">STREAM</span>
    </div>
    <h3 class="text-base font-bold text-stone-900 mb-1">Stream On-Chain</h3>
    <p class="text-xs text-indigo-700 font-mono mb-3">Continuous Micro-Accrual</p>
    <ul class="text-xs text-stone-600 space-y-2 list-disc list-inside">
      <li>Real-time accrual at $10^{18}$ Wei precision</li>
      <li><strong class="text-blue-700"><span v-mark.underline.indigo="2">75% Dynamic Safety Cap</span></strong> for liquidity</li>
      <li>25% collateral locked for milestone review</li>
    </ul>
  </div>

  <div
    v-click="3"
    v-motion
    :initial="{ y: 50, opacity: 0, scale: 0.95 }"
    :enter="{ y: 0, opacity: 1, scale: 1, transition: { delay: 200, duration: 400 } }"
    class="card-editorial hover:border-purple-400 transition"
  >
    <div class="flex items-center justify-between mb-2">
      <span class="text-3xl font-serif text-purple-600 font-bold">03</span>
      <span class="pill bg-purple-50 text-purple-700 text-[10px]">VERIFY</span>
    </div>
    <h3 class="text-base font-bold text-stone-900 mb-1">Prove &amp; Attest</h3>
    <p class="text-xs text-purple-700 font-mono mb-3">Reputation Minting</p>
    <ul class="text-xs text-stone-600 space-y-2 list-disc list-inside">
      <li>Git Sentinel CLI logs commit tree hashes</li>
      <li>Mints immutable <strong><span v-mark.circle.purple="3">EAS Attestation</span></strong></li>
      <li>Permanent developer credibility score</li>
    </ul>
  </div>
</div>

<!--
The 3-step loop: Lock & Delegate upfront, Stream On-Chain with a 75% cap, and Prove & Attest upon completion to build portable on-chain reputation.
-->

---
layout: center
title: Part 2 - Smart Contracts & Mathematics
---

<ThemeToggle class="abs-tr m-5 z-50" />

<SectionCard
  kicker="Part two"
  title="Smart Contracts & Mathematics"
  art="/solidity.svg"
>
  <div class="sc-list">
    <span>Protocol Lifecycle: fundStream, claimStream &amp; approveStream</span>
    <span>Core Invariant: claimStream security mutex &amp; 75% safety cap</span>
    <span>Interactive streaming simulator: $10^{18}$ Wei accounting</span>
    <span>Mathematical model &amp; Zero-Dust conservation invariant</span>
  </div>
</SectionCard>

<!--
In part two, we examine the smart contract architecture, walk through the 75% safety cap invariant, demonstrate an interactive simulator, and prove mathematical conservation.
-->

---

<ThemeToggle class="abs-tr m-5 z-50" />

# Smart Contract Architecture

<div class="flex items-center gap-2 mb-2 font-mono text-xs text-blue-700">
  <img src="/solidity.svg" class="w-3.5 h-3.5" />
  AvenEscrowStream.sol &mdash; Protocol Lifecycle in 3 Functions
</div>

<div class="grid grid-cols-2 gap-6 items-start mt-2">
<div>

<div class="code-contract">

````md magic-move {lines: true}
```solidity
// Step 1: Client funds escrow stream
function fundStream(
    address freelancer,
    uint256 budget,
    uint256 duration
) external returns (bytes32 streamId) {
    token.safeTransferFrom(msg.sender, address(this), budget);
    streamId = keccak256(abi.encodePacked(
        msg.sender, freelancer, block.timestamp
    ));
    streams[streamId] = Stream({
        client: msg.sender,
        freelancer: freelancer,
        budget: budget,
        startTime: block.timestamp,
        duration: duration,
        withdrawn: 0,
        status: Status.FUNDED
    });
}
```
```solidity
// Step 2: Freelancer claims accrued stream
function claimStream(bytes32 id, uint256 amount)
    external nonReentrant onlyFreelancer(id)
{
    Stream storage s = streams[id];
    uint256 earned = calculateEarned(id);

    // 75% Dynamic Safety Cap Invariant
    uint256 cap = (s.status == Status.COMPLETED)
        ? s.budget : (s.budget * 75) / 100;
    require(s.withdrawn + amount <= min(earned, cap),
        "Exceeds 75% safety cap");

    s.withdrawn += amount;
    token.safeTransfer(msg.sender, amount);
    emit StreamClaimed(id, msg.sender, amount);
}
```
```solidity
// Step 3: Client approves & mints EAS
function approveStream(bytes32 id, uint8 rating)
    external onlyClient(id)
{
    Stream storage s = streams[id];
    require(s.status == Status.IN_PROGRESS);
    s.status = Status.COMPLETED;

    // Release remaining 25% collateral
    uint256 remaining = s.budget - s.withdrawn;
    token.safeTransfer(s.freelancer, remaining);

    // Mint immutable EAS attestation
    eas.attest(s.freelancer, rating, s.budget);
    emit StreamCompleted(id, rating);
}
```
````

</div>

</div>
<div>

<RoughLifecycleNote :stage="$clicks" />

</div>
</div>

<!--
Watch the smart contract morph smoothly across its 3 lifecycle stages: fundStream locks the vault, claimStream enforces the 75% safety cap, and approveStream settles the final collateral and mints the EAS attestation.
-->

---

<ThemeToggle class="abs-tr m-5 z-50" />

# Core Invariant: claimStream Logic

<div class="flex items-center gap-2 mb-2 font-mono text-xs text-blue-700">
  <img src="/solidity.svg" class="w-4 h-4" />
  AvenEscrowStream.sol &mdash; Security Mutex &amp; Dynamic Safety Cap Walkthrough
</div>

<div class="grid grid-cols-2 gap-6 items-start mt-2">
<div>

<div class="code-contract">

```solidity {all|2-5|7-8|10-16|18-20|all}
// AvenEscrowStream.sol — Continuous Micro-Payment Claim
function claimStream(bytes32 id, uint256 amount)
    external
    nonReentrant
    onlyFreelancer(id)
{
    Stream storage s = streams[id];
    uint256 earned = calculateEarned(id);

    // 75% Dynamic Safety Cap Invariant
    uint256 maxAllowed = (s.status == Status.COMPLETED)
        ? s.budget
        : (s.budget * 75) / 100;

    uint256 claimLimit = min(earned, maxAllowed);
    require(s.withdrawn + amount <= claimLimit, "Exceeds cap");

    s.withdrawn += amount;
    token.safeTransfer(msg.sender, amount);
    emit StreamClaimed(id, msg.sender, amount);
}
```

</div>

</div>
<div>

<RoughCodeNote :stage="$clicks" />

</div>
</div>

<!--
Here is the core claimStream function line-by-line: notice how it checks permissions, calculates real-time earnings, strictly clamps to the 75% cap, and securely transfers funds using the CEI pattern.
-->

---

<ThemeToggle class="abs-tr m-5 z-50" />

# Interactive Live Streaming Simulator

Test the $10^{18}$ flow rate, 75% dynamic safety cap, and on-demand claims right inside the slide:

<div class="mt-4 max-w-2xl mx-auto">
  <StreamSimulator />
</div>

<div class="grid grid-cols-3 gap-3 mt-4 text-xs text-stone-600 max-w-2xl mx-auto text-center font-mono">
  <div class="p-2.5 rounded-xl bg-white border border-stone-200 shadow-sm">
    <span class="text-blue-700 font-bold block">1. Click Start</span>
    Simulate per-second micro-accrual
  </div>
  <div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
    <span class="text-emerald-700 font-bold block">2. Observe 75% Cap</span>
    Max claim stops at 375.00 USDC
  </div>
  <div class="p-2.5 rounded-xl bg-purple-50 border border-purple-200">
    <span class="text-purple-700 font-bold block">3. Click Claim</span>
    Instant withdrawal settled to wallet
  </div>
</div>

<!--
Evaluators can test the streaming math live right inside the slide.
-->

---

<ThemeToggle class="abs-tr m-5 z-50" />

# Mathematical Model & Invariants

High-precision integer EVM accounting &amp; terminal conservation proofs:

<div class="grid grid-cols-2 gap-8 mt-4">
<div>

### <span v-mark.underline.blue="1">1. Wei-Scaled Flow Rate</span>
Eliminates division truncation errors via $10^{18}$ scaling:

$$
\text{ratePerSec} = \frac{\text{budget} \times 10^{18}}{\Delta t_{\text{total}}}
$$

### <span v-mark.underline.indigo="2">2. Pause-Aware Active Clock</span>
Strictly discounts cumulative paused intervals:

$$
\Delta t_{\text{active}} = t_{\text{now}} - t_{\text{start}} - \sum \Delta t_{\text{paused}}
$$

</div>
<div>

### <span v-mark.underline.amber="3">3. The 75% Dynamic Safety Cap</span>
Bounds active claims, retaining 25% milestone collateral:

$$
\text{maxClaimable} = \min\!\left(\text{earned},\, \frac{\text{budget} \times 75}{100}\right) - W
$$

### <span v-mark.box.emerald="4">4. Zero-Dust Conservation Invariant</span>
Guarantees zero stranded tokens on terminal state settlement:

$$
W_{\text{claimed}} + E_{\text{unwithdrawn}} + R_{\text{refund}} \equiv \text{budget}
$$

</div>
</div>

<!--
Solidity truncates fractions. We eliminated rounding errors by scaling by 10^18. Both columns are perfectly aligned horizontally and vertically.
-->

---
layout: center
title: Part 3 - Ecosystem & Live Defense
---

<ThemeToggle class="abs-tr m-5 z-50" />

<SectionCard
  kicker="Part three"
  title="Ecosystem & Live Defense"
  art="/base.svg"
>
  <div class="sc-list">
    <span>Developer Git Sentinel CLI: Non-invasive SHA-256 commit tracking</span>
    <span>Security threat model: Reentrancy &amp; Pull-over-Push defenses</span>
    <span>Live Base Sepolia deployment with interactive scan-ready QR code</span>
  </div>
</SectionCard>

<!--
In part three, we explore the Git Sentinel daemon, threat modeling, and conclude with the live deployment on Base Sepolia.
-->

---

<ThemeToggle class="abs-tr m-5 z-50" />

# Developer Git Sentinel CLI

### *Cryptographic Proof-of-Work Sentinel*

Background daemon connecting developer Git activity with smart contract milestones without spyware:

<div class="grid grid-cols-2 gap-8 items-start mt-4">
  <div class="space-y-2.5 text-xs">
    <div class="flex items-center gap-2 p-2 rounded-lg bg-white border border-stone-200">
      <span class="pill bg-emerald-50 text-emerald-700 text-[10px]">PRIVACY</span>
      <span class="text-stone-700"><strong>Zero Spyware:</strong> No screen recording, webcam access, or keylogging</span>
    </div>
    <div class="flex items-center gap-2 p-2 rounded-lg bg-white border border-stone-200">
      <span class="pill bg-blue-50 text-blue-700 text-[10px]">MERKLE</span>
      <span class="text-stone-700"><strong>SHA-256 Commit Tree:</strong> Hashes commits and cumulative line diffs</span>
    </div>
    <div class="flex items-center gap-2 p-2 rounded-lg bg-white border border-stone-200">
      <span class="pill bg-purple-50 text-purple-700 text-[10px]">SECURITY</span>
      <span class="text-stone-700"><strong>.avenignore Filter:</strong> Automatically strips .env and private keys</span>
    </div>
  </div>

  <div
    v-motion
    :initial="{ x: 40, opacity: 0 }"
    :enter="{ x: 0, opacity: 1, transition: { duration: 450 } }"
    class="bg-stone-900 p-4 rounded-xl font-mono text-xs text-stone-300 shadow-xl"
  >
    <div class="text-cyan-400 mb-2 flex items-center gap-1.5 font-bold">
      <span>AVEN-ETH PROTOCOL ACTIVITY WATCHER</span>
    </div>
    <div class="text-stone-400">Stream ID: <span class="text-white">agr_67e0342ec0c8</span></div>
    <div class="text-stone-400">Base Commit: <span class="text-amber-300">7f2a18b...</span></div>
    <div class="text-stone-400">Head Commit: <span class="text-emerald-300">9c4e51a...</span></div>
    <div class="text-stone-400">Branch: <span class="text-blue-300">feature/auth-guard</span></div>
    <div class="text-stone-400">Cumulative Diff: <span class="text-emerald-400">+184</span> / <span class="text-red-400">-32</span> lines</div>
    <div class="text-stone-400 mt-2">Cryptographic Root:</div>
    <div class="text-[10px] text-cyan-300 break-all bg-black/40 p-1.5 rounded mt-1">
      e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    </div>
    <div class="text-emerald-400 mt-3 text-[11px]">
      &bull; Sentinel Active &amp; Verified on Consensus Ledger
    </div>
  </div>
</div>

<!--
The Git Sentinel replaces invasive webcam surveillance with cryptographic Git hashes.
-->

---

<ThemeToggle class="abs-tr m-5 z-50" />

# Live Base Sepolia Deployment

Contracts verified and active on Base Sepolia Layer-2 (Chain ID: 84532):

<div class="grid grid-cols-3 gap-5 mt-4">
<div class="card-editorial col-span-2 space-y-3">
<div class="flex items-center justify-between pb-2 border-b border-stone-200">
<div class="font-bold text-sm text-stone-900">Verified On-Chain Contracts</div>
<span class="pill bg-blue-50 text-blue-700">Base Sepolia L2</span>
</div>

<div class="p-3 rounded-xl bg-stone-50 border border-stone-200">
<div class="flex items-center justify-between mb-1">
<span class="text-xs font-bold text-stone-900 flex items-center gap-1.5">
<img src="/solidity.svg" class="w-3.5 h-3.5" /> AvenEscrowStream.sol (Core Vault)
</span>
<span v-mark.box.emerald="1" class="pill bg-emerald-100 text-emerald-800 text-[10px]">VERIFIED</span>
</div>
<a href="https://sepolia.basescan.org/address/0x5Cfa2C922C1C1Fd42ba7570306a7D83e630dC6F9" target="_blank" class="font-mono text-xs text-blue-700 hover:underline">
0x5Cfa2C922C1C1Fd42ba7570306a7D83e630dC6F9 &rarr;
</a>
</div>

<div class="p-3 rounded-xl bg-stone-50 border border-stone-200">
<div class="flex items-center justify-between mb-1">
<span class="text-xs font-bold text-stone-900 flex items-center gap-1.5">
<img src="/usdc.svg" class="w-3.5 h-3.5" /> MockUSDC.sol (ERC-20 Faucet)
</span>
<span v-mark.box.blue="1" class="pill bg-cyan-100 text-cyan-800 text-[10px]">FAUCET</span>
</div>
<a href="https://sepolia.basescan.org/address/0xf922026C1810BF93C5a31e35B87ee4dc9Bc8f651" target="_blank" class="font-mono text-xs text-blue-700 hover:underline">
0xf922026C1810BF93C5a31e35B87ee4dc9Bc8f651 &rarr;
</a>
</div>

<div class="flex items-center justify-between pt-1 text-xs text-stone-500 font-mono">
<span>Block Time: ~2.0s</span>
<span>Avg Gas: &lt; $0.001</span>
<span>Tests: 30/30 Passing</span>
</div>
</div>

<div
  v-motion
  :initial="{ scale: 0.9, opacity: 0 }"
  :enter="{ scale: 1, opacity: 1, transition: { delay: 150, duration: 400 } }"
  class="card-editorial flex flex-col items-center justify-center text-center"
>
<div class="text-xs font-mono font-bold text-stone-500 uppercase tracking-wider mb-3">Live Production dApp</div>
<QrCode url="https://getsidekick.vercel.app" :size="120" caption="SCAN WITH PHONE" />
<a href="https://getsidekick.vercel.app" target="_blank" class="mt-3 pill bg-blue-600 text-white font-mono text-xs hover:bg-blue-700">
getsidekick.vercel.app &rarr;
</a>
</div>
</div>

<!--
The contracts are live on Base Sepolia. You can scan the QR code right off the screen to open the live production dApp on your phone.
-->

---
layout: center
class: text-center
title: Thank You!
---

<ThemeToggle class="abs-tr m-5 z-50" />

<div class="max-w-xl mx-auto">
  <div class="pill bg-emerald-50 text-emerald-800 border border-emerald-200 mb-3 text-xs font-mono">
    DEFENSE CONCLUDED &bull; ALL PROTOCOL INVARIANTS SATISFIED
  </div>

  <h1 class="text-6xl font-serif font-bold text-stone-900 mb-2">
    Thank You!
  </h1>

  <p class="text-base text-stone-600 mb-6 font-light">
    Sidekick (AVEN-ETH): Sovereign Freelance Escrow Protocol
  </p>

  <div class="grid grid-cols-3 gap-3 mb-6">
    <div
      v-motion
      :initial="{ y: 30, opacity: 0, scale: 0.9 }"
      :enter="{ y: 0, opacity: 1, scale: 1, transition: { delay: 100, type: 'spring', stiffness: 200 } }"
      class="p-3 rounded-xl bg-white border border-stone-200 shadow-sm"
    >
      <span class="text-blue-700 font-bold block text-lg font-mono">0%</span>
      <span class="text-stone-500 text-xs">Intermediary Tax</span>
    </div>
    <div
      v-motion
      :initial="{ y: 30, opacity: 0, scale: 0.9 }"
      :enter="{ y: 0, opacity: 1, scale: 1, transition: { delay: 200, type: 'spring', stiffness: 200 } }"
      class="p-3 rounded-xl bg-white border border-stone-200 shadow-sm"
    >
      <span class="text-emerald-700 font-bold block text-lg font-mono">75%</span>
      <span class="text-stone-500 text-xs">Safety Cap Invariant</span>
    </div>
    <div
      v-motion
      :initial="{ y: 30, opacity: 0, scale: 0.9 }"
      :enter="{ y: 0, opacity: 1, scale: 1, transition: { delay: 300, type: 'spring', stiffness: 200 } }"
      class="p-3 rounded-xl bg-white border border-stone-200 shadow-sm"
    >
      <span class="text-purple-700 font-bold block text-lg font-mono">30/30</span>
      <span class="text-stone-500 text-xs">Automated Tests Pass</span>
    </div>
  </div>

  <div class="flex justify-center items-center gap-3">
    <a href="https://getsidekick.vercel.app" target="_blank" class="pill bg-blue-600 text-white hover:bg-blue-700 text-xs">
      Launch Live dApp &rarr;
    </a>
    <a href="https://github.com/mailmeatdarshan/AVEN-ETH" target="_blank" class="pill bg-white border border-stone-300 text-stone-800 hover:bg-stone-50 text-xs">
      <carbon-logo-github class="text-sm mr-1" /> GitHub Repo
    </a>
  </div>

  <p class="mt-8 text-xs text-stone-400 font-mono">
    Questions &amp; Technical Defense Discussion Welcomed
  </p>
</div>

<!--
Thank you very much. We are now open for evaluation questions and technical discussion.
-->
