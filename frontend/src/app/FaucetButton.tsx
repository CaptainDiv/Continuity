"use client";

import React from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, BaseError } from "wagmi";
import { parseUnits } from "viem";
import { CONTRACT_ADDRESSES, ERC20_ABI } from "./contracts";

export function FaucetButton() {
  const { address, isConnected } = useAccount();
  const { data: hash, isPending, writeContract, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleMint = () => {
    if (!address) return;

    writeContract({
      address: CONTRACT_ADDRESSES.cvaToken as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "mint",
      args: [address, parseUnits("10000", 18)],
    });
  };

  if (!isConnected) return null;

  return (
    <div className="flex flex-col items-start gap-1 my-2">
      <button
        onClick={handleMint}
        disabled={isPending || isConfirming}
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm shadow transition-all disabled:opacity-50"
      >
        {isPending || isConfirming ? "Minting 10k CVA..." : "🚰 Get 10,000 Test CVA"}
      </button>

      {isSuccess && (
        <span className="text-xs text-emerald-400">
          10,000 CVA tokens minted to your wallet!
        </span>
      )}

      {error && (
        <span className="text-xs text-red-400">
          {error instanceof BaseError ? error.shortMessage : error.message}
        </span>
      )}
    </div>
  );
}