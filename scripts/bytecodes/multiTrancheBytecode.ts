import fs from 'fs';
import path from 'path';
import * as hre from 'hardhat';
import { deployBase, deployOpcodeLibs } from '../utils/deploy.utils';
import { checkOrCreateFolder } from '../../utils/utils';

/**
 * Deploy libraries that are required by Agreement & generate Agreement bytecode with those
 * libraries
 */
async function main() {
  console.log(`Deploying from address ${(await hre.ethers.getSigners())[0].address}`);

  // Note: run this on the same node as Front End to actually deploy these libraries
  const [
    comparisonOpcodesLibAddr,
    branchingOpcodesLibAddr,
    logicalOpcodesLibAddr,
    otherOpcodesLibAddr,
  ] = await deployOpcodeLibs(hre);

  const [, executorLibAddr] = await deployBase(hre);

  const AgreementContract = await hre.ethers.getContractFactory('MultiTranche', {
    libraries: {
      Executor: executorLibAddr,
    },
  });
  const bytecodeFolder = path.join(__dirname, '../..', 'bytecode');

  checkOrCreateFolder(bytecodeFolder);
  fs.writeFileSync(path.join(bytecodeFolder, 'multiTranche.bytecode'), AgreementContract.bytecode);
}

main();
