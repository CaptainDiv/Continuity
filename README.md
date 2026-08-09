# Continuity 🛡️

Continuity is an institutional-grade insurance and protection protocol built on the Monad blockchain. It protects lenders from compliance and credit risks by automating insurance payouts based on real-time identity and asset verification.

## 🚀 The Problem & Solution
Institutional lenders need assurance that their capital is protected if a borrower falls out of compliance or defaults. 

Continuity solves this by integrating the Cleanverse stack (CVI, CVA, and the CCP Protocol). If a borrower's Cleanverse Verified Identity (CVI) is revoked, our off-chain relayer/admin engine instantly triggers an on-chain transaction. The `PolicyManager` verifies the status and forces the `InsurancePool` to execute an automated payout to the lender, ensuring zero counterparty risk.

## 🏗️ Architecture Overview
* **InsurancePool:** Holds underwriting capital and processes approved payouts.
* **ReferenceLendingPool:** Simulates an institutional lending desk where loans are issued and protected.
* **PolicyManager:** The core logic hub that links policies to loans, verifies compliance events, and triggers the insurance pool.
* **Cleanverse Stack:** Utilized for A-Token (CVA) standard integration and CVI compliance checks.

## 🌍 Monad Testnet Deployments
Our core smart contracts are deployed and verified on the Monad testnet:

* **PolicyManager:** `0xfC599223766CD08e843d819D8a951b90162796C7`
* **InsurancePool:** `0x5b424b56a9eb5d65cEF56D70fB966FB73216e62c`
* **ReferenceLendingPool:** `0x9d08fF111aF853e6411B03b63880da1A1E567ea6`
* **CVA Mock Token:** `0x66D5B1D1Ada273c68E626790a4145cbB03FBc662`

## 🛠️ Tech Stack
* **Smart Contracts:** Solidity, Foundry (Forge)
* **Blockchain:** Monad Testnet
* **Integration:** Cleanverse (CVI, CVA, CCP)
* **Frontend:** (Add details here once connected)

## 💻 Running Locally

Clone the repository and install dependencies:
```bash
git clone https://github.com/CaptainDiv/Continuity.git
cd continuity
forge install
