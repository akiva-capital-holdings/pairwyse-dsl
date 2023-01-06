import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Governance, Parser } from '../../typechain-types';

export const hex4Bytes = (hre: HardhatRuntimeEnvironment, str: string) =>
  hre.ethers.utils
    .keccak256(hre.ethers.utils.toUtf8Bytes(str))
    .split('')
    .map((x, i) => (i < 10 ? x : '0'))
    .join('');
