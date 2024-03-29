import { expect } from 'chai';
import * as hre from 'hardhat';
import { deployOpcodeLibs } from '../../../scripts/utils/deploy.utils';
import { deployBaseMock } from '../../../scripts/utils/deploy.utils.mock';
import { DSLContextMock, ProgramContextMock, ParserMock } from '../../../typechain-types';
import { hex4Bytes, bnToLongHexString } from '../../utils/utils';

const { ethers, network } = hre;

describe('Parser', () => {
  let parser: ParserMock;
  let preprocessorAddr: string;
  let ctxDSL: DSLContextMock;
  let ctxProgram: ProgramContextMock;
  let ctxDSLAddr: string;
  let ctxProgramAddr: string;
  let snapshotId: number;
  let parserAddr: string;
  let parserAddrHex: string;

  before(async () => {
    [parserAddr /* parser address */, , preprocessorAddr] = await deployBaseMock(hre);
    parser = await ethers.getContractAt('ParserMock', parserAddr);
    parserAddrHex = parserAddr.substring(2);
    // Deploy & setup Context
    const [
      comparisonOpcodesLibAddr,
      branchingOpcodesLibAddr,
      logicalOpcodesLibAddr,
      otherOpcodesLibAddr,
      complexOpcodesLibAddr,
    ] = await deployOpcodeLibs(hre);
    ctxDSL = await (
      await ethers.getContractFactory('DSLContextMock')
    ).deploy(
      comparisonOpcodesLibAddr,
      branchingOpcodesLibAddr,
      logicalOpcodesLibAddr,
      otherOpcodesLibAddr,
      complexOpcodesLibAddr
    );
    ctxProgram = await (await ethers.getContractFactory('ProgramContextMock')).deploy();
    ctxDSLAddr = ctxDSL.address;
    ctxProgramAddr = ctxProgram.address;
    await ctxProgram.setAppAddress(parser.address);
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
      await expect(
        parser.parse(preprocessorAddr, ctxDSLAddr, ctxProgramAddr, 'uint256')
      ).to.be.revertedWith('PRS1');
    });

    it('error: if adding number with a string', async () => {
      await expect(
        parser.parse(preprocessorAddr, ctxDSLAddr, ctxProgramAddr, '0 + a')
      ).to.be.revertedWith('Parser: "a" command is unknown');
      await expect(
        parser.parse(preprocessorAddr, ctxDSLAddr, ctxProgramAddr, 'dd + 1')
      ).to.be.revertedWith('Parser: "dd" command is unknown');
    });

    it('error: if adding number with a number that contains string', async () => {
      await expect(
        parser.parse(preprocessorAddr, ctxDSLAddr, ctxProgramAddr, '10d + 1')
      ).to.be.revertedWith('SUT5');
    });

    it('error: if adding number with a number that can be hex', async () => {
      await expect(
        parser.parse(preprocessorAddr, ctxDSLAddr, ctxProgramAddr, '1 + 0x1')
      ).to.be.revertedWith('SUT5');
    });

    it('error: if adding uint256 with string value with a number', async () => {
      await expect(
        parser.parse(preprocessorAddr, ctxDSLAddr, ctxProgramAddr, 'uint256 a + 1000')
      ).to.be.revertedWith('PRS1');
    });

    it('uint256 1122334433', async () => {
      await parser.parse(preprocessorAddr, ctxDSLAddr, ctxProgramAddr, 'uint256 1122334433');
      const expected = '0x1a0000000000000000000000000000000000000000000000000000000042e576e1';
      expect(await ctxProgram.program()).to.equal(expected);
    });

    it('var TIMESTAMP < var NEXT_MONTH', async () => {
      await parser.parse(
        preprocessorAddr,
        ctxDSLAddr,
        ctxProgramAddr,
        'var TIMESTAMP < var NEXT_MONTH'
      );
      expect(await ctxProgram.program()).to.equal(
        '0x' +
          '1b' + // variable opcode
          '1b7b16d4' + // bytes32('TIMESTAMP')
          '1b' + // variable opcode
          'a75b67d7' + // bytes32('NEXT_MONTH')
          '03' // `<` opcode
      );
    });

    it('AMOUNT > 5', async () => {
      await parser.parse(preprocessorAddr, ctxDSLAddr, ctxProgramAddr, 'AMOUNT > 5');
      expect(await ctxProgram.program()).equal(
        '0x' +
          '1b' + // variable opcode
          '1a3a187d' + // bytes32('AMOUNT')
          '1a' + // uint256 opcode
          '0000000000000000000000000000000000000000000000000000000000000005' + // value
          '04' // `>` opcode
      );
    });

    it('NUMBER > NUMBER2', async () => {
      await parser.parse(preprocessorAddr, ctxDSLAddr, ctxProgramAddr, 'NUMBER > NUMBER2');
      expect(await ctxProgram.program()).equal(
        '0x' +
          '1b' + // variable opcode
          '545cbf77' + // bytes32('NUMBER')
          '1b' + // variable opcode
          'b66353ab' + //  bytes32('NUMBER2')
          '04' // `>` opcode
      );
    });

    it('((time > init) and (time < expiry)) or (risk != true)', async () => {
      await parser.parse(
        preprocessorAddr,
        ctxDSLAddr,
        ctxProgramAddr,
        `
          (var TIMESTAMP > var INIT)
          and
          (var TIMESTAMP < var EXPIRY)
          or
          (var RISK != bool true)
          `
      );
      expect(await ctxProgram.program()).to.equal(
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
      await expect(
        parser.parse(preprocessorAddr, ctxDSLAddr, ctxProgramAddr, 'unknownExpr')
      ).to.be.revertedWith('Parser: "unknownExpr" command is unknown');
      await expect(
        parser.parse(preprocessorAddr, ctxDSLAddr, ctxProgramAddr, '?!')
      ).to.be.revertedWith('Parser: "?!" command is unknown');
    });

    it('if condition', async () => {
      const ONE = new Array(64).join('0') + 1;
      const TWO = new Array(64).join('0') + 2;
      const FOUR = new Array(64).join('0') + 4;

      await parser.parseCode(ctxDSLAddr, ctxProgramAddr, [
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
      expect(await ctxProgram.program()).to.equal(expected);
    });

    it('if-else condition', async () => {
      const ONE = new Array(64).join('0') + 1;
      const TWO = new Array(64).join('0') + 2;
      const THREE = new Array(64).join('0') + 3;
      const FOUR = new Array(64).join('0') + 4;

      await parser.parseCode(ctxDSLAddr, ctxProgramAddr, [
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
      expect(await ctxProgram.program()).to.equal(expected);
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
      await parser.parseCode(ctxDSLAddr, ctxProgramAddr, code);

      expect(await ctxProgram.program()).to.equal(
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
      await parser['setStorageUint256(bytes32,uint256)'](bytes32Number, 1000);

      await parser.parseCode(ctxDSLAddr, ctxProgramAddr, [
        'loadRemote',
        'uint256',
        'NUMBER',
        parserAddr,
      ]);

      expect(await ctxProgram.program()).to.equal(
        '0x' +
          '1c' + // loadRemote
          '01' + // uint256
          '545cbf77' + // bytecode for a `NUMBER` name
          `${parserAddrHex.toLowerCase()}`
      );
    });

    it('updates the program with the loadRemote variable (bool)', async () => {
      const bytes32Bool = hex4Bytes('BOOL_VALUE');
      // Set BOOL_VALUE
      await parser['setStorageBool(bytes32,bool)'](bytes32Bool, true);

      await parser.parseCode(ctxDSLAddr, ctxProgramAddr, [
        'loadRemote',
        'bool',
        'BOOL_VALUE',
        parserAddr,
      ]);
      expect(await ctxProgram.program()).to.equal(
        '0x' +
          '1c' + // loadRemote
          '02' + // bool
          'f11f9a5d' + // bytecode for a `BOOL_VALUE` name
          `${parserAddrHex.toLowerCase()}`
      );
    });
    // TODO: add for other types
  });

  describe('DSL arrays', () => {
    describe('declare array', () => {
      describe('uint256 type', () => {
        describe('declare array', () => {
          it('simple array', async () => {
            await parser.parseCode(ctxDSLAddr, ctxProgramAddr, [
              'declareArr',
              'uint256',
              'NUMBERS',
            ]);
            expect(await ctxProgram.program()).to.equal(
              '0x' +
                '31' + // declareArr
                '01' + // uint256
                '1fff709e' // bytecode for a `NUMBERS` name
            );
          });

          it('with additional code just before it', async () => {
            const number = new Array(64).join('0') + 6;
            await parser.parseCode(ctxDSLAddr, ctxProgramAddr, [
              'uint256',
              '6',
              'var',
              'TIMESTAMP',
              'declareArr',
              'uint256',
              'NUMBERS',
            ]);
            expect(await ctxProgram.program()).to.equal(
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

          it('with additional code just after it', async () => {
            const number = new Array(64).join('0') + 6;
            await parser.parseCode(ctxDSLAddr, ctxProgramAddr, [
              'declareArr',
              'uint256',
              'NUMBERS',
              'uint256',
              '6',
              'var',
              'TIMESTAMP',
            ]);
            expect(await ctxProgram.program()).to.equal(
              '0x' +
                '31' + // declareArr
                '01' + // uint256 type
                '1fff709e' + // bytecode for a `NUMBERS` name
                '1a' + // uint256
                `${number}` + // 6
                '1b' + // var
                '1b7b16d4' // TIMESTAMP
            );
          });

          it('with additional code before and after it', async () => {
            const number = new Array(64).join('0') + 6;
            await parser.parseCode(ctxDSLAddr, ctxProgramAddr, [
              'uint256',
              '6',
              'declareArr',
              'uint256',
              'NUMBERS',
              'var',
              'TIMESTAMP',
            ]);
            expect(await ctxProgram.program()).to.equal(
              '0x' +
                '1a' + // uint256
                `${number}` + // 6
                '31' + // declareArr
                '01' + // uint256 type
                '1fff709e' + // bytecode for a `NUMBERS` name
                '1b' + // var
                '1b7b16d4' // TIMESTAMP
            );
          });
        });

        describe('sumOf', () => {
          it('sum several values with additional code', async () => {
            await parser.parseCode(ctxDSLAddr, ctxProgramAddr, [
              'uint256',
              '3',
              'setUint256',
              'SUM',
              'declareArr',
              'uint256',
              'NUMBERS',
              'push',
              '1345',
              'NUMBERS',
              'declareArr',
              'uint256',
              'INDEXES',
              'push',
              '1',
              'INDEXES',
              'push',
              '1465',
              'NUMBERS',
              'push',
              '3',
              'INDEXES',
              'bool',
              'false',
              'sumOf',
              'INDEXES',
              'sumOf',
              'NUMBERS',
            ]);

            const one = new Array(64).join('0') + 1;
            const three = new Array(64).join('0') + 3;
            const number1 = new Array(62).join('0') + 541;
            const number2 = `${new Array(62).join('0')}5b9`;
            expect(await ctxProgram.program()).to.equal(
              '0x' + //
                '1a' + // uint256
                `${three}` + // 3
                '2e' + // setUint256
                '2df384fb' + // SUM
                '31' + // declareArr
                '01' + // uint256
                '1fff709e' + // NUMBERS
                '33' + // push
                `${number1}` + // 1345
                '1fff709e' + // NUMBERS
                '31' + // declareArr
                '01' + // uint256
                '257b3678' + // INDEXES
                '33' + // push
                `${one}` + // 1
                '257b3678' + // INDEXES
                '33' + // push
                `${number2}` + // 1465
                '1fff709e' + // NUMBERS
                '33' + // push
                `${three}` + // 3
                '257b3678' + // INDEXES
                '18' + // bool
                '00' + // false
                '40' + // sumOf
                '257b3678' + // INDEXES
                '40' + // sumOf
                '1fff709e'
            ); // NUMBERS
          });
        });
      });

      describe('address type', () => {
        it('declare simple array', async () => {
          await parser.parseCode(ctxDSLAddr, ctxProgramAddr, ['declareArr', 'address', 'MARY']);
          expect(await ctxProgram.program()).to.equal(
            '0x' +
              '31' + // declareArr
              '03' + // address type
              '5e315030' // bytecode for a `MARY` name
          );
        });

        it('with additional code just before it', async () => {
          const number = new Array(64).join('0') + 6;
          await parser.parseCode(ctxDSLAddr, ctxProgramAddr, [
            'uint256',
            '6',
            'var',
            'TIMESTAMP',
            'declareArr',
            'address',
            'MARY',
          ]);
          expect(await ctxProgram.program()).to.equal(
            '0x' +
              '1a' + // uint256
              `${number}` + // 6
              '1b' + // var
              '1b7b16d4' + // TIMESTAMP
              '31' + // declareArr
              '03' + // address type
              '5e315030' // bytecode for a `MARY` name
          );
        });

        it('with additional code just after it', async () => {
          const number = new Array(64).join('0') + 6;
          await parser.parseCode(ctxDSLAddr, ctxProgramAddr, [
            'declareArr',
            'address',
            'MARY',
            'uint256',
            '6',
            'var',
            'TIMESTAMP',
          ]);
          expect(await ctxProgram.program()).to.equal(
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
          await parser.parseCode(ctxDSLAddr, ctxProgramAddr, [
            'uint256',
            '6',
            'declareArr',
            'address',
            'MARY',
            'var',
            'TIMESTAMP',
          ]);
          expect(await ctxProgram.program()).to.equal(
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
          await parser.parseCode(ctxDSLAddr, ctxProgramAddr, [
            'declareArr',
            'uint256',
            'NUMBERS',
            'push',
            '1345',
            'NUMBERS',
          ]);
          expect(await ctxProgram.program()).to.equal(
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
          await parser.parseCode(ctxDSLAddr, ctxProgramAddr, [
            'declareArr',
            'address',
            'PARTNERS',
            'push',
            '0xe7f8a90ede3d84c7c0166bd84a4635e4675accfc',
            'PARTNERS',
          ]);
          expect(await ctxProgram.program()).to.equal(
            '0x' +
              '31' + // declareArr
              '03' + // address
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
        await parser.parseCode(ctxDSLAddr, ctxProgramAddr, [
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
        expect(await ctxProgram.program()).to.equal(expectedProgram);
      });
    });

    describe('Get element by index', () => {
      it('different types with inserting values', async () => {
        await parser.parseCode(ctxDSLAddr, ctxProgramAddr, [
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
        expect(await ctxProgram.program()).to.equal(expectedProgram);
      });
    });

    describe('Structs', () => {
      const tempZero = new Array(64).join('0');
      const one = tempZero + 1;
      const two = tempZero + 2;
      const three = tempZero + 3;

      describe('uint256', () => {
        it('insert number', async () => {
          await parser.parseCode(ctxDSLAddr, ctxProgramAddr, [
            'struct',
            'BOB',
            'balance',
            '3',
            'endStruct',
          ]);
          expect(await ctxProgram.program()).to.equal(
            '0x' +
              '36' + // struct opcode
              '74e2234b' + // BOB.balance
              `${three}` + // 3
              'cb398fe1' // endStruct
          );
        });

        it('get number', async () => {
          const code = [
            'struct',
            'BOB',
            'lastPayment',
            '3',
            'endStruct',
            'BOB.lastPayment',
            'uint256',
            '2',
            '>',
          ];

          await parser.parseCode(ctxDSLAddr, ctxProgramAddr, code);
          expect(await ctxProgram.program()).to.equal(
            '0x' +
              '36' + // struct opcode
              '4a871642' + // BOB.lastPayment
              `${three}` + // 3
              'cb398fe1' + // endStruct
              '1b' + // var
              '4a871642' + // BOB.lastPayment
              '1a' + // uint256
              `${two}` + // 2
              '04' // >
          );
        });

        it('use number after getting', async () => {
          const code = [
            'struct',
            'BOB',
            'lastPayment',
            '3',
            'endStruct',
            'BOB.lastPayment',
            'uint256',
            '1',
            '>',
            'setUint256',
            'RESULT_AFTER',
            'BOB.lastPayment',
            'uint256',
            '2',
            '*',
            'setUint256',
            'BOB.lastPayment',
          ];

          await parser.parseCode(ctxDSLAddr, ctxProgramAddr, code);
          expect(await ctxProgram.program()).to.equal(
            '0x' +
              '36' + // struct opcode
              '4a871642' + // BOB.lastPayment
              `${three}` + // 3
              'cb398fe1' + // endStruct
              '1b' + // var
              '4a871642' + // BOB.lastPayment
              '1a' + // uint256
              `${one}` + // 1
              '04' + // >
              '2e' + // setUint256
              'cf239df2' + // RESULT_AFTER
              '1b' + // var
              '4a871642' + // BOB.lastPayment
              '1a' + // uint256
              `${two}` + // 1
              '28' + // *
              '2e' + // setUint256
              '4a871642' // BOB.lastPayment
          );
        });
      });

      describe('address', () => {
        it('insert address', async () => {
          await parser.parseCode(ctxDSLAddr, ctxProgramAddr, [
            'struct',
            'BOB',
            'account',
            '0x47f8a90ede3d84c7c0166bd84a4635e4675accfc',
            'endStruct',
          ]);
          expect(await ctxProgram.program()).to.equal(
            '0x' +
              '36' + // struct opcode
              '2215b81f' + // BOB.account
              // addres without 0x
              '47f8a90ede3d84c7c0166bd84a4635e4675accfc000000000000000000000000' +
              'cb398fe1' // endStruct
          );
        });

        it('use address after getting', async () => {
          await parser.parseCode(ctxDSLAddr, ctxProgramAddr, [
            'struct',
            'BOB',
            'account',
            '0x47f8a90ede3d84c7c0166bd84a4635e4675accfc',
            'account2',
            '0x57f8a90ede3d84c7c0166bd84a4635e4675accfc',
            'endStruct',
            'BOB.account',
            'BOB.account2',
            '!=',
          ]);
          expect(await ctxProgram.program()).to.equal(
            '0x' +
              '36' + // struct opcode
              '2215b81f' + // BOB.account
              // the address for account
              '47f8a90ede3d84c7c0166bd84a4635e4675accfc000000000000000000000000' +
              'c71243e7' + // BOB.account
              // the address for account
              '57f8a90ede3d84c7c0166bd84a4635e4675accfc000000000000000000000000' +
              'cb398fe1' + // endStruct
              '1b' + // var
              '2215b81f' + // BOB.account
              '1b' + // var
              'c71243e7' + // BOB.account2
              '14' // !=
          );
        });
      });

      describe('mixed types', () => {
        it('error: insert empty value', async () => {
          await expect(
            parser.parseCode(ctxDSLAddr, ctxProgramAddr, ['struct', 'BOB', 'endStruct'])
          ).to.be.revertedWith('PRS1');
        });

        it('insert address and number', async () => {
          const number = new Array(64).join('0') + 9;
          await parser.parseCode(ctxDSLAddr, ctxProgramAddr, [
            'struct',
            'BOB',
            'account',
            '0x47f8a90ede3d84c7c0166bd84a4635e4675accfc',
            'tax',
            '9',
            'endStruct',
          ]);
          expect(await ctxProgram.program()).to.equal(
            '0x' +
              '36' + // struct opcode
              '2215b81f' + // BOB.account
              // addres without 0x
              '47f8a90ede3d84c7c0166bd84a4635e4675accfc000000000000000000000000' +
              '9b8dbd6b' + // BOB.tax
              `${number}` + // 9
              'cb398fe1' // endStruct
          );
        });

        it('push struct type values into array', async () => {
          const input = [
            'struct',
            'BOB',
            'lastPayment',
            '3',
            'endStruct',
            'struct',
            'MAX',
            'lastPayment',
            '170',
            'endStruct',
            'declareArr',
            'struct',
            'USERS',
            'push',
            'BOB',
            'USERS',
            'push',
            'MAX',
            'USERS',
          ];

          await parser.parseCode(ctxDSLAddr, ctxProgramAddr, input);

          const number = `${new Array(63).join('0')}aa`; // 170
          expect(await ctxProgram.program()).to.equal(
            '0x' +
              '36' + // struct
              '4a871642' + // BOB.lastPayment
              `${three}` + // 3
              'cb398fe1' + // endStruct
              '36' + // struct
              'ffafe3f2' + // MAX.lastPayment
              `${number}` + // 170
              'cb398fe1' + // endStruct
              '31' + // declareArr
              '02' + // struct
              '80e5f4d2' + // USERS
              '33' + // push
              '29d93e4f00000000000000000000000000000000000000000000000000000000' + // BOB
              '80e5f4d2' + // USERS
              '33' + // push
              'a427878700000000000000000000000000000000000000000000000000000000' + // MAX
              '80e5f4d2' // USERS
          );
        });

        it('use address and number after getting values', async () => {
          const number = new Array(64).join('0') + 3;
          await parser.parseCode(ctxDSLAddr, ctxProgramAddr, [
            'struct',
            'BOB',
            'account',
            '0x47f8a90ede3d84c7c0166bd84a4635e4675accfc',
            'account2',
            '0x57f8a90ede3d84c7c0166bd84a4635e4675accfc',
            'lastPayment',
            '3',
            'endStruct',
            'BOB.account',
            'BOB.account2',
            '!=',
            'BOB.lastPayment',
            'uint256',
            '3',
            '==',
          ]);
          expect(await ctxProgram.program()).to.equal(
            '0x' +
              '36' + // struct opcode
              '2215b81f' + // BOB.account
              // the address for account
              '47f8a90ede3d84c7c0166bd84a4635e4675accfc000000000000000000000000' +
              'c71243e7' + // BOB.account
              // the address for account
              '57f8a90ede3d84c7c0166bd84a4635e4675accfc000000000000000000000000' +
              '4a871642' + // BOB.lastPayment
              `${number}` + // 3
              'cb398fe1' + // endStruct
              '1b' + // var
              '2215b81f' + // BOB.account
              '1b' + // var
              'c71243e7' + // BOB.account2
              '14' + // !=
              '1b' + // var
              '4a871642' + // BOB.lastPayment
              '1a' + // uint256
              `${number}` + // 3
              '01'
          );
        });

        describe('sumThroughStructs', () => {
          it('sum through structs values with additional code', async () => {
            await parser.parseCode(ctxDSLAddr, ctxProgramAddr, [
              'struct',
              'BOB',
              'lastPayment',
              '3',
              'endStruct',
              'struct',
              'ALISA',
              'lastPayment',
              '300',
              'endStruct',
              'struct',
              'MAX',
              'lastPayment',
              '170',
              'endStruct',
              'declareArr',
              'struct',
              'USERS',
              'push',
              'ALISA',
              'USERS',
              'push',
              'BOB',
              'USERS',
              'push',
              'MAX',
              'USERS',
              'sumThroughStructs',
              'USERS',
              'lastPayment',
            ]);

            const number1 = `${new Array(62).join('0')}12c`; // 300
            const number2 = `${new Array(63).join('0')}aa`; // 170
            expect(await ctxProgram.program()).to.equal(
              '0x' +
                '36' + // struct
                '4a871642' + // BOB.lastPayment
                `${three}` + // 3
                'cb398fe1' + // endStruct
                '36' + // endStruct
                'c07a9c8d' + // ALISA.lastPayment
                `${number1}` + // 300
                'cb398fe1' + // endStruct
                '36' + // struct
                'ffafe3f2' + // MAX.lastPayment
                `${number2}` + // 170
                'cb398fe1' + // endStruct
                '31' + // declareArr
                '02' + // struct
                '80e5f4d2' + // USERS
                '33' + //  push
                'f15754e000000000000000000000000000000000000000000000000000000000' + // ALISA
                '80e5f4d2' + // USERS
                '33' + // push
                '29d93e4f00000000000000000000000000000000000000000000000000000000' + // BOB
                '80e5f4d2' + // USERS
                '33' + // push
                'a427878700000000000000000000000000000000000000000000000000000000' + // MAX
                '80e5f4d2' + // USERS
                '38' + // sumThroughStructs
                '80e5f4d2' + // USERS
                'f72cc83a' // lastPayment
            );
          });
        });
      });
    });
  });

  describe('For loops', () => {
    // TODO
    // test a loop over array of type uint256
    // test a loop over array of type struct
    // test a loop over array of type address
    // test function calls inside a for loop
    // test if inside a for loop
    // test if-else inside a for loop
  });

  describe('activate records', () => {
    it('enable several records for several agreements', async () => {
      await parser.parseCode(ctxDSLAddr, ctxProgramAddr, [
        'enableRecord',
        'RECORD_ID',
        'at',
        'AGREEMENT_ADDR_1',
        'enableRecord',
        'RECORD_ID_1',
        'at',
        'AGREEMENT_ADDR_2',
        'enableRecord',
        'RECORD_ID_2',
        'at',
        'AGREEMENT_ADDR_3',
      ]);

      expect(await ctxProgram.program()).to.equal(
        '0x' +
          '41' + // enableRecord
          '2c610312' + // RECORD_ID
          '57b12c58' + // AGREEMENT_ADDR_1
          '41' + // enableRecord
          '906b8b75' + // RECORD_ID_1
          'e7738f5c' + // AGREEMENT_ADDR_2
          '41' + // enableRecord
          'f505530c' + // RECORD_ID_2
          'ea1daa93' // AGREEMENT_ADDR_3
      );
    });
  });

  describe('Governannce pre-defined commands', () => {
    it('check record', async () => {
      await parser.parseCode(ctxDSLAddr, ctxProgramAddr, [
        'sumThroughStructs',
        'VOTES',
        'vote',
        'setUint256',
        'YES_CTR',
        'lengthOf',
        'VOTERS',
        'uint256',
        '10000000000',
        '*',
        'YES_CTR',
        'uint256',
        '10000000000',
        '*',
        '/',
        'uint256',
        '2',
        '<',
        'if',
        'ENABLE_RECORD',
        'end',
        'ENABLE_RECORD',
        'enableRecord',
        'RECORD_ID',
        'at',
        'AGREEMENT_ADDR',
        'end',
      ]);

      expect(await ctxProgram.program()).to.equal(
        '0x' +
          '38' + // sumThroughStructs
          'c3ea08e5' + // VOTES
          '0932bdf8' + // vote
          '2e' + // setUint256
          'cd97e36c' + // YES_CTR
          '34' + // lengthOf
          'ef3a685c' + // VOTERS
          '1a' + // uint256
          `${bnToLongHexString('10000000000')}` +
          '28' + // *
          '1b' + // var
          'cd97e36c' + // YES_CTR
          '1a' + // uint256
          `${bnToLongHexString('10000000000')}` +
          '28' + // *
          '29' + // /
          '1a' + // uint256
          `${bnToLongHexString('2')}` +
          '03250083' + // ENABLE_RECORD
          '24' + // end
          '41' + // enableRecord
          '2c610312' + // RECORD_ID
          'ca2bf0ef' + // AGREEMENT_ADDR
          '24'
      );
    });
  });
});
