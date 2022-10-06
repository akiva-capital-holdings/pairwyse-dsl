import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import * as hre from 'hardhat';
import { deployBaseMock } from '../../scripts/utils/deploy.utils.mock';
import { Context, ParserMock } from '../../typechain-types';
import { hex4Bytes } from '../utils/utils';

const { ethers, network } = hre;

describe('Parser', () => {
  let sender: SignerWithAddress;
  let app: ParserMock;
  let preprocessorAddr: string;
  let ctx: Context;
  let ctxAddr: string;
  let snapshotId: number;
  let appAddr: string;
  let appAddrHex: string;

  before(async () => {
    [sender] = await ethers.getSigners();

    [appAddr /* parser address */, , preprocessorAddr] = await deployBaseMock(hre);
    app = await ethers.getContractAt('ParserMock', appAddr);
    appAddrHex = appAddr.slice(2);

    // Deploy & setup Context
    ctx = await (await ethers.getContractFactory('Context')).deploy();
    ctxAddr = ctx.address;
    await ctx.setAppAddress(appAddr);
    await ctx.setMsgSender(sender.address);
  });

  beforeEach(async () => {
    snapshotId = await network.provider.send('evm_snapshot');
  });

  afterEach(async () => {
    // Return to the snapshot
    await network.provider.send('evm_revert', [snapshotId]);
  });

  describe('parse', () => {
    it('error: delegatecall to asmSelector fail', async () => {
      await expect(app.parse(preprocessorAddr, ctxAddr, 'uint256')).to.be.revertedWith('PRS1');
    });

    it('error: if adding number with a string', async () => {
      await expect(app.parse(preprocessorAddr, ctxAddr, '0 + a')).to.be.revertedWith(
        'Parser: "a" command is unknown'
      );
      await expect(app.parse(preprocessorAddr, ctxAddr, 'dd + 1')).to.be.revertedWith(
        'Parser: "dd" command is unknown'
      );
    });

    it('error: if adding number with a number that contains string', async () => {
      await expect(app.parse(preprocessorAddr, ctxAddr, '10d + 1')).to.be.revertedWith('SUT5');
    });

    it('error: if adding number with a number that can be hex', async () => {
      await expect(app.parse(preprocessorAddr, ctxAddr, '1 + 0x1')).to.be.revertedWith('SUT5');
    });

    it('error: if adding uint256 with string value with a number', async () => {
      await expect(app.parse(preprocessorAddr, ctxAddr, 'uint256 a + 1000')).to.be.revertedWith(
        'PRS1'
      );
    });

    it('uint256 1122334433', async () => {
      await app.parse(preprocessorAddr, ctxAddr, 'uint256 1122334433');
      const expected = '0x1a0000000000000000000000000000000000000000000000000000000042e576e1';
      expect(await ctx.program()).to.equal(expected);
    });

    it('var TIMESTAMP < var NEXT_MONTH', async () => {
      await app.parse(preprocessorAddr, ctxAddr, 'var TIMESTAMP < var NEXT_MONTH');
      expect(await ctx.program()).to.equal(
        '0x' +
          '1b' + // variable opcode
          '1b7b16d4' + // bytes32('TIMESTAMP')
          '1b' + // variable opcode
          'a75b67d7' + // bytes32('NEXT_MONTH')
          '03' // `<` opcode
      );
    });

    it('AMOUNT > 5', async () => {
      await app.parse(preprocessorAddr, ctxAddr, 'AMOUNT > 5');
      expect(await ctx.program()).equal(
        '0x' +
          '1b' + // variable opcode
          '1a3a187d' + // bytes32('AMOUNT')
          '1a' + // uint256 opcode
          '0000000000000000000000000000000000000000000000000000000000000005' + // value
          '04' // `>` opcode
      );
    });

    it('NUMBER > NUMBER2', async () => {
      await app.parse(preprocessorAddr, ctxAddr, 'NUMBER > NUMBER2');
      expect(await ctx.program()).equal(
        '0x' +
          '1b' + // variable opcode
          '545cbf77' + // bytes32('NUMBER')
          '1b' + // variable opcode
          'b66353ab' + //  bytes32('NUMBER2')
          '04' // `>` opcode
      );
    });

    it('((time > init) and (time < expiry)) or (risk != true)', async () => {
      await app.parse(
        preprocessorAddr,
        ctxAddr,
        `
          (var TIMESTAMP > var INIT)
          and
          (var TIMESTAMP < var EXPIRY)
          or
          (var RISK != bool true)
          `
      );
      expect(await ctx.program()).to.equal(
        '0x' +
          '1b' + // variable opcode
          '1b7b16d4' + // bytes32('TIMESTAMP')
          '1b' + // variable opcode
          'b687035e' + // bytes32('INIT')
          '04' + // `>` opcode
          '1b' + // variable opcode
          '1b7b16d4' + // bytes32('TIMESTAMP')
          '1b' + // variable opcode
          '9dc69bb5' + // bytes32('EXPIRY')
          '03' + // `<` opcode
          '12' + // `and` opcode
          '1b' + // variable opcode
          '55248f7c' + // bytes32('RISK')
          '18' + // `bool` opcode
          '01' + // true
          '14' + // `!=` opcode
          '13' // `or` opcode
      );
    });

    it('should throw at unknownExpr', async () => {
      await expect(app.parse(preprocessorAddr, ctxAddr, 'unknownExpr')).to.be.revertedWith(
        'Parser: "unknownExpr" command is unknown'
      );
      await expect(app.parse(preprocessorAddr, ctxAddr, '?!')).to.be.revertedWith(
        'Parser: "?!" command is unknown'
      );
    });

    it('if condition', async () => {
      const ONE = new Array(64).join('0') + 1;
      const TWO = new Array(64).join('0') + 2;
      const FOUR = new Array(64).join('0') + 4;

      await app.parseCodeExt(ctxAddr, [
        'bool',
        'true',
        'if',
        'action',
        'uint256',
        FOUR,
        'end',
        'action',
        'uint256',
        ONE,
        'uint256',
        TWO,
        'end',
      ]);

      const expected =
        '0x' +
        '18' + // bool
        '01' + // true
        '25' + // if
        '0027' + // position of the `action` branch
        '1a' + // uin256
        `${FOUR}` + // FOUR
        '24' + // end of body
        '1a' + // action: uint256
        `${ONE}` + // action: ONE
        '1a' + // action: uint256
        `${TWO}` + // action: TWO
        '24'; // action: end
      expect(await ctx.program()).to.equal(expected);
    });

    it('if-else condition', async () => {
      const ONE = new Array(64).join('0') + 1;
      const TWO = new Array(64).join('0') + 2;
      const THREE = new Array(64).join('0') + 3;
      const FOUR = new Array(64).join('0') + 4;

      await app.parseCodeExt(ctxAddr, [
        'bool',
        'true',
        'ifelse',
        'good',
        'bad',
        'uint256',
        FOUR,
        'end',
        'good',
        'uint256',
        ONE,
        'uint256',
        TWO,
        'end',
        'bad',
        'uint256',
        THREE,
        'end',
      ]);

      const expected =
        '0x' +
        '18' + // bool
        '01' + // true
        '23' + // ifelse
        '0029' + // position of the `good` branch
        '006c' + // position of the `bad` branch
        '1a' + // uin256
        `${FOUR}` + // FOUR
        '24' + // end of body
        '1a' + // good: uint256
        `${ONE}` + // good: ONE
        '1a' + // good: uint256
        `${TWO}` + // good: TWO
        '24' + // good: end
        '1a' + // bad: uint256
        `${THREE}` + // bad: THREE
        '24'; // bad: end
      expect(await ctx.program()).to.equal(expected);
    });
  });

  describe('Load local variables without `var` opcode', async () => {
    it('set two local variables, one of them using in the next command', async () => {
      /*
        Example:
          uint256 6 setUint256 A
          (A + 2) setUint256 SUM
      */
      const SIX = new Array(64).join('0') + 6;
      const TWO = new Array(64).join('0') + 2;
      const code = [
        'uint256',
        '6',
        'setUint256',
        'A',
        'var',
        'A',
        'uint256',
        '2',
        '+',
        'setUint256',
        'SUM',
      ];
      await app.parseCodeExt(ctxAddr, code);

      expect(await ctx.program()).to.equal(
        '0x' +
          '1a' + // uint256
          `${SIX}` + // 6
          '2e' + // setUint256
          '03783fac' + // bytecode for an `A` name
          '1b' + // var
          '03783fac' + // A
          '1a' + // uint256
          `${TWO}` +
          '26' + // +
          '2e' + // setUint256
          '2df384fb' // bytecode for a `SUM` name
      );
    });
  });

  describe('asmLoadRemote', () => {
    it('updates the program with the loadRemote variable (uin256)', async () => {
      // Set NUMBER
      const bytes32Number = hex4Bytes('NUMBER');
      await app.setStorageUint256(bytes32Number, 1000);

      await app.parseCodeExt(ctxAddr, ['loadRemote', 'uint256', 'NUMBER', appAddrHex]);

      expect(await ctx.program()).to.equal(
        '0x' +
          '1c' + // loadRemote
          '01' + // uint256
          '545cbf77' + // bytecode for a `NUMBER` name
          `${appAddrHex.toLowerCase()}`
      );
    });

    it('updates the program with the loadRemote variable (bool)', async () => {
      const bytes32Bool = hex4Bytes('BOOL_VALUE');
      // Set BOOL_VALUE
      await app.setStorageBool(bytes32Bool, true);

      await app.parseCodeExt(ctxAddr, ['loadRemote', 'bool', 'BOOL_VALUE', appAddrHex]);
      expect(await ctx.program()).to.equal(
        '0x' +
          '1c' + // loadRemote
          '02' + // bool
          'f11f9a5d' + // bytecode for a `BOOL_VALUE` name
          `${appAddrHex.toLowerCase()}`
      );
    });
    // TODO: add for other types
  });

  describe('DSL arrays', () => {
    /* Attention!
      TODO:
      All skiped tests are needed to check that functionality works well. Don't
      forget to check, update or remove tests after each changing in the code of
      arrays functionality
    */
    describe('declare array', () => {
      describe('uint256 type', () => {
        it.skip('simple array', async () => {
          await app.parseCodeExt(ctxAddr, ['declareArr', 'uint256', 'NUMBERS']);
          expect(await ctx.program()).to.equal(
            '0x' +
              '31' + // declareArr
              '01' + // uint256
              '1fff709e' // bytecode for a `NUMBERS` name
          );
        });

        it.skip('only with additional code just before it', async () => {
          const number = new Array(64).join('0') + 6;
          await app.parseCodeExt(ctxAddr, [
            'uint256',
            '6',
            'var',
            'TIMESTAMP',
            'declareArr',
            'uint256',
            'NUMBERS',
          ]);
          expect(await ctx.program()).to.equal(
            '0x' +
              '1a' + // uint256
              `${number}` + // 6
              '1b' + // var
              '1b7b16d4' + // TIMESTAMP
              '31' + // declareArr
              '01' + // uint256
              '1fff709e' // bytecode for a `NUMBERS` name
          );
        });

        it.skip('only with additional code just after it', async () => {
          const number = new Array(64).join('0') + 6;
          await app.parseCodeExt(ctxAddr, [
            'declareArr',
            'uint256',
            'NUMBERS',
            'uint256',
            '6',
            'var',
            'TIMESTAMP',
          ]);
          expect(await ctx.program()).to.equal(
            '0x' +
              '31' + // declareArr
              '01' + // uint256
              '1fff709e' + // bytecode for a `NUMBERS` name
              '1a' + // uint256
              `${number}` + // 6
              '1b' + // var
              '1b7b16d4' // TIMESTAMP
          );
        });

        it('with additional code before and after it', async () => {
          const number = new Array(64).join('0') + 6;
          await app.parseCodeExt(ctxAddr, [
            'uint256',
            '6',
            'declareArr',
            'uint256',
            'NUMBERS',
            'var',
            'TIMESTAMP',
          ]);
          expect(await ctx.program()).to.equal(
            '0x' +
              '1a' + // uint256
              `${number}` + // 6
              '31' + // declareArr
              '01' + // uint256
              '1fff709e' + // bytecode for a `NUMBERS` name
              '1b' + // var
              '1b7b16d4' // TIMESTAMP
          );
        });
      });

      describe('address type', () => {
        it.skip('declare simple array', async () => {
          await app.parseCodeExt(ctxAddr, ['declareArr', 'address', 'MARY']);
          expect(await ctx.program()).to.equal(
            '0x' +
              '31' + // declareArr
              '03' + // address
              '5e315030' // bytecode for a `MARY` name
          );
        });

        it.skip('only with additional code just before it', async () => {
          const number = new Array(64).join('0') + 6;
          await app.parseCodeExt(ctxAddr, [
            'uint256',
            '6',
            'var',
            'TIMESTAMP',
            'declareArr',
            'address',
            'MARY',
          ]);
          expect(await ctx.program()).to.equal(
            '0x' +
              '1a' + // uint256
              `${number}` + // 6
              '1b' + // var
              '1b7b16d4' + // TIMESTAMP
              '31' + // declareArr
              '03' + // address
              '5e315030' // bytecode for a `MARY` name
          );
        });

        it.skip('only with additional code just after it', async () => {
          const number = new Array(64).join('0') + 6;
          await app.parseCodeExt(ctxAddr, [
            'declareArr',
            'address',
            'MARY',
            'uint256',
            '6',
            'var',
            'TIMESTAMP',
          ]);
          expect(await ctx.program()).to.equal(
            '0x' +
              '31' + // declareArr
              '03' + // address
              '5e315030' + // bytecode for a `MARY` name
              '1a' + // uint256
              `${number}` + // 6
              '1b' + // var
              '1b7b16d4' // TIMESTAMP
          );
        });

        it('with additional code before and after it', async () => {
          const number = new Array(64).join('0') + 6;
          await app.parseCodeExt(ctxAddr, [
            'uint256',
            '6',
            'declareArr',
            'address',
            'MARY',
            'var',
            'TIMESTAMP',
          ]);
          expect(await ctx.program()).to.equal(
            '0x' +
              '1a' + // uint256
              `${number}` + // 6
              '31' + // declareArr
              '03' + // address
              '5e315030' + // bytecode for a `MARY` name
              '1b' + // var
              '1b7b16d4' // TIMESTAMP
          );
        });
      });
    });

    describe('Push data', () => {
      // TODO: add checks for boundary values (zero, max, bad cases)
      describe('uint256', () => {
        it('push an item to an array', async () => {
          const number = new Array(62).join('0') + 541;
          await app.parseCodeExt(ctxAddr, [
            'declareArr',
            'uint256',
            'NUMBERS',
            'push',
            '1345',
            'NUMBERS',
          ]);
          expect(await ctx.program()).to.equal(
            '0x' +
              '31' + // declareArr
              '01' + // uint256
              '1fff709e' + // bytecode for NUMBERS
              '33' + // push
              `${number}` + // first address
              '1fff709e' // bytecode for NUMBERS
          );
        });
      });

      describe('address', () => {
        it('push an item to an array', async () => {
          await app.parseCodeExt(ctxAddr, [
            'declareArr',
            'address',
            'PARTNERS',
            'push',
            '0xe7f8a90ede3d84c7c0166bd84a4635e4675accfc',
            'PARTNERS',
          ]);
          expect(await ctx.program()).to.equal(
            '0x' +
              '31' + // declareArr
              '03' + // uint256
              '3c8423ff' + // bytecode for PARTNERS
              '33' + // push
              'e7f8a90ede3d84c7c0166bd84a4635e4675accfc000000000000000000000000' + // address
              '3c8423ff' // bytecode for PARTNERS
          );
        });
      });
    });

    describe('Get array length', () => {
      it('different types with inserting values', async () => {
        await app.parseCodeExt(ctxAddr, [
          'declareArr',
          'uint256',
          'NUMBERS',
          'declareArr',
          'address',
          'INDEXES',
          'push',
          '0xe7f8a90ede3d84c7c0166bd84a4635e4675accfc',
          'INDEXES',
          'push',
          '1345',
          'NUMBERS',
          'push',
          '0x47f8a90ede3d84c7c0166bd84a4635e4675accfc',
          'INDEXES',
          'lengthOf',
          'INDEXES',
          'lengthOf',
          'NUMBERS',
        ]);

        const NUMBER = new Array(62).join('0') + 541;
        const ONE = new Array(64).join('0') + 1;
        const ZERO = new Array(65).join('0');

        const expectedProgram =
          '0x' +
          '31' + // declareArr
          '01' + // uint256
          '1fff709e' + // bytecode for NUMBERS
          '31' + // declareArr
          '03' + // address
          '257b3678' + // bytecode for INDEXES
          '33' + // push
          'e7f8a90ede3d84c7c0166bd84a4635e4675accfc000000000000000000000000' + // first address
          '257b3678' + // bytecode for INDEXES
          '33' + // push
          `${NUMBER}` + // 1345 in dec or 541 in hex
          '1fff709e' + // bytecode for NUMBERS
          '33' + // push
          '47f8a90ede3d84c7c0166bd84a4635e4675accfc000000000000000000000000' + // second address
          '257b3678' + // bytecode for INDEXES
          '34' + // lengthOf
          '257b3678' + // bytecode for INDEXES
          '34' + // lengthOf
          '1fff709e'; // bytecode for NUMBERS
        expect(await ctx.program()).to.equal(expectedProgram);
      });
    });

    describe('Get element by index', () => {
      it('different types with inserting values', async () => {
        await app.parseCodeExt(ctxAddr, [
          'declareArr',
          'uint256',
          'NUMBERS',
          'declareArr',
          'address',
          'INDEXES',
          'push',
          '0xe7f8a90ede3d84c7c0166bd84a4635e4675accfc',
          'INDEXES',
          'push',
          '1345',
          'NUMBERS',
          'push',
          '0x47f8a90ede3d84c7c0166bd84a4635e4675accfc',
          'INDEXES',
          'lengthOf',
          'INDEXES',
          'lengthOf',
          'NUMBERS',
          'get',
          '0',
          'NUMBERS',
          'get',
          '1',
          'INDEXES',
        ]);

        const NUMBER = new Array(62).join('0') + 541;
        const ONE = new Array(64).join('0') + 1;
        const ZERO = new Array(65).join('0');

        const expectedProgram =
          '0x' +
          '31' + // declareArr
          '01' + // uint256
          '1fff709e' + // bytecode for NUMBERS
          '31' + // declareArr
          '03' + // address
          '257b3678' + // bytecode for INDEXES
          '33' + // push
          'e7f8a90ede3d84c7c0166bd84a4635e4675accfc000000000000000000000000' + // first address
          '257b3678' + // bytecode for INDEXES
          '33' + // push
          `${NUMBER}` + // 1345 in dec or 541 in hex
          '1fff709e' + // bytecode for NUMBERS
          '33' + // push
          '47f8a90ede3d84c7c0166bd84a4635e4675accfc000000000000000000000000' + // second address
          '257b3678' + // bytecode for INDEXES
          '34' + // lengthOf
          '257b3678' + // bytecode for INDEXES
          '34' + // lengthOf
          '1fff709e' + // bytecode for NUMBERS
          '35' + // get
          `${ZERO}` + // 0 index
          '1fff709e' + // bytecode for NUMBERS
          '35' + // get
          `${ONE}` + // 1 index
          '257b3678'; // bytecode for INDEXES
        expect(await ctx.program()).to.equal(expectedProgram);
      });
    });
  });
});
