import * as hre from 'hardhat';
import { deployPreprocessor } from './data/deploy.utils';

async function main() {
  console.log(`Deploying from address ${(await hre.ethers.getSigners())[0].address}`);
  const preprocAddr = await deployPreprocessor(hre);
  console.log(`\x1b[42m Preprocessor address \x1b[0m\x1b[32m ${preprocAddr}\x1b[0m`);
}

main();
