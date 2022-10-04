import { task } from 'hardhat/config';
import {
  deployAgreement,
  deployContextFactory,
  deployParser,
  deployPreprocessor,
} from '../scripts/utils/deploy.utils';

task(
  'deployMain',
  'Deploy main contracts: Preprocessor, Parser, ContextFactory, Agreement, and required libraries'
)
  .addParam('safe', 'GnosisSafe address that could execute Agreement.update() function')
  .setAction(async ({ safe }, hre) => {
    console.log(`Deploying from address ${(await hre.ethers.getSigners())[0].address}`);

    // Deploy the contracts
    const contextFactoryAddr = await deployContextFactory(hre);
    const parserAddr = await deployParser(hre);
    const preprocessorAddr = await deployPreprocessor(hre);
    const agreementAddr = await deployAgreement(hre, safe);

    // Display deployed addresses
    console.log(`\x1b[42m Context Factory address \x1b[0m\x1b[32m ${contextFactoryAddr}\x1b[0m`);
    console.log(`\x1b[42m Parser address \x1b[0m\x1b[32m ${parserAddr}\x1b[0m`);
    console.log(`\x1b[42m Preprocessor address \x1b[0m\x1b[32m ${preprocessorAddr}\x1b[0m`);
    console.log(`\x1b[42m Agreement address \x1b[0m\x1b[32m ${agreementAddr}\x1b[0m`);
  });
