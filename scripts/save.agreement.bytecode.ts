import { ethers } from 'hardhat';
import fs from 'fs';
import { deployBase, deployOpcodeLibs } from './data/deploy.utils';

async function main() {
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

  fs.writeFileSync('agreement.bytecode', AgreementContract.bytecode);
}

main();
