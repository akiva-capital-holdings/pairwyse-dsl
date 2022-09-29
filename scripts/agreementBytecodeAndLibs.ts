import { ethers } from 'hardhat';
import fs from 'fs';
import path from 'path';
import { deployBase, deployOpcodeLibs } from './data/deploy.utils';

/**
 * Deploy libraries that are required by Agreement & generate Agreement bytecode with those
 * libraries
 */
async function main() {
  // Note: run this on the same node as Front End to actually deploy these libraries
  const [
    comparisonOpcodesLibAddr,
    branchingOpcodesLibAddr,
    logicalOpcodesLibAddr,
    otherOpcodesLibAddr,
  ] = await deployOpcodeLibs();

  const [, executorLibAddr] = await deployBase();

  const AgreementContract = await ethers.getContractFactory('Agreement', {
    libraries: {
      ComparisonOpcodes: comparisonOpcodesLibAddr,
      BranchingOpcodes: branchingOpcodesLibAddr,
      LogicalOpcodes: logicalOpcodesLibAddr,
      OtherOpcodes: otherOpcodesLibAddr,
      Executor: executorLibAddr,
    },
  });

  fs.writeFileSync(path.join(__dirname, 'agreement.bytecode'), AgreementContract.bytecode);
}

main();
