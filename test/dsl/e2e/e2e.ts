import * as hre from 'hardhat';
import { expect } from 'chai';
import { BigNumber } from 'ethers';

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { E2EApp, Context, Preprocessor, Stack } from '../../../typechain-types';
import { checkStackTailv2, hex4Bytes, hex4BytesShort } from '../../utils/utils';
import { deployOpcodeLibs } from '../../../scripts/utils/deploy.utils';
import { deployBaseMock } from '../../../scripts/utils/deploy.utils.mock';
import { getChainId } from '../../../utils/utils';

const { ethers, network } = hre;

describe('End-to-end', () => {
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carl: SignerWithAddress;
  let stack: Stack;
  let preprocessor: Preprocessor;
  let ctx: Context;
  let ctxAddr: string;
  let app: E2EApp;
  let NEXT_MONTH: number;
  let PREV_MONTH: number;
  let lastBlockTimestamp: number;
  let snapshotId: number;

  before(async () => {
    [alice, bob, carl] = await ethers.getSigners();
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
      await app.setStorageUint256(varHashPadded, varValue);
      await app.parse(code);

      const resultBytecode = await ctx.program();
      expect(resultBytecode).to.be.equal(`0x${bytecode.join('')}`);

      // Execute program
      await app.execute();

      await checkStackTailv2(stack, [1]);
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
      await app.setStorageUint256(hex4Bytes('NOW'), NOW);
      await app.setStorageUint256(hex4Bytes('INIT'), INIT);
      await app.setStorageUint256(hex4Bytes('EXPIRY'), EXPIRY);
      await app.setStorageUint256(hex4Bytes('RISK'), RISK);

      await app.execute();
      await checkStackTailv2(stack, [result]);
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
      'branch',
      'good',
      'uint256',
      ONE,
      'uint256',
      TWO,
      'end',
      'branch',
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
      '2f' + // branch tag
      '1a' + // good: uint256
      `${ONE}` + // good: ONE
      '1a' + // good: uint256
      `${TWO}` + // good: TWO
      '24' + // good: end
      '2f' + // branch tag
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
    it('get empty items from arrays with different types', async () => {
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
        `${ZERO}` + // 1 index
        '257b3678'; // bytecode for INDEXES
      expect(await ctx.program()).to.equal(expectedProgram);

      // Execute and check
      await checkStackTailv2(stack, []);

      await app.execute();
      const StackCont = await ethers.getContractFactory('Stack');
      const contextStackAddress = await ctx.stack();
      stack = StackCont.attach(contextStackAddress);

      expect(await app.get(0, hex4Bytes('INDEXES'))).to.equal(`0x${new Array(65).join('0')}`);
      expect(await app.get(0, hex4Bytes('NUMBERS'))).to.equal(`0x${new Array(65).join('0')}`);

      await checkStackTailv2(stack, []);
    });

    it('get items from arrays with different types', async () => {
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
      await checkStackTailv2(stack, []);

      await app.execute();
      const StackCont = await ethers.getContractFactory('Stack');
      const contextStackAddress = await ctx.stack();
      stack = StackCont.attach(contextStackAddress);

      /*
        lengthOf INDEXES -> 2 in the stack
        lengthOf NUMBERS -> 1 in the stack
        0 item in NUMBERS -> 1345 in the stack
        1 item in INDEXES -> 0x47f8a90ede3d84c7c0166bd84a4635e4675accfc in the stack
      */
      expect(await app.get(0, hex4Bytes('INDEXES'))).to.equal(
        `0xe7f8a90ede3d84c7c0166bd84a4635e4675accfc${new Array(25).join('0')}`
      );
      expect(await app.get(1, hex4Bytes('INDEXES'))).to.equal(
        `0x47f8a90ede3d84c7c0166bd84a4635e4675accfc${new Array(25).join('0')}`
      );
      expect(await app.get(0, hex4Bytes('NUMBERS'))).to.equal(`0x${new Array(62).join('0')}541`);

      await checkStackTailv2(stack, [
        2,
        1,
        1345,
        BigNumber.from('0x47f8a90ede3d84c7c0166bd84a4635e4675accfc000000000000000000000000'),
      ]);
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
      await app.setStorageUint256(hex4Bytes('A'), 6);
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
      await checkStackTailv2(stack, [0]);
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
        await checkStackTailv2(stack, [1, 1]);
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
    });
  });

  describe.only('For-loops', () => {
    before(async () => {
      // Create an array for the usage in for-loops
      const input = `
      uint256[] LPS_INITIAL
      insert ${alice.address} into LPS_INITIAL
      insert ${bob.address} into LPS_INITIAL
      insert ${carl.address} into LPS_INITIAL
      `;
      const code = await preprocessor.callStatic.transform(ctxAddr, input);
      await app.parseCode(code);
      await app.execute();
    });

    it.only('Simple for loop', async () => {
      const input = `
        for LP_INITIAL in LPS_INITIAL {
          bool true
        }
      `;
      // Set necessary variables
      // await app.setStorageUint256(hex4Bytes('LPS_INITIAL'), varValue);

      // Preprocessing
      const code = await preprocessor.callStatic.transform(ctxAddr, input);
      expect(code).eql(['for', 'LP_INITIAL', 'in', 'LPS_INITIAL', 'bool', 'true', 'end']);

      // Parsing
      await app.parseCode(code);
      expect(await ctx.program()).to.equal(
        '0x' +
          '37' + // for
          'c5bc3efa' + // hex4Bytes('LP_INITIAL')
          'a0c9d042' + // hex4Bytes('LPS_INITIAL')
          '18' + // bool
          '01' + // true
          '24' // end
      );

      // Execution
      await app.execute();
    });
  });
});
