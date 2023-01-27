import * as hre from 'hardhat';
import { deployExecutor } from '../utils/deploy.utils';

async function main() {
  console.log(`Deploying from address ${(await hre.ethers.getSigners())[0].address}`);
  const executorAddr = await deployExecutor(hre);
  console.log(`\x1b[42m Executor address \x1b[0m\x1b[32m ${executorAddr}\x1b[0m`);
}

main();
