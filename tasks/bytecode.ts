import fs from 'fs';
import path from 'path';
import { task } from 'hardhat/config';

task('bytecode:multitranche', 'Get a bytecode of MultiTranche contract')
  .addParam('executorLib', 'Executor library address')
  .setAction(async ({ executorLib }, hre) => {
    const MultiTrancheCont = await hre.ethers.getContractFactory('MultiTranche', {
      libraries: {
        Executor: executorLib,
      },
    });

    fs.writeFileSync(
      path.join(__dirname, '..', 'bytecode', 'multiTranche.bytecode'),
      MultiTrancheCont.bytecode
    );
  });
