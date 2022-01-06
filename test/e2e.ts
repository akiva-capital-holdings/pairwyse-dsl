import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  AppParserMock, Context, Stack, StackValue__factory,
} from '../typechain';
import { checkStackTail, hex4Bytes, hex4BytesShort } from './utils/utils';

const NEXT_MONTH = Math.round((Date.now() + 1000 * 60 * 60 * 24 * 30) / 1000);
const PREV_MONTH = Math.round((Date.now() - 1000 * 60 * 60 * 24 * 30) / 1000);

async function getChainId() {
  return ethers.provider.getNetwork().then((network) => network.chainId);
}

describe('End-to-end', () => {
  let stack: Stack;
  let context: Context;
  let app: AppParserMock;
  let StackValue: StackValue__factory;

  before(async () => {
    // Create StackValue Factory instance
    StackValue = await ethers.getContractFactory('StackValue');

    // Deploy App
    const AppCont = await ethers.getContractFactory('AppParserMock');
    app = await AppCont.deploy();

    // Create Context instance
    context = await ethers.getContractAt('Context', await app.ctx());

    // Create Stack instance
    const StackCont = await ethers.getContractFactory('Stack');
    const contextStackAddress = await context.stack();
    stack = StackCont.attach(contextStackAddress);
  });

  afterEach(async () => app.reset());

  describe('blockChainId < loadLocal uint256 VAR', async () => {
    const chainId = await getChainId();
    const varHashPadded = hex4Bytes('VAR');
    const varHash = varHashPadded.slice(2, 2 + 8);
    const varValue = chainId + 1;

    const code = [
      ['blockChainId'],
      ['loadLocal', 'uint256', 'VAR'],
      ['<'],
    ];

    const bytecode = [
      '17',
      `1b01${varHash}`,
      '03',
    ];

    const stackStepByStep = [
      [chainId],
      [chainId, varValue],
      [1],
    ];

    it('bytecode', async () => {
      await app.parseCode(code.flat());

      const resultBytecode = await context.program();
      expect(resultBytecode).to.be.equal(`0x${bytecode.join('')}`);
    });

    it('step-by-step stack', async () => {
      await app.setStorageUint256(varHashPadded, varValue);

      for (let i = 0; i < stackStepByStep.length; i += 1) {
        const [targetStack, ops] = [stackStepByStep[i], code[i]];
        if (!targetStack || !ops) {
          throw new Error('Invalid bytecode or stack');
        }

        await app.exec(ops);
        await checkStackTail(StackValue, stack, targetStack.length, targetStack);
      }
    });
  });

  describe('((time > init) and (time < expiry)) or ((risk == true) == false)', async () => {
    const ITS_RISKY = 1;
    const NOT_RISKY = 0;
    const NOW = Math.floor(Date.now() / 1000);

    // (A & B) | C
    const code = [
      ['loadLocal', 'uint256', 'NOW'],
      ['loadLocal', 'uint256', 'INIT'],
      ['>'], // A

      ['loadLocal', 'uint256', 'NOW'],
      ['loadLocal', 'uint256', 'EXPIRY'],
      ['<'], // B

      ['and'],

      ['loadLocal', 'bool', 'RISK'],
      ['bool', 'true'],
      ['=='],

      ['bool', 'false'],
      ['=='], // C

      ['or'],
    ];

    const bytecode = [
      /* eslint-disable no-multi-spaces */
      `1b01${hex4BytesShort('NOW')}`,     // ['loadLocal', 'uint256', 'NOW'],
      `1b01${hex4BytesShort('INIT')}`,    // ['loadLocal', 'uint256', 'INIT'],
      '04',                               // ['>'], // A

      `1b01${hex4BytesShort('NOW')}`,     // ['loadLocal', 'uint256', 'NOW'],
      `1b01${hex4BytesShort('EXPIRY')}`,  // ['loadLocal', 'uint256', 'EXPIRY'],
      '03',                               // ['<'], // B

      '12',                               // ['and'],

      `1b02${hex4BytesShort('RISK')}`,    // ['loadLocal', 'bool', 'RISK'],
      '1801',                             // ['bool', 'true'],
      '01',                               // ['=='],

      '1800',                             // ['bool', 'false'],
      '01',                               // ['=='], // C

      '13',                               // ['or'],
      /* eslint-enable no-multi-spaces */
    ];

    async function testCase(
      INIT: number,
      EXPIRY: number,
      RISK: number,
      A: number,
      B: number,
      C: number,
      result: number,
    ) {
      const stackStepByStep = [
        /* eslint-disable no-multi-spaces */
        [NOW],                          // ['loadLocal', 'uint256', 'NOW'],
        [NOW, INIT],                    // ['loadLocal', 'uint256', 'INIT'],
        [A],                            // ['>'], // A

        [A, NOW],                       // ['loadLocal', 'uint256', 'NOW'],
        [A, NOW, EXPIRY],               // ['loadLocal', 'uint256', 'EXPIRY'],
        [A, B],                         // ['<'], // B

        [+(A && B)],                    // ['and'],

        [+(A && B), RISK],              // ['loadLocal', 'bool', 'RISK'],
        [+(A && B), RISK, 1],           // ['bool', 'true'],
        [+(A && B), +(RISK === 1)],     // ['=='],

        [+(A && B), +(RISK === 1), 0],  // ['bool', 'false'],
        [+(A && B), C],                 // ['=='], // C

        [result],                       // ['or'],
        /* eslint-enable no-multi-spaces */
      ];

      await app.setStorageUint256(hex4Bytes('NOW'), NOW);
      await app.setStorageUint256(hex4Bytes('INIT'), INIT);
      await app.setStorageUint256(hex4Bytes('EXPIRY'), EXPIRY);
      await app.setStorageUint256(hex4Bytes('RISK'), RISK);

      for (let i = 0; i < stackStepByStep.length; i += 1) {
        const [targetStack, ops] = [stackStepByStep[i], code[i]];

        if (!targetStack || !ops) {
          throw new Error('Invalid bytecode or stack');
        }

        await app.exec(ops);
        await checkStackTail(StackValue, stack, targetStack.length, targetStack);
      }
    }

    it('bytecode', async () => {
      await app.parseCode(code.flat());

      const resultBytecode = await context.program();
      expect(resultBytecode).to.be.equal(`0x${bytecode.join('')}`);
    });

    describe('step-by-step stack', async () => {
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
});
