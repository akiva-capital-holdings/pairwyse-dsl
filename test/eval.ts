/* eslint-disable camelcase */
import { ethers } from 'hardhat';
import {
  ContextMock,
  StackValue__factory,
  Stack,
  ExternalEvalAppMock,
  EvalAppMock,
  Opcodes,
} from '../typechain';
import { checkStack, hex4Bytes } from './helpers/utils';

describe('Context', () => {
  let context: ContextMock;
  let opcodes: Opcodes;
  let stack: Stack;
  let app: EvalAppMock;
  let externalApp: ExternalEvalAppMock;
  let StackValue: StackValue__factory;

  beforeEach(async () => {
    // Create StackValue Factory instance
    StackValue = await ethers.getContractFactory('StackValue');

    // use Parser for init opcodes
    const parser = await ethers.getContractFactory('Parser').then((o) => o.deploy());
    const ctxAddress = await parser.ctx();
    const opcodesAddress = await parser.opcodes();

    externalApp = await ethers.getContractFactory('ExternalEvalAppMock').then((o) => o.deploy(ctxAddress, opcodesAddress));

    // Deploy App
    const AppCont = await ethers.getContractFactory('EvalAppMock');
    app = await AppCont.deploy(await parser.ctx(), await parser.opcodes());

    // Create Context instance
    context = await ethers.getContractAt('Context', await app.ctx());

    // Create Stack instance
    const StackCont = await ethers.getContractFactory('Stack');
    const contextStackAddress = await context.stack();
    stack = StackCont.attach(contextStackAddress);
  });

  describe('eval()', async () => {
    it('blockNumber', async () => {
      /**
       * Program is:
       * `
       *  blockNumber
       * `
       */
      await context.setProgram('0x15');
      const evalTx = await app.eval();
      await checkStack(StackValue, stack, 1, evalTx.blockNumber || 0);
    });

    it('blockNumber < blockTimestamp', async () => {
      /**
       * Program is:
       * `
       *  blockNumber
       *  blockTimestamp
       *  <
       * `
       */
      await context.setProgram('0x151603');
      await app.eval();
      await checkStack(StackValue, stack, 1, 1);
    });

    describe.skip('Load local', () => {
      describe('opLoadLocalUint256', () => {
        it('17 > 15', async () => {
          // Set NUMBER
          const bytes32Number = hex4Bytes('NUMBER');
          await app.setStorageUint256(bytes32Number, 17);

          // Set NUMBER2
          const bytes32Number2 = hex4Bytes('NUMBER2');
          await app.setStorageUint256(bytes32Number2, 15);

          /**
           * The program is:
           * `
           *  loadLocalUint256 NUMBER
           *  loadLocalUint256 NUMBER2
           *  >
           * `
           */
          const number = bytes32Number.substr(2, 8);
          const number2 = bytes32Number2.substr(2, 8);
          // console.log(`0x0a${number}0a${number2}04`);
          await context.setProgram(`0x0a${number}0a${number2}04`);
          await app.eval();
          await checkStack(StackValue, stack, 1, 1);
        });

        it('5 <= 3', async () => {
          // Set NUMBER
          const bytes32Number = hex4Bytes('NUMBER');
          await app.setStorageUint256(bytes32Number, 5);

          // Set NUMBER2
          const bytes32Number2 = hex4Bytes('NUMBER2');
          await app.setStorageUint256(bytes32Number2, 3);

          /**
           * The program is:
           * `
           *  loadLocalUint256 NUMBER
           *  loadLocalUint256 NUMBER2
           *  >
           * `
           */
          const number = bytes32Number.substr(2, 8);
          const number2 = bytes32Number2.substr(2, 8);
          await context.setProgram(`0x0a${number}0a${number2}06`);
          await app.eval();
          await checkStack(StackValue, stack, 1, 0);
        });

        it('12 = 12', async () => {
          // Set NUMBER
          const bytes32Number = hex4Bytes('NUMBER');
          await app.setStorageUint256(bytes32Number, 12);

          // Set NUMBER2
          const bytes32Number2 = hex4Bytes('NUMBER2');
          await app.setStorageUint256(bytes32Number2, 12);

          /**
           * The program is:
           * `
           *  loadLocalUint256 NUMBER
           *  loadLocalUint256 NUMBER2
           *  >
           * `
           */
          const number = bytes32Number.substr(2, 8);
          const number2 = bytes32Number2.substr(2, 8);
          await context.setProgram(`0x0a${number}0a${number2}01`);
          await app.eval();
          await checkStack(StackValue, stack, 1, 1);
        });
      });

      describe('opLoadLocalBytes32', () => {
        it('bytes32 are equal', async () => {
          // Set BYTES
          const bytes32Bytes = hex4Bytes('BYTES');
          await app.setStorageBytes32(
            bytes32Bytes,
            '0x1234500000000000000000000000000000000000000000000000000000000001',
          );

          // Set BYTES2
          const bytes32Bytes2 = hex4Bytes('BYTES2');
          await app.setStorageBytes32(
            bytes32Bytes2,
            '0x1234500000000000000000000000000000000000000000000000000000000001',
          );

          /**
           * The program is:
           * `
           *  opLoadLocalBytes32 BYTES
           *  opLoadLocalBytes32 BYTES2
           *  =
           * `
           */
          const bytes = bytes32Bytes.substr(2, 8);
          const bytes2 = bytes32Bytes2.substr(2, 8);
          await context.setProgram(`0x0c${bytes}0c${bytes2}01`);
          await app.eval();
          await checkStack(StackValue, stack, 1, 1);
        });

        it('bytes32 are not equal', async () => {
          // Set BYTES
          const bytes32Bytes = hex4Bytes('BYTES');
          await app.setStorageBytes32(
            bytes32Bytes,
            '0x1234500000000000000000000000000000000000000000000000000000000001',
          );

          // Set BYTES2
          const bytes32Bytes2 = hex4Bytes('BYTES2');
          await app.setStorageBytes32(
            bytes32Bytes2,
            '0x1234500000000000000000000000000000000000000000000000000000000011',
          );

          /**
           * The program is:
           * `
           *  opLoadLocalBytes32 BYTES
           *  opLoadLocalBytes32 BYTES2
           *  =
           * `
           */
          const bytes = bytes32Bytes.substr(2, 8);
          const bytes2 = bytes32Bytes2.substr(2, 8);
          await context.setProgram(`0x0c${bytes}0c${bytes2}01`);
          await app.eval();
          await checkStack(StackValue, stack, 1, 0);
        });
      });

      describe('opLoadLocalAddress', () => {
        it('addresses are equal', async () => {
          // Set ADDR
          const bytes32Bytes = hex4Bytes('ADDR');
          await app.setStorageAddress(
            bytes32Bytes,
            '0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5',
          );

          // Set ADDR2
          const bytes32Bytes2 = hex4Bytes('ADDR2');
          await app.setStorageAddress(
            bytes32Bytes2,
            '0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5',
          );

          /**
           * The program is:
           * `
           *  opLoadLocalAddress ADDR
           *  opLoadLocalAddress ADDR2
           *  =
           * `
           */
          const bytes = bytes32Bytes.substr(2, 8);
          const bytes2 = bytes32Bytes2.substr(2, 8);
          await context.setProgram(`0x10${bytes}10${bytes2}01`);
          await app.eval();
          await checkStack(StackValue, stack, 1, 1);
        });

        it('addresses are not equal', async () => {
          // Set ADDR
          const bytes32Bytes = hex4Bytes('ADDR');
          await app.setStorageAddress(
            bytes32Bytes,
            '0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5',
          );

          // Set ADDR2
          const bytes32Bytes2 = hex4Bytes('ADDR2');
          await app.setStorageAddress(
            bytes32Bytes2,
            '0x1aD91ee08f21bE3dE0BA2ba6918E714dA6B45836',
          );

          /**
           * The program is:
           * `
           *  opLoadLocalAddress ADDR
           *  opLoadLocalAddress ADDR2
           *  =
           * `
           */
          const bytes = bytes32Bytes.substr(2, 8);
          const bytes2 = bytes32Bytes2.substr(2, 8);
          await context.setProgram(`0x10${bytes}10${bytes2}01`);
          await app.eval();
          await checkStack(StackValue, stack, 1, 0);
        });
      });

      describe('opLoadLocalBool', () => {
        it('true == true', async () => {
          // Set BOOL
          const bytes32Bytes = hex4Bytes('BOOL');
          await app.setStorageBool(bytes32Bytes, true);

          // Set BOOL2
          const bytes32Bytes2 = hex4Bytes('BOOL2');
          await app.setStorageBool(bytes32Bytes2, true);

          /**
           * The program is:
           * `
           *  opLoadLocalBool BOOL
           *  opLoadLocalBool BOOL2
           *  =
           * `
           */
          const bytes = bytes32Bytes.substr(2, 8);
          const bytes2 = bytes32Bytes2.substr(2, 8);
          await context.setProgram(`0x0e${bytes}0e${bytes2}01`);
          await app.eval();
          await checkStack(StackValue, stack, 1, 1);
        });

        it('true && true', async () => {
          // Set BOOL
          const bytes32Bytes = hex4Bytes('BOOL');
          await app.setStorageBool(bytes32Bytes, true);

          // Set BOOL2
          const bytes32Bytes2 = hex4Bytes('BOOL2');
          await app.setStorageBool(bytes32Bytes2, true);

          /**
           * The program is:
           * `
           *  opLoadLocalBool BOOL
           *  opLoadLocalBool BOOL2
           *  =
           * `
           */
          const bytes = bytes32Bytes.substr(2, 8);
          const bytes2 = bytes32Bytes2.substr(2, 8);
          await context.setProgram(`0x0e${bytes}0e${bytes2}12`);
          await app.eval();
          await checkStack(StackValue, stack, 1, 1);
        });

        it('true == false', async () => {
          // Set BOOL
          const bytes32Bytes = hex4Bytes('BOOL');
          await app.setStorageBool(bytes32Bytes, true);

          // Set BOOL2
          const bytes32Bytes2 = hex4Bytes('BOOL2');
          await app.setStorageBool(bytes32Bytes2, false);

          /**
           * The program is:
           * `
           *  opLoadLocalBool BOOL
           *  opLoadLocalBool BOOL2
           *  =
           * `
           */
          const bytes = bytes32Bytes.substr(2, 8);
          const bytes2 = bytes32Bytes2.substr(2, 8);
          await context.setProgram(`0x0e${bytes}0e${bytes2}01`);
          await app.eval();
          await checkStack(StackValue, stack, 1, 0);
        });
      });
    });

    describe.skip('Load remote', () => {
      let externalAppAddr: string;

      beforeEach(async () => {
        // Deploy user external application
        const ExternalAppCont = await ethers.getContractFactory(
          'ExternalEvalAppMock',
        );
        externalApp = await ExternalAppCont.deploy(
          context.address,
          opcodes.address,
        );

        // Create Context instance
        const contextAddress = await externalApp.ctx();
        const ContextCont = await ethers.getContractFactory('ContextMock');
        context = ContextCont.attach(contextAddress);

        // Create Stack instance
        const StackCont = await ethers.getContractFactory('Stack');
        const contextStackAddress = await context.stack();
        stack = StackCont.attach(contextStackAddress);

        externalAppAddr = externalApp.address.substr(2);
      });

      describe('opLoadRemoteUint256', () => {
        it('17 > 15', async () => {
          // Set N
          const bytes32Number = hex4Bytes('N');
          await externalApp.setStorageUint256(bytes32Number, 17);

          // Set N2
          const bytes32Number2 = hex4Bytes('N2');
          await externalApp.setStorageUint256(bytes32Number2, 15);

          /**
           * The program is:
           * `
           *  opLoadRemoteUint256 N
           *  opLoadRemoteUint256 N2
           *  >
           * `
           */
          const number = bytes32Number.substr(2, 8);
          const number2 = bytes32Number2.substr(2, 8);
          await context.setProgram(
            `0x0b${number}${externalAppAddr}0b${number2}${externalAppAddr}04`,
          );
          await externalApp.eval();
          await checkStack(StackValue, stack, 1, 1);
        });

        it('5 <= 3', async () => {
          // Set N
          const bytes32Number = hex4Bytes('N');
          await externalApp.setStorageUint256(bytes32Number, 5);

          // Set N2
          const bytes32Number2 = hex4Bytes('N2');
          await externalApp.setStorageUint256(bytes32Number2, 3);

          /**
           * The program is:
           * `
           *  opLoadRemoteUint256 N
           *  opLoadRemoteUint256 N2
           *  >
           * `
           */
          const number = bytes32Number.substr(2, 8);
          const number2 = bytes32Number2.substr(2, 8);
          await context.setProgram(
            `0x0b${number}${externalAppAddr}0b${number2}${externalAppAddr}06`,
          );
          await externalApp.eval();
          await checkStack(StackValue, stack, 1, 0);
        });

        it('12 = 12', async () => {
          // Set N
          const bytes32Number = hex4Bytes('N');
          await externalApp.setStorageUint256(bytes32Number, 12);

          // Set N2
          const bytes32Number2 = hex4Bytes('N2');
          await externalApp.setStorageUint256(bytes32Number2, 12);

          /**
           * The program is:
           * `
           *  opLoadRemoteUint256 N
           *  opLoadRemoteUint256 N2
           *  >
           * `
           */
          const number = bytes32Number.substr(2, 8);
          const number2 = bytes32Number2.substr(2, 8);
          await context.setProgram(
            `0x0b${number}${externalAppAddr}0b${number2}${externalAppAddr}01`,
          );
          await externalApp.eval();
          await checkStack(StackValue, stack, 1, 1);
        });
      });

      describe('opLoadRemoteBytes32', () => {
        it('bytes32 are equal', async () => {
          // Set BYTES
          const bytes32Bytes = hex4Bytes('BYTES');
          await externalApp.setStorageBytes32(
            bytes32Bytes,
            '0x1234500000000000000000000000000000000000000000000000000000000001',
          );

          // Set BYTES2
          const bytes32Bytes2 = hex4Bytes('BYTES2');
          await externalApp.setStorageBytes32(
            bytes32Bytes2,
            '0x1234500000000000000000000000000000000000000000000000000000000001',
          );

          /**
           * The program is:
           * `
           *  opLoadRemoteBytes32 BYTES
           *  opLoadRemoteBytes32 BYTES2
           *  =
           * `
           */
          const bytes = bytes32Bytes.substr(2, 8);
          const bytes2 = bytes32Bytes2.substr(2, 8);
          await context.setProgram(
            `0x0d${bytes}${externalAppAddr}0d${bytes2}${externalAppAddr}01`,
          );
          await externalApp.eval();
          await checkStack(StackValue, stack, 1, 1);
        });

        it('bytes32 are not equal', async () => {
          // Set BYTES
          const bytes32Bytes = hex4Bytes('BYTES');
          await externalApp.setStorageBytes32(
            bytes32Bytes,
            '0x1234500000000000000000000000000000000000000000000000000000000001',
          );

          // Set BYTES2
          const bytes32Bytes2 = hex4Bytes('BYTES2');
          await externalApp.setStorageBytes32(
            bytes32Bytes2,
            '0x1234500000000000000000000000000000000000000000000000000000000011',
          );

          /**
           * The program is:
           * `
           *  opLoadRemoteBytes32 BYTES
           *  opLoadRemoteBytes32 BYTES2
           *  =
           * `
           */
          const bytes = bytes32Bytes.substr(2, 8);
          const bytes2 = bytes32Bytes2.substr(2, 8);
          await context.setProgram(
            `0x0d${bytes}${externalAppAddr}0d${bytes2}${externalAppAddr}01`,
          );
          await externalApp.eval();
          await checkStack(StackValue, stack, 1, 0);
        });
      });

      describe('opLoadRemoteBool', () => {
        it('true == true', async () => {
          // Set BOOL
          const boolBytes = hex4Bytes('BOOL');
          await externalApp.setStorageBool(boolBytes, true);

          // Set BOOL2
          const boolBytes2 = hex4Bytes('BOOL2');
          await externalApp.setStorageBool(boolBytes2, true);

          /**
           * The program is:
           * `
           *  opLoadRemoteBool BOOL
           *  opLoadRemoteBool BOOL2
           *  =
           * `
           */
          const bool = boolBytes.substr(2, 8);
          const bool2 = boolBytes2.substr(2, 8);
          await context.setProgram(
            `0x0f${bool}${externalAppAddr}0f${bool2}${externalAppAddr}01`,
          );
          await externalApp.eval();
          await checkStack(StackValue, stack, 1, 1);
        });

        it('true != true', async () => {
          // Set BOOL
          const boolBytes = hex4Bytes('BOOL');
          await externalApp.setStorageBool(boolBytes, true);

          // Set BOOL2
          const boolBytes2 = hex4Bytes('BOOL2');
          await externalApp.setStorageBool(boolBytes2, true);

          /**
           * The program is:
           * `
           *  opLoadRemoteBool BOOL
           *  opLoadRemoteBool BOOL2
           *  !=
           * `
           */
          const bool = boolBytes.substr(2, 8);
          const bool2 = boolBytes2.substr(2, 8);
          await context.setProgram(
            `0x0f${bool}${externalAppAddr}0f${bool2}${externalAppAddr}14`,
          );
          await externalApp.eval();
          await checkStack(StackValue, stack, 1, 0);
        });
      });

      describe('opLoadRemoteAddress', () => {
        it('addresses are equal', async () => {
          // Set ADDR
          const addrBytes = hex4Bytes('ADDR');
          await externalApp.setStorageAddress(
            addrBytes,
            '0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5',
          );

          // Set ADDR2
          const addrBytes2 = hex4Bytes('ADDR2');
          await externalApp.setStorageAddress(
            addrBytes2,
            '0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5',
          );

          /**
           * The program is:
           * `
           *  opLoadRemoteAddress ADDR
           *  opLoadRemoteAddress ADDR2
           *  =
           * `
           */
          const addr = addrBytes.substr(2, 8);
          const addr2 = addrBytes2.substr(2, 8);
          await context.setProgram(
            `0x11${addr}${externalAppAddr}11${addr2}${externalAppAddr}01`,
          );
          await externalApp.eval();
          await checkStack(StackValue, stack, 1, 1);
        });

        it('different addresses are not equal', async () => {
          // Set A
          const addrBytes = hex4Bytes('A');
          await externalApp.setStorageAddress(
            addrBytes,
            '0x52bc44d5378309EE2abF1539BF71dE1b7d7bE3b5',
          );

          // Set A2
          const addrBytes2 = hex4Bytes('A2');
          await externalApp.setStorageAddress(
            addrBytes2,
            '0x1aD91ee08f21bE3dE0BA2ba6918E714dA6B45836',
          );

          /**
           * The program is:
           * `
           *  opLoadRemoteAddress A
           *  opLoadRemoteAddress A2
           *  =
           * `
           */
          const addr = addrBytes.substr(2, 8);
          const addr2 = addrBytes2.substr(2, 8);
          await context.setProgram(
            `0x11${addr}${externalAppAddr}11${addr2}${externalAppAddr}01`,
          );
          await externalApp.eval();
          await checkStack(StackValue, stack, 1, 0);
        });
      });
    });
  });
});
