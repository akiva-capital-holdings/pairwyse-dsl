import fs from 'fs';
import path from 'path';
import * as hre from 'hardhat';
import { deployBase, deployOpcodeLibs } from './data/deploy.utils';

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

  const AgreementContract = await hre.ethers.getContractFactory('Agreement', {
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
