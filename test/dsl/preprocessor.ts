import { expect } from 'chai';
import { ethers } from 'hardhat';
import { parseUnits } from 'ethers/lib/utils';

import { Preprocessor } from '../../typechain-types';
import { Testcase } from '../types';

describe('Preprocessor', () => {
  let app: Preprocessor;
  let ctxAddr: string;
  let appAddrHex: string;

  const jsTransform = (expr: string) =>
    expr
      .replaceAll('(', '@(@')
      .replaceAll(')', '@)@')
      .split(/[@ \n]/g)
      .filter((x: string) => !!x);

  before(async () => {
    // Deploy StringUtils library
    const stringLib = await (await ethers.getContractFactory('StringUtils')).deploy();

    // Deploy Context
    const ctx = await (await ethers.getContractFactory('ContextMock')).deploy();
    ctxAddr = ctx.address;

    // Setup operators & priorities
    await ctx.addOperatorExt('!', 4);

    await ctx.addOperatorExt('swap', 3);
    await ctx.addOperatorExt('and', 3);
    await ctx.addOperatorExt('*', 3);
    await ctx.addOperatorExt('/', 3);

    await ctx.addOperatorExt('xor', 2);
    await ctx.addOperatorExt('or', 2);
    await ctx.addOperatorExt('+', 2);
    await ctx.addOperatorExt('-', 2);

    await ctx.addOperatorExt('==', 1);
    await ctx.addOperatorExt('<', 1);
    await ctx.addOperatorExt('>', 1);
    await ctx.addOperatorExt('<=', 1);
    await ctx.addOperatorExt('>=', 1);
    await ctx.addOperatorExt('!=', 1);

    // Deploy Preprocessor
    app = await (
      await ethers.getContractFactory('Preprocessor', {
        libraries: { StringUtils: stringLib.address },
      })
    ).deploy();
    appAddrHex = app.address.slice(2);
  });

  describe('infix to postfix', () => {
    const tests: Testcase[] = [
      {
        name: 'simple math',
        expr: '1 + 2',
        expected: ['uint256', '1', 'uint256', '2', '+'],
      },
      {
        name: 'simple',
        expr: 'loadLocal address SENDER == msgSender',
        expected: ['loadLocal', 'address', 'SENDER', 'msgSender', '=='],
      },
      {
        name: 'complex',
        expr: `
        (blockTimestamp > loadLocal uint256 INIT)
          and
        (blockTimestamp < loadLocal uint256 EXPIRY)
          or
        (loadLocal bool RISK != bool true)
      `,
        expected: [
          'TIME',
          'loadLocal',
          'uint256',
          'INIT',
          '>', // A
          'TIME',
          'loadLocal',
          'uint256',
          'EXPIRY',
          '<', // B
          'and',
          'loadLocal',
          'bool',
          'RISK',
          'bool',
          'true',
          '!=', // C
          'or',
        ],
      },
      {
        name: 'parenthesis',
        expr: '(((1 or 5) or 7) and 0)',
        expected: [
          'uint256',
          '1',
          'uint256',
          '5',
          'or',
          'uint256',
          '7',
          'or',
          'uint256',
          '0',
          'and',
        ],
      },
    ];

    const infixToPostfixTest = ({ name, expr, expected }: Testcase) => {
      it(name, async () => {
        const stack = await (await ethers.getContractFactory('StringStack')).deploy();
        const inputArr = jsTransform(expr);
        const res = await app.callStatic.infixToPostfix(ctxAddr, inputArr, stack.address);
        expect(res).to.eql(expected);
      });
    };

    tests.forEach((testcase) => infixToPostfixTest(testcase));
  });

  describe('split', () => {
    it('simple case', async () => {
      const res = await app.callStatic.split('loadLocal address SENDER == msgSender');
      expect(res).to.eql(jsTransform('loadLocal address SENDER == msgSender'));
    });

    it('extra spaces', async () => {
      const res = await app.callStatic.split('loadLocal      address SENDER == msgSender');
      expect(res).to.eql(jsTransform('loadLocal      address SENDER == msgSender'));
    });

    it('parenthesis', async () => {
      const res = await app.callStatic.split('(((1 or 5) or 7) and 0)');
      expect(res).to.eql(jsTransform('(((1 or 5) or 7) and 0)'));
    });

    it('new line symbol', async () => {
      const res = await app.callStatic.split(`
          loadLocal address SENDER
            ==
          msgSender
        `);
      expect(res).to.eql(
        jsTransform(`
          loadLocal address SENDER
            ==
          msgSender
        `)
      );
    });

    it('all together', async () => {
      const res = await app.callStatic.split(`
        (
          (
            blockTimestamp > loadLocal uint256 INIT
          )
            and
          (
            blockTimestamp < loadLocal uint256 EXPIRY
              or
            (
              loadLocal bool RISK != bool true
            )
          )
        )
        `);
      expect(res).to.eql(
        jsTransform(`
        (
          (
            blockTimestamp > loadLocal uint256 INIT
          )
            and
          (
            blockTimestamp < loadLocal uint256 EXPIRY
              or
            (
              loadLocal bool RISK != bool true
            )
          )
        )
        `)
      );
    });
  });

  describe('Execute high-level DSL', () => {
    it('parenthesis', async () => {
      const cmds = await app.callStatic.transform(ctxAddr, '(((1 or 5) or 7) and 1)');
      expect(cmds).to.eql([
        'uint256',
        '1',
        'uint256',
        '5',
        'or',
        'uint256',
        '7',
        'or',
        'uint256',
        '1',
        'and',
      ]);
    });

    describe('parenthesis matter', () => {
      it('first', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, '1 or 0 or 1 and 0');
        expect(cmds).to.eql([
          'uint256',
          '1',
          'uint256',
          '0',
          'or',
          'uint256',
          '1',
          'uint256',
          '0',
          'and',
          'or',
        ]);
      });

      it('second', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, '((1 or 0) or 1) and 0');
        expect(cmds).to.eql([
          'uint256',
          '1',
          'uint256',
          '0',
          'or',
          'uint256',
          '1',
          'or',
          'uint256',
          '0',
          'and',
        ]);
      });

      it('third', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, '(1 or 0) or (1 and 0)');
        expect(cmds).to.eql([
          'uint256',
          '1',
          'uint256',
          '0',
          'or',
          'uint256',
          '1',
          'uint256',
          '0',
          'and',
          'or',
        ]);
      });
    });

    it('complex expression', async () => {
      const program = `
        (((loadLocal uint256 TIMESTAMP >    loadLocal uint256 INIT)
          and
        (loadLocal uint256 TIMESTAMP <   loadLocal uint256 EXPIRY))
          or
        loadLocal bool RISK != bool true)`;

      const cmds = await app.callStatic.transform(ctxAddr, program);
      expect(cmds).to.eql([
        'loadLocal',
        'uint256',
        'TIMESTAMP',
        'loadLocal',
        'uint256',
        'INIT',
        '>',
        'loadLocal',
        'uint256',
        'TIMESTAMP',
        'loadLocal',
        'uint256',
        'EXPIRY',
        '<',
        'and',
        'loadLocal',
        'bool',
        'RISK',
        'or',
        'bool',
        'true',
        '!=',
      ]);
    });

    it('if expression', async () => {
      const ONE = new Array(64).join('0') + 1;
      const TWO = new Array(64).join('0') + 2;
      const FOUR = new Array(64).join('0') + 4;

      const program = `
        bool true
        if action

        ${FOUR}
        end

        action {
          ${ONE}
          ${TWO}
        }
        `;

      const cmds = await app.callStatic.transform(ctxAddr, program);
      expect(cmds).to.eql([
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
    });

    it('if-else expression', async () => {
      const ONE = new Array(64).join('0') + 1;
      const TWO = new Array(64).join('0') + 2;
      const THREE = new Array(64).join('0') + 3;
      const FOUR = new Array(64).join('0') + 4;

      const program = `
        bool true
        ifelse good bad

        ${FOUR}
        end

        good {
          ${ONE}
          ${TWO}
        }

        bad {
          ${THREE}
        }
        `;

      const cmds = await app.callStatic.transform(ctxAddr, program);
      expect(cmds).to.eql([
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
    });
  });
  describe('Remove comments', async () => {
    describe('Single line comment in user-input', async () => {
      it('commented one-line command', async () => {
        const cleanString = await app.callStatic.cleanString('// uint256 2 * uint256 5');
        expect(cleanString).to.eql('');
      });

      it('commented all lines of program', async () => {
        const cleanString = await app.callStatic.cleanString(`
          // uint256 2 * uint256 5
          // bool true
        `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        expect(cmds).to.eql([]);
      });

      it('a comment located next to the command line', async () => {
        const cleanString = await app.callStatic.cleanString(`
          // uint256 2 * uint256 5
          bool true
        `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        expect(cmds).to.eql(['bool', 'true']);
      });

      it('a comment located between two lines of commands', async () => {
        const cleanString = await app.callStatic.cleanString(`
          bool false
          // uint256 2 * uint256 5
          bool true
        `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        expect(cmds).to.eql(['bool', 'false', 'bool', 'true']);
      });

      it('a comment located next to the command (w/o spaces) ', async () => {
        const cleanString = await app.callStatic.cleanString(`
          bool true//uint256 2 * uint256 5
        `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        expect(cmds).to.eql(['bool', 'true']);
      });

      it('a comment located just after the command (with end line) ', async () => {
        const cleanString = await app.callStatic.cleanString(`
          bool true//smth
          bool false
        `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        expect(cmds).to.eql(['bool', 'true', 'bool', 'false']);
      });

      it('a comment located next to the command (with space)', async () => {
        const cleanString = await app.callStatic.cleanString(`
          bool true// uint256 2 * uint256 5
        `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        expect(cmds).to.eql(['bool', 'true']);
      });

      it('a comment located just before the command (with space)', async () => {
        const cleanString = await app.callStatic.cleanString(`
          bool true //uint256 2 * uint256 5
        `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        expect(cmds).to.eql(['bool', 'true']);
      });

      it('comments located before and below the command', async () => {
        const cleanString = await app.callStatic.cleanString(`
          //123
          bool true
          // uint256 2 * uint256 5
        `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        expect(cmds).to.eql(['bool', 'true']);
      });

      it('a comment contains another single comment', async () => {
        const cleanString = await app.callStatic.cleanString(`
          //bool false//uint256 2 * uint256 5
          bool true
        `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        expect(cmds).to.eql(['bool', 'true']);
      });

      it('a comment contains a multiple comment', async () => {
        const cleanString = await app.callStatic.cleanString(`
          //bool false/*uint256 2 * uint256 5*/bool true
          bool true
        `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        expect(cmds).to.eql(['bool', 'true']);
      });

      it('a comment located before the command', async () => {
        const cleanString = await app.callStatic.cleanString(`
          //bool false
          bool true
        `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        expect(cmds).to.eql(['bool', 'true']);
      });

      it('a comment located below the command', async () => {
        const cleanString = await app.callStatic.cleanString(`
          bool true
          //bool false
        `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        expect(cmds).to.eql(['bool', 'true']);
      });
    });

    describe('Multiple line comments in user-input', async () => {
      it('commented one-line command with spaces', async () => {
        const cleanString = await app.callStatic.cleanString(`
          /* uint256 2 * uint256 5 */
        `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        expect(cmds).to.eql([]);
      });

      it('commented all lines of program with \\n symbols', async () => {
        const cleanString = await app.callStatic.cleanString(`
          /*
          uint256 2 * uint256 5
          bool true
          smt
          */
        `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        expect(cmds).to.eql([]);
      });

      it('a multi comment that located next to the command line', async () => {
        // contains a single comment inside
        const cleanString = await app.callStatic.cleanString(`
          2 * 5
          /*
          //bool true
          smt
          */
        `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        expect(cmds).to.eql(['uint256', '2', 'uint256', '5', '*']);
      });

      it('comments located before and below the command', async () => {
        const cleanString = await app.callStatic.cleanString(`
          2 * 5
          /*
          //123
          smt
          */
          bool true
        `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        expect(cmds).to.eql(['uint256', '2', 'uint256', '5', 'bool', 'true', '*']);
      });

      it('if a comment was not closed', async () => {
        // returns only the first command
        const cleanString = await app.callStatic.cleanString(`
          bool false
          // wow test
          /*
          smt
          bool true
        `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        expect(cmds).to.eql(['bool', 'false']);
      });

      it('different comments located between two lines of commands', async () => {
        const cleanString = await app.callStatic.cleanString(`
          // wow test
          2 * 5
          /*
          //123
          smt
          */
          bool true
          // wow test 2
        `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        expect(cmds).to.eql(['uint256', '2', 'uint256', '5', 'bool', 'true', '*']);
      });

      it('comment contains the command (w/o spaces) ', async () => {
        const cleanString = await app.callStatic.cleanString(`
          /*2 * 5*/
        `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        expect(cmds).to.eql([]);
      });

      it('a comment opens before and closes at the beginning of the command', async () => {
        const cleanString = await app.callStatic.cleanString(`
          /*
          uint256 2 * uint256 5
          */bool true
          `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        expect(cmds).to.eql(['bool', 'true']);
      });

      it('a comment located before the command', async () => {
        const cleanString = await app.callStatic.cleanString(`
          /*
          uint256 2 * uint256 5
          */bool true
          `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        expect(cmds).to.eql(['bool', 'true']);
      });

      it('a comment located below the command', async () => {
        const cleanString = await app.callStatic.cleanString(`
          bool true
          /*
          uint256 2 * uint256 5
          */
          `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        expect(cmds).to.eql(['bool', 'true']);
      });

      it('a comment contains a multiple comment', async () => {
        const cleanString = await app.callStatic.cleanString(`
          bool true
          /*
          uint256 /*2 * uint256 5*/
          */
          `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        expect(cmds).to.eql(['bool', 'true', '*/']);
      });

      it('a comment opens next to the command and closes below', async () => {
        const cleanString = await app.callStatic.cleanString(`
          bool true/*uint256 2 * uint256 5
          */
          `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        expect(cmds).to.eql(['bool', 'true']);
      });

      it('mix comments and commands', async () => {
        const cleanString = await app.callStatic.cleanString(`
          /**
           * 123
           */
          bool false
          //
          2 * 5 //
          //
          bool true/* abc test
          */
          11111//commenthere/**/
          /*bool true */ bool false//comment here
          `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        expect(cmds).to.eql([
          'bool',
          'false',
          'uint256',
          '2',
          'uint256',
          '5',
          'bool',
          'true',
          'uint256',
          '11111',
          'bool',
          'false',
          '*',
        ]);
      });
    });
  });

  describe('Using integers without uint256 opCode', () => {
    it('Bool algebra', async () => {
      const cmds = await app.callStatic.transform(ctxAddr, '1 or 245');
      expect(cmds).to.eql(['uint256', '1', 'uint256', '245', 'or']);
    });

    it('revert if the text `opCode` used with uint256', async () => {
      await expect(app.callStatic.transform(ctxAddr, '1 and 2-test')).to.be.revertedWith('SUT5');
    });
  });

  describe('complex opcodes', () => {
    it('should transform correctly if loadRemote is in the code', async () => {
      const cmds = await app.callStatic.transform(
        ctxAddr,
        `
        uint256 4
        loadRemote bytes32 BYTES ${appAddrHex}
        bool true
        loadRemote bytes32 BYTES2 ${appAddrHex} + loadRemote bytes32 BYTES ${appAddrHex}
        `
      );
      expect(cmds).to.eql([
        'uint256',
        '4',
        'loadRemote',
        'bytes32',
        'BYTES',
        appAddrHex,
        'bool',
        'true',
        'loadRemote',
        'bytes32',
        'BYTES2',
        appAddrHex,
        'loadRemote',
        'bytes32',
        'BYTES',
        appAddrHex,
        '+',
      ]);
    });

    it('should transform correctly if transferFrom is in the code', async () => {
      const cmds = await app.callStatic.transform(
        ctxAddr,
        `
        loadRemote bytes32 BYTES ${appAddrHex}
        transferFrom DAI OWNER RECEIVER
        bool true
        `
      );
      expect(cmds).to.eql([
        'loadRemote',
        'bytes32',
        'BYTES',
        appAddrHex,
        'transferFrom',
        'DAI',
        'OWNER',
        'RECEIVER',
        'bool',
        'true',
      ]);
    });

    it('should transform correctly if sendEth is in the code', async () => {
      const cmds = await app.callStatic.transform(
        ctxAddr,
        `
        loadRemote bool BOOL_V ${appAddrHex}
        sendEth RECEIVER 239423894
        10000000
        `
      );
      expect(cmds).to.eql([
        'loadRemote',
        'bool',
        'BOOL_V',
        appAddrHex,
        'sendEth',
        'RECEIVER',
        '239423894',
        'uint256',
        '10000000',
      ]);
    });

    it('should transform correctly if 1 GWEI is in the code', async () => {
      const cmds = await app.callStatic.transform(
        ctxAddr,
        `
        loadRemote bool BOOL_V ${appAddrHex}
        sendEth RECEIVER 239423894
        1 GWEI
        `
      );
      expect(cmds).to.eql([
        'loadRemote',
        'bool',
        'BOOL_V',
        appAddrHex,
        'sendEth',
        'RECEIVER',
        '239423894',
        'uint256',
        '1000000000',
      ]);
    });

    it('should transform correctly if `transfer` is in the code', async () => {
      const cmds = await app.callStatic.transform(
        ctxAddr,
        `
        bool false
        transfer DAI RECEIVER 239423894
        10000000
        uint256 200
        `
      );
      expect(cmds).to.eql([
        'bool',
        'false',
        'transfer',
        'DAI',
        'RECEIVER',
        '239423894',
        'uint256',
        '10000000',
        'uint256',
        '200',
      ]);
    });
  });

  describe('DSL functions', () => {
    it('comand list for a SUM_OF_NUMBERS function (without parameters)', async () => {
      const cmds = await app.callStatic.transform(
        ctxAddr,
        `
        func SUM_OF_NUMBERS endf
        end

        SUM_OF_NUMBERS {
          (6 + 8) setUint256 SUM
        }
        `
      );
      expect(cmds).to.eql([
        'func',
        'SUM_OF_NUMBERS',
        'end',
        'SUM_OF_NUMBERS',
        'uint256',
        '6',
        'uint256',
        '8',
        '+',
        'setUint256',
        'SUM',
        'end',
      ]);
    });

    it('comand list for a SUM_OF_NUMBERS function (with two parameters)', async () => {
      const cmds = await app.callStatic.transform(
        ctxAddr,
        `
        6 8
        func SUM_OF_NUMBERS 2 endf
        end

        SUM_OF_NUMBERS {
          (loadLocal uint256 SUM_OF_NUMBERS_1 + loadLocal uint256 SUM_OF_NUMBERS_2) setUint256 SUM
        }
        `
      );
      expect(cmds).to.eql([
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
      ]);
    });

    it('returns error if amount of parameters is 0 for the function', async () => {
      await expect(
        app.callStatic.transform(
          ctxAddr,
          `
        6 8
        func SUM_OF_NUMBERS 0 endf
        end

        SUM_OF_NUMBERS {
          (loadLocal uint256 SUM_OF_NUMBERS_1 + loadLocal uint256 SUM_OF_NUMBERS_2) setUint256 SUM
        }
        `
        )
      ).to.be.revertedWith('PRP1');
    });

    it('returns error if amount of parameters is less then provided for the function', async () => {
      await expect(
        app.callStatic.transform(
          ctxAddr,
          `
        6
        func SUM_OF_NUMBERS 2 endf
        end

        SUM_OF_NUMBERS {
          (loadLocal uint256 SUM_OF_NUMBERS_1 + loadLocal uint256 SUM_OF_NUMBERS_2) setUint256 SUM
        }
        `
        )
      ).to.be.revertedWith('PRP2');
    });
  });

  describe('Convertations tests', () => {
    it('0 ETH - ok', async () => {
      const cmds = await app.callStatic.transform(ctxAddr, '0 ETH');
      expect(cmds).to.eql(['uint256', '0']);
    });

    it('0 GWEI - ok', async () => {
      const cmds = await app.callStatic.transform(ctxAddr, '0 GWEI');
      expect(cmds).to.eql(['uint256', '0']);
    });

    it('1 ETH > 1 GWEI', async () => {
      const cmds = await app.callStatic.transform(ctxAddr, '1 ETH > 1 GWEI');
      expect(cmds).to.eql(['uint256', '1000000000000000000', 'uint256', '1000000000', '>']);
    });

    it('1 ETH = 1e9 GWEI', async () => {
      const cmds = await app.callStatic.transform(ctxAddr, '1 ETH = 1e9 GWEI');
      expect(cmds).to.eql([
        'uint256',
        '1000000000000000000',
        '=',
        'uint256',
        '1000000000000000000',
      ]);
    });

    it('uint256 1 ETH', async () => {
      const cmds = await app.callStatic.transform(ctxAddr, 'uint256 1 ETH');
      expect(cmds).to.eql(['uint256', '1000000000000000000']);
    });

    it('uint256 1 GWEI', async () => {
      const cmds = await app.callStatic.transform(ctxAddr, 'uint256 1 GWEI');
      expect(cmds).to.eql(['uint256', '1000000000']);
    });

    it('sendEth ETH_RECEIVER 1e5 GWEI', async () => {
      const cmds = await app.callStatic.transform(ctxAddr, 'sendEth ETH_RECEIVER 1e5 GWEI');
      expect(cmds).to.eql(['sendEth', 'ETH_RECEIVER', '100000000000000']);
    });

    it('sendEth ETH_RECEIVER 1e2 ETH', async () => {
      const cmds = await app.callStatic.transform(ctxAddr, 'sendEth ETH_RECEIVER 1e2 ETH');
      expect(cmds).to.eql(['sendEth', 'ETH_RECEIVER', '100000000000000000000']);
    });

    it('just ETH', async () => {
      const cmds = await app.callStatic.transform(ctxAddr, 'ETH');
      expect(cmds).to.eql([]);
    });

    it('just GWEI', async () => {
      const cmds = await app.callStatic.transform(ctxAddr, 'GWEI');
      expect(cmds).to.eql([]);
    });
  });

  describe('Simplified writing number in wei', () => {
    describe('setUint256', () => {
      it('should return a simple number with 18 decimals', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, '(uint256 1e18) setUint256 SUM');
        expect(cmds).to.eql(['uint256', parseUnits('1', 18).toString(), 'setUint256', 'SUM']);
      });

      it('should return a simple number with 18 decimals without uint256 type', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, '(123e18) setUint256 SUM');
        expect(cmds).to.eql(['uint256', parseUnits('123', 18).toString(), 'setUint256', 'SUM']);
      });

      it('should return a simple number with 36 decimals', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, '(uint256 1e36) setUint256 SUM');
        expect(cmds).to.eql([
          'uint256',
          parseUnits('1', 36).toString(), // ex. 1000000000000000000 ETH
          'setUint256',
          'SUM',
        ]);
      });

      it('should return a long number with 18 decimals', async () => {
        const cmds = await app.callStatic.transform(
          ctxAddr,
          '(uint256 1000000000000000e18) setUint256 SUM'
        );
        expect(cmds).to.eql([
          'uint256',
          parseUnits('1000000000000000', 18).toString(),
          'setUint256',
          'SUM',
        ]);
      });

      it('should return a simple number with 10 decimals', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, '(uint256 146e10) setUint256 SUM');
        expect(cmds).to.eql(['uint256', parseUnits('146', 10).toString(), 'setUint256', 'SUM']);
      });

      it('should return a long number with 10 decimals', async () => {
        const cmds = await app.callStatic.transform(
          ctxAddr,
          '(uint256 1000000000000000e10) setUint256 SUM'
        );
        expect(cmds).to.eql(['uint256', parseUnits('1', 25).toString(), 'setUint256', 'SUM']);
      });

      it('should return a simple number without decimals even using simplified method', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, '(uint256 123e0) setUint256 SUM');
        expect(cmds).to.eql(['uint256', parseUnits('123', 0).toString(), 'setUint256', 'SUM']);
      });

      it('should return a long number without decimals even using simplified method', async () => {
        const cmds = await app.callStatic.transform(
          ctxAddr,
          '(uint256 1000000000000000e0) setUint256 SUM'
        );
        expect(cmds).to.eql(['uint256', parseUnits('1', 15).toString(), 'setUint256', 'SUM']);
      });

      it('should revert if tried to put several `e` symbol', async () => {
        await expect(
          app.callStatic.transform(ctxAddr, '(uint256 10000000e00000000e18) setUint256 SUM')
        ).to.be.revertedWith('SUT5');
      });

      it('should revert if tried to put not `e` symbol', async () => {
        await expect(
          app.callStatic.transform(ctxAddr, '(uint256 10000000a18) setUint256 SUM')
        ).to.be.revertedWith('SUT5');
      });

      it('should revert if tried to put Upper `E` symbol', async () => {
        await expect(
          app.callStatic.transform(ctxAddr, '(uint256 10000000E18) setUint256 SUM')
        ).to.be.revertedWith('SUT5');
      });

      it('should revert if tried to put `0x65` symbol', async () => {
        await expect(
          app.callStatic.transform(ctxAddr, '(uint256 100000000x6518) setUint256 SUM')
        ).to.be.revertedWith('SUT5');
      });

      it('should not revert in preprocessor if the number starts with symbol', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, '(uint256 e18) setUint256 SUM');
        expect(cmds).to.eql(['uint256', 'e18', 'setUint256', 'SUM']);
      });

      it('should revert if decimals does not exist', async () => {
        await expect(
          app.callStatic.transform(ctxAddr, '(uint256 45e) setUint256 SUM')
        ).to.be.revertedWith('SUT6');
      });

      it('should revert if two `e` were provided', async () => {
        await expect(
          app.callStatic.transform(ctxAddr, '(uint256 45ee6) setUint256 SUM')
        ).to.be.revertedWith('SUT5');
      });
    });

    describe('sendEth', () => {
      it('should transform correctly if sendEth is in the code', async () => {
        const cmds = await app.callStatic.transform(
          ctxAddr,
          `
          loadRemote bool BOOL_V ${appAddrHex}
          sendEth RECEIVER 2e2
          10000000
          `
        );
        expect(cmds).to.eql([
          'loadRemote',
          'bool',
          'BOOL_V',
          appAddrHex,
          'sendEth',
          'RECEIVER',
          '200',
          'uint256',
          '10000000',
        ]);
      });

      it('simple number with 18 decimals', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, 'sendEth RECEIVER 2e18');
        expect(cmds).to.eql(['sendEth', 'RECEIVER', parseUnits('2', 18).toString()]);
      });

      it('a simple number with 36 decimals', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, 'sendEth RECEIVER 20e36');
        expect(cmds).to.eql(['sendEth', 'RECEIVER', parseUnits('20', 36).toString()]);
      });

      it('a long number with 18 decimals', async () => {
        const cmds = await app.callStatic.transform(
          ctxAddr,
          'sendEth RECEIVER 1000000000000000e18'
        );
        expect(cmds).to.eql(['sendEth', 'RECEIVER', parseUnits('1000000000000000', 18).toString()]);
      });

      it('a simple number with 10 decimals', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, 'sendEth RECEIVER 146e10');
        expect(cmds).to.eql(['sendEth', 'RECEIVER', parseUnits('146', 10).toString()]);
      });

      it('a long number with 10 decimals', async () => {
        const cmds = await app.callStatic.transform(
          ctxAddr,
          'sendEth RECEIVER 1000000000000000e10'
        );
        expect(cmds).to.eql(['sendEth', 'RECEIVER', parseUnits('1', 25).toString()]);
      });

      it('a simple number without decimals even using simplified method', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, 'sendEth RECEIVER 123e0');
        expect(cmds).to.eql(['sendEth', 'RECEIVER', parseUnits('123', 0).toString()]);
      });

      it('a long number without decimals even using simplified method', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, 'sendEth RECEIVER 1000000000000000e0');
        expect(cmds).to.eql(['sendEth', 'RECEIVER', parseUnits('1', 15).toString()]);
      });

      it('should revert if tried to put several `e` symbol', async () => {
        await expect(
          app.callStatic.transform(ctxAddr, 'sendEth RECEIVER 10000000e00000000e18')
        ).to.be.revertedWith('SUT5');
      });

      it('should revert if tried to put not `e` symbol', async () => {
        await expect(
          app.callStatic.transform(ctxAddr, 'sendEth RECEIVER 10000000a18')
        ).to.be.revertedWith('SUT5');
      });

      it('should revert if tried to put Upper `E` symbol', async () => {
        await expect(
          app.callStatic.transform(ctxAddr, 'sendEth RECEIVER 10000000E18')
        ).to.be.revertedWith('SUT5');
      });

      it('should revert if tried to put `0x65` symbol', async () => {
        await expect(
          app.callStatic.transform(ctxAddr, 'sendEth RECEIVER 100000000x6518')
        ).to.be.revertedWith('SUT5');
      });

      it('should not revert in preprocessor if first symbol is not a number', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, 'sendEth RECEIVER e18');
        expect(cmds).to.eql(['sendEth', 'RECEIVER', 'e18']);
      });

      it('should revert if decimals does not exist', async () => {
        await expect(app.callStatic.transform(ctxAddr, 'sendEth RECEIVER 45e')).to.be.revertedWith(
          'SUT6'
        );
      });

      it('should revert if two `e` were provided', async () => {
        await expect(
          app.callStatic.transform(ctxAddr, 'sendEth RECEIVER 45ee6')
        ).to.be.revertedWith('SUT5');
      });
    });

    describe('transferFrom', () => {
      it('should return a simple number with 18 decimals', async () => {
        const cmds = await app.callStatic.transform(
          ctxAddr,
          'transferFrom DAI OWNER RECEIVER 1 ETH'
        );
        expect(cmds).to.eql([
          'transferFrom',
          'DAI',
          'OWNER',
          'RECEIVER',
          parseUnits('1', 18).toString(),
        ]);
      });

      it('should return a simple number with 9 decimals', async () => {
        const cmds = await app.callStatic.transform(
          ctxAddr,
          'transferFrom DAI OWNER RECEIVER 1 GWEI'
        );
        expect(cmds).to.eql([
          'transferFrom',
          'DAI',
          'OWNER',
          'RECEIVER',
          parseUnits('1', 9).toString(),
        ]);
      });

      it('should return a simple number with 20 decimals', async () => {
        const cmds = await app.callStatic.transform(
          ctxAddr,
          'transferFrom DAI OWNER RECEIVER 1e2 ETH'
        );
        expect(cmds).to.eql([
          'transferFrom',
          'DAI',
          'OWNER',
          'RECEIVER',
          parseUnits('1', 20).toString(),
        ]);
      });

      it('should return a simple number with 11 decimals', async () => {
        const cmds = await app.callStatic.transform(
          ctxAddr,
          'transferFrom DAI OWNER RECEIVER 1e2 GWEI'
        );
        expect(cmds).to.eql([
          'transferFrom',
          'DAI',
          'OWNER',
          'RECEIVER',
          parseUnits('1', 11).toString(),
        ]);
      });

      it('should return a simple number with 18 decimals', async () => {
        const cmds = await app.callStatic.transform(
          ctxAddr,
          'transferFrom DAI OWNER RECEIVER 1e18'
        );
        expect(cmds).to.eql([
          'transferFrom',
          'DAI',
          'OWNER',
          'RECEIVER',
          parseUnits('1', 18).toString(),
        ]);
      });

      it('should return a simple number with 36 decimals', async () => {
        const cmds = await app.callStatic.transform(
          ctxAddr,
          'transferFrom DAI OWNER RECEIVER 1e36'
        );
        expect(cmds).to.eql([
          'transferFrom',
          'DAI',
          'OWNER',
          'RECEIVER',
          parseUnits('1', 36).toString(),
        ]);
      });

      it('should return a long number with 18 decimals', async () => {
        const cmds = await app.callStatic.transform(
          ctxAddr,
          'transferFrom DAI OWNER RECEIVER 1000000000000000e18'
        );
        expect(cmds).to.eql([
          'transferFrom',
          'DAI',
          'OWNER',
          'RECEIVER',
          parseUnits('1000000000000000', 18).toString(),
        ]);
      });

      it('should return a simple number with 10 decimals', async () => {
        const cmds = await app.callStatic.transform(
          ctxAddr,
          'transferFrom DAI OWNER RECEIVER 146e10'
        );
        expect(cmds).to.eql([
          'transferFrom',
          'DAI',
          'OWNER',
          'RECEIVER',
          parseUnits('146', 10).toString(),
        ]);
      });

      it('should return a long number with 10 decimals', async () => {
        const cmds = await app.callStatic.transform(
          ctxAddr,
          'transferFrom DAI OWNER RECEIVER 1000000000000000e10'
        );
        expect(cmds).to.eql([
          'transferFrom',
          'DAI',
          'OWNER',
          'RECEIVER',
          parseUnits('1', 25).toString(),
        ]);
      });

      it('should return a simple number without decimals even using simplified method', async () => {
        const cmds = await app.callStatic.transform(
          ctxAddr,
          'transferFrom DAI OWNER RECEIVER 123e0'
        );
        expect(cmds).to.eql([
          'transferFrom',
          'DAI',
          'OWNER',
          'RECEIVER',
          parseUnits('123', 0).toString(),
        ]);
      });

      it('should return a long number without decimals even using simplified method', async () => {
        const cmds = await app.callStatic.transform(
          ctxAddr,
          'transferFrom DAI OWNER RECEIVER 1000000000000000e0'
        );
        expect(cmds).to.eql([
          'transferFrom',
          'DAI',
          'OWNER',
          'RECEIVER',
          parseUnits('1', 15).toString(),
        ]);
      });

      it('should not revert in preprocessor if first symbol is not a number', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, 'transferFrom DAI OWNER RECEIVER e18');
        expect(cmds).to.eql(['transferFrom', 'DAI', 'OWNER', 'RECEIVER', 'e18']);
      });

      it('should revert if tried to put several `e` symbol', async () => {
        await expect(
          app.callStatic.transform(ctxAddr, 'transferFrom DAI OWNER RECEIVER 10000000e00000000e18')
        ).to.be.revertedWith('SUT5');
      });

      it('should revert if tried to put not `e` symbol', async () => {
        await expect(
          app.callStatic.transform(ctxAddr, 'transferFrom DAI OWNER RECEIVER 10000000a18')
        ).to.be.revertedWith('SUT5');
      });

      it('should revert if tried to put Upper `E` symbol', async () => {
        await expect(
          app.callStatic.transform(ctxAddr, 'transferFrom DAI OWNER RECEIVER 10000000E18')
        ).to.be.revertedWith('SUT5');
      });

      it('should revert if tried to put `0x65` symbol', async () => {
        await expect(
          app.callStatic.transform(ctxAddr, 'transferFrom DAI OWNER RECEIVER 100000000x6518')
        ).to.be.revertedWith('SUT5');
      });

      it('should revert if decimals does not exist', async () => {
        await expect(
          app.callStatic.transform(ctxAddr, 'transferFrom DAI OWNER RECEIVER 45e')
        ).to.be.revertedWith('SUT6');
      });

      it('should revert if two `e` were provided', async () => {
        await expect(
          app.callStatic.transform(ctxAddr, 'transferFrom DAI OWNER RECEIVER 45ee6')
        ).to.be.revertedWith('SUT5');
      });
    });

    describe('transfer', () => {
      it('should return a simple number with 18 decimals', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, 'transfer DAI RECEIVER 1 ETH');
        expect(cmds).to.eql(['transfer', 'DAI', 'RECEIVER', parseUnits('1', 18).toString()]);
      });

      it('should return a simple number with 18 decimals', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, 'transfer DAI RECEIVER 0 ETH');
        expect(cmds).to.eql(['transfer', 'DAI', 'RECEIVER', parseUnits('0', 18).toString()]);
      });

      it('should return a simple number with 9 decimals', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, 'transfer DAI RECEIVER 1 GWEI');
        expect(cmds).to.eql(['transfer', 'DAI', 'RECEIVER', parseUnits('1', 9).toString()]);
      });

      it('should return a simple number with 20 decimals', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, 'transfer DAI RECEIVER 1e2 ETH');
        expect(cmds).to.eql(['transfer', 'DAI', 'RECEIVER', parseUnits('1', 20).toString()]);
      });

      it('should return a simple number with 11 decimals', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, 'transfer DAI RECEIVER 1e2 GWEI');
        expect(cmds).to.eql(['transfer', 'DAI', 'RECEIVER', parseUnits('1', 11).toString()]);
      });

      it('should return a simple number with 18 decimals', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, 'transfer DAI RECEIVER 1e18');
        expect(cmds).to.eql(['transfer', 'DAI', 'RECEIVER', parseUnits('1', 18).toString()]);
      });

      it('should return a simple number with 36 decimals', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, 'transfer DAI RECEIVER 1e36');
        expect(cmds).to.eql(['transfer', 'DAI', 'RECEIVER', parseUnits('1', 36).toString()]);
      });

      it('should return a long number with 18 decimals', async () => {
        const cmds = await app.callStatic.transform(
          ctxAddr,
          'transfer DAI RECEIVER 1000000000000000e18'
        );
        expect(cmds).to.eql([
          'transfer',
          'DAI',
          'RECEIVER',
          parseUnits('1000000000000000', 18).toString(),
        ]);
      });

      it('should return a simple number with 10 decimals', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, 'transfer DAI RECEIVER 146e10');
        expect(cmds).to.eql(['transfer', 'DAI', 'RECEIVER', parseUnits('146', 10).toString()]);
      });

      it('should return a long number with 10 decimals', async () => {
        const cmds = await app.callStatic.transform(
          ctxAddr,
          'transfer DAI RECEIVER 1000000000000000e10'
        );
        expect(cmds).to.eql(['transfer', 'DAI', 'RECEIVER', parseUnits('1', 25).toString()]);
      });

      it('should return a simple number without decimals even using simplified method', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, 'transfer DAI RECEIVER 123e0');
        expect(cmds).to.eql(['transfer', 'DAI', 'RECEIVER', parseUnits('123', 0).toString()]);
      });

      it('should return a long number without decimals even using simplified method', async () => {
        const cmds = await app.callStatic.transform(
          ctxAddr,
          'transfer DAI RECEIVER 1000000000000000e0'
        );
        expect(cmds).to.eql(['transfer', 'DAI', 'RECEIVER', parseUnits('1', 15).toString()]);
      });

      it('should not revert in preprocessor if first symbol is not a number', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, 'transfer DAI RECEIVER e18');
        expect(cmds).to.eql(['transfer', 'DAI', 'RECEIVER', 'e18']);
      });

      it('should revert if tried to put several `e` symbol', async () => {
        await expect(
          app.callStatic.transform(ctxAddr, 'transfer DAI RECEIVER 10000000e00000000e18')
        ).to.be.revertedWith('SUT5');
      });

      it('should revert if tried to put not `e` symbol', async () => {
        await expect(
          app.callStatic.transform(ctxAddr, 'transfer DAI RECEIVER 10000000a18')
        ).to.be.revertedWith('SUT5');
      });

      it('should revert if tried to put Upper `E` symbol', async () => {
        await expect(
          app.callStatic.transform(ctxAddr, 'transfer DAI RECEIVER 10000000E18')
        ).to.be.revertedWith('SUT5');
      });

      it('should revert if tried to put `0x65` symbol', async () => {
        await expect(
          app.callStatic.transform(ctxAddr, 'transfer DAI RECEIVER 100000000x6518')
        ).to.be.revertedWith('SUT5');
      });

      it('should revert if decimals does not exist', async () => {
        await expect(
          app.callStatic.transform(ctxAddr, 'transfer DAI RECEIVER 45e')
        ).to.be.revertedWith('SUT6');
      });

      it('should revert if two `e` were provided', async () => {
        await expect(
          app.callStatic.transform(ctxAddr, 'transfer DAI RECEIVER 45ee6')
        ).to.be.revertedWith('SUT5');
      });
    });
  });
});
