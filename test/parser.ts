import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  AppMock, Context, Stack, StackValue__factory,
} from '../typechain';
import { checkStack, hex4Bytes } from './helpers/utils';

const NEXT_MONTH = Math.round((Date.now() + 1000 * 60 * 60 * 24 * 30) / 1000);
const PREV_MONTH = Math.round((Date.now() - 1000 * 60 * 60 * 24 * 30) / 1000);

describe('Parser', () => {
  let stack: Stack;
  let context: Context;
  let app: AppMock;
  let externalApp: AppMock;
  let StackValue: StackValue__factory;

  beforeEach(async () => {
    // Create StackValue Factory instance
    StackValue = await ethers.getContractFactory('StackValue');

    externalApp = await ethers.getContractFactory('AppMock').then((o) => o.deploy());

    // Deploy App
    const AppCont = await ethers.getContractFactory('AppMock');
    app = await AppCont.deploy();

    // Create Context instance
    context = await ethers.getContractAt('Context', await app.ctx());

    // Create Stack instance
    const StackCont = await ethers.getContractFactory('Stack');
    const contextStackAddress = await context.stack();
    stack = StackCont.attach(contextStackAddress);
  });

  it('block number < block timestamp', async () => {
    await app.exec(['blockNumber', 'blockTimestamp', '<']);
    await checkStack(StackValue, stack, 1, 1);
  });

  it('loadLocal uint256 NUMBER (1000) > loadLocal uint256 NUMBER2 (15)', async () => {
    // Set NUMBER
    const bytes32Number = hex4Bytes('NUMBER');
    await app.setStorageUint256(bytes32Number, 1000);

    // Set NUMBER2
    const bytes32Number2 = hex4Bytes('NUMBER2');
    await app.setStorageUint256(bytes32Number2, 15);

    await app.exec(['loadLocal', 'uint256', 'NUMBER', 'loadLocal', 'uint256', 'NUMBER2', '>']);
    await checkStack(StackValue, stack, 1, 1);
  });

  it('blockTimestamp < loadLocal uint256 NEXT_MONTH', async () => {
    const bytes32Number = hex4Bytes('NEXT_MONTH');
    await app.setStorageUint256(bytes32Number, NEXT_MONTH);

    await app.exec(['blockTimestamp', 'loadLocal', 'uint256', 'NEXT_MONTH', '<']);
    await checkStack(StackValue, stack, 1, 1);
  });

  it('should throw at unknownExpr', async () => {
    await expect(app.exec(['unknownExpr'])).to.be.revertedWith('Parser: invalid command found');
  });

  it('loadLocal uint256 NUMBER', async () => {
    await app.setStorageUint256(hex4Bytes('NUMBER'), 777);

    await app.exec(['loadLocal', 'uint256', 'NUMBER']);
    await checkStack(StackValue, stack, 1, 777);
  });

  it('loadLocal bool B', async () => {
    await app.setStorageBool(hex4Bytes('B'), true);

    await app.exec(['loadLocal', 'bool', 'B']);
    await checkStack(StackValue, stack, 1, 1);
  });

  it('loadRemote uint256 NUMBER ADDR', async () => {
    await externalApp.setStorageUint256(hex4Bytes('NUMBER'), 777);

    await app.exec(['loadRemote', 'uint256', 'NUMBER', externalApp.address.slice(2)]);
    await checkStack(StackValue, stack, 1, 777);
  });

  it('should push false', async () => {
    await app.exec(['bool', 'false']);
    await checkStack(StackValue, stack, 1, 0);
  });

  it('should push true', async () => {
    await app.exec(['bool', 'true']);
    await checkStack(StackValue, stack, 1, 1);
  });

  it('uint256 1122334433', async () => {
    await app.exec(['uint256', '1122334433']);
    await checkStack(StackValue, stack, 1, 1122334433);
  });

  it('uint256 5 < uint256 6', async () => {
    await app.exec(['uint256', '5', 'uint256', '6', '<']);
    await checkStack(StackValue, stack, 1, 1);
  });

  it('T & T == T', async () => {
    const code = [
      'bool', 'true',
      'bool', 'true',
      'and',
    ];
    await app.exec(code);
    await checkStack(StackValue, stack, 1, 1);
  });

  it('(T & T) | T == T', async () => {
    const code = [
      'bool', 'true',
      'bool', 'true',
      'and',
      'bool', 'true',
      'or',
    ];
    await app.exec(code);
    await checkStack(StackValue, stack, 1, 1);
  });

  it('time > PREV_MONTH', async () => {
    await app.setStorageUint256(hex4Bytes('PREV_MONTH'), PREV_MONTH);
    await app.exec(['blockTimestamp', 'loadLocal', 'uint256', 'PREV_MONTH', '>']);
    await checkStack(StackValue, stack, 1, 1);
  });

  it('time < NEXT_MONTH', async () => {
    await app.setStorageUint256(hex4Bytes('NEXT_MONTH'), NEXT_MONTH);
    await app.exec(['blockTimestamp', 'loadLocal', 'uint256', 'NEXT_MONTH', '<']);
    await checkStack(StackValue, stack, 1, 1);
  });

  describe('((time > init) and (time < expiry)) or ((risk == true) == false)', async () => {
    // (A & B) | C
    const code = [
      'blockTimestamp',
      'loadLocal', 'uint256', 'INIT',
      '>', // A

      'blockTimestamp',
      'loadLocal', 'uint256', 'EXPIRY',
      '<', // B

      'and',

      'loadLocal', 'bool', 'RISK',
      'bool', 'true',
      '==',

      'bool', 'false',
      '==', // C

      'or',
    ];

    const ITS_RISKY = 1;
    const NOT_RISKY = 0;

    async function testCase(INIT: number, EXPIRY: number, RISK: number, target: number) {
      await app.setStorageUint256(hex4Bytes('INIT'), INIT);
      await app.setStorageUint256(hex4Bytes('EXPIRY'), EXPIRY);
      await app.setStorageUint256(hex4Bytes('RISK'), RISK);

      await app.exec(code);
      await checkStack(StackValue, stack, 1, target);
    }

    // T - true, F - false
    it('((T & T) | T) == T', async () => testCase(PREV_MONTH, NEXT_MONTH, NOT_RISKY, 1));
    it('((T & F) | T) == T', async () => testCase(PREV_MONTH, PREV_MONTH, NOT_RISKY, 1));
    it('((F & T) | T) == T', async () => testCase(NEXT_MONTH, NEXT_MONTH, NOT_RISKY, 1));
    it('((F & F) | T) == T', async () => testCase(NEXT_MONTH, PREV_MONTH, NOT_RISKY, 1));
    it('((T & T) | F) == T', async () => testCase(PREV_MONTH, NEXT_MONTH, ITS_RISKY, 1));
    it('((T & F) | F) == F', async () => testCase(PREV_MONTH, PREV_MONTH, ITS_RISKY, 0));
    it('((F & T) | F) == F', async () => testCase(NEXT_MONTH, NEXT_MONTH, ITS_RISKY, 0));
    it('((F & F) | F) == F', async () => testCase(NEXT_MONTH, PREV_MONTH, ITS_RISKY, 0));
  });
});
