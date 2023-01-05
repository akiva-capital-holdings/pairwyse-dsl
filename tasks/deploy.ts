import { task } from 'hardhat/config';
import {
  deployAgreement,
  deployContextDSL,
  deployParser,
  deployPreprocessor,
} from '../scripts/utils/deploy.utils';

task(
  'deploy:main',
  'Deploy main contracts: Preprocessor, Parser, ContextFactory, Agreement, and required libraries'
)
  .addParam('safe', 'GnosisSafe address that could execute Agreement.update() function')
  .setAction(async ({ safe }, hre) => {
    console.log(`Deploying from address ${(await hre.ethers.getSigners())[0].address}`);

    // Deploy the contracts
    const contextDSLAddr = await deployContextDSL(hre);
    const parserAddr = await deployParser(hre);
    const preprocessorAddr = await deployPreprocessor(hre);
    const agreementAddr = await deployAgreement(hre, safe);

    // Display deployed addresses
    console.log(`\x1b[42m DSL Context address \x1b[0m\x1b[32m ${contextDSLAddr}\x1b[0m`);
    console.log(`\x1b[42m Parser address \x1b[0m\x1b[32m ${parserAddr}\x1b[0m`);
    console.log(`\x1b[42m Preprocessor address \x1b[0m\x1b[32m ${preprocessorAddr}\x1b[0m`);
    console.log(`\x1b[42m Agreement address \x1b[0m\x1b[32m ${agreementAddr}\x1b[0m`);
  });

task('deploy-and-mint:erc20', 'To deploy erc20 mock')
  .addParam('supply', 'total supply')
  .setAction(async ({ supply: totalSupplyValue }, hre) => {
    console.log(`Deploying Token address ${(await hre.ethers.getSigners())[0].address}`);

    // Deploy the token
    const token = await (
      await hre.ethers.getContractFactory('Token')
    ).deploy(hre.ethers.utils.parseEther(`${totalSupplyValue}`));

    // Display deployed address
    console.log(`\x1b[42m Token address \x1b[0m\x1b[32m ${token.address}\x1b[0m`);
  });
