import fs from 'fs';
import path from 'path';
import { task } from 'hardhat/config';

/**
 * @dev Get MultiTranche smart contract bytecode
 */
task('bytecode:multitranche', 'Get a bytecode of MultiTranche contract')
  .addParam('executor', 'Executor library address')
  .setAction(async ({ executor }, hre) => {
    const MultiTrancheCont = await hre.ethers.getContractFactory('MultiTranche', {
      libraries: {
        Executor: executor,
      },
    });

    const outputDir = path.join(__dirname, '..', 'bytecode');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    fs.writeFileSync(path.join(outputDir, 'multiTranche.bytecode'), MultiTrancheCont.bytecode);
  });

/**
 * @dev Get Agreement smart contract bytecode
 */
task('bytecode:agreement', 'Get a bytecode of Agreement contract')
  .addParam('executor', 'Executor library address')
  .setAction(async ({ executor }, hre) => {
    const AgreementContract = await hre.ethers.getContractFactory('Agreement', {
      libraries: {
        Executor: executor,
      },
    });

    const outputDir = path.join(__dirname, '..', 'bytecode');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    const agreementBytecodeFile = path.join(outputDir, 'agreement.bytecode');
    fs.writeFileSync(agreementBytecodeFile, AgreementContract.bytecode);
    console.log(`\n\nAgreement bytecode was saved to ${agreementBytecodeFile}!`);
  });
