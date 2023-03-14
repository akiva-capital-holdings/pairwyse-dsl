import { task } from 'hardhat/config';
import {
  deployContextDSL,
  deployExecutor,
  deployParser,
  deployPreprocessor,
  deployStringUtils,
} from '../scripts/utils/deploy.utils';

task(
  'deploy:main',
  'Deploy main contracts: Preprocessor, Parser, ContextFactory, Agreement, and required libraries'
)
  // .addParam('owner', 'Owner address of Agreement')
  .setAction(async (_, hre) => {
    console.log(`Deploying from address ${(await hre.ethers.getSigners())[0].address}`);

    const stringUtilsAddr = await deployStringUtils(hre);

    // Deploy the contracts
    const contextDSLAddr = await deployContextDSL(hre);
    const parserAddr = await deployParser(hre, stringUtilsAddr);
    const preprocessorAddr = await deployPreprocessor(hre);
    // const agreementAddr = await deployAgreement(hre, owner, stringUtilsAddr);
    const executorAddr = await deployExecutor(hre);

    // Display deployed addresses
    console.log(`\x1b[42m DSL Context address \x1b[0m\x1b[32m ${contextDSLAddr}\x1b[0m`);
    console.log(`\x1b[42m Parser address \x1b[0m\x1b[32m ${parserAddr}\x1b[0m`);
    console.log(`\x1b[42m Preprocessor address \x1b[0m\x1b[32m ${preprocessorAddr}\x1b[0m`);
    // console.log(`\x1b[42m Agreement address \x1b[0m\x1b[32m ${agreementAddr}\x1b[0m`);
    console.log(`\x1b[42m Executor address \x1b[0m\x1b[32m ${executorAddr}\x1b[0m`);
  });

task('deploy-and-mint:erc20', 'To deploy erc20 mock')
  .addParam('supply', 'total supply')
  .setAction(async ({ supply: totalSupplyValue }, hre) => {
    console.log(`Deploying Token address ${(await hre.ethers.getSigners())[0].address}`);

    // Deploy the token
    const token = await (
      await hre.ethers.getContractFactory('ERC20Premint')
    ).deploy('Token', 'TKN', hre.ethers.utils.parseEther(`${totalSupplyValue}`));

    // Display deployed address
    console.log(`\x1b[42m Token address \x1b[0m\x1b[32m ${token.address}\x1b[0m`);
  });

task('deploy:parser')
  .addParam('stringUtils', 'StringUtils address')
  .setAction(async ({ stringUtils }, hre) => {
    console.log(`Deploying from address ${(await hre.ethers.getSigners())[0].address}`);
    const parserAddr = await deployParser(hre, stringUtils);
    console.log(`\x1b[42m Parser address \x1b[0m\x1b[32m ${parserAddr}\x1b[0m`);
  });
