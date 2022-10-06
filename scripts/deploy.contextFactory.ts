import * as hre from 'hardhat';
import { deployContextFactory } from './utils/deploy.utils';

async function deploy() {
  console.log(`Deploying from address ${(await hre.ethers.getSigners())[0].address}`);
  const factoryAddr = await deployContextFactory(hre);
  console.log(`\x1b[42m ContextFactory address \x1b[0m\x1b[32m ${factoryAddr}\x1b[0m`);
}

deploy();
