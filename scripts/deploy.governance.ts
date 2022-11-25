import { task } from 'hardhat/config';
import { deployGovernance } from './utils/deploy.utils';

task('deploy:Governance', 'Deploy Governance and required libraries')
  .addParam('agreementAddress', 'adress of deployed agreement contrsct')
  .addParam('aliceAddress', 'Alice Address')
  .addParam('tokenAddress', 'adress of deployed token contract')
  .setAction(async ({ agreementAddress, aliceAddress, tokenAddress }, hre) => {
    console.log(`Deploying from address ${(await hre.ethers.getSigners())[0].address}`);
    const governanceAddress = await deployGovernance(
      hre,
      agreementAddress,
      aliceAddress,
      tokenAddress
    );
    console.log(`\x1b[42m Preprocessor address \x1b[0m\x1b[32m ${governanceAddress}\x1b[0m`);
  });
