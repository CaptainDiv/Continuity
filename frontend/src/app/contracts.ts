import { parseAbi, type Address, type Abi } from "viem";
import PolicyManagerABI from "../abis/PolicyManager.json";
import InsurancePoolABI from "../abis/InsurancePool.json";
import ReferenceLendingPoolABI from "../abis/ReferenceLendingPool.json";

export const CHAIN_ID = 10143;
export const RPC_URL = "https://testnet-rpc.monad.xyz";

export const CONTRACT_ADDRESSES = {
  policyManager: "0xCA9368a397ACB89b6380C1d9e743094AA397D9Fe",
  insurancePool: "0xAE4E9aa88CC78099D0C0e637374C351381D9ac35",
  referenceLendingPool: "0x98110D8957B87e1c761C5A7eFD357BA0ec357CDE",
  cvaToken: "0x7333343bD9Fb62E2416c78aD55656753f84DbCfB",
} as const satisfies Record<string, Address>;

export const ERC20_ABI = parseAbi([
  "function mint(address to, uint256 amount) external",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
]);

const POLICY_MANAGER_TRIGGER_ABI = parseAbi([
  "function checkAndTrigger(uint256 policyId) external",
  "error PolicyNotFound()",
  "error PolicyNotActive()",
  "error PolicyNotYetActive()",
]);

function mergeAbi(base: Abi, extra: Abi): Abi {
  const sig = (f: any) =>
    `${f.type}:${f.name ?? ""}:${(f.inputs ?? []).map((i: any) => i.type).join(",")}`;
  const seen = new Set(base.map(sig));
  const additions = extra.filter((f) => !seen.has(sig(f)));
  return [...base, ...additions];
}

export const CONTRACT_ABIS = {
  policyManager: mergeAbi(PolicyManagerABI.abi as Abi, POLICY_MANAGER_TRIGGER_ABI),
  insurancePool: InsurancePoolABI.abi,
  referenceLendingPool: ReferenceLendingPoolABI.abi,
  cvaToken: ERC20_ABI,
} as const;