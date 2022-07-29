import '@nomiclabs/hardhat-ethers';
import * as hre from 'hardhat';
import { TxObject } from '../test/types';
import { businessCaseSteps } from './data/agreement';

import { Context__factory } from '../typechain-types';
import { AgreementMock } from '../typechain-types/agreement/mocks';

const { ethers } = hre;

let agreement: AgreementMock;
const BASE = 4;

const addSteps = async (steps: TxObject[], Ctx: Context__factory) => {
  let txCtx;

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
    console.log(step.txId);
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

  const ParserCont = await ethers.getContractFactory('Parser', {
    libraries: { StringUtils: stringLib.address, ByteUtils: byteLib.address },
  });
  const parser = await ParserCont.deploy();
  const executorLib = await (await ethers.getContractFactory('Executor')).deploy();
  const AgreementContract = await ethers.getContractFactory('AgreementMock', {
    libraries: {
      ComparisonOpcodes: comparisonOpcodesLib.address,
      BranchingOpcodes: branchingOpcodesLib.address,
      LogicalOpcodes: logicalOpcodesLib.address,
      OtherOpcodes: otherOpcodesLib.address,
      Executor: executorLib.address,
    },
  });
  agreement = (await AgreementContract.deploy(parser.address)) as AgreementMock;
  await agreement.deployed();

  const ContextCont = await ethers.getContractFactory('Context');
  const [, GP, ...LPs] = await ethers.getSigners();

  await addSteps(businessCaseSteps(GP, [LPs[0], LPs[1]], BASE), ContextCont);

  console.log(await agreement.parser());
  const txsAddr = await agreement.txs();
  console.log({ txsAddr });

  console.log(`\x1b[42m Mock agreement address \x1b[0m\x1b[32m ${agreement.address}\x1b[0m`);
}

deploy();
