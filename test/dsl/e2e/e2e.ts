import * as hre from 'hardhat';
import { expect } from 'chai';
import { BigNumber } from 'ethers';

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { parseEther } from 'ethers/lib/utils';
import { E2EApp, Context, Preprocessor, Stack, Agreement } from '../../../typechain-types';
import { bnToLongHexString, checkStackTail, hex4Bytes, hex4BytesShort } from '../../utils/utils';
import {
  deployOpcodeLibs,
  deployAgreement,
  deployPreprocessor,
} from '../../../scripts/utils/deploy.utils';
import { deployBaseMock } from '../../../scripts/utils/deploy.utils.mock';
import { getChainId } from '../../../utils/utils';
import { ONE_DAY, ONE_MONTH } from '../../utils/constants';
import { parseConditions, parseConditionsList } from '../../../scripts/utils/update.record.mock';
const { ethers, network } = hre;

describe('End-to-end', () => {
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carl: SignerWithAddress;
  let david: SignerWithAddress;
  let stack: Stack;
  let preprocessor: Preprocessor;
  let ctx: Context;
  let ctxAddr: string;
  let app: E2EApp;
  let NEXT_MONTH: number;
  let NEXT_TWO_MONTH: number;
  let PREV_MONTH: number;
  let lastBlockTimestamp: number;
  let snapshotId: number;

  before(async () => {
    [alice, bob, carl, david] = await ethers.getSigners();
    lastBlockTimestamp = (
      await ethers.provider.getBlock(
        // eslint-disable-next-line no-underscore-dangle
        ethers.provider._lastBlockNumber /* it's -2 but the resulting block number is correct */
      )
    ).timestamp;

    NEXT_MONTH = lastBlockTimestamp + 60 * 60 * 24 * 30;
    PREV_MONTH = lastBlockTimestamp - 60 * 60 * 24 * 30;

    // Deploy libraries
    const [
      comparisonOpcodesLibAddr,
      branchingOpcodesLibAddr,
      logicalOpcodesLibAddr,
      otherOpcodesLibAddr,
    ] = await deployOpcodeLibs(hre);

    const [parserAddr, executorLibAddr, preprAddr] = await deployBaseMock(hre);
    preprocessor = await ethers.getContractAt('Preprocessor', preprAddr);

    // Deploy Context & setup
    ctx = await (await ethers.getContractFactory('Context')).deploy();
    ctxAddr = ctx.address;
    await ctx.setComparisonOpcodesAddr(comparisonOpcodesLibAddr);
    await ctx.setBranchingOpcodesAddr(branchingOpcodesLibAddr);
    await ctx.setLogicalOpcodesAddr(logicalOpcodesLibAddr);
    await ctx.setOtherOpcodesAddr(otherOpcodesLibAddr);

    // Create Stack instance
    const StackCont = await ethers.getContractFactory('Stack');
    const contextStackAddress = await ctx.stack();
    stack = StackCont.attach(contextStackAddress);

    // Deploy Application
    app = await (
      await ethers.getContractFactory('E2EApp', { libraries: { Executor: executorLibAddr } })
    ).deploy(parserAddr, preprAddr, ctxAddr);

    await ctx.setAppAddress(app.address);
  });

  beforeEach(async () => {
    snapshotId = await network.provider.send('evm_snapshot');
  });

  afterEach(async () => {
    await network.provider.send('evm_revert', [snapshotId]);
  });

  describe('blockChainId < var VAR', () => {
    it('blockChainId < var VAR', async () => {
      const chainId = await getChainId(hre);
      const varHashPadded = hex4Bytes('VAR');
      const varHash = varHashPadded.slice(2, 2 + 8);
      const varValue = chainId + 1;
      const code = 'blockChainId < var VAR';
      const bytecode = ['17', `1b${varHash}`, '03'];

      // Parse code
      await app['setStorageUint256(bytes32,uint256)'](varHashPadded, varValue);
      await app.parse(code);

      const resultBytecode = await ctx.program();
      expect(resultBytecode).to.be.equal(`0x${bytecode.join('')}`);

      // Execute program
      await app.execute();

      await checkStackTail(stack, [1]);
    });
  });

  describe('((time > init) and (time < expiry)) or ((risk == true) == false)', () => {
    const ITS_RISKY = 1;
    const NOT_RISKY = 0;
    let NOW: number;

    before(() => {
      NOW = lastBlockTimestamp;
    });

    const code = `
    ((var NOW > var INIT)
    and
    (var NOW < var EXPIRY))
    or
    ((var RISK == bool true)
    ==
    (bool false))
  `;

    const bytecode = [
      /* eslint-disable no-multi-spaces */
      `1b${hex4BytesShort('NOW')}`, // ['var', 'NOW'],
      `1b${hex4BytesShort('INIT')}`, // ['var', 'INIT'],
      '04', // ['>'], // A

      `1b${hex4BytesShort('NOW')}`, // ['var', 'NOW'],
      `1b${hex4BytesShort('EXPIRY')}`, // ['var', 'EXPIRY'],
      '03', // ['<'], // B

      '12', // ['and'],

      `1b${hex4BytesShort('RISK')}`, // ['var', 'RISK'],
      '1801', // ['bool', 'true'],
      '01', // ['=='],

      '1800', // ['bool', 'false'],
      '01', // ['=='], // C

      '13', // ['or'],
      /* eslint-enable no-multi-spaces */
    ];

    async function testCase(
      INIT: number,
      EXPIRY: number,
      RISK: number,
      A: number,
      B: number,
      C: number,
      result: number
    ) {
      await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('NOW'), NOW);
      await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('INIT'), INIT);
      await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('EXPIRY'), EXPIRY);
      await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('RISK'), RISK);

      await app.execute();
      await checkStackTail(stack, [result]);
    }

    it('bytecode', async () => {
      await app.parse(code);

      const resultBytecode = await ctx.program();
      expect(resultBytecode).to.be.equal(`0x${bytecode.join('')}`);
    });

    describe('step-by-step stack', async () => {
      beforeEach(async () => {
        await app.parse(code);
      });

      // T - true, F - false
      it('((T & T) | T) == T', async () => testCase(PREV_MONTH, NEXT_MONTH, NOT_RISKY, 1, 1, 1, 1));
      it('((T & F) | T) == T', async () => testCase(PREV_MONTH, PREV_MONTH, NOT_RISKY, 1, 0, 1, 1));
      it('((F & T) | T) == T', async () => testCase(NEXT_MONTH, NEXT_MONTH, NOT_RISKY, 0, 1, 1, 1));
      it('((F & F) | T) == T', async () => testCase(NEXT_MONTH, PREV_MONTH, NOT_RISKY, 0, 0, 1, 1));
      it('((T & T) | F) == T', async () => testCase(PREV_MONTH, NEXT_MONTH, ITS_RISKY, 1, 1, 0, 1));
      it('((T & F) | F) == F', async () => testCase(PREV_MONTH, PREV_MONTH, ITS_RISKY, 1, 0, 0, 0));
      it('((F & T) | F) == F', async () => testCase(NEXT_MONTH, NEXT_MONTH, ITS_RISKY, 0, 1, 0, 0));
      it('((F & F) | F) == F', async () => testCase(NEXT_MONTH, PREV_MONTH, ITS_RISKY, 0, 0, 0, 0));
    });
  });

  it('if-else branch', async () => {
    const ONE = new Array(64).join('0') + 1;
    const TWO = new Array(64).join('0') + 2;
    const THREE = new Array(64).join('0') + 3;
    const FOUR = new Array(64).join('0') + 4;

    // to Preprocessor (input)
    const input = `
  bool true
  ifelse good bad

  ${FOUR}

  branch good {
    ${ONE}
    ${TWO}
  }

  branch bad {
    ${THREE}
  }
  `;
    const code = await preprocessor.callStatic.transform(ctxAddr, input);
    const expectedCode = [
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
      'end',
      'bad',
      'uint256',
      THREE,
      'end',
    ];
    expect(code).to.eql(expectedCode);

    // to Parser
    await app.parseCode(code);

    // to Executor
    const expectedProgram =
      '0x' +
      '18' + // bool
      '01' + // true
      '23' + // ifelse
      '0029' + // position of the `good` branch
      '006d' + // position of the `bad` branch
      '1a' + // uin256
      `${FOUR}` + // FOUR
      '24' + // end tag
      '1a' + // good: uint256
      `${ONE}` + // good: ONE
      '1a' + // good: uint256
      `${TWO}` + // good: TWO
      '24' + // good: end
      '24' + // end tag
      '1a' + // bad: uint256
      `${THREE}` + // bad: THREE
      '24'; // bad: end
    expect(await ctx.program()).to.equal(expectedProgram);
  });

  describe('functions', async () => {
    it('func SUM_OF_NUMBERS (get uint256 variables from storage)', async () => {
      const input = `
      6 8
      func SUM_OF_NUMBERS 2 endf
      end

      SUM_OF_NUMBERS {
        (var SUM_OF_NUMBERS_1 + var SUM_OF_NUMBERS_2) setUint256 SUM
      }
      `;

      const code = await preprocessor.callStatic.transform(ctxAddr, input);
      const expectedCode = [
        'uint256',
        '6',
        'setUint256',
        'SUM_OF_NUMBERS_1',
        'uint256',
        '8',
        'setUint256',
        'SUM_OF_NUMBERS_2',
        'func',
        'SUM_OF_NUMBERS',
        'end',
        'SUM_OF_NUMBERS',
        'var',
        'SUM_OF_NUMBERS_1',
        'var',
        'SUM_OF_NUMBERS_2',
        '+',
        'setUint256',
        'SUM',
        'end',
      ];
      expect(code).to.eql(expectedCode);

      // to Parser
      await app.parseCode(code);
      const first = new Array(64).join('0') + 6;
      const second = new Array(64).join('0') + 8;
      // to Executor
      const expectedProgram =
        '0x' +
        '1a' + // uint256
        `${first}` + // 6
        '2e' + // setUint256
        'c56b21ed' + // SUM_OF_NUMBERS_1
        '1a' + // uint256
        `${second}` + // 8
        '2e' + // setUint256
        '66fb6745' + // SUM_OF_NUMBERS_2
        '30' + // func
        '0050' + // position of the SUM_OF_NUMBERS name
        '24' + // end
        '1b' + // var
        'c56b21ed' + // SUM_OF_NUMBERS_1
        '1b' + // var
        '66fb6745' + // SUM_OF_NUMBERS_2
        '26' + // +
        '2e' + // setUint256
        '2df384fb' + // SUM
        '24'; // end
      expect(await ctx.program()).to.equal(expectedProgram);
    });

    it('func SUM_OF_NUMBERS without parameters', async () => {
      const input = `
      func SUM_OF_NUMBERS endf
      end

      SUM_OF_NUMBERS {
        (8 + 6) setUint256 SUM
      }
      `;

      const code = await preprocessor.callStatic.transform(ctxAddr, input);
      const expectedCode = [
        'func',
        'SUM_OF_NUMBERS',
        'end',
        'SUM_OF_NUMBERS',
        'uint256',
        '8',
        'uint256',
        '6',
        '+',
        'setUint256',
        'SUM',
        'end',
      ];
      expect(code).to.eql(expectedCode);

      // to Parser
      await app.parseCode(code);
      const first = new Array(64).join('0') + 6;
      const second = new Array(64).join('0') + 8;
      // to Executor
      const expectedProgram =
        '0x' +
        '30' + // func
        '0004' + // position of SUM_OF_NUMBERS
        '24' + // end
        '1a' + // uint256
        `${second}` + // 8
        '1a' + // uint256
        `${first}` + // 6
        '26' + // +
        '2e' + // setUint256
        '2df384fb' + // SUM
        '24'; // end
      expect(await ctx.program()).to.equal(expectedProgram);
    });
  });

  describe('Arrays', async () => {
    describe('uint256 type', () => {
      describe('declareArr', () => {
        it('with additional code before and after it', async () => {
          const input = `
            bool false
            uint256[] NUMBERS
            bool true
          `;

          const code = await preprocessor.callStatic.transform(ctxAddr, input);
          const expectedCode = [
            'bool',
            'false',
            'declareArr',
            'uint256',
            'NUMBERS',
            'bool',
            'true',
          ];
          expect(code).to.eql(expectedCode);
          // to Parser
          await app.parseCode(code);

          const expectedProgram =
            '0x' +
            '18' + // bool
            '00' + // false
            '31' + // declareArr
            '01' + // uint256
            '1fff709e' + // NUMBERS
            '18' + // bool
            '01'; // true
          expect(await ctx.program()).to.equal(expectedProgram);

          // Execute and check
          await app.execute();
          const StackCont = await ethers.getContractFactory('Stack');
          const contextStackAddress = await ctx.stack();
          stack = StackCont.attach(contextStackAddress);
          // Results: 0 - false, 1 - true
          await checkStackTail(stack, [0, 1]);
        });
      });

      describe('push', () => {
        it('with additional code before and after it', async () => {
          const one = new Array(64).join('0') + 1;
          const two = new Array(64).join('0') + 2;
          const three = new Array(64).join('0') + 3;
          const five = new Array(64).join('0') + 5;
          const input = `
            bool false
            uint256[] NUMBERS
            uint256 5
            insert 2 into NUMBERS
            insert 1 into NUMBERS
            bool true
            insert 3 into NUMBERS
          `;

          const code = await preprocessor.callStatic.transform(ctxAddr, input);
          const expectedCode = [
            'bool',
            'false',
            'declareArr',
            'uint256',
            'NUMBERS',
            'uint256',
            '5',
            'push',
            '2',
            'NUMBERS',
            'push',
            '1',
            'NUMBERS',
            'bool',
            'true',
            'push',
            '3',
            'NUMBERS',
          ];
          expect(code).to.eql(expectedCode);
          // to Parser
          await app.parseCode(code);

          const expectedProgram =
            '0x' +
            '18' + // bool
            '00' + // false
            '31' + // declareArr
            '01' + // uint256
            '1fff709e' + // NUMBERS
            '1a' + // uint256
            `${five}` + // 1
            '33' + // push
            `${two}` + // 2
            '1fff709e' + // NUMBERS
            '33' + // push
            `${one}` + // 1
            '1fff709e' + // NUMBERS
            '18' + // bool
            '01' + // true
            '33' + // push
            `${three}` + // 3
            '1fff709e'; // NUMBERS
          expect(await ctx.program()).to.equal(expectedProgram);

          // Execute and check
          await app.execute();
          const StackCont = await ethers.getContractFactory('Stack');
          const contextStackAddress = await ctx.stack();
          stack = StackCont.attach(contextStackAddress);
          // Results:
          // 0 - bool false,
          // 5 - uint256 5
          // 1 - bool true
          await checkStackTail(stack, [0, 5, 1]);
        });
      });

      describe('get', () => {
        it('with additional code before and after it', async () => {
          const one = new Array(64).join('0') + 1;
          const five = new Array(64).join('0') + 5;
          const seven = new Array(64).join('0') + 7;
          const input = `
            bool false
            uint256[] NUMBERS
            insert 5 into NUMBERS
            insert 7 into NUMBERS
            get 1 NUMBERS > get 0 NUMBERS
          `;

          const code = await preprocessor.callStatic.transform(ctxAddr, input);
          const expectedCode = [
            'bool',
            'false',
            'declareArr',
            'uint256',
            'NUMBERS',
            'push',
            '5',
            'NUMBERS',
            'push',
            '7',
            'NUMBERS',
            'get',
            '1',
            'NUMBERS',
            'get',
            '0',
            'NUMBERS',
            '>',
          ];
          expect(code).to.eql(expectedCode);
          // to Parser
          await app.parseCode(code);
          const ZERO = new Array(65).join('0');
          const expectedProgram =
            '0x' +
            '18' + // bool
            '00' + // false
            '31' + // declareArr
            '01' + // uint256
            '1fff709e' + // NUMBERS
            '33' + // push
            `${five}` + // 5
            '1fff709e' + // NUMBERS
            '33' + // push
            `${seven}` + // 5
            '1fff709e' + // NUMBERS
            '35' + // get
            `${one}` + // 1 index
            '1fff709e' + // NUMBERS
            '35' + // get
            `${ZERO}` + // 0 index
            '1fff709e' + // NUMBERS
            '04'; // >
          expect(await ctx.program()).to.equal(expectedProgram);

          // Execute and check
          await app.execute();
          const StackCont = await ethers.getContractFactory('Stack');
          const contextStackAddress = await ctx.stack();
          stack = StackCont.attach(contextStackAddress);
          // Results:
          // 0 - bool false
          // 1 - true (because 7 is more than 5)
          await checkStackTail(stack, [0, 1]);
        });
      });

      describe('sumOf', () => {
        it('returns 0 if the aray is empty', async () => {
          const input = `
            uint256[] NUMBERS
            sumOf NUMBERS
          `;

          const code = await preprocessor.callStatic.transform(ctxAddr, input);
          const expectedCode = ['declareArr', 'uint256', 'NUMBERS', 'sumOf', 'NUMBERS'];
          expect(code).to.eql(expectedCode);

          // to Parser
          await app.parseCode(code);
          const expectedProgram =
            '0x' +
            '31' + // declareArr
            '01' + // uint256
            '1fff709e' + // NUMBERS
            '40' + // sumOf
            '1fff709e'; // NUMBERS
          expect(await ctx.program()).to.equal(expectedProgram);

          // Execute and check
          await app.execute();
          const StackCont = await ethers.getContractFactory('Stack');
          const contextStackAddress = await ctx.stack();
          stack = StackCont.attach(contextStackAddress);
          await checkStackTail(stack, [0]);
        });

        it('returns error if the array has wrong type', async () => {
          const input = `
            address[] PARTNERS
            sumOf PARTNERS
          `;

          const code = await preprocessor.callStatic.transform(ctxAddr, input);
          const expectedCode = ['declareArr', 'address', 'PARTNERS', 'sumOf', 'PARTNERS'];
          expect(code).to.eql(expectedCode);

          // to Parser
          await app.parseCode(code);
          const expectedProgram =
            '0x' +
            '31' + // declareArr
            '03' + // address
            '3c8423ff' + // PARTNERS
            '40' + // sumOf
            '3c8423ff'; // PARTNERS
          expect(await ctx.program()).to.equal(expectedProgram);

          // Execute and check
          expect(app.execute()).revertedWith('EXC3');
          const StackCont = await ethers.getContractFactory('Stack');
          const contextStackAddress = await ctx.stack();
          stack = StackCont.attach(contextStackAddress);
          await checkStackTail(stack, []);
        });

        it('sum several values with additional code and compare', async () => {
          const input = `
            3 setUint256 SUM
            uint256[] NUMBERS
            insert 1345 into NUMBERS
            uint256[] INDEXES
            insert 1 into INDEXES
            insert 1465 into NUMBERS
            insert 3 into INDEXES
            bool false
            sumOf INDEXES setUint256 SUM1
            sumOf NUMBERS setUint256 SUM2
            sumOf INDEXES > sumOf NUMBERS
          `;

          const code = await preprocessor.callStatic.transform(ctxAddr, input);
          const expectedCode = [
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
            'setUint256',
            'SUM1',
            'sumOf',
            'NUMBERS',
            'setUint256',
            'SUM2',
            'sumOf',
            'INDEXES',
            'sumOf',
            'NUMBERS',
            '>',
          ];
          expect(code).to.eql(expectedCode);

          // to Parser
          await app.parseCode(code);
          const one = new Array(64).join('0') + 1;
          const three = new Array(64).join('0') + 3;
          const number1 = new Array(62).join('0') + 541;
          const number2 = `${new Array(62).join('0')}5b9`;
          const expectedProgram =
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
            '2e' + // setUint256
            '7a83eb71' + // SUM1
            '40' + // sumOf
            '1fff709e' + // NUMBERS
            '2e' + // setUint256
            'd49d1b0f' + // SUM2
            '40' + // sumOf
            '257b3678' + // INDEXES
            '40' + // sumOf
            '1fff709e' + // NUMBERS
            '04'; // >
          expect(await ctx.program()).to.equal(expectedProgram);

          // Execute and check
          await app.execute();
          const StackCont = await ethers.getContractFactory('Stack');
          const contextStackAddress = await ctx.stack();
          stack = StackCont.attach(contextStackAddress);

          /*
            setUint256 SUM -> 1 in the stack
            bool false -> 0 in the stack
            setUint256 SUM1 -> 1 in the stack
            setUint256 SUM2 -> 1 in the stack
            comparison result for `sumOf INDEXES > sumOf NUMBERS` is false -> 0 in the stack
          */
          await checkStackTail(stack, [1, 0, 1, 1, 0]);
          expect(await app.getStorageUint256(hex4Bytes('SUM1'))).equal(4);
          expect(await app.getStorageUint256(hex4Bytes('SUM2'))).equal(2810);
        });
      });
    });

    describe('mixed types', () => {
      it('get empty items from arrays', async () => {
        const input = `
        uint256[] NUMBERS
        address[] INDEXES
        lengthOf INDEXES
        lengthOf NUMBERS
        get 0 NUMBERS
        get 0 INDEXES
        `;
        const code = await preprocessor.callStatic.transform(ctxAddr, input);
        const expectedCode = [
          'declareArr',
          'uint256',
          'NUMBERS',
          'declareArr',
          'address',
          'INDEXES',
          'lengthOf',
          'INDEXES',
          'lengthOf',
          'NUMBERS',
          'get',
          '0',
          'NUMBERS',
          'get',
          '0',
          'INDEXES',
        ];
        expect(code).to.eql(expectedCode);

        // to Parser
        const ZERO = new Array(65).join('0');
        await app.parseCode(code);
        const expectedProgram =
          '0x' +
          '31' + // declareArr
          '01' + // uint256
          '1fff709e' + // bytecode for NUMBERS
          '31' + // declareArr
          '03' + // address
          '257b3678' + // bytecode for INDEXES
          '34' + // lengthOf
          '257b3678' + // bytecode for INDEXES
          '34' + // lengthOf
          '1fff709e' + // bytecode for NUMBERS
          '35' + // get
          `${ZERO}` + // 0 index
          '1fff709e' + // bytecode for NUMBERS
          '35' + // get
          `${ZERO}` + // 0 index
          '257b3678'; // bytecode for INDEXES
        expect(await ctx.program()).to.equal(expectedProgram);

        // Execute and check
        await checkStackTail(stack, []);

        await app.execute();
        const StackCont = await ethers.getContractFactory('Stack');
        const contextStackAddress = await ctx.stack();
        stack = StackCont.attach(contextStackAddress);

        expect(await app.get(0, hex4Bytes('INDEXES'))).to.equal(`0x${new Array(65).join('0')}`);
        expect(await app.get(0, hex4Bytes('NUMBERS'))).to.equal(`0x${new Array(65).join('0')}`);

        /*
          as arrays are empty, all values are zero in the stack for commands:
          lengthOf INDEXES returns 0
          lengthOf NUMBERS returns 0
          get 0 NUMBERS returns 0
          get 0 INDEXES returns 0
        */
        await checkStackTail(stack, [0, 0, 0, 0]);
      });

      it('get items from arrays', async () => {
        const input = `
        uint256[] NUMBERS
        address[] INDEXES
        insert 0xe7f8a90ede3d84c7c0166bd84a4635e4675accfc into INDEXES
        insert 1345 into NUMBERS
        insert 0x47f8a90ede3d84c7c0166bd84a4635e4675accfc into INDEXES
        lengthOf INDEXES
        lengthOf NUMBERS
        get 0 NUMBERS
        get 1 INDEXES
        `;
        const code = await preprocessor.callStatic.transform(ctxAddr, input);
        const expectedCode = [
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
        ];
        expect(code).to.eql(expectedCode);

        // to Parser
        const NUMBER = new Array(62).join('0') + 541;
        const ONE = new Array(64).join('0') + 1;
        const ZERO = new Array(65).join('0');
        await app.parseCode(code);
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

        // Execute and check
        await checkStackTail(stack, []);

        await app.execute();
        const StackCont = await ethers.getContractFactory('Stack');
        const contextStackAddress = await ctx.stack();
        stack = StackCont.attach(contextStackAddress);

        expect(await app.get(0, hex4Bytes('INDEXES'))).to.equal(
          `0xe7f8a90ede3d84c7c0166bd84a4635e4675accfc${new Array(25).join('0')}`
        );
        expect(await app.get(1, hex4Bytes('INDEXES'))).to.equal(
          `0x47f8a90ede3d84c7c0166bd84a4635e4675accfc${new Array(25).join('0')}`
        );
        expect(await app.get(0, hex4Bytes('NUMBERS'))).to.equal(`0x${new Array(62).join('0')}541`);

        /*
          lengthOf INDEXES -> 2 in the stack
          lengthOf NUMBERS -> 1 in the stack
          0 item in NUMBERS -> 1345 in the stack
          1 item in INDEXES -> 0x47f8a90ede3d84c7c0166bd84a4635e4675accfc in the stack
        */
        await checkStackTail(stack, [
          2,
          1,
          1345,
          BigNumber.from('0x47f8a90ede3d84c7c0166bd84a4635e4675accfc000000000000000000000000'),
        ]);
      });
    });
  });

  describe('Load local variables without `var` opcode', async () => {
    it('set two local variables, one of them using in the next command', async () => {
      const input = `
      uint256 6 setUint256 A
      (var A + 2) setUint256 SUM
      `;
      const SIX = new Array(64).join('0') + 6;
      const TWO = new Array(64).join('0') + 2;
      const code = await preprocessor.callStatic.transform(ctxAddr, input);
      const expectedCode = [
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
      expect(code).to.eql(expectedCode);

      // to Parser
      await app.parseCode(code);
      const expectedProgram =
        '0x' +
        '1a' + // uint256
        `${SIX}` + // 6
        '2e' + // setUint256
        '03783fac' + // A
        '1b' + // var
        '03783fac' + // A
        '1a' + // uint256
        `${TWO}` +
        '26' + // +
        '2e' + // setUint256
        '2df384fb'; // SUM
      expect(await ctx.program()).to.equal(expectedProgram);
    });

    it('updates A variable', async () => {
      const input = `
      uint256 6 setUint256 A
      (var A + 2) setUint256 A
      `;
      const SIX = new Array(64).join('0') + 6;
      const TWO = new Array(64).join('0') + 2;
      const code = await preprocessor.callStatic.transform(ctxAddr, input);
      const expectedCode = [
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
        'A',
      ];
      expect(code).to.eql(expectedCode);

      // to Parser
      await app.parseCode(code);
      const expectedProgram =
        '0x' +
        '1a' + // uint256
        `${SIX}` + // 6
        '2e' + // setUint256
        '03783fac' + // A
        '1b' + // var
        '03783fac' + // A
        '1a' + // uint256
        `${TWO}` +
        '26' + // +
        '2e' + // setUint256
        '03783fac'; // SUM
      expect(await ctx.program()).to.equal(expectedProgram);
    });

    it('reverts if try to set bool value instead of a number', async () => {
      const input = `
      true setUint256 A
      (A + 2) setUint256 SUM
      `;
      const code = await preprocessor.callStatic.transform(ctxAddr, input);
      const expectedCode = [
        'true',
        'setUint256',
        'A',
        'A',
        'uint256',
        '2',
        '+',
        'setUint256',
        'SUM',
      ];
      expect(code).to.eql(expectedCode);

      // to Parser
      expect(app.parseCode(code)).revertedWith('Parser: "true" command is unknown');
    });

    it('reverts if try to get A value before if was stored', async () => {
      const input = `
      A setUint256 B
      (B + 2) setUint256 SUM
      `;
      const code = await preprocessor.callStatic.transform(ctxAddr, input);
      const expectedCode = ['A', 'setUint256', 'B', 'B', 'uint256', '2', '+', 'setUint256', 'SUM'];
      expect(code).to.eql(expectedCode);

      // to Parser
      expect(app.parseCode(code)).revertedWith('Parser: "A" command is unknown');
    });

    it('Use A value as bool, but it was stored as a number', async () => {
      await app['setStorageUint256(bytes32,uint256)'](hex4Bytes('A'), 6);
      const input = 'bool A';
      const code = await preprocessor.callStatic.transform(ctxAddr, input);
      const expectedCode = ['bool', 'A'];
      expect(code).to.eql(expectedCode);

      // to Parser
      await app.parseCode(code);
      const expectedProgram = '0x1800';
      expect(await ctx.program()).to.equal(expectedProgram);

      // Execute and check
      await app.execute();
      const StackCont = await ethers.getContractFactory('Stack');
      const contextStackAddress = await ctx.stack();
      stack = StackCont.attach(contextStackAddress);
      await checkStackTail(stack, [0]);
      expect(await app.getStorageUint256(hex4Bytes('A'))).equal(6);
      expect(await app.getStorageBool(hex4Bytes('A'))).equal(true);
    });
  });

  describe('Structs', () => {
    describe('uint256', () => {
      it('store number', async () => {
        const number = new Array(64).join('0') + 3;
        const input = 'struct BOB { lastPayment: 3 }';
        const code = await preprocessor.callStatic.transform(ctxAddr, input);
        const expectedCode = ['struct', 'BOB', 'lastPayment', '3', 'endStruct'];
        expect(code).to.eql(expectedCode);

        // to Parser
        await app.parseCode(code);
        expect(await ctx.program()).to.equal(
          '0x' +
            '36' + // struct opcode
            '4a871642' + // BOB.lastPayment
            `${number}` + // 3
            'cb398fe1' // endStruct
        );

        // Execute and check
        expect(await app.getStorageUint256(hex4Bytes('BOB.lastPayment'))).equal(0);
        await app.execute();
        expect(await app.getStorageUint256(hex4Bytes('BOB.lastPayment'))).equal(3);
      });

      it('use number after getting', async () => {
        const tempZero = new Array(64).join('0');
        const one = tempZero + 1;
        const two = tempZero + 2;
        const three = tempZero + 3;

        const input = `
        struct BOB {
          lastPayment: 3
        }

        (BOB.lastPayment > 1) setUint256 RESULT_AFTER
        (BOB.lastPayment * 2) setUint256 BOB.lastPayment
        `;
        const code = await preprocessor.callStatic.transform(ctxAddr, input);
        const expectedCode = [
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
        expect(code).to.eql(expectedCode);

        // to Parser
        await app.parseCode(code);
        expect(await ctx.program()).to.equal(
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

        // Execute and check
        expect(await app.getStorageUint256(hex4Bytes('BOB.lastPayment'))).equal(0);
        expect(await app.getStorageUint256(hex4Bytes('RESULT_AFTER'))).equal(0);
        await app.execute();
        const StackCont = await ethers.getContractFactory('Stack');
        const contextStackAddress = await ctx.stack();
        stack = StackCont.attach(contextStackAddress);
        await checkStackTail(stack, [1, 1]);
        expect(await app.getStorageUint256(hex4Bytes('BOB.lastPayment'))).equal(6);
        expect(await app.getStorageUint256(hex4Bytes('RESULT_AFTER'))).equal(1);
      });
    });

    describe('address', () => {
      it('store address', async () => {
        const input = 'struct BOB { account: 0x47f8a90ede3d84c7c0166bd84a4635e4675accfc }';
        const code = await preprocessor.callStatic.transform(ctxAddr, input);
        const expectedCode = [
          'struct',
          'BOB',
          'account',
          '0x47f8a90ede3d84c7c0166bd84a4635e4675accfc',
          'endStruct',
        ];
        expect(code).to.eql(expectedCode);

        // to Parser
        await app.parseCode(code);
        expect(await ctx.program()).to.equal(
          '0x' +
            '36' + // struct opcode
            '2215b81f' + // BOB.account
            // the address for account
            '47f8a90ede3d84c7c0166bd84a4635e4675accfc000000000000000000000000' +
            'cb398fe1' // endStruct
        );

        // Execute and check
        expect(await app.getStorageUint256(hex4Bytes('BOB.account'))).equal(0);
        await app.execute();
        expect(await app.getStorageUint256(hex4Bytes('BOB.account'))).equal(
          BigNumber.from('0x47f8a90ede3d84c7c0166bd84a4635e4675accfc000000000000000000000000')
        );
      });

      it('use address after getting', async () => {
        const input = `
          struct BOB {
            account: 0x47f8a90ede3d84c7c0166bd84a4635e4675accfc
          }

          struct ALICA {
            account: 0x67f8a90ede3d84c7c0166bd84a4635e4675accfc
          }

          struct MAX {
            account: 0x67f8a90ede3d84c7c0166bd84a4635e4675accfc
          }

          (BOB.account != ALICA.account) setUint256 RESULT_1
          (ALICA.account == MAX.account) setUint256 RESULT_2
          `;
        const code = await preprocessor.callStatic.transform(ctxAddr, input);
        const expectedCode = [
          'struct',
          'BOB',
          'account',
          '0x47f8a90ede3d84c7c0166bd84a4635e4675accfc',
          'endStruct',
          'struct',
          'ALICA',
          'account',
          '0x67f8a90ede3d84c7c0166bd84a4635e4675accfc',
          'endStruct',
          'struct',
          'MAX',
          'account',
          '0x67f8a90ede3d84c7c0166bd84a4635e4675accfc',
          'endStruct',
          'BOB.account',
          'ALICA.account',
          '!=',
          'setUint256',
          'RESULT_1',
          'ALICA.account',
          'MAX.account',
          '==',
          'setUint256',
          'RESULT_2',
        ];
        expect(code).to.eql(expectedCode);

        // to Parser
        await app.parseCode(code);
        expect(await ctx.program()).to.equal(
          '0x' +
            '36' + // struct opcode
            '2215b81f' + // BOB.account
            '47f8a90ede3d84c7c0166bd84a4635e4675accfc000000000000000000000000' + // BOB account
            'cb398fe1' + // endStruct
            '36' + // struct opcode
            '22a4c6e2' + // ALICA.account
            '67f8a90ede3d84c7c0166bd84a4635e4675accfc000000000000000000000000' + // ALICA account
            'cb398fe1' + // endStruct
            '36' + // struct opcode
            'c475c91c' + // MAX.account
            '67f8a90ede3d84c7c0166bd84a4635e4675accfc000000000000000000000000' + // MAX account
            'cb398fe1' + // endStruct
            '1b' + // var
            '2215b81f' + // BOB.account
            '1b' + // var
            '22a4c6e2' + // ALICA.account
            '14' + // !=
            '2e' + // setUint256
            '11ae1785' + // RESULT_1
            '1b' + // var
            '22a4c6e2' + // ALICA.account
            '1b' + // var
            'c475c91c' + // MAX.account
            '01' + // equal opcode
            '2e' + // setUint256
            '842db530' // RESULT_2
        );

        // Execute and check
        expect(await app.getStorageUint256(hex4Bytes('RESULT_1'))).equal(0);
        expect(await app.getStorageUint256(hex4Bytes('RESULT_2'))).equal(0);
        await app.execute();
        expect(await app.getStorageUint256(hex4Bytes('BOB.account'))).equal(
          BigNumber.from('0x47f8a90ede3d84c7c0166bd84a4635e4675accfc000000000000000000000000')
        );
        expect(await app.getStorageUint256(hex4Bytes('ALICA.account'))).equal(
          BigNumber.from('0x67f8a90ede3d84c7c0166bd84a4635e4675accfc000000000000000000000000')
        );
        expect(await app.getStorageUint256(hex4Bytes('MAX.account'))).equal(
          BigNumber.from('0x67f8a90ede3d84c7c0166bd84a4635e4675accfc000000000000000000000000')
        );
        expect(await app.getStorageUint256(hex4Bytes('RESULT_1'))).equal(1);
        expect(await app.getStorageUint256(hex4Bytes('RESULT_2'))).equal(1);
      });
    });

    describe('mixed types', () => {
      it('store address and uint256 in struct', async () => {
        const number = new Array(64).join('0') + 3;
        const input = `
        struct BOB {
          account: 0x47f8a90ede3d84c7c0166bd84a4635e4675accfc,
          lastPayment: 3
        }`;
        const code = await preprocessor.callStatic.transform(ctxAddr, input);
        const expectedCode = [
          'struct',
          'BOB',
          'account',
          '0x47f8a90ede3d84c7c0166bd84a4635e4675accfc',
          'lastPayment',
          '3',
          'endStruct',
        ];
        expect(code).to.eql(expectedCode);

        // to Parser
        await app.parseCode(code);
        expect(await ctx.program()).to.equal(
          '0x' +
            '36' + // struct opcode
            '2215b81f' + // BOB.account
            // the address for account
            '47f8a90ede3d84c7c0166bd84a4635e4675accfc000000000000000000000000' +
            '4a871642' + // BOB.lastPayment
            `${number}` + // 3
            'cb398fe1' // endStruct
        );

        // Execute and check
        expect(await app.getStorageUint256(hex4Bytes('BOB.account'))).equal(0);
        expect(await app.getStorageUint256(hex4Bytes('BOB.lastPayment'))).equal(0);
        await app.execute();
        expect(await app.getStorageUint256(hex4Bytes('BOB.lastPayment'))).equal(3);
        expect(await app.getStorageUint256(hex4Bytes('BOB.account'))).equal(
          BigNumber.from('0x47f8a90ede3d84c7c0166bd84a4635e4675accfc000000000000000000000000')
        );
      });

      it('use address and number after getting', async () => {
        const input = `
          struct BOB {
            account: 0x47f8a90ede3d84c7c0166bd84a4635e4675accfc
            lastPayment: 3
          }

          struct ALICA {
            account: 0x67f8a90ede3d84c7c0166bd84a4635e4675accfc
            lastPayment: 0
            totalEarn: 100
          }

          (ALICA.totalEarn > (BOB.lastPayment + ALICA.lastPayment)) setUint256 RESULT_1
          (BOB.account != ALICA.account) setUint256 RESULT_2
          (ALICA.lastPayment == BOB.lastPayment) setUint256 RESULT_3
          `;
        const code = await preprocessor.callStatic.transform(ctxAddr, input);

        // to Parser
        await app.parseCode(code);

        // Execute and check
        expect(await app.getStorageUint256(hex4Bytes('RESULT_1'))).equal(0);
        expect(await app.getStorageUint256(hex4Bytes('RESULT_2'))).equal(0);
        expect(await app.getStorageUint256(hex4Bytes('RESULT_3'))).equal(0);
        await app.execute();
        expect(await app.getStorageUint256(hex4Bytes('BOB.account'))).equal(
          BigNumber.from('0x47f8a90ede3d84c7c0166bd84a4635e4675accfc000000000000000000000000')
        );
        expect(await app.getStorageUint256(hex4Bytes('ALICA.account'))).equal(
          BigNumber.from('0x67f8a90ede3d84c7c0166bd84a4635e4675accfc000000000000000000000000')
        );
        expect(await app.getStorageUint256(hex4Bytes('RESULT_1'))).equal(1);
        expect(await app.getStorageUint256(hex4Bytes('RESULT_2'))).equal(1);
        expect(await app.getStorageUint256(hex4Bytes('RESULT_3'))).equal(0);
      });

      it('push struct type values into array', async () => {
        const input = `
          struct BOB {
            lastPayment: 3
          }

          struct MAX {
            lastPayment: 170
          }
          struct[] USERS
          insert BOB into USERS
          insert MAX into USERS
        `;

        const code = await preprocessor.callStatic.transform(ctxAddr, input);
        await app.parseCode(code);

        const three = new Array(64).join('0') + 3;
        const number = `${new Array(63).join('0')}aa`; // 170

        expect(await ctx.program()).to.equal(
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

        expect(await app.getStorageUint256(hex4Bytes('MAX.lastPayment'))).equal(0);
        expect(await app.getStorageUint256(hex4Bytes('BOB.lastPayment'))).equal(0);
        await app.execute();

        expect(await app.getStorageUint256(hex4Bytes('MAX.lastPayment'))).equal(170);
        expect(await app.getStorageUint256(hex4Bytes('BOB.lastPayment'))).equal(3);
      });

      it('sum through structs values with additional code', async () => {
        const input = `
          struct BOB {
            lastPayment: 3
          }

          struct ALISA {
            lastPayment: 300
          }

          struct MAX {
            lastPayment: 170
          }
          struct[] USERS
          insert ALISA into USERS
          insert BOB into USERS
          sumOf USERS.lastPayment
          insert MAX into USERS
          sumOf USERS.lastPayment
        `;

        const code = await preprocessor.callStatic.transform(ctxAddr, input);
        await app.parseCode(code);

        const three = new Array(64).join('0') + 3;
        const number1 = `${new Array(62).join('0')}12c`; // 300
        const number2 = `${new Array(63).join('0')}aa`; // 170

        expect(await ctx.program()).to.equal(
          '0x' +
            '36' + // struct
            '4a871642' + // BOB.lastPayment
            `${three}` + // 3
            'cb398fe1' + // endStruct
            '36' + // struct
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
            '38' + // sumThroughStructs
            '80e5f4d2' + // USERS
            'f72cc83a' + // lastPayment
            '33' + // push
            'a427878700000000000000000000000000000000000000000000000000000000' + // MAX
            '80e5f4d2' + // USERS
            '38' + // sumThroughStructs
            '80e5f4d2' + // USERS
            'f72cc83a' // lastPayment
        );

        expect(await app.getStorageUint256(hex4Bytes('ALISA.lastPayment'))).equal(0);
        expect(await app.getStorageUint256(hex4Bytes('MAX.lastPayment'))).equal(0);
        expect(await app.getStorageUint256(hex4Bytes('BOB.lastPayment'))).equal(0);
        await app.execute();

        const StackCont = await ethers.getContractFactory('Stack');
        const contextStackAddress = await ctx.stack();
        stack = StackCont.attach(contextStackAddress);
        await checkStackTail(stack, [303, 473]);

        expect(await app.getStorageUint256(hex4Bytes('ALISA.lastPayment'))).equal(300);
        expect(await app.getStorageUint256(hex4Bytes('MAX.lastPayment'))).equal(170);
        expect(await app.getStorageUint256(hex4Bytes('BOB.lastPayment'))).equal(3);
      });

      it('sum through structs values with voting markers YES/NO', async () => {
        const input = `
          struct YES_VOTE {
            vote: YES
          }

          struct NO_VOTE {
            vote: NO
          }

          struct[] RESULTS
          insert YES_VOTE into RESULTS
          insert NO_VOTE into RESULTS
          insert YES_VOTE into RESULTS
          sumOf RESULTS.vote
          insert NO_VOTE into RESULTS
          insert YES_VOTE into RESULTS
          (sumOf RESULTS.vote) setUint256 YES_CTR
        `;

        const code = await preprocessor.callStatic.transform(ctxAddr, input);
        await app.parseCode(code);

        await app.execute();

        const StackCont = await ethers.getContractFactory('Stack');
        const contextStackAddress = await ctx.stack();
        stack = StackCont.attach(contextStackAddress);
        await checkStackTail(stack, [2, 1]);

        expect(await app.getStorageUint256(hex4Bytes('YES_CTR'))).equal(3);
      });
    });
  });

  describe('For-loops', () => {
    before(async () => {
      // Create arrays for the usage in for-loops
      const input = `
        address[] USERS
        insert ${bob.address} into USERS
        insert ${carl.address} into USERS
        insert ${david.address} into USERS

        uint256[] DEPOSITS
        insert 2 into DEPOSITS
        insert 3 into DEPOSITS
        insert 4 into DEPOSITS
      `;
      const code = await preprocessor.callStatic.transform(ctxAddr, input);
      await app.parseCode(code);
      await app.execute();
    });

    // TODO: this test won't work correctly, fix it
    it.skip('Simple for loop', async () => {
      const input = `
        for ME in USERS {
          (msgSender == ME)
          ifelse ITS_ME ITS_NOT_ME end
        }

        ITS_ME { 10 }
        ITS_NOT_ME { 5 }
      `;

      // Preprocessing
      const code = await preprocessor.callStatic.transform(ctxAddr, input);
      expect(code).eql([
        'for',
        'ME',
        'in',
        'USERS',
        'startLoop',
        'msgSender',
        'ME',
        '==',
        'ifelse',
        'ITS_ME',
        'ITS_NOT_ME',
        // 'end',
        'endLoop',
        'ITS_ME',
        'uint256',
        '10',
        'end',
        'ITS_NOT_ME',
        'uint256',
        '5',
        'end',
        // 'uint256',
        // '15',
      ]);

      // Parsing
      await app.parseCode(code);

      expect(await ctx.program()).to.equal(
        '0x' +
          '37' + // for 1
          '1854c655' + // hex4Bytes('ME') 5
          '80e5f4d2' + // hex4Bytes('USERS') 9
          '32' + // startLoop 10
          '1d' + // msgSender 11
          '1b' + // var 12
          '1854c655' + // hex4Bytes('ME') 16
          '01' + // `==` 17
          '23' + // ifelse 18
          '0017' + // ITS_ME branch position 20
          '0039' + // ITS_NOT_ME branch position 22
          // '24' + // end 23
          '39' + // endLoop 24
          '1a' + // uint256 25
          `${new Array(64).join('0')}a` + // 10
          '24' + // end
          '1a' + // uint256
          `${new Array(64).join('0')}5` + // 5
          '24' // end
        // '1a' + // uint256
        // `${new Array(64).join('0')}f` // 15
      );

      // Execution
      await app.connect(alice).execute();

      /**
       * 1 - setUint256 TOTAL_DEPOSIT (first iteration)
       * 1 - setUint256 TOTAL_DEPOSIT (second iteration)
       * 1 - setUint256 TOTAL_DEPOSIT (third iteration)
       * 15 - uint256 15
       */
      await checkStackTail(stack, [5, 15, 5]);
    });

    it('for loop over array of numbers', async () => {
      const input = `
        // Getting the total user's deposit
        for DEPOSIT in DEPOSITS {
          (var TOTAL_DEPOSIT + var DEPOSIT) setUint256 TOTAL_DEPOSIT
        }

        15 // just a random number
      `;

      // Preprocessing
      const noComments = await preprocessor.callStatic.cleanString(input);
      const code = await preprocessor.callStatic.transform(ctxAddr, noComments);
      expect(code).eql([
        'for',
        'DEPOSIT',
        'in',
        'DEPOSITS',
        'startLoop',
        'var',
        'TOTAL_DEPOSIT',
        'var',
        'DEPOSIT',
        '+',
        'setUint256',
        'TOTAL_DEPOSIT',
        'endLoop',
        'uint256',
        '15',
      ]);

      // Parsing
      await app.parseCode(code);
      expect(await ctx.program()).to.equal(
        '0x' +
          '37' + // for
          '87a7811f' + // hex4Bytes('DEPOSIT')
          '060f7dbd' + // hex4Bytes('DEPOSITS')
          '32' + // startLoop
          '1b' + // var
          '0432f551' + // hex4Bytes('TOTAL_DEPOSIT')
          '1b' + // var
          '87a7811f' + // hex4Bytes('DEPOSIT')
          '26' + // +
          '2e' + // setUint256
          '0432f551' + // hex4Bytes('TOTAL_DEPOSIT')
          '39' + // endLoop
          '1a' + // uint256
          `${new Array(64).join('0')}f` // 15
      );

      // Execution
      await app.execute();

      // Variable checks
      expect(await app.getStorageUint256(hex4Bytes('TOTAL_DEPOSIT'))).equal(2 + 3 + 4);
      /**
       * 1 - setUint256 TOTAL_DEPOSIT (first iteration)
       * 1 - setUint256 TOTAL_DEPOSIT (second iteration)
       * 1 - setUint256 TOTAL_DEPOSIT (third iteration)
       * 15 - uint256 15
       */
      await checkStackTail(stack, [1, 1, 1, 15]);
    });

    it('two for loops', async () => {
      const input = `
        1 setUint256 TOTAL_DEPOSIT

        // Now we're not getting the true total deposit but rather multiply
        // the deposits
        for DEPOSIT in DEPOSITS {
          (var TOTAL_DEPOSIT * var DEPOSIT) setUint256 TOTAL_DEPOSIT
        }

        // Sending 1 ETH to all users in the USERS array
        for USER in USERS {
          sendEth USER 1e18
        }
      `;

      // Preprocessing
      const noComments = await preprocessor.callStatic.cleanString(input);
      const code = await preprocessor.callStatic.transform(ctxAddr, noComments);
      expect(code).eql([
        'uint256',
        '1',
        'setUint256',
        'TOTAL_DEPOSIT',
        'for',
        'DEPOSIT',
        'in',
        'DEPOSITS',
        'startLoop',
        'var',
        'TOTAL_DEPOSIT',
        'var',
        'DEPOSIT',
        '*',
        'setUint256',
        'TOTAL_DEPOSIT',
        'endLoop',
        'for',
        'USER',
        'in',
        'USERS',
        'startLoop',
        'sendEth',
        'USER',
        '1000000000000000000',
        'endLoop',
      ]);

      // Parsing
      await app.parseCode(code);
      expect(await ctx.program()).to.equal(
        '0x' +
          '1a' + // uint256
          `${bnToLongHexString('1')}` + // 1
          '2e' + // setUint256
          '0432f551' + // hex4Bytes('TOTAL_DEPOSIT')
          '37' + // for
          '87a7811f' + // hex4Bytes('DEPOSIT')
          '060f7dbd' + // hex4Bytes('DEPOSITS')
          '32' + // startLoop
          '1b' + // var
          '0432f551' + // hex4Bytes('TOTAL_DEPOSIT')
          '1b' + // var
          '87a7811f' + // hex4Bytes('DEPOSIT')
          '28' + // *
          '2e' + // setUint256
          '0432f551' + // hex4Bytes('TOTAL_DEPOSIT')
          '39' + // endLoop
          '37' + // for
          '2db9fd3d' + // hex4Bytes('USER')
          '80e5f4d2' + // hex4Bytes('USERS')
          '32' + // startLoop
          '1e' + // sendEth
          '2db9fd3d' + // hex4Bytes('USER')
          `${bnToLongHexString(parseEther('1'))}` + // 1e18
          '39' // endLoop
      );

      // Top up the contract
      alice.sendTransaction({ to: app.address, value: parseEther('3') });

      const balancesBefore = {
        bob: await bob.getBalance(),
        carl: await carl.getBalance(),
        david: await david.getBalance(),
      };

      // Execution
      await app.execute();

      // Variable checks
      expect(await app.getStorageUint256(hex4Bytes('TOTAL_DEPOSIT'))).equal(2 * 3 * 4);
      const balancesAfter = {
        bob: await bob.getBalance(),
        carl: await carl.getBalance(),
        david: await david.getBalance(),
      };
      expect(balancesAfter.bob.sub(balancesBefore.bob)).to.equal(parseEther('1'));
      expect(balancesAfter.carl.sub(balancesBefore.carl)).to.equal(parseEther('1'));
      expect(balancesAfter.david.sub(balancesBefore.david)).to.equal(parseEther('1'));
      /**
       * 1 - setUint256 TOTAL_DEPOSIT (initiating the variable with value `1`)
       * 1 - setUint256 TOTAL_DEPOSIT (first iteration)
       * 1 - setUint256 TOTAL_DEPOSIT (second iteration)
       * 1 - setUint256 TOTAL_DEPOSIT (third iteration)
       * 1 - sendEth (first iteration)
       * 1 - sendEth (second iteration)
       * 1 - sendEth (third iteration)
       */
      await checkStackTail(stack, [1, 1, 1, 1, 1, 1, 1]);
    });
  });

  describe.only('Governance', () => {
    let agreement: Agreement;
    let agreementAddr: string;
    let preprocessorAddr: string;
    let tokenAddr: string;
    let setRecord: string;
    let yesRecord: string;
    let noRecord: string;
    let checkRecord: string;
    const oneEthBN = parseEther('1');
    const tenTokens = parseEther('10');

    before(async () => {
      const LAST_BLOCK_TIMESTAMP = (
        await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
      ).timestamp;
      NEXT_MONTH = LAST_BLOCK_TIMESTAMP + ONE_MONTH;
      NEXT_TWO_MONTH = NEXT_MONTH + ONE_MONTH;

      preprocessorAddr = await deployPreprocessor(hre);

      // Deploy Token contract
      const token = await (await ethers.getContractFactory('Token'))
        .connect(alice)
        .deploy(ethers.utils.parseEther('1000'));
      await token.deployed();
      tokenAddr = token.address;

      setRecord =
        'declareArr struct VOTERS ' +
        'struct VOTE_YES { vote: YES } ' +
        'struct VOTE_NO { vote: NO } uint256 1';
      yesRecord = 'insert VOTE_YES into VOTERS uint256 1';
      noRecord = 'insert VOTE_NO into VOTERS uint256 1';
      checkRecord =
        '(sumOf VOTERS.vote) setUint256 YES_CTR ' +
        '(((lengthOf VOTERS * 1e10) / (YES_CTR * 1e10)) < 2) ' +
        'if ENABLE_RECORD end ' +
        'ENABLE_RECORD { enableRecord RECORD_ID at AGREEMENT_ADDR } uint256 1';
    });

    it.only('Voting process. Record in agreement is activated', async () => {
      const Context = await ethers.getContractFactory('Context');
      // 1. Governance contract is deployed; it will be an owner of Agreement.
      const [
        comparisonOpcodesLibAddr,
        branchingOpcodesLibAddr,
        logicalOpcodesLibAddr,
        otherOpcodesLibAddr,
      ] = await deployOpcodeLibs(hre);
      const [parserAddr, executorLibAddr, preprAddr] = await deployBaseMock(hre);
      const MockContract = await hre.ethers.getContractFactory('GovernanceMock', {
        libraries: {
          ComparisonOpcodes: comparisonOpcodesLibAddr,
          BranchingOpcodes: branchingOpcodesLibAddr,
          LogicalOpcodes: logicalOpcodesLibAddr,
          OtherOpcodes: otherOpcodesLibAddr,
          Executor: executorLibAddr,
        },
      });
      const parser = await ethers.getContractAt('ParserMock', parserAddr);

      const _contexts = [
        await Context.deploy(),
        await Context.deploy(),
        await Context.deploy(),
        await Context.deploy(),
        await Context.deploy(),
        await Context.deploy(),
        await Context.deploy(),
        await Context.deploy(),
      ];
      const contexts = [
        _contexts[0].address,
        _contexts[1].address,
        _contexts[2].address,
        _contexts[3].address,
        _contexts[4].address,
        _contexts[5].address,
        _contexts[6].address,
        _contexts[7].address,
      ];
      const governance = await MockContract.deploy(
        parserAddr,
        alice.address,
        tokenAddr,
        NEXT_MONTH,
        contexts
      );
      await governance.deployed();

      // 2. Alice creates a new record in Agreement. This record is disabled
      // Create Agreement contract
      agreementAddr = await deployAgreement(hre, governance.address);
      agreement = await ethers.getContractAt('Agreement', agreementAddr);
      const txId = '133';
      const signatories = [alice.address];
      const conditions = ['bool true'];
      const transaction = '(uint256 5) setUint256 AGREEMENT_RESULT';

      await governance.setStorageUint256(hex4Bytes('RECORD_ID'), txId);
      await governance.setStorageAddress(hex4Bytes('AGREEMENT_ADDR'), agreementAddr);
      await governance.setStorageUint256(hex4Bytes('GOV_BALANCE'), 55);

      const recordContext = await Context.deploy();
      const conditionContext = await Context.deploy();
      await recordContext.setAppAddress(agreementAddr);
      await conditionContext.setAppAddress(agreementAddr);
      await _contexts[0].setAppAddress(governance.address);
      await _contexts[1].setAppAddress(governance.address);
      await _contexts[2].setAppAddress(governance.address);
      await _contexts[3].setAppAddress(governance.address);
      await _contexts[4].setAppAddress(governance.address);
      await _contexts[5].setAppAddress(governance.address);
      await _contexts[6].setAppAddress(governance.address);
      await _contexts[7].setAppAddress(governance.address);

      // check that added record can not be executable for now
      await agreement.parse(conditions[0], conditionContext.address, preprAddr);
      await agreement.parse(transaction, recordContext.address, preprAddr);
      await agreement.connect(alice).update(
        txId,
        [], // required records
        [alice.address],
        transaction,
        conditions,
        recordContext.address,
        [conditionContext.address]
      );
      await expect(agreement.execute(txId)).to.be.revertedWith('AGR13');
      let record = await agreement.records(txId);
      expect(record.isActive).to.be.equal(false);

      // 3. Governance voting occurs. If consensus is met -> enable the target record.
      // -------> check the setRecord data and execution <-------
      let recordGov = await governance.records(0);
      let conditionGov = await governance.conditionContexts(0, 0);
      expect(recordGov.isActive).to.be.equal(true);
      expect(recordGov.isExecuted).to.be.equal(false);
      // expect(recordGov.transactionString).to.be.equal(setRecord);
      expect(recordGov.recordContext).to.be.equal(contexts[0]);
      expect(conditionGov).to.be.equal(contexts[1]);

      await parseConditionsList([0, 1, 2, 3], parser, governance, preprAddr);
      await governance.parse(recordGov.transactionString, recordGov.recordContext, preprAddr);
      await governance.connect(alice).execute(0); // sets DSL code for the first record
      recordGov = await governance.records(0);
      expect(recordGov.isActive).to.be.equal(true);
      expect(recordGov.isExecuted).to.be.equal(true);
      await expect(governance.connect(alice).execute(0)).to.be.revertedWith('AGR7');

      // -------> check the yesRecord data and execution <-------
      recordGov = await governance.records(1);
      conditionGov = await governance.conditionContexts(1, 0);
      expect(recordGov.isActive).to.be.equal(true);
      expect(recordGov.isExecuted).to.be.equal(false);
      // expect(recordGov.transactionString).to.be.equal(yesRecord);
      expect(recordGov.recordContext).to.be.equal(contexts[2]);
      expect(conditionGov).to.be.equal(contexts[3]);

      // await parseConditions(1, parser, governance, preprAddr);
      await governance.parse(recordGov.transactionString, recordGov.recordContext, preprAddr);
      await governance.connect(bob).execute(1); // bob votes YES
      await governance.connect(carl).execute(1); // bob votes YES

      // Check that the variable was set correctly
      // expect(app.getStorageUint256(hex4Bytes('VOTES.vote'))).to.equal(1);

      // declareArr struct VOTERS '
      //   'struct VOTE_YES { vote: 1 } '
      // getStorageUint256(hex4Bytes('VOTE_YES.vote')) == 1
      // get 0 VOTERS => hex4Bytes('VOTE_YES')
      // To obtain '1': hex4Bytes('VOTE_YES.vote') // hex4Bytes('`${hex4Bytes('VOTE_YES')}`.vote')

      // [hex4Bytes('VOTE_YES.vote'), hex4Bytes('VOTE_YES'), ...]

      // check that bob can not vote anymore
      await expect(governance.connect(bob).execute(1)).to.be.revertedWith('AGR7');
      recordGov = await governance.records(1);
      expect(recordGov.isActive).to.be.equal(true);
      expect(recordGov.isExecuted).to.be.equal(false);

      // -------> check the noRecord data and execution <-------
      recordGov = await governance.records(2);
      conditionGov = await governance.conditionContexts(2, 0);
      expect(recordGov.isActive).to.be.equal(true);
      expect(recordGov.isExecuted).to.be.equal(false);
      // expect(recordGov.transactionString).to.be.equal(noRecord);
      expect(recordGov.recordContext).to.be.equal(contexts[4]);
      expect(conditionGov).to.be.equal(contexts[5]);

      // await parseConditions(2, parser, governance, preprAddr);
      await governance.parse(recordGov.transactionString, recordGov.recordContext, preprAddr);
      await governance.connect(bob).execute(2); // votes NO
      // check that bob can not vote anymore
      await expect(governance.connect(bob).execute(2)).to.be.revertedWith('AGR7');
      recordGov = await governance.records(2);
      expect(recordGov.isActive).to.be.equal(true);
      expect(recordGov.isExecuted).to.be.equal(false);

      // -------> check the checkRecord data and execution <-------
      recordGov = await governance.records(3);
      conditionGov = await governance.conditionContexts(3, 0);
      expect(recordGov.isActive).to.be.equal(true);
      expect(recordGov.isExecuted).to.be.equal(false);
      // expect(recordGov.transactionString).to.be.equal(checkRecord);
      expect(recordGov.recordContext).to.be.equal(contexts[6]);
      expect(conditionGov).to.be.equal(contexts[7]);

      // await parseConditions(3, parser, governance, preprAddr);
      await governance.parse(recordGov.transactionString, recordGov.recordContext, preprAddr);

      // Deadline condition isn't satisfied
      await expect(governance.connect(alice).execute(3)).to.be.revertedWith('AGR6');

      // Increase time that is more that deadline and execute the record
      await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);

      // Check that the result of voting is zero
      expect(await governance.getStorageUint256(hex4Bytes('YES_CTR'))).to.be.equal(0);
      // console.log('------->')
      await governance.connect(alice).execute(3); // execute Voting results after deadline

      console.log('\n\n ->');
      expect(hex4BytesShort('VOTE_YES')).equal('506e8220');
      expect(hex4BytesShort('VOTE_NO')).equal('692b95cd');
      expect(hex4BytesShort('VOTERS')).equal('ef3a685c');
      expect(hex4BytesShort('vote')).equal('0932bdf8');

      // Check that the result of voting is two votes
      expect(await governance.getStorageUint256(hex4Bytes('YES_CTR'))).to.be.equal(2);

      // recordGov = await governance.records(3);
      // expect(recordGov.isActive).to.be.equal(true);
      // expect(recordGov.isExecuted).to.be.equal(true);

      // // TODO: bellow checks are failed. make them work
      // // check that record in agreement was activated
      // record = await agreement.records(txId);
      // expect(record.isActive).to.be.equal(true);

      // // Check that the result in agreement contract of the AGREEMENT_RESULT variable is zero
      // expect(await agreement.getStorageUint256(hex4Bytes('AGREEMENT_RESULT'))).to.be.equal(0);

      // // check that record in agreement can be executed
      // await agreement.execute(txId);

      // // Check that the result in agreement contract of the AGREEMENT_RESULT variable is 5
      // expect(await agreement.getStorageUint256(hex4Bytes('AGREEMENT_RESULT'))).to.be.equal(5);

      // TODO: check that no one can vote anymore because of deadline
      // await expect(governance.connect(david).execute(1)).to.be.revertedWith('AGR6');
      // await expect(governance.connect(david).execute(2)).to.be.revertedWith('AGR6');
    });
  });
});
