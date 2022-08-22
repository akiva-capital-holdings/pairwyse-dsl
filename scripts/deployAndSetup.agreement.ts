import '@nomiclabs/hardhat-ethers';
import * as hre from 'hardhat';
import { parseEther } from 'ethers/lib/utils';
import { TxObject } from '../test/types';
import { aliceAndBobSteps, aliceBobAndCarl, businessCaseSteps } from './data/agreement';

import { Context__factory } from '../typechain-types';
import { addSteps, deployBase, deployOpcodeLibs } from './data/deploy.utils';

const { ethers } = hre;

const deployAndSetupAgreement = async () => {
  const [, , , , GP, ...LPs] = await ethers.getSigners();
  console.log({ GP: GP.address });
  console.log({
    LP0: LPs[0].address,
    LP1: LPs[1].address,
    LP2: LPs[2].address,
  });

  const [
    comparisonOpcodesLibAddr,
    branchingOpcodesLibAddr,
    logicalOpcodesLibAddr,
    otherOpcodesLibAddr,
  ] = await deployOpcodeLibs();

  const [parserAddr, executorLibAddr, preprocessorAddr] = await deployBase();

  const AgreementContract = await ethers.getContractFactory('Agreement', {
    libraries: {
      ComparisonOpcodes: comparisonOpcodesLibAddr,
      BranchingOpcodes: branchingOpcodesLibAddr,
      LogicalOpcodes: logicalOpcodesLibAddr,
      OtherOpcodes: otherOpcodesLibAddr,
      Executor: executorLibAddr,
    },
  });
  const agreement = await AgreementContract.deploy(parserAddr);
  await agreement.deployed();

  console.log(`\x1b[32m Agreement address \x1b[0m\x1b[32m ${agreement.address}\x1b[0m`);

  await addSteps(preprocessorAddr, businessCaseSteps(GP, [LPs[0], LPs[1]], 1), agreement.address);

  return agreement.address;
};

deployAndSetupAgreement();
