import fs from 'fs';
import path from 'path';
import { task } from 'hardhat/config';

/**
 * @dev Get MultiTranche smart contract bytecode
 */
task('bytecode:multitranche', 'Get a bytecode of MultiTranche contract')
  .addParam('executorLib', 'Executor library address')
  .setAction(async ({ executorLib }, hre) => {
    const MultiTrancheCont = await hre.ethers.getContractFactory('MultiTranche', {
      libraries: {
        Executor: executorLib,
      },
    });

    const outputDir = path.join(__dirname, '..', 'bytecode');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    fs.writeFileSync(path.join(outputDir, 'multiTranche.bytecode'), MultiTrancheCont.bytecode);
  });
