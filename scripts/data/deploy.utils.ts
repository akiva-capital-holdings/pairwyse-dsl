import '@nomiclabs/hardhat-ethers';
import * as hre from 'hardhat';
// TODO: would it be better to store types both in the test directory?
import { parseEther } from 'ethers/lib/utils';
import { TxObject } from '../../test/types';
import { AgreementMock } from '../../typechain-types/agreement/mocks';
import { Context__factory } from '../../typechain-types';

const { ethers } = hre;

export const addSteps = async (
  steps: TxObject[],
  Ctx: Context__factory,
  agreementAddress: string
) => {
  let txCtx;
  const agreement = await ethers.getContractAt('AgreementMock', agreementAddress);
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

export const deployOpcodeLibs = async () => {
  const opcodeHelpersLib = await (await ethers.getContractFactory('OpcodeHelpers')).deploy();
  const comparisonOpcodesLib = await (
    await ethers.getContractFactory('ComparisonOpcodes', {
      libraries: {
        OpcodeHelpers: opcodeHelpersLib.address,
      },
    })
  ).deploy();

  const branchingOpcodesLib = await (
    await ethers.getContractFactory('BranchingOpcodes', {
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

  const otherOpcodesLib = await (
    await ethers.getContractFactory('OtherOpcodes', {
      libraries: {
        OpcodeHelpers: opcodeHelpersLib.address,
      },
    })
  ).deploy();
  return [
    comparisonOpcodesLib.address,
    branchingOpcodesLib.address,
    logicalOpcodesLib.address,
    otherOpcodesLib.address,
  ];
};

export const deployParser = async () => {
  const stringLib = await (await ethers.getContractFactory('StringUtils')).deploy();
  const byteLib = await (await ethers.getContractFactory('ByteUtils')).deploy();

  const ParserCont = await ethers.getContractFactory('Parser', {
    libraries: { StringUtils: stringLib.address, ByteUtils: byteLib.address },
  });
  const parser = await ParserCont.deploy();
  return parser.address;
};

export const deployExecutor = async () => {
  const executorLib = await (await ethers.getContractFactory('Executor')).deploy();
  return executorLib.address;
};

export const deployBase = async () => {
  let parserAddr = await deployParser();
  let executorLibAddr = await deployExecutor();

  return [parserAddr, executorLibAddr];
};

export const deployAgreement = async () => {
  let comparisonOpcodesLibAddr: string;
  let branchingOpcodesLibAddr: string;
  let logicalOpcodesLibAddr: string;
  let otherOpcodesLibAddr: string;
  let executorLibAddr: string;
  let parserAddr: string;

  [comparisonOpcodesLibAddr, branchingOpcodesLibAddr, logicalOpcodesLibAddr, otherOpcodesLibAddr] =
    await deployOpcodeLibs();

  [parserAddr, executorLibAddr] = await deployBase();

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

  // TODO: comments below will be used only to fix tests for busines cases
  // then it shoul be removed
  /*
      TODO: pay attention, that the agreement.ts and agreementBusinessCase.ts has
      only one LP signature in the required list!
      It has to be used another test, like `Lifecycle Test Multiple LPs`
      to check multiple LPs
    */
  // ---> steps for businessCases with multiple LPs <---
  // await addSteps(businessCaseSteps(GP, [LPs[0], LPs[1]], 4), ContextCont, agreement.address);
  // await addSteps(businessCaseSteps(GP, [LPs[0], LPs[1]], 5), ContextCont, agreement.address);

  return agreement.address;
};

export const deployAgreementFactory = async () => {
  let comparisonOpcodesLibAddr: string;
  let branchingOpcodesLibAddr: string;
  let logicalOpcodesLibAddr: string;
  let otherOpcodesLibAddr: string;
  let executorLibAddr: string;
  let parserAddr: string;

  [comparisonOpcodesLibAddr, branchingOpcodesLibAddr, logicalOpcodesLibAddr, otherOpcodesLibAddr] =
    await deployOpcodeLibs();

  executorLibAddr = await deployExecutor();

  // Deploy AgreementFactory
  const factory = await (
    await ethers.getContractFactory('AgreementFactory', {
      libraries: {
        ComparisonOpcodes: comparisonOpcodesLibAddr,
        BranchingOpcodes: branchingOpcodesLibAddr,
        LogicalOpcodes: logicalOpcodesLibAddr,
        OtherOpcodes: otherOpcodesLibAddr,
        Executor: executorLibAddr,
      },
    })
  ).deploy();
  await factory.deployed();

  return factory.address;
};

export const deployConditionalTxs = async () => {
  // Deploy libraries
  let comparisonOpcodesLibAddr: string;
  let branchingOpcodesLibAddr: string;
  let logicalOpcodesLibAddr: string;
  let otherOpcodesLibAddr: string;
  let executorLibAddr: string;
  let parserAddr: string;

  [comparisonOpcodesLibAddr, branchingOpcodesLibAddr, logicalOpcodesLibAddr, otherOpcodesLibAddr] =
    await deployOpcodeLibs();

  [parserAddr, executorLibAddr] = await deployBase();

  const app = await (
    await ethers.getContractFactory('ConditionalTxs', {
      libraries: {
        ComparisonOpcodes: comparisonOpcodesLibAddr,
        BranchingOpcodes: branchingOpcodesLibAddr,
        LogicalOpcodes: logicalOpcodesLibAddr,
        OtherOpcodes: otherOpcodesLibAddr,
        Executor: executorLibAddr,
      },
    })
  ).deploy();

  return [app.address, parserAddr];
};
