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

export const deployBase = async () => {
  const stringLib = await (await ethers.getContractFactory('StringUtils')).deploy();
  const byteLib = await (await ethers.getContractFactory('ByteUtils')).deploy();

  const ParserCont = await ethers.getContractFactory('Parser', {
    libraries: { StringUtils: stringLib.address, ByteUtils: byteLib.address },
  });
  const parser = await ParserCont.deploy();
  const executorLib = await (await ethers.getContractFactory('Executor')).deploy();
  return [parser.address, executorLib.address];
};

export const deployAgreement = async (
  comparisonOpcodesLibAddr: string,
  branchingOpcodesLibAddr: string,
  logicalOpcodesLibAddr: string,
  otherOpcodesLibAddr: string,
  executorLibAddr: string,
  parserAddr: string
) => {
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

  console.log(`\x1b[42m Agreement address \x1b[0m\x1b[32m ${agreement.address}\x1b[0m`);
  return agreement.address;
};

export const deployAgreementFull = async () => {
  let comparisonOpcodesLibAddr: string;
  let branchingOpcodesLibAddr: string;
  let logicalOpcodesLibAddr: string;
  let otherOpcodesLibAddr: string;
  let executorLibAddr: string;
  let parserAddr: string;

  [comparisonOpcodesLibAddr, branchingOpcodesLibAddr, logicalOpcodesLibAddr, otherOpcodesLibAddr] =
    await deployOpcodeLibs();

  [parserAddr, executorLibAddr] = await deployBase();
  const agreementAddr = await deployAgreement(
    comparisonOpcodesLibAddr,
    branchingOpcodesLibAddr,
    logicalOpcodesLibAddr,
    otherOpcodesLibAddr,
    executorLibAddr,
    parserAddr
  );
  return agreementAddr;
};
