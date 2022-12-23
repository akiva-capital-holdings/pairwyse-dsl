import * as hre from 'hardhat';
import { expect } from 'chai';
import { ethers } from 'hardhat';
/* eslint-disable camelcase */
import {
  Stack__factory,
  ProgramContextMock,
  Stack,
  BaseStorage,
  ComparisonOpcodesMock,
} from '../../../../typechain-types';
import { checkStack, pushToStack } from '../../../utils/utils';

// works
describe('Comparison opcodes', () => {
  // eslint-disable-next-line camelcase
  let StackCont: Stack__factory;
  let app: ComparisonOpcodesMock;
  let programContext: ProgramContextMock;
  let ctxProgramAddr: string;
  let stack: Stack;
  let baseStorage: BaseStorage;

  before(async () => {
    StackCont = await ethers.getContractFactory('Stack');
    baseStorage = await (await ethers.getContractFactory('BaseStorage')).deploy();
    programContext = await (await ethers.getContractFactory('ProgramContextMock')).deploy();
    ctxProgramAddr = programContext.address;

    // Deploy libraries
    const opcodeHelpersLib = await (await ethers.getContractFactory('OpcodeHelpers')).deploy();
    const comparisonOpcodesLib = await (
      await ethers.getContractFactory('ComparisonOpcodes', {
        libraries: { OpcodeHelpers: opcodeHelpersLib.address },
      })
    ).deploy();

    // Deploy ComparisonOpcodesMock
    app = await (
      await ethers.getContractFactory('ComparisonOpcodesMock', {
        libraries: { ComparisonOpcodes: comparisonOpcodesLib.address },
      })
    ).deploy();

    // Create Stack instance
    const stackAddr = await programContext.stack();
    stack = await ethers.getContractAt('Stack', stackAddr);

    // Setup
    await programContext.setAppAddress(baseStorage.address);
  });

  afterEach(async () => {
    await programContext.setPc(0);
    await stack.clear();
  });

  describe('opEq', () => {
    it('success', async () => {
      await pushToStack(programContext, StackCont, [1, 1]);
      await app.opEq(ctxProgramAddr, ethers.constants.AddressZero);
      await checkStack(stack, 1, 1);

      await stack.clear();
      await programContext.setPc(0);

      await pushToStack(programContext, StackCont, [1, 2]);
      await app.opEq(ctxProgramAddr, ethers.constants.AddressZero);
      await checkStack(stack, 1, 0);
    });
  });

  describe('opNotEq', () => {
    it('success', async () => {
      await pushToStack(programContext, StackCont, [1, 1]);
      await app.opNotEq(ctxProgramAddr, ethers.constants.AddressZero);
      await checkStack(stack, 1, 0);

      await stack.clear();
      await programContext.setPc(0);

      await pushToStack(programContext, StackCont, [1, 2]);
      await app.opNotEq(ctxProgramAddr, ethers.constants.AddressZero);
      await checkStack(stack, 1, 1);
    });
  });

  describe('opLt', () => {
    it('success', async () => {
      await pushToStack(programContext, StackCont, [1, 1]);
      await app.opLt(ctxProgramAddr, ethers.constants.AddressZero);
      await checkStack(stack, 1, 0);

      await stack.clear();
      await programContext.setPc(0);

      await pushToStack(programContext, StackCont, [1, 2]);
      await app.opLt(ctxProgramAddr, ethers.constants.AddressZero);
      await checkStack(stack, 1, 1);

      await stack.clear();
      await programContext.setPc(0);

      await pushToStack(programContext, StackCont, [2, 1]);
      await app.opLt(ctxProgramAddr, ethers.constants.AddressZero);
      await checkStack(stack, 1, 0);
    });
  });

  describe('opNot', () => {
    it('success', async () => {
      await pushToStack(programContext, StackCont, [1, 1]);
      await app.opNot(ctxProgramAddr, ethers.constants.AddressZero);
      await checkStack(stack, 2, 0);

      await stack.clear();
      await programContext.setPc(0);

      await pushToStack(programContext, StackCont, [0, 1]);
      await app.opNot(ctxProgramAddr, ethers.constants.AddressZero);
      await checkStack(stack, 2, 0);

      await stack.clear();
      await programContext.setPc(0);

      await pushToStack(programContext, StackCont, [0, 0]);
      await app.opNot(ctxProgramAddr, ethers.constants.AddressZero);
      await checkStack(stack, 2, 1);

      await stack.clear();
      await programContext.setPc(0);

      await pushToStack(programContext, StackCont, [1]);
      await app.opNot(ctxProgramAddr, ethers.constants.AddressZero);
      await checkStack(stack, 1, 0);
    });
  });

  describe('opSwap', () => {
    it('success', async () => {
      await pushToStack(programContext, StackCont, [1, 1]);
      await app.opSwap(ctxProgramAddr, ethers.constants.AddressZero);
      await checkStack(stack, 2, 1);

      await stack.clear();
      await programContext.setPc(0);

      await pushToStack(programContext, StackCont, [0]);
      await app.opNot(ctxProgramAddr, ethers.constants.AddressZero);
      await checkStack(stack, 1, 1);

      await stack.clear();
      await programContext.setPc(0);

      await pushToStack(programContext, StackCont, [0, 1]);
      await app.opNot(ctxProgramAddr, ethers.constants.AddressZero);
      await checkStack(stack, 2, 0);
    });
  });

  describe('opGt', () => {
    it('success', async () => {
      await pushToStack(programContext, StackCont, [2, 1]);
      await app.opGt(ctxProgramAddr, ethers.constants.AddressZero);
      await checkStack(stack, 1, 1);

      await stack.clear();
      await programContext.setPc(0);

      await pushToStack(programContext, StackCont, [1, 2]);
      await app.opGt(ctxProgramAddr, ethers.constants.AddressZero);
      await checkStack(stack, 1, 0);

      await stack.clear();
      await programContext.setPc(0);

      await pushToStack(programContext, StackCont, [1, 1]);
      await app.opGt(ctxProgramAddr, ethers.constants.AddressZero);
      await checkStack(stack, 1, 0);
    });
  });

  describe('opLe', () => {
    it('success', async () => {
      await pushToStack(programContext, StackCont, [2, 1]);
      await app.opLe(ctxProgramAddr, ethers.constants.AddressZero);
      await checkStack(stack, 1, 0);

      await stack.clear();
      await programContext.setPc(0);

      await pushToStack(programContext, StackCont, [1, 2]);
      await app.opLe(ctxProgramAddr, ethers.constants.AddressZero);
      await checkStack(stack, 1, 1);

      await stack.clear();
      await programContext.setPc(0);

      await pushToStack(programContext, StackCont, [1, 1]);
      await app.opLe(ctxProgramAddr, ethers.constants.AddressZero);
      await checkStack(stack, 1, 1);

      await stack.clear();
      await programContext.setPc(0);

      await pushToStack(programContext, StackCont, [1, 0]);
      await app.opLe(ctxProgramAddr, ethers.constants.AddressZero);
      await checkStack(stack, 1, 0);

      await stack.clear();
      await programContext.setPc(0);

      await pushToStack(programContext, StackCont, [0, 1]);
      await app.opLe(ctxProgramAddr, ethers.constants.AddressZero);
      await checkStack(stack, 1, 1);
    });
  });

  describe('opGe', () => {
    it('success', async () => {
      await pushToStack(programContext, StackCont, [2, 1]);
      await app.opGe(ctxProgramAddr, ethers.constants.AddressZero);
      await checkStack(stack, 1, 1);

      await stack.clear();
      await programContext.setPc(0);

      await pushToStack(programContext, StackCont, [1, 2]);
      await app.opGe(ctxProgramAddr, ethers.constants.AddressZero);
      await checkStack(stack, 1, 0);

      await stack.clear();
      await programContext.setPc(0);

      await pushToStack(programContext, StackCont, [1, 1]);
      await app.opGe(ctxProgramAddr, ethers.constants.AddressZero);
      await checkStack(stack, 1, 1);

      await stack.clear();
      await programContext.setPc(0);

      await pushToStack(programContext, StackCont, [1, 0]);
      await app.opGe(ctxProgramAddr, ethers.constants.AddressZero);
      await checkStack(stack, 1, 1);

      await stack.clear();
      await programContext.setPc(0);

      await pushToStack(programContext, StackCont, [0, 1]);
      await app.opGe(ctxProgramAddr, ethers.constants.AddressZero);
      await checkStack(stack, 1, 0);
    });
  });
});
