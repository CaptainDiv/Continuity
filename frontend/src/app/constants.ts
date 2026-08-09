import PolicyManagerJSON from '../abi/PolicyManager.json';
import InsurancePoolJSON from '../abi/InsurancePool.json';
import ReferenceLendingPoolJSON from '../abi/ReferenceLendingPool.json';

export const POLICY_MANAGER_ADDRESS = '0xfC599223766CD08e843d819D8a951b90162796C7';
export const INSURANCE_POOL_ADDRESS = '0x5b424b56a9eb5d65cEF56D70fB966FB73216e62c';
export const REFERENCE_LENDING_POOL_ADDRESS = '0x9d08fF111aF853e6411B03b63880da1A1E567ea6';
export const CVA_MOCK_TOKEN_ADDRESS = '0x66D5B1D1Ada273c68E626790a4145cbB03FBc662';

export const POLICY_MANAGER_ABI = PolicyManagerJSON.abi;
export const INSURANCE_POOL_ABI = InsurancePoolJSON.abi;
export const REFERENCE_LENDING_POOL_ABI = ReferenceLendingPoolJSON.abi;

export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: 'remaining', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: 'success', type: 'bool' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: 'success', type: 'bool' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_from', type: 'address' },
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: 'success', type: 'bool' }],
    type: 'function',
  },
] as const;
