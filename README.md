# 🛡️ Continuity: Automated On-Chain Lending Insurance Protocol

Continuity is a compliance-gated, automated on-chain lending insurance protocol built on the **Monad Testnet** leveraging the **Cleanverse stack**. It protects institutional and retail lenders against borrower defaults by natively integrating verifiable identities (CVI) and trusted assets (CVA) directly into the underwriting and claims lifecycle.

---

## 🚀 The Problem & Solution

* **The Problem:** Institutional lenders need assurance that their capital is protected if a borrower falls out of compliance or defaults.
* **The Solution:** Continuity solves this by integrating the Cleanverse stack (CVI, CVA, and the CCP Protocol). If a borrower's Cleanverse Verified Identity (CVI) is revoked, our off-chain relayer/admin engine instantly triggers an on-chain transaction. The `PolicyManager` verifies the status and forces the `InsurancePool` to execute an automated payout to the lender, ensuring zero counterparty risk.

---

## 🏗️ Architecture Overview

* **InsurancePool:** Holds underwriting capital and processes approved payouts.
* **ReferenceLendingPool:** Simulates an institutional lending desk where loans are issued and protected.
* **PolicyManager:** The core logic hub that links policies to loans, verifies compliance events, and triggers the insurance pool.
* **Cleanverse Stack:** Utilized for A-Token (CVA) standard integration and CVI compliance checks.

---

## 🌍 Monad Testnet Deployments

Our core smart contracts are deployed and verified on the Monad testnet:

* **PolicyManager:** `0xfC599223766CD08e843d819D8a951b90162796C7`
* **InsurancePool:** `0x5b424b56a9eb5d65cEF56D70fB966FB73216e62c`
* **ReferenceLendingPool:** `0x9d08fF111aF853e6411B03b63880da1A1E567ea6`
* **CVA Mock Token:** `0x66D5B1D1Ada273c68E626790a4145cbB03FBc662`

---

## 🛠️ Tech Stack

* **Smart Contracts:** Solidity, Foundry (Forge)
* **Blockchain:** Monad Testnet (Chain ID: 10143)
* **Integration:** Cleanverse (CVI, CVA, CCP Protocol)
* **Frontend:** Next.js (App Router), Tailwind CSS, Wagmi / Viem

---

## 💻 Running Locally & Testing      

To clone the repository and run the smart contract environment or frontend:

```bash
# Clone the repository
git clone [https://github.com/CaptainDiv/Continuity.git](https://github.com/CaptainDiv/Continuity.git)
cd continuity

# Install Foundry dependencies (if testing smart contracts)
forge install

---
# To run the frontend dashboard:
cd frontend
npm install
npm run dev
