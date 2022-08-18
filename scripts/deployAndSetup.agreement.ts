import '@nomiclabs/hardhat-ethers';
import * as hre from 'hardhat';
import { parseEther } from 'ethers/lib/utils';
import { TxObject } from '../test/types';
import { aliceAndBobSteps, aliceBobAndCarl, businessCaseSteps } from './data/agreement';

import { Context__factory } from '../typechain-types';
import { addSteps, deployBase, deployOpcodeLibs } from './data/deploy.utils';

const { ethers } = hre;

// const addSteps = async (steps: TxObject[], Ctx: Context__factory, agreementAddress: string) => {
//   let txCtx;
//   const agreement = await ethers.getContractAt('Agreement', agreementAddress);
//   for await (const step of steps) {
//     console.log(`\n---\n\n🧩 Adding Term #${step.txId} to Agreement`);
//     txCtx = await Ctx.deploy();
//     const cdCtxsAddrs = [];

//     console.log('\nTerm Conditions');

//     for (let j = 0; j < step.conditions.length; j++) {
//       const cond = await Ctx.deploy();
//       cdCtxsAddrs.push(cond.address);
//       await agreement.parse(step.conditions[j], cond.address);
//       console.log(
//         `\n\taddress: \x1b[35m${cond.address}\x1b[0m\n\tcondition ${j + 1}:\n\t\x1b[33m${
//           step.conditions[j]
//         }\x1b[0m`
//       );
//     }
//     await agreement.parse(step.transaction, txCtx.address);
//     console.log('\nTerm transaction');
//     console.log(`\n\taddress: \x1b[35m${txCtx.address}\x1b[0m`);
//     console.log(`\t\x1b[33m${step.transaction}\x1b[0m`);
//     const { hash } = await agreement.update(
//       step.txId,
//       step.requiredTxs,
//       step.signatories,
//       step.transaction,
//       step.conditions,
//       txCtx.address,
//       cdCtxsAddrs
//     );
//     console.log(`\nAgreement update transaction hash: \n\t\x1b[35m${hash}\x1b[0m`);
//   }
// };

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
