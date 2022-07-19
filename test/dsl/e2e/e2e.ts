import { ethers } from 'hardhat';
import { expect } from 'chai';
import { E2EApp, Context, Preprocessor, Stack, StackValue__factory } from '../../../typechain';
import { checkStack, hex4Bytes, hex4BytesShort } from '../../utils/utils';

async function getChainId() {
  return ethers.provider.getNetwork().then((network) => network.chainId);
}

// TODO: make more thorough end-to-end testing
describe('End-to-end', () => {
  let stack: Stack;
  let preprocessor: Preprocessor;
  let ctx: Context;
  let ctxAddr: string;
  let app: E2EApp;
  let StackValue: StackValue__factory;
  let NEXT_MONTH: number;
  let PREV_MONTH: number;
  let lastBlockTimestamp: number;

  before(async () => {
    lastBlockTimestamp = (
      await ethers.provider.getBlock(
        // eslint-disable-next-line no-underscore-dangle
        ethers.provider._lastBlockNumber /* it's -2 but the resulting block number is correct */
      )
    ).timestamp;

    NEXT_MONTH = lastBlockTimestamp + 60 * 60 * 24 * 30;
    PREV_MONTH = lastBlockTimestamp - 60 * 60 * 24 * 30;

    // Create StackValue Factory instance
    StackValue = await ethers.getContractFactory('StackValue');

    // Deploy libraries
    const opcodeHelpersLib = await (await ethers.getContractFactory('OpcodeHelpers')).deploy();
    const comparatorOpcodesLib = await (
      await ethers.getContractFactory('ComparatorOpcodes', {
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
    const setOpcodesLib = await (
      await ethers.getContractFactory('SetOpcodes', {
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
    const stringLib = await (await ethers.getContractFactory('StringUtils')).deploy();
    const byteLib = await (await ethers.getContractFactory('ByteUtils')).deploy();
    const executorLib = await (await ethers.getContractFactory('Executor')).deploy();

    // Deploy Preprocessor
    preprocessor = await (
      await ethers.getContractFactory('Preprocessor', {
        libraries: { StringUtils: stringLib.address },
      })
    ).deploy();

    // Deploy ParserMock
    const parser = await (
      await ethers.getContractFactory('ParserMock', {
        libraries: { StringUtils: stringLib.address, ByteUtils: byteLib.address },
      })
    ).deploy();

    // Deploy Context & setup
    ctx = await (await ethers.getContractFactory('Context')).deploy();
    ctxAddr = ctx.address;
    await ctx.setComparatorOpcodesAddr(comparatorOpcodesLib.address);
    await ctx.setLogicalOpcodesAddr(logicalOpcodesLib.address);
    await ctx.setSetOpcodesAddr(setOpcodesLib.address);
    await ctx.setOtherOpcodesAddr(otherOpcodesLib.address);

    // Create Stack instance
    const StackCont = await ethers.getContractFactory('Stack');
    const contextStackAddress = await ctx.stack();
    stack = StackCont.attach(contextStackAddress);

    // Deploy Application
    app = await (
      await ethers.getContractFactory('E2EApp', { libraries: { Executor: executorLib.address } })
    ).deploy(preprocessor.address, parser.address, ctxAddr);
  });

  describe('blockChainId < loadLocal uint256 VAR', () => {
    it('blockChainId < loadLocal uint256 VAR', async () => {
      const chainId = await getChainId();
      const varHashPadded = hex4Bytes('VAR');
      const varHash = varHashPadded.slice(2, 2 + 8);
      const varValue = chainId + 1;
      const code = 'blockChainId < loadLocal uint256 VAR';
      const bytecode = ['17', `1b01${varHash}`, '03'];

      // Parse code
      await app.setStorageUint256(varHashPadded, varValue);
      await app.parse(code);

      const resultBytecode = await ctx.program();
      expect(resultBytecode).to.be.equal(`0x${bytecode.join('')}`);

      // Execute program
      await app.execute();

      await checkStack(StackValue, stack, 1, 1);
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
      ((loadLocal uint256 NOW > loadLocal uint256 INIT)
      and
      (loadLocal uint256 NOW < loadLocal uint256 EXPIRY))
      or
      ((loadLocal bool RISK == bool true)
      ==
      (bool false))
    `;

    const bytecode = [
      /* eslint-disable no-multi-spaces */
      `1b01${hex4BytesShort('NOW')}`, // ['loadLocal', 'uint256', 'NOW'],
      `1b01${hex4BytesShort('INIT')}`, // ['loadLocal', 'uint256', 'INIT'],
      '04', // ['>'], // A

      `1b01${hex4BytesShort('NOW')}`, // ['loadLocal', 'uint256', 'NOW'],
      `1b01${hex4BytesShort('EXPIRY')}`, // ['loadLocal', 'uint256', 'EXPIRY'],
      '03', // ['<'], // B

      '12', // ['and'],

      `1b02${hex4BytesShort('RISK')}`, // ['loadLocal', 'bool', 'RISK'],
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
      await checkStack(StackValue, stack, 1, result);
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
    it('func SUM_OF_NUMBERS (get uint256 variables from storage) ', async () => {
      const input = `
        6 8
        func SUM_OF_NUMBERS 2 endf
        end

        SUM_OF_NUMBERS {
          (loadLocal uint256 SUM_OF_NUMBERS_1 + loadLocal uint256 SUM_OF_NUMBERS_2) setUint256 SUM
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
        'loadLocal',
        'uint256',
        'SUM_OF_NUMBERS_1',
        'loadLocal',
        'uint256',
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
        '1b' + // loadLocal
        '01' + // uint256
        'c56b21ed' + // SUM_OF_NUMBERS_1
        '1b' + // loadLocal
        '01' + // uint256
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

  describe('Load local variables without loadLocal opcode', async () => {
    it('set two local variables, one of them using in the next command', async () => {
      const input = `
        uint256 6 setUint256 A
        (A + 2) setUint256 SUM
        `;
      const SIX = new Array(64).join('0') + 6;
      const TWO = new Array(64).join('0') + 2;
      const code = await preprocessor.callStatic.transform(ctxAddr, input);
      const expectedCode = [
        'uint256',
        '6',
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
      await app.parseCode(code);
      const expectedProgram =
        '0x' +
        '1a' + // uint256
        `${SIX}` + // 6
        '2e' + // setUint256
        '03783fac' + // A
        '1b' + // loadlocal
        '01' + // uint256
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
        (A + 2) setUint256 A
        `;
      const SIX = new Array(64).join('0') + 6;
      const TWO = new Array(64).join('0') + 2;
      const code = await preprocessor.callStatic.transform(ctxAddr, input);
      const expectedCode = [
        'uint256',
        '6',
        'setUint256',
        'A',
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
        '1b' + // loadlocal
        '01' + // uint256
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
      const six = new Array(64).join('0') + 6;
      const two = new Array(64).join('0') + 2;
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
      // TODO: should revert or use true value?
      const SIX = new Array(64).join('0') + 6;
      const input = `
        uint256 6 setUint256 A
        bool A
        `;
      const code = await preprocessor.callStatic.transform(ctxAddr, input);
      const expectedCode = ['uint256', '6', 'setUint256', 'A', 'bool', 'A'];
      expect(code).to.eql(expectedCode);

      // to Parser
      await app.parseCode(code);
      const expectedProgram = `0x1a${SIX}2e03783fac1800`;
      expect(await ctx.program()).to.equal(expectedProgram);
    });
  });
});
