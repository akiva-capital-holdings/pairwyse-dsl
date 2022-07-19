import '@nomiclabs/hardhat-ethers';
import * as hre from 'hardhat';
// TODO: would it be better to store types bot in the test directory?
import { parseEther } from 'ethers/lib/utils';
import { TxObject } from '../test/types';
import { aliceAndBobSteps, aliceBobAndCarl, businessCaseSteps } from './data/agreement';

import { Context__factory } from '../typechain-types';

const { ethers } = hre;

const addSteps = async (steps: TxObject[], Ctx: Context__factory, agreementAddress: string) => {
  let txCtx;
  const agreement = await ethers.getContractAt('Agreement', agreementAddress);
  for await (const step of steps) {
    console.log(`\n---\n\n🧩 Adding Term #${step.txId} to Agreement`);
    txCtx = await Ctx.deploy();
    const cdCtxsAddrs = [];

    console.log('\nTerm Conditions');

    for (let j = 0; j < step.conditions.length; j++) {
      const cond = await Ctx.deploy();
      cdCtxsAddrs.push(cond.address);
      await agreement.parse(step.conditions[j], cond.address);
      console.log(
        `\n\taddress: \x1b[35m${cond.address}\x1b[0m\n\tcondition ${j + 1}:\n\t\x1b[33m${
          step.conditions[j]
        }\x1b[0m`
      );
    }
    await agreement.parse(step.transaction, txCtx.address);
    console.log('\nTerm transaction');
    console.log(`\n\taddress: \x1b[35m${txCtx.address}\x1b[0m`);
    console.log(`\t\x1b[33m${step.transaction}\x1b[0m`);
    const { hash } = await agreement.update(
      step.txId,
      step.requiredTxs,
      step.signatories,
      step.transaction,
      step.conditions,
      txCtx.address,
      cdCtxsAddrs
    );
    console.log(`\nAgreement update transaction hash: \n\t\x1b[35m${hash}\x1b[0m`);
  }
};

async function deploy() {
  const opcodeHelpersLib = await (await ethers.getContractFactory('OpcodeHelpers')).deploy();
  const stringLib = await (await ethers.getContractFactory('StringUtils')).deploy();
  const byteLib = await (await ethers.getContractFactory('ByteUtils')).deploy();

  const comparatorOpcodesLib = await (
    await ethers.getContractFactory('ComparatorOpcodes', {
      libraries: {
        OpcodeHelpers: opcodeHelpersLib.address,
      },
    })
  ).deploy();

  const logicalOpcodesLib = await (
    await ethers.getContractFactory('LogicalOpcodes', {
      libraries: {
        OpcodeHelpers: opcodeHelpersLib.address,
      },
    })
  ).deploy();

  const setOpcodesLib = await (
    await ethers.getContractFactory('SetOpcodes', {
      libraries: {
        OpcodeHelpers: opcodeHelpersLib.address,
      },
    })
  ).deploy();

  const otherOpcodesLib = await (
    await ethers.getContractFactory('OtherOpcodes', {
      libraries: {
        OpcodeHelpers: opcodeHelpersLib.address,
      },
    })
  ).deploy();

  const ParserCont = await ethers.getContractFactory('Parser', {
    libraries: { StringUtils: stringLib.address, ByteUtils: byteLib.address },
  });
  const parser = await ParserCont.deploy();
  const executorLib = await (await ethers.getContractFactory('Executor')).deploy();
  const AgreementContract = await ethers.getContractFactory('Agreement', {
    libraries: {
      ComparatorOpcodes: comparatorOpcodesLib.address,
      LogicalOpcodes: logicalOpcodesLib.address,
      SetOpcodes: setOpcodesLib.address,
      OtherOpcodes: otherOpcodesLib.address,
      Executor: executorLib.address,
    },
  });
  const agreement = await AgreementContract.deploy(parser.address);
  await agreement.deployed();

  const ContextCont = await ethers.getContractFactory('Context');
  let alice;
  let bob;
  let carl;
  let anybody;
  let GP;
  let LPs;
  [alice, bob, carl, anybody, GP, ...LPs] = await ethers.getSigners();
  const oneEthBN = parseEther('1');
  const tenTokens = parseEther('10');

  const txId = 1;
  const requiredTxs: number[] = [];
  const signatories = [alice.address];
  const conditions = ['blockTimestamp > loadLocal uint256 LOCK_TIME'];
  const transaction = 'sendEth RECEIVER 1000000000000000000';
  // ---> steps for Alice, Bob and Carl <---

  await addSteps(
    [{ txId, requiredTxs, signatories, conditions, transaction }],
    ContextCont,
    agreement.address
  );
  await addSteps(aliceAndBobSteps(alice, bob, oneEthBN, tenTokens), ContextCont, agreement.address);
  await addSteps(
    aliceBobAndCarl(alice, bob, carl, oneEthBN, tenTokens),
    ContextCont,
    agreement.address
  );

  // ---> steps for businessCases with one LP <---
  await addSteps(businessCaseSteps(GP, [LPs[0]], 4), ContextCont, agreement.address);
  // await addSteps(businessCaseSteps(GP, [LPs[0]], 5), ContextCont, agreement.address);

  /*
    TODO: pay attention, that the agreement.ts and agreementBusinessCase.ts has
    only one LP signature in the required list!
    It has to be used another test, like `Lifecycle Test Multiple LPs`
    to check multiple LPs
  */
  // ---> steps for businessCases with multiple LPs <---
  await addSteps(businessCaseSteps(GP, [LPs[0], LPs[1]], 4), ContextCont, agreement.address);
  // await addSteps(businessCaseSteps(GP, [LPs[0], LPs[1]], 5), ContextCont, agreement.address);

  console.log('Agreement address: ', agreement.address);
}

deploy();
