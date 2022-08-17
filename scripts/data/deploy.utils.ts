import '@nomiclabs/hardhat-ethers';
import * as hre from 'hardhat';
// TODO: would it be better to store types both in the test directory?
import { parseEther } from 'ethers/lib/utils';
import { TxObject } from '../../test/types';
import { AgreementMock } from '../../typechain-types/agreement/mocks';
import { ContextMock, ParserMock, ExecutorMock } from '../../typechain-types/dsl/mocks';
import { OpcodeHelpersMock } from '../../typechain-types/dsl/mocks/opcodes';

const { ethers } = hre;

export const addSteps = async (
  preprocessorAddr: string,
  steps: TxObject[],
  agreementAddress: string
) => {
  let transactionContext;
  const agreement = await ethers.getContractAt('AgreementMock', agreementAddress);
  for await (const step of steps) {
    console.log(`\n---\n\n🧩 Adding Term #${step.txId} to Agreement`);
    let ContextMock = await ethers.getContractFactory('ContextMock');
    transactionContext = await ContextMock.deploy(agreementAddress);
    const cdCtxsAddrs = []; // conditional context Addresses

    console.log('\nTerm Conditions');

    for (let j = 0; j < step.conditions.length; j++) {
      const conditionContract = await ContextMock.deploy(agreementAddress);
      cdCtxsAddrs.push(conditionContract.address);
      await agreement.parse(step.conditions[j], conditionContract.address, preprocessorAddr);
      console.log(
        `\n\taddress: \x1b[35m${conditionContract.address}\x1b[0m\n\tcondition ${
          j + 1
        }:\n\t\x1b[33m${step.conditions[j]}\x1b[0m`
      );
    }
    await agreement.parse(step.transaction, transactionContext.address, preprocessorAddr);
    console.log('\nTerm transaction');
    console.log(`\n\taddress: \x1b[35m${transactionContext.address}\x1b[0m`);
    console.log(`\t\x1b[33m${step.transaction}\x1b[0m`);
    const { hash } = await agreement.update(
      step.txId,
      step.requiredTxs,
      step.signatories,
      step.transaction,
      step.conditions,
      transactionContext.address,
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
  // Deploy libraries
  const stringLib = await (await ethers.getContractFactory('StringUtils')).deploy();
  const byteLib = await (await ethers.getContractFactory('ByteUtils')).deploy();

  const ParserMockContract = await ethers.getContractFactory('ParserMock', {
    libraries: { StringUtils: stringLib.address, ByteUtils: byteLib.address },
  });
  const parser = await ParserMockContract.deploy();
  return parser.address;
};

export const deployExecutor = async () => {
  const executorLib = await (await ethers.getContractFactory('Executor')).deploy();
  return executorLib.address;
};

export const deployPreprocessor = async () => {
  const stringLib = await (await ethers.getContractFactory('StringUtils')).deploy();
  const preprocessor = await (
    await ethers.getContractFactory('Preprocessor', {
      libraries: { StringUtils: stringLib.address },
    })
  ).deploy();
  return preprocessor.address;
};

export const deployBase = async () => {
  const parserAddr = await deployParser();
  const executorLibAddr = await deployExecutor();
  const preprocessorAddr = await deployPreprocessor();

  return [parserAddr, executorLibAddr, preprocessorAddr];
};

export const deployAgreement = async () => {
  const [
    comparisonOpcodesLibAddr,
    branchingOpcodesLibAddr,
    logicalOpcodesLibAddr,
    otherOpcodesLibAddr,
  ] = await deployOpcodeLibs();

  const [parserAddr, executorLibAddr] = await deployBase();

  const AgreementContract = await ethers.getContractFactory('AgreementMock', {
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
  // await addSteps(preprocessorAddr, businessCaseSteps(GP, [LPs[0], LPs[1]], 4), ContextCont, agreement.address);
  // await addSteps(preprocessorAddr, businessCaseSteps(GP, [LPs[0], LPs[1]], 5), ContextCont, agreement.address);

  return agreement.address;
};

export const deployAgreementFactory = async () => {
  const [
    comparisonOpcodesLibAddr,
    branchingOpcodesLibAddr,
    logicalOpcodesLibAddr,
    otherOpcodesLibAddr,
  ] = await deployOpcodeLibs();

  const executorLibAddr = await deployExecutor();

  // Deploy AgreementFactory
  const factory = await (
    await ethers.getContractFactory('AgreementFactoryMock', {
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

export const deployConditionalTxs = async (agreementAddress: string) => {
  // TODO: Deploy only ConditionalTxs without libraries
  const [
    comparisonOpcodesLibAddr,
    branchingOpcodesLibAddr,
    logicalOpcodesLibAddr,
    otherOpcodesLibAddr,
  ] = await deployOpcodeLibs();

  const executorLibAddr = await deployExecutor();
  const app = await (
    await ethers.getContractFactory('ContextMock', {
      libraries: {
        ComparisonOpcodes: comparisonOpcodesLibAddr,
        BranchingOpcodes: branchingOpcodesLibAddr,
        LogicalOpcodes: logicalOpcodesLibAddr,
        OtherOpcodes: otherOpcodesLibAddr,
        Executor: executorLibAddr,
      },
    })
  ).deploy(agreementAddress);

  return app.address;
};
