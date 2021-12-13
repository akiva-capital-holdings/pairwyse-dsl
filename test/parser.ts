import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  AppMock, Context, Stack, StackValue__factory,
} from '../typechain';
import { checkStack, checkStackTail, hex4Bytes } from './helpers/utils';

const NEXT_MONTH = Math.round((Date.now() + 1000 * 60 * 60 * 24 * 30) / 1000);
const PREV_MONTH = Math.round((Date.now() - 1000 * 60 * 60 * 24 * 30) / 1000);

describe.only('Parser', () => {
  let stack: Stack;
  let context: Context;
  let app: AppMock;
  let externalApp: AppMock;
  let extAppAddrHex: string;
  let StackValue: StackValue__factory;

  beforeEach(async () => {
    // Create StackValue Factory instance
    StackValue = await ethers.getContractFactory('StackValue');

    externalApp = await ethers.getContractFactory('AppMock').then((o) => o.deploy());
    extAppAddrHex = externalApp.address.slice(2);

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

  it('uint256 1122334433', async () => {
    await app.exec(['uint256', '1122334433']);
    await checkStack(StackValue, stack, 1, 1122334433);
  });

  it('uint256 2 uint256 3 -> 2 3', async () => {
    await app.exec(['uint256', '2', 'uint256', '3']);
    await checkStackTail(StackValue, stack, 2, [2, 3]);
  });

  it('5 == 5', async () => {
    await app.exec(['uint256', '5', 'uint256', '5', '==']);
    await checkStack(StackValue, stack, 1, 1);
  });

  it('5 != 6', async () => {
    await app.exec(['uint256', '5', 'uint256', '6', '!=']);
    await checkStack(StackValue, stack, 1, 1);
  });

  it('5 < 6', async () => {
    await app.exec(['uint256', '5', 'uint256', '6', '<']);
    await checkStack(StackValue, stack, 1, 1);
  });

  it('5 < 5 = false', async () => {
    await app.exec(['uint256', '5', 'uint256', '5', '<']);
    await checkStack(StackValue, stack, 1, 0);
  });

  it('6 > 5', async () => {
    await app.exec(['uint256', '6', 'uint256', '5', '>']);
    await checkStack(StackValue, stack, 1, 1);
  });

  it('5 > 5 = false', async () => {
    await app.exec(['uint256', '5', 'uint256', '5', '>']);
    await checkStack(StackValue, stack, 1, 0);
  });

  it('5 <= 5', async () => {
    await app.exec(['uint256', '5', 'uint256', '5', '<=']);
    await checkStack(StackValue, stack, 1, 1);
  });

  it('5 <= 6', async () => {
    await app.exec(['uint256', '5', 'uint256', '6', '<=']);
    await checkStack(StackValue, stack, 1, 1);
  });

  it('5 >= 5', async () => {
    await app.exec(['uint256', '5', 'uint256', '5', '>=']);
    await checkStack(StackValue, stack, 1, 1);
  });

  it('6 >= 5', async () => {
    await app.exec(['uint256', '6', 'uint256', '5', '>=']);
    await checkStack(StackValue, stack, 1, 1);
  });

  it('5 6 swap -> 6 5', async () => {
    await app.exec(['uint256', '5', 'uint256', '6', 'swap']);
    await checkStackTail(StackValue, stack, 2, [6, 5]);
  });

  describe('Logical AND', async () => {
    it('1 && 0 = false', async () => {
      await app.exec(['uint256', '1', 'uint256', '0', 'and']);
      await checkStack(StackValue, stack, 1, 0);
    });
    it('1 && 1 = true', async () => {
      await app.exec(['uint256', '1', 'uint256', '1', 'and']);
      await checkStack(StackValue, stack, 1, 1);
    });
    it('0 && 1 = false', async () => {
      await app.exec(['uint256', '0', 'uint256', '1', 'and']);
      await checkStack(StackValue, stack, 1, 0);
    });
    it('0 && 0 = false', async () => {
      await app.exec(['uint256', '0', 'uint256', '0', 'and']);
      await checkStack(StackValue, stack, 1, 0);
    });
    it('3 && 3 = false', async () => {
      await app.exec(['uint256', '3', 'uint256', '3', 'and']);
      await checkStack(StackValue, stack, 1, 1);
    });
    it('(((1 && 5) && 7) && 0) = 0', async () => {
      await app.exec([
        'uint256', '1',
        'uint256', '5',
        'and',

        'uint256', '7',
        'and',

        'uint256', '0',
        'and',
      ]);

      await checkStack(StackValue, stack, 1, 0);
    });
  });

  describe('Logical OR', async () => {
    it('1 || 0 = true', async () => {
      await app.exec(['uint256', '1', 'uint256', '0', 'or']);
      await checkStack(StackValue, stack, 1, 1);
    });
    it('1 || 1 = true', async () => {
      await app.exec(['uint256', '1', 'uint256', '1', 'or']);
      await checkStack(StackValue, stack, 1, 1);
    });
    it('0 || 5 = true', async () => {
      await app.exec(['uint256', '0', 'uint256', '5', 'or']);
      await checkStack(StackValue, stack, 1, 1);
    });
    it('0 || 0 = false', async () => {
      await app.exec(['uint256', '0', 'uint256', '0', 'or']);
      await checkStack(StackValue, stack, 1, 0);
    });
    it('3 || 3 = false', async () => {
      await app.exec(['uint256', '3', 'uint256', '3', 'or']);
      await checkStack(StackValue, stack, 1, 1);
    });
    it('0 || 0 || 3', async () => {
      await app.exec([
        'uint256', '0',
        'uint256', '0',
        'or',

        'uint256', '3',
        'or',
      ]);

      await checkStack(StackValue, stack, 1, 1);
    });
  });

  describe('Logical NOT', async () => {
    it('NOT 0 = 1', async () => {
      await app.exec(['uint256', '0', '!']);
      await checkStack(StackValue, stack, 1, 1);
    });
    it('NOT 1 = 0', async () => {
      await app.exec(['uint256', '1', '!']);
      await checkStack(StackValue, stack, 1, 0);
    });
    it('NOT 3 = 0', async () => {
      await app.exec(['uint256', '3', '!']);
      await checkStack(StackValue, stack, 1, 0);
    });
  });

  it('push false', async () => {
    await app.exec(['bool', 'false']);
    await checkStack(StackValue, stack, 1, 0);
  });

  it('push true', async () => {
    await app.exec(['bool', 'true']);
    await checkStack(StackValue, stack, 1, 1);
  });

  it('blockNumber', async () => {
    const tx = await app.exec(['blockNumber']);
    await checkStack(StackValue, stack, 1, tx.blockNumber!);
  });

  it.skip('blockTimestamp', async () => {
    const tx = await app.exec(['blockTimestamp']);
    await checkStack(StackValue, stack, 1, tx.timestamp!); // tx.timestamp === undefined
  });

  it('blockChainId', async () => {
    const tx = await app.exec(['blockChainId']);
    await checkStack(StackValue, stack, 1, tx.chainId);
  });

  it('block number < block timestamp', async () => {
    await app.exec(['blockNumber', 'blockTimestamp', '<']);
    await checkStack(StackValue, stack, 1, 1);
  });

  describe('loadLocal', async () => {
    it('loadLocal uint256 NUMBER', async () => {
      await app.setStorageUint256(hex4Bytes('NUMBER'), 777);

      await app.exec(['loadLocal', 'uint256', 'NUMBER']);
      await checkStack(StackValue, stack, 1, 777);
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

    it('loadLocal bool A (false)', async () => {
      await app.setStorageBool(hex4Bytes('A'), false);

      await app.exec(['loadLocal', 'bool', 'A']);
      await checkStack(StackValue, stack, 1, 0);
    });

    it('loadLocal bool B (true)', async () => {
      await app.setStorageBool(hex4Bytes('B'), true);

      await app.exec(['loadLocal', 'bool', 'B']);
      await checkStack(StackValue, stack, 1, 1);
    });

    it('loadLocal bool A (false) != loadLocal bool B (true)', async () => {
      await app.setStorageBool(hex4Bytes('A'), false);
      await app.setStorageBool(hex4Bytes('B'), true);

      await app.exec([
        'loadLocal', 'bool', 'A',
        'loadLocal', 'bool', 'B',
        '!=',
      ]);
      await checkStack(StackValue, stack, 1, 1);
    });
  });

  describe('loadLocal', async () => {
    it('loadLocal uint256 NUMBER', async () => {
      await app.setStorageUint256(hex4Bytes('NUMBER'), 777);

      await app.exec(['loadLocal', 'uint256', 'NUMBER']);
      await checkStack(StackValue, stack, 1, 777);
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

    it('loadLocal bool A (false)', async () => {
      await app.setStorageBool(hex4Bytes('A'), false);

      await app.exec(['loadLocal', 'bool', 'A']);
      await checkStack(StackValue, stack, 1, 0);
    });

    it('loadLocal bool B (true)', async () => {
      await app.setStorageBool(hex4Bytes('B'), true);

      await app.exec(['loadLocal', 'bool', 'B']);
      await checkStack(StackValue, stack, 1, 1);
    });

    it('loadLocal bool A (false) != loadLocal bool B (true)', async () => {
      await app.setStorageBool(hex4Bytes('A'), false);
      await app.setStorageBool(hex4Bytes('B'), true);

      await app.exec([
        'loadLocal', 'bool', 'A',
        'loadLocal', 'bool', 'B',
        '!=',
      ]);
      await checkStack(StackValue, stack, 1, 1);
    });
  });

  describe('loadRemote', async () => {
    it('loadRemote uint256 NUMBER', async () => {
      await externalApp.setStorageUint256(hex4Bytes('NUMBER'), 777);

      await app.exec(['loadRemote', 'uint256', 'NUMBER', extAppAddrHex]);
      await checkStack(StackValue, stack, 1, 777);
    });

    it('loadRemote uint256 NUMBER (1000) > loadRemote uint256 NUMBER2 (15)', async () => {
      // Set NUMBER
      const bytes32Number = hex4Bytes('NUMBER');
      await externalApp.setStorageUint256(bytes32Number, 1000);

      // Set NUMBER2
      const bytes32Number2 = hex4Bytes('NUMBER2');
      await externalApp.setStorageUint256(bytes32Number2, 15);

      await app.exec([
        'loadRemote', 'uint256', 'NUMBER', extAppAddrHex,
        'loadRemote', 'uint256', 'NUMBER2', extAppAddrHex,
        '>',
      ]);
      await checkStack(StackValue, stack, 1, 1);
    });

    it('blockTimestamp < loadRemote uint256 NEXT_MONTH', async () => {
      const bytes32Number = hex4Bytes('NEXT_MONTH');
      await externalApp.setStorageUint256(bytes32Number, NEXT_MONTH);

      await app.exec(['blockTimestamp', 'loadRemote', 'uint256', 'NEXT_MONTH', extAppAddrHex, '<']);
      await checkStack(StackValue, stack, 1, 1);
    });

    it('loadRemote bool A (false)', async () => {
      await externalApp.setStorageBool(hex4Bytes('A'), false);

      await app.exec(['loadRemote', 'bool', 'A', extAppAddrHex]);
      await checkStack(StackValue, stack, 1, 0);
    });

    it('loadRemote bool B (true)', async () => {
      await externalApp.setStorageBool(hex4Bytes('B'), true);

      await app.exec(['loadRemote', 'bool', 'B', extAppAddrHex]);
      await checkStack(StackValue, stack, 1, 1);
    });

    it('loadRemote bool A (false) != loadRemote bool B (true)', async () => {
      await externalApp.setStorageBool(hex4Bytes('A'), false);
      await externalApp.setStorageBool(hex4Bytes('B'), true);

      await app.exec([
        'loadRemote', 'bool', 'A', extAppAddrHex,
        'loadRemote', 'bool', 'B', extAppAddrHex,
        '!=',
      ]);
      await checkStack(StackValue, stack, 1, 1);
    });
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

  describe('Boolean Algebra', async () => {
    describe('Commutative law: A & B <=> B & A', async () => {
      async function testCase(a: boolean, b: boolean) {
        await app.exec([
          'bool', a.toString(),
          'bool', b.toString(),
          'and',

          'bool', b.toString(),
          'bool', a.toString(),
          'and',

          '==',
        ]);
        await checkStack(StackValue, stack, 1, 1);
      }

      it('T & F <=> F & T', async () => testCase(true, false));
      it('F & T <=> T & F', async () => testCase(false, true));
    });

    describe('Associative law: (A & B) & C <=> A & (B & C)', async () => {
      async function testCase(a: boolean, b: boolean, c: boolean) {
        const A = a.toString();
        const B = b.toString();
        const C = c.toString();
        await app.exec([
          'bool', A,
          'bool', B,
          'and',

          'bool', C,
          'and',

          // <=>

          'bool', A,
          'bool', B,
          'bool', C,
          'and',
          'and',

          '==',
        ]);
        await checkStack(StackValue, stack, 1, 1);
      }

      it('(F & F) & F <=> F & (F & F)', async () => testCase(false, false, false));
      it('(F & F) & T <=> F & (F & T)', async () => testCase(false, false, true));
      it('(F & T) & F <=> F & (T & F)', async () => testCase(false, true, false));
      it('(F & T) & T <=> F & (T & T)', async () => testCase(false, true, true));
      it('(T & F) & F <=> T & (F & F)', async () => testCase(true, false, false));
      it('(T & F) & T <=> T & (F & T)', async () => testCase(true, false, true));
      it('(T & T) & F <=> T & (T & F)', async () => testCase(true, true, false));
      it('(T & T) & T <=> T & (T & T)', async () => testCase(true, true, true));
    });

    describe('Distributive law: A & (B | C) <=> (A & B) | (A & C)', async () => {
      async function testCase(a: boolean, b: boolean, c: boolean) {
        const A = a.toString();
        const B = b.toString();
        const C = c.toString();

        await app.exec([
          'bool', A,
          'bool', B,
          'bool', C,
          'or',
          'and',

          // <=>

          'bool', A,
          'bool', B,
          'and',

          'bool', A,
          'bool', C,
          'and',

          'or',
          '==',
        ]);

        await checkStack(StackValue, stack, 1, 1);
      }

      it('F & (F | F) <=> (F & F) | (F & F)', async () => testCase(false, false, false));
      it('F & (F | T) <=> (F & F) | (F & T)', async () => testCase(false, false, true));
      it('F & (T | F) <=> (F & T) | (F & F)', async () => testCase(false, true, false));
      it('F & (T | T) <=> (F & T) | (F & T)', async () => testCase(false, true, true));
      it('T & (F | F) <=> (T & F) | (T & F)', async () => testCase(true, false, false));
      it('T & (F | T) <=> (T & F) | (T & T)', async () => testCase(true, false, true));
      it('T & (T | F) <=> (T & T) | (T & F)', async () => testCase(true, true, false));
      it('T & (T | T) <=> (T & T) | (T & T)', async () => testCase(true, true, true));
    });

    describe('DeMorgan\'s Law: !(A | B) <=> (!A) & (!B)', async () => {
      async function testCase(a: boolean, b: boolean) {
        const A = a.toString();
        const B = b.toString();

        await app.exec([
          'bool', A,
          'bool', B,
          'or',
          '!',

          'bool', A,
          '!',
          'bool', B,
          '!',
          'and',

          '==',
        ]);
        await checkStack(StackValue, stack, 1, 1);
      }

      it('!(F | F) <=> (!F) & (!F)', async () => testCase(false, false));
      it('!(T | F) <=> (!T) & (!F)', async () => testCase(true, false));
      it('!(F | T) <=> (!F) & (!T)', async () => testCase(false, true));
      it('!(T | T) <=> (!T) & (!T)', async () => testCase(true, true));
    });
  });

  it('should throw at unknownExpr', async () => {
    await expect(app.exec(['unknownExpr'])).to.be.revertedWith('Parser: invalid command found');
  });
});
