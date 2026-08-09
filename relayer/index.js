const { ethers } = require("ethers");
require("dotenv").config();

// 1. Configuration (Load from environment variables)
const RPC_URL = process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz"; // Replace with Monad testnet RPC when live
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY;
const POLICY_MANAGER_ADDRESS = process.env.POLICY_MANAGER_ADDRESS;

// Minimal ABI required for triggering the policy
const POLICY_MANAGER_ABI = [
    "function checkAndTrigger(uint256 policyId) external"
];

async function runRelayer() {
    console.log("Starting Continuity Off-Chain Relayer...");

    // Set up provider and wallet
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider);
    const policyManager = new ethers.Contract(POLICY_MANAGER_ADDRESS, POLICY_MANAGER_ABI, wallet);

    // Simulated function checking Cleanverse API for CVI status
    // In production, this would poll the Cleanverse backend or listen to a webhook.
    const pollCleanverseAndTrigger = async (policyId, borrowerAddress) => {
        try {
            console.log(`Checking Cleanverse CVI status for borrower: ${borrowerAddress}...`);
            
            // --- MOCK API CHECK ---
            // Replace this boolean with an actual fetch request to Cleanverse's verification endpoint
            const isCviRevoked = await simulateCleanverseAPI(borrowerAddress);

            if (isCviRevoked) {
                console.warn(`ALERT: CVI Revoked for ${borrowerAddress}! Executing on-chain trigger...`);
                
                // Call the smart contract function
                const tx = await policyManager.checkAndTrigger(policyId);
                console.log(`Transaction sent: ${tx.hash}`);
                
                const receipt = await tx.wait();
                console.log(`Success! Policy #${policyId} triggered in block ${receipt.blockNumber}`);
            } else {
                console.log(`Borrower status normal. No action taken.`);
            }
        } catch (error) {
            console.error("Error executing relayer check:", error);
        }
    };

    // Run a check loop every 30 seconds for active policies
    // For testing, we check policyId #1 against borrower address
    setInterval(() => {
        pollCleanverseAndTrigger(1, "0x82...A91");
    }, 30000);
}

// Helper simulation function for hackathon demonstration
async function simulateCleanverseAPI(borrowerAddress) {
    // You can toggle this to true to simulate a live revocation event during testing
    return false; 
}

runRelayer();