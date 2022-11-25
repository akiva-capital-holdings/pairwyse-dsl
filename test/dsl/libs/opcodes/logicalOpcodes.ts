import * as hre from 'hardhat';
import { expect } from 'chai';
import { ethers } from 'hardhat';
/* eslint-disable camelcase */
import {
  Stack__factory,
  ProgramContextMock,
  Stack,
  BaseStorage,
  LogicalOpcodesMock,
} from '../../../../typechain-types';
import { checkStack, pushToStack } from '../../../utils/utils';

describe('Logical opcodes', () => {
  let StackCont: Stack__factory;
  let app: LogicalOpcodesMock;
  let ctxProgram: ProgramContextMock;
  let ctxProgramAddr: string;
  let stack: Stack;
  let baseStorage: BaseStorage;
  /* eslint-enable camelcase */

  before(async () => {
    StackCont = await ethers.getContractFactory('Stack');
    baseStorage = await (await ethers.getContractFactory('BaseStorage')).deploy();
    ctxProgram = await (await ethers.getContractFactory('ProgramContextMock')).deploy();
    ctxProgramAddr = ctxProgram.address;

    // Deploy libraries
    const opcodeHelpersLib = await (await ethers.getContractFactory('OpcodeHelpers')).deploy();
    const logicalOpcodesLib = await (
      await ethers.getContractFactory('LogicalOpcodes', {
        libraries: { OpcodeHelpers: opcodeHelpersLib.address },
      })
    ).deploy();

    // Deploy LogicalOpcodesMock
    app = await (
      await ethers.getContractFactory('LogicalOpcodesMock', {
        libraries: { LogicalOpcodes: logicalOpcodesLib.address },
      })
    ).deploy();

    // Create Stack instance
    const stackAddr = await ctxProgram.stack();
    stack = await ethers.getContractAt('Stack', stackAddr);

    // Setup
    await ctxProgram.setAppAddress(baseStorage.address);
  });

  afterEach(async () => {
    await ctxProgram.setPc(0);
    await stack.clear();
  });

  describe('opAnd', () => {
    it('success', async () => {
      await pushToStack(ctxProgram, StackCont, [1, 1]);
      await app.opAnd(ctxProgramAddr);
      await checkStack(stack, 1, 1);

      await stack.clear();
      await ctxProgram.setPc(0);

      await pushToStack(ctxProgram, StackCont, [3, 2222]);
      await app.opAnd(ctxProgramAddr);
      await checkStack(stack, 1, 1);

      await stack.clear();
      await ctxProgram.setPc(0);

      await pushToStack(ctxProgram, StackCont, [2, 0]);
      await app.opAnd(ctxProgramAddr);
      await checkStack(stack, 1, 0);

      await stack.clear();
      await ctxProgram.setPc(0);

      await pushToStack(ctxProgram, StackCont, [0, 0]);
      await app.opAnd(ctxProgramAddr);
      await checkStack(stack, 1, 0);

      await stack.clear();
      await ctxProgram.setPc(0);

      await pushToStack(ctxProgram, StackCont, [0, 1]);
      await app.opAnd(ctxProgramAddr);
      await checkStack(stack, 1, 0);
    });
  });

  describe('opOr', () => {
    it('success', async () => {
      await pushToStack(ctxProgram, StackCont, [1, 1]);
      await app.opOr(ctxProgramAddr);
      await checkStack(stack, 1, 1);

      await stack.clear();
      await ctxProgram.setPc(0);

      await pushToStack(ctxProgram, StackCont, [3, 2222]);
      await app.opOr(ctxProgramAddr);
      await checkStack(stack, 1, 1);

      await stack.clear();
      await ctxProgram.setPc(0);

      await pushToStack(ctxProgram, StackCont, [2, 0]);
      await app.opOr(ctxProgramAddr);
      await checkStack(stack, 1, 1);

      await stack.clear();
      await ctxProgram.setPc(0);

      await pushToStack(ctxProgram, StackCont, [0, 0]);
      await app.opOr(ctxProgramAddr);
      await checkStack(stack, 1, 0);

      await stack.clear();
      await ctxProgram.setPc(0);

      await pushToStack(ctxProgram, StackCont, [0, 2]);
      await app.opOr(ctxProgramAddr);
      await checkStack(stack, 1, 1);
    });
  });

  describe('opXor', () => {
    it('success', async () => {
      await pushToStack(ctxProgram, StackCont, [1, 1]);
      await app.opXor(ctxProgramAddr);
      await checkStack(stack, 1, 0);

      await stack.clear();
      await ctxProgram.setPc(0);

      await pushToStack(ctxProgram, StackCont, [3, 2222]);
      await app.opXor(ctxProgramAddr);
      await checkStack(stack, 1, 0);

      await stack.clear();
      await ctxProgram.setPc(0);

      await pushToStack(ctxProgram, StackCont, [2222, 3]);
      await app.opXor(ctxProgramAddr);
      await checkStack(stack, 1, 0);

      await stack.clear();
      await ctxProgram.setPc(0);

      await pushToStack(ctxProgram, StackCont, [2, 0]);
      await app.opXor(ctxProgramAddr);
      await checkStack(stack, 1, 1);

      await stack.clear();
      await ctxProgram.setPc(0);

      await pushToStack(ctxProgram, StackCont, [0, 0]);
      await app.opXor(ctxProgramAddr);
      await checkStack(stack, 1, 0);

      await stack.clear();
      await ctxProgram.setPc(0);

      await pushToStack(ctxProgram, StackCont, [0, 2]);
      await app.opXor(ctxProgramAddr);
      await checkStack(stack, 1, 1);
    });
  });

  describe('opAdd', () => {
    it('success', async () => {
      await pushToStack(ctxProgram, StackCont, [1, 1]);
      await app.opAdd(ctxProgramAddr);
      await checkStack(stack, 1, 2);

      await stack.clear();
      await ctxProgram.setPc(0);

      await pushToStack(ctxProgram, StackCont, [3, 2222]);
      await app.opAdd(ctxProgramAddr);
      await checkStack(stack, 1, 2225);

      await stack.clear();
      await ctxProgram.setPc(0);

      await pushToStack(ctxProgram, StackCont, [2, 0]);
      await app.opAdd(ctxProgramAddr);
      await checkStack(stack, 1, 2);

      await stack.clear();
      await ctxProgram.setPc(0);

      await pushToStack(ctxProgram, StackCont, [0, 0]);
      await app.opAdd(ctxProgramAddr);
      await checkStack(stack, 1, 0);

      await stack.clear();
      await ctxProgram.setPc(0);

      await pushToStack(ctxProgram, StackCont, [0, 2]);
      await app.opAdd(ctxProgramAddr);
      await checkStack(stack, 1, 2);
    });
  });

  describe('opSub', () => {
    it('success', async () => {
      await pushToStack(ctxProgram, StackCont, [1, 1]);
      await app.opSub(ctxProgramAddr);
      await checkStack(stack, 1, 0);

      await stack.clear();
      await ctxProgram.setPc(0);

      await pushToStack(ctxProgram, StackCont, [2222, 3]);
      await app.opSub(ctxProgramAddr);
      await checkStack(stack, 1, 2219);

      await stack.clear();
      await ctxProgram.setPc(0);

      await pushToStack(ctxProgram, StackCont, [2, 0]);
      await app.opSub(ctxProgramAddr);
      await checkStack(stack, 1, 2);

      await stack.clear();
      await ctxProgram.setPc(0);

      await pushToStack(ctxProgram, StackCont, [0, 0]);
      await app.opSub(ctxProgramAddr);
      await checkStack(stack, 1, 0);
    });
  });

  describe('opMul', () => {
    it('success', async () => {
      await pushToStack(ctxProgram, StackCont, [1, 1]);
      await app.opMul(ctxProgramAddr);
      await checkStack(stack, 1, 1);

      await stack.clear();
      await ctxProgram.setPc(0);

      await pushToStack(ctxProgram, StackCont, [2222, 3]);
      await app.opMul(ctxProgramAddr);
      await checkStack(stack, 1, 6666);

      await stack.clear();
      await ctxProgram.setPc(0);

      await pushToStack(ctxProgram, StackCont, [2, 0]);
      await app.opMul(ctxProgramAddr);
      await checkStack(stack, 1, 0);

      await stack.clear();
      await ctxProgram.setPc(0);

      await pushToStack(ctxProgram, StackCont, [0, 0]);
      await app.opMul(ctxProgramAddr);
      await checkStack(stack, 1, 0);
    });
  });

  describe('opDiv', () => {
    it('success', async () => {
      await pushToStack(ctxProgram, StackCont, [1, 1]);
      await app.opDiv(ctxProgramAddr);
      await checkStack(stack, 1, 1);

      await stack.clear();
      await ctxProgram.setPc(0);

      await pushToStack(ctxProgram, StackCont, [3333, 3]);
      await app.opDiv(ctxProgramAddr);
      await checkStack(stack, 1, 1111);

      await stack.clear();
      await ctxProgram.setPc(0);

      await pushToStack(ctxProgram, StackCont, [5, 2]);
      await app.opDiv(ctxProgramAddr);
      await checkStack(stack, 1, 2);
    });
  });
});
