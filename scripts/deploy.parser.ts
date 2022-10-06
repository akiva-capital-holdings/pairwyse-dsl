import * as hre from 'hardhat';
import { deployParser } from './utils/deploy.utils';

export async function main() {
  console.log(`Deploying from address ${(await hre.ethers.getSigners())[0].address}`);
  const parserAddr = await deployParser(hre);
  console.log(`\x1b[42m Parser address \x1b[0m\x1b[32m ${parserAddr}\x1b[0m`);
}

main();
