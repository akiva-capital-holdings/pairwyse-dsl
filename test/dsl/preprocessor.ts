import { expect } from 'chai';
import { ethers } from 'hardhat';
import { parseUnits } from 'ethers/lib/utils';

import { Preprocessor } from '../../typechain-types';
import { checkStringStack, split } from '../utils/utils';

describe('Preprocessor', () => {
  let app: Preprocessor;
  let ctxAddr: string;
  let appAddrHex: string;

  before(async () => {
    // Deploy required libraries
    const stringLib = await (await ethers.getContractFactory('StringUtils')).deploy();
    const strStackLib = await (await ethers.getContractFactory('StringStack')).deploy();

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
        libraries: { StringUtils: stringLib.address, StringStack: strStackLib.address },
      })
    ).deploy();
    // appAddrHex = app.address.slice(2);
    appAddrHex = app.address;
  });

  // works, ok
  describe('infix to postfix', () => {
    it('simple math', async () => {
      const code = split('uint256 1 + uint256 2');
      const cmds = await app.callStatic.infixToPostfix(ctxAddr, code);
      checkStringStack(cmds, ['uint256', '1', 'uint256', '2', '+']);
    });

    it('simple', async () => {
      const code = split('var SENDER == msgSender');
      const cmds = await app.callStatic.infixToPostfix(ctxAddr, code);
      checkStringStack(cmds, ['var', 'SENDER', 'msgSender', '==']);
    });

    it('complex', async () => {
      const code = split(`
        (time > var INIT)
          and
        (time < var EXPIRY)
          or
        (var RISK != bool true)
      `);
      const cmds = await app.callStatic.infixToPostfix(ctxAddr, code);
      checkStringStack(cmds, [
        'time',
        'var',
        'INIT',
        '>', // A
        'time',
        'var',
        'EXPIRY',
        '<', // B
        'and',
        'var',
        'RISK',
        'bool',
        'true',
        '!=', // C
        'or',
      ]);
    });

    it('parenthesis #1', async () => {
      const code = split('uint256 1 or (uint256 5 or uint256 7)');
      const cmds = await app.callStatic.infixToPostfix(ctxAddr, code);
      checkStringStack(cmds, ['uint256', '1', 'uint256', '5', 'uint256', '7', 'or', 'or']);
    });

    it('parenthesis #2', async () => {
      const code = split('((uint256 1 or (uint256 5 or uint256 7)) and uint256 0)');
      const cmds = await app.callStatic.infixToPostfix(ctxAddr, code);
      checkStringStack(cmds, [
        'uint256',
        '1',
        'uint256',
        '5',
        'uint256',
        '7',
        'or',
        'or',
        'uint256',
        '0',
        'and',
      ]);
    });
  });

  // works, ok
  describe('split', () => {
    it('simple case', async () => {
      const input = 'var SENDER == msgSender';
      const res = await app.callStatic.split(input, '\n ,:(){}', '(){}');
      checkStringStack(res, split(input));
    });

    it('extra spaces', async () => {
      const input = 'var      SENDER ==   msgSender';
      const res = await app.callStatic.split(input, '\n ,:(){}', '(){}');
      checkStringStack(res, split(input));
    });

    it('parenthesis', async () => {
      const res = await app.callStatic.split('(((1 or 5) or 7) and 0)', '\n ,:(){}', '(){}');
      checkStringStack(res, split('(((1 or 5) or 7) and 0)'));
    });

    it('new line symbol', async () => {
      const res = await app.callStatic.split(
        `
          var SENDER
            ==
          msgSender
        `,
        '\n ,:(){}',
        '(){}'
      );
      checkStringStack(
        res,
        split(`
          var SENDER
            ==
          msgSender
        `)
      );
    });

    it('all together', async () => {
      const res = await app.callStatic.split(
        `
        (
          (
            blockTimestamp > var INIT
          )
            and
          (
            blockTimestamp < var EXPIRY
              or
            (
              var RISK != bool true
            )
          )
        )
        `,
        '\n ,:(){}',
        '(){}'
      );
      checkStringStack(
        res,
        split(`
        (
          (
            blockTimestamp > var INIT
          )
            and
          (
            blockTimestamp < var EXPIRY
              or
            (
              var RISK != bool true
            )
          )
        )
        `)
      );
    });

    it('complex case', async () => {
      const res = await app.callStatic.split(
        `
        ((blockTimestamp > var INIT) and
          (blockTimestamp < var EXPIRY or
            (var RISK != bool true)
          )
        )

        for DEPOSIT in DEPOSITS {
          (var TOTAL_DEPOSIT * var DEPOSIT) setUint256 TOTAL_DEPOSIT
        }
      `,
        '\n ,:(){}',
        '(){}'
      );

      await app.split(
        `
        ((blockTimestamp > var INIT) and
          (blockTimestamp < var EXPIRY or
            (var RISK != bool true)
          )
        )

        for DEPOSIT in DEPOSITS {
          (var TOTAL_DEPOSIT * var DEPOSIT) setUint256 TOTAL_DEPOSIT
        }
      `,
        '\n ,:(){}',
        '(){}'
      );

      checkStringStack(res, [
        '(',
        '(',
        'blockTimestamp',
        '>',
        'var',
        'INIT',
        ')',
        'and',
        '(',
        'blockTimestamp',
        '<',
        'var',
        'EXPIRY',
        'or',
        '(',
        'var',
        'RISK',
        '!=',
        'bool',
        'true',
        ')',
        ')',
        ')',
        'for',
        'DEPOSIT',
        'in',
        'DEPOSITS',
        '{',
        '(',
        'var',
        'TOTAL_DEPOSIT',
        '*',
        'var',
        'DEPOSIT',
        ')',
        'setUint256',
        'TOTAL_DEPOSIT',
        '}',
      ]);
    });
  });

  // works, ok
  describe('Execute high-level DSL', () => {
    it('parenthesis', async () => {
      const cmds = await app.callStatic.transform(ctxAddr, '(((1 or 5) or 7) and 1)');
      checkStringStack(cmds, [
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
        checkStringStack(cmds, [
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
        checkStringStack(cmds, [
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
        checkStringStack(cmds, [
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
        (((var TIMESTAMP > var INIT)
          and
        (var TIMESTAMP < var EXPIRY))
          or
        var RISK != bool true)`;

      const cmds = await app.callStatic.transform(ctxAddr, program);
      const expected = [
        'var',
        'TIMESTAMP',
        'var',
        'INIT',
        '>',
        'var',
        'TIMESTAMP',
        'var',
        'EXPIRY',
        '<',
        'and',
        'var',
        'RISK',
        'or',
        'bool',
        'true',
        '!=',
      ];
      checkStringStack(cmds, expected);
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
      checkStringStack(cmds, [
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
      checkStringStack(cmds, [
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

  // works, ok
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
        checkStringStack(cmds, []);
      });

      it('a comment located next to the command line', async () => {
        const cleanString = await app.callStatic.cleanString(`
          // uint256 2 * uint256 5
          bool true
        `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        checkStringStack(cmds, ['bool', 'true']);
      });

      it('a comment located between two lines of commands', async () => {
        const cleanString = await app.callStatic.cleanString(`
          bool false
          // uint256 2 * uint256 5
          bool true
        `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        checkStringStack(cmds, ['bool', 'false', 'bool', 'true']);
      });

      it('a comment located next to the command (w/o spaces) ', async () => {
        const cleanString = await app.callStatic.cleanString(`
          bool true//uint256 2 * uint256 5
        `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        checkStringStack(cmds, ['bool', 'true']);
      });

      it('a comment located just after the command (with end line) ', async () => {
        const cleanString = await app.callStatic.cleanString(`
          bool true//smth
          bool false
        `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        checkStringStack(cmds, ['bool', 'true', 'bool', 'false']);
      });

      it('a comment located next to the command (with space)', async () => {
        const cleanString = await app.callStatic.cleanString(`
          bool true// uint256 2 * uint256 5
        `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        checkStringStack(cmds, ['bool', 'true']);
      });

      it('a comment located just before the command (with space)', async () => {
        const cleanString = await app.callStatic.cleanString(`
          bool true //uint256 2 * uint256 5
        `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        checkStringStack(cmds, ['bool', 'true']);
      });

      it('comments located before and below the command', async () => {
        const cleanString = await app.callStatic.cleanString(`
          //123
          bool true
          // uint256 2 * uint256 5
        `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        checkStringStack(cmds, ['bool', 'true']);
      });

      it('a comment contains another single comment', async () => {
        const cleanString = await app.callStatic.cleanString(`
          //bool false//uint256 2 * uint256 5
          bool true
        `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        checkStringStack(cmds, ['bool', 'true']);
      });

      it('a comment contains a multiple comment', async () => {
        const cleanString = await app.callStatic.cleanString(`
          //bool false/*uint256 2 * uint256 5*/bool true
          bool true
        `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        checkStringStack(cmds, ['bool', 'true']);
      });

      it('a comment located before the command', async () => {
        const cleanString = await app.callStatic.cleanString(`
          //bool false
          bool true
        `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        checkStringStack(cmds, ['bool', 'true']);
      });

      it('a comment located below the command', async () => {
        const cleanString = await app.callStatic.cleanString(`
          bool true
          //bool false
        `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        checkStringStack(cmds, ['bool', 'true']);
      });
    });

    describe('Multiple line comments in user-input', async () => {
      it('commented one-line command with spaces', async () => {
        const cleanString = await app.callStatic.cleanString(`
          /* uint256 2 * uint256 5 */
        `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        checkStringStack(cmds, []);
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
        checkStringStack(cmds, []);
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
        checkStringStack(cmds, ['uint256', '2', 'uint256', '5', '*']);
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
        checkStringStack(cmds, ['uint256', '2', 'uint256', '5', 'bool', 'true', '*']);
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
        checkStringStack(cmds, ['bool', 'false']);
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
        checkStringStack(cmds, ['uint256', '2', 'uint256', '5', 'bool', 'true', '*']);
      });

      it('comment contains the command (w/o spaces) ', async () => {
        const cleanString = await app.callStatic.cleanString(`
          /*2 * 5*/
        `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        checkStringStack(cmds, []);
      });

      it('a comment opens before and closes at the beginning of the command', async () => {
        const cleanString = await app.callStatic.cleanString(`
          /*
          uint256 2 * uint256 5
          */bool true
          `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        checkStringStack(cmds, ['bool', 'true']);
      });

      it('a comment located before the command', async () => {
        const cleanString = await app.callStatic.cleanString(`
          /*
          uint256 2 * uint256 5
          */bool true
          `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        checkStringStack(cmds, ['bool', 'true']);
      });

      it('a comment located below the command', async () => {
        const cleanString = await app.callStatic.cleanString(`
          bool true
          /*
          uint256 2 * uint256 5
          */
          `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        checkStringStack(cmds, ['bool', 'true']);
      });

      it('a comment contains a multiple comment', async () => {
        const cleanString = await app.callStatic.cleanString(`
          bool true
          /*
          uint256 /*2 * uint256 5*/
          */
          `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        checkStringStack(cmds, ['bool', 'true', '*/']);
      });

      it('a comment opens next to the command and closes below', async () => {
        const cleanString = await app.callStatic.cleanString(`
          bool true/*uint256 2 * uint256 5
          */
          `);
        const cmds = await app.callStatic.transform(ctxAddr, cleanString);
        checkStringStack(cmds, ['bool', 'true']);
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
        checkStringStack(cmds, [
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

  // works, ok
  describe('Using integers without uint256 opCode', () => {
    it('Bool algebra', async () => {
      const cmds = await app.callStatic.transform(ctxAddr, '1 or 245');
      checkStringStack(cmds, ['uint256', '1', 'uint256', '245', 'or']);
    });

    // doesn't work
    // TODO: check this test with @shadowsupercoder
    it.skip('revert if the text `opCode` used with uint256', async () => {
      await expect(app.callStatic.transform(ctxAddr, '1 and 2-test')).to.be.revertedWith('SUT5');
    });
  });

  // works, ok
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
      checkStringStack(cmds, [
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
      checkStringStack(cmds, [
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
      checkStringStack(cmds, [
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
      checkStringStack(cmds, [
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
      checkStringStack(cmds, [
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

  // doesn't work
  describe.skip('DSL functions', () => {
    it.skip('comand list for a SUM_OF_NUMBERS function (without parameters)', async () => {
      const cmds = await app.callStatic.transform(
        ctxAddr,
        `
        SUM_OF_NUMBERS()

        func SUM_OF_NUMBERS {
          (6 + 8) setUint256 SUM
        }
        `
      );
      checkStringStack(cmds, [
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
          (var SUM_OF_NUMBERS_1 + var SUM_OF_NUMBERS_2) setUint256 SUM
        }
        `
      );
      checkStringStack(cmds, [
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
          (var SUM_OF_NUMBERS_1 + var SUM_OF_NUMBERS_2) setUint256 SUM
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
          (var SUM_OF_NUMBERS_1 + var SUM_OF_NUMBERS_2) setUint256 SUM
        }
        `
        )
      ).to.be.revertedWith('PRP2');
    });
  });

  // works, ok
  describe('Convertations tests', () => {
    it('0 ETH - ok', async () => {
      const cmds = await app.callStatic.transform(ctxAddr, '0 ETH');
      checkStringStack(cmds, ['uint256', '0']);
    });

    it('0 GWEI - ok', async () => {
      const cmds = await app.callStatic.transform(ctxAddr, '0 GWEI');
      checkStringStack(cmds, ['uint256', '0']);
    });

    it('1 ETH > 1 GWEI', async () => {
      const cmds = await app.callStatic.transform(ctxAddr, '1 ETH > 1 GWEI');
      checkStringStack(cmds, ['uint256', '1000000000000000000', 'uint256', '1000000000', '>']);
    });

    it('1 ETH = 1e9 GWEI', async () => {
      const cmds = await app.callStatic.transform(ctxAddr, '1 ETH = 1e9 GWEI');
      checkStringStack(cmds, [
        'uint256',
        '1000000000000000000',
        '=',
        'uint256',
        '1000000000000000000',
      ]);
    });

    it('uint256 1 ETH', async () => {
      const cmds = await app.callStatic.transform(ctxAddr, 'uint256 1 ETH');
      checkStringStack(cmds, ['uint256', '1000000000000000000']);
    });

    it('uint256 1 GWEI', async () => {
      const cmds = await app.callStatic.transform(ctxAddr, 'uint256 1 GWEI');
      checkStringStack(cmds, ['uint256', '1000000000']);
    });

    it('sendEth ETH_RECEIVER 1e5 GWEI', async () => {
      const cmds = await app.callStatic.transform(ctxAddr, 'sendEth ETH_RECEIVER 1e5 GWEI');
      checkStringStack(cmds, ['sendEth', 'ETH_RECEIVER', '100000000000000']);
    });

    it('sendEth ETH_RECEIVER 1e2 ETH', async () => {
      const cmds = await app.callStatic.transform(ctxAddr, 'sendEth ETH_RECEIVER 1e2 ETH');
      checkStringStack(cmds, ['sendEth', 'ETH_RECEIVER', '100000000000000000000']);
    });

    it('just ETH', async () => {
      const cmds = await app.callStatic.transform(ctxAddr, 'ETH');
      checkStringStack(cmds, ['uint256', '0']);
    });

    it('just GWEI', async () => {
      const cmds = await app.callStatic.transform(ctxAddr, 'GWEI');
      checkStringStack(cmds, ['uint256', '0']);
    });
  });

  // works, ok
  describe('Simplified writing number in wei', () => {
    describe('setUint256', () => {
      it('should return a simple number with 18 decimals', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, '(uint256 1e18) setUint256 SUM');
        checkStringStack(cmds, ['uint256', parseUnits('1', 18).toString(), 'setUint256', 'SUM']);
      });

      it('should return a simple number with 18 decimals without uint256 type', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, '(123e18) setUint256 SUM');
        checkStringStack(cmds, ['uint256', parseUnits('123', 18).toString(), 'setUint256', 'SUM']);
      });

      it('should return a simple number with 36 decimals', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, '(uint256 1e36) setUint256 SUM');
        checkStringStack(cmds, [
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
        checkStringStack(cmds, [
          'uint256',
          parseUnits('1000000000000000', 18).toString(),
          'setUint256',
          'SUM',
        ]);
      });

      it('should return a simple number with 10 decimals', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, '(uint256 146e10) setUint256 SUM');
        checkStringStack(cmds, ['uint256', parseUnits('146', 10).toString(), 'setUint256', 'SUM']);
      });

      it('should return a long number with 10 decimals', async () => {
        const cmds = await app.callStatic.transform(
          ctxAddr,
          '(uint256 1000000000000000e10) setUint256 SUM'
        );
        checkStringStack(cmds, ['uint256', parseUnits('1', 25).toString(), 'setUint256', 'SUM']);
      });

      it('should return a simple number without decimals even with simplified method', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, '(uint256 123e0) setUint256 SUM');
        checkStringStack(cmds, ['uint256', parseUnits('123', 0).toString(), 'setUint256', 'SUM']);
      });

      it('should return a long number without decimals even with simplified method', async () => {
        const cmds = await app.callStatic.transform(
          ctxAddr,
          '(uint256 1000000000000000e0) setUint256 SUM'
        );
        checkStringStack(cmds, ['uint256', parseUnits('1', 15).toString(), 'setUint256', 'SUM']);
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
        checkStringStack(cmds, ['uint256', 'e18', 'setUint256', 'SUM']);
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
        checkStringStack(cmds, [
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
        checkStringStack(cmds, ['sendEth', 'RECEIVER', parseUnits('2', 18).toString()]);
      });

      it('a simple number with 36 decimals', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, 'sendEth RECEIVER 20e36');
        checkStringStack(cmds, ['sendEth', 'RECEIVER', parseUnits('20', 36).toString()]);
      });

      it('a long number with 18 decimals', async () => {
        const cmds = await app.callStatic.transform(
          ctxAddr,
          'sendEth RECEIVER 1000000000000000e18'
        );
        checkStringStack(cmds, [
          'sendEth',
          'RECEIVER',
          parseUnits('1000000000000000', 18).toString(),
        ]);
      });

      it('a simple number with 10 decimals', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, 'sendEth RECEIVER 146e10');
        checkStringStack(cmds, ['sendEth', 'RECEIVER', parseUnits('146', 10).toString()]);
      });

      it('a long number with 10 decimals', async () => {
        const cmds = await app.callStatic.transform(
          ctxAddr,
          'sendEth RECEIVER 1000000000000000e10'
        );
        checkStringStack(cmds, ['sendEth', 'RECEIVER', parseUnits('1', 25).toString()]);
      });

      it('a simple number without decimals even using simplified method', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, 'sendEth RECEIVER 123e0');
        checkStringStack(cmds, ['sendEth', 'RECEIVER', parseUnits('123', 0).toString()]);
      });

      it('a long number without decimals even using simplified method', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, 'sendEth RECEIVER 1000000000000000e0');
        checkStringStack(cmds, ['sendEth', 'RECEIVER', parseUnits('1', 15).toString()]);
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
        checkStringStack(cmds, ['sendEth', 'RECEIVER', 'e18']);
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
        checkStringStack(cmds, [
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
        checkStringStack(cmds, [
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
        checkStringStack(cmds, [
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
        checkStringStack(cmds, [
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
        checkStringStack(cmds, [
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
        checkStringStack(cmds, [
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
        checkStringStack(cmds, [
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
        checkStringStack(cmds, [
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
        checkStringStack(cmds, [
          'transferFrom',
          'DAI',
          'OWNER',
          'RECEIVER',
          parseUnits('1', 25).toString(),
        ]);
      });

      it('should return a simple number without decimals even with simplified method', async () => {
        const cmds = await app.callStatic.transform(
          ctxAddr,
          'transferFrom DAI OWNER RECEIVER 123e0'
        );
        checkStringStack(cmds, [
          'transferFrom',
          'DAI',
          'OWNER',
          'RECEIVER',
          parseUnits('123', 0).toString(),
        ]);
      });

      it('should return a long number without decimals even with simplified method', async () => {
        const cmds = await app.callStatic.transform(
          ctxAddr,
          'transferFrom DAI OWNER RECEIVER 1000000000000000e0'
        );
        checkStringStack(cmds, [
          'transferFrom',
          'DAI',
          'OWNER',
          'RECEIVER',
          parseUnits('1', 15).toString(),
        ]);
      });

      it('should not revert in preprocessor if first symbol is not a number', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, 'transferFrom DAI OWNER RECEIVER e18');
        checkStringStack(cmds, ['transferFrom', 'DAI', 'OWNER', 'RECEIVER', 'e18']);
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
        checkStringStack(cmds, ['transfer', 'DAI', 'RECEIVER', parseUnits('1', 18).toString()]);
      });

      it('should return a simple number with 18 decimals', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, 'transfer DAI RECEIVER 0 ETH');
        checkStringStack(cmds, ['transfer', 'DAI', 'RECEIVER', parseUnits('0', 18).toString()]);
      });

      it('should return a simple number with 9 decimals', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, 'transfer DAI RECEIVER 1 GWEI');
        checkStringStack(cmds, ['transfer', 'DAI', 'RECEIVER', parseUnits('1', 9).toString()]);
      });

      it('should return a simple number with 20 decimals', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, 'transfer DAI RECEIVER 1e2 ETH');
        checkStringStack(cmds, ['transfer', 'DAI', 'RECEIVER', parseUnits('1', 20).toString()]);
      });

      it('should return a simple number with 11 decimals', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, 'transfer DAI RECEIVER 1e2 GWEI');
        checkStringStack(cmds, ['transfer', 'DAI', 'RECEIVER', parseUnits('1', 11).toString()]);
      });

      it('should return a simple number with 18 decimals', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, 'transfer DAI RECEIVER 1e18');
        checkStringStack(cmds, ['transfer', 'DAI', 'RECEIVER', parseUnits('1', 18).toString()]);
      });

      it('should return a simple number with 36 decimals', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, 'transfer DAI RECEIVER 1e36');
        checkStringStack(cmds, ['transfer', 'DAI', 'RECEIVER', parseUnits('1', 36).toString()]);
      });

      it('should return a long number with 18 decimals', async () => {
        const cmds = await app.callStatic.transform(
          ctxAddr,
          'transfer DAI RECEIVER 1000000000000000e18'
        );
        checkStringStack(cmds, [
          'transfer',
          'DAI',
          'RECEIVER',
          parseUnits('1000000000000000', 18).toString(),
        ]);
      });

      it('should return a simple number with 10 decimals', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, 'transfer DAI RECEIVER 146e10');
        checkStringStack(cmds, ['transfer', 'DAI', 'RECEIVER', parseUnits('146', 10).toString()]);
      });

      it('should return a long number with 10 decimals', async () => {
        const cmds = await app.callStatic.transform(
          ctxAddr,
          'transfer DAI RECEIVER 1000000000000000e10'
        );
        checkStringStack(cmds, ['transfer', 'DAI', 'RECEIVER', parseUnits('1', 25).toString()]);
      });

      it('should return a simple number without decimals even with simplified method', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, 'transfer DAI RECEIVER 123e0');
        checkStringStack(cmds, ['transfer', 'DAI', 'RECEIVER', parseUnits('123', 0).toString()]);
      });

      it('should return a long number without decimals even with simplified method', async () => {
        const cmds = await app.callStatic.transform(
          ctxAddr,
          'transfer DAI RECEIVER 1000000000000000e0'
        );
        checkStringStack(cmds, ['transfer', 'DAI', 'RECEIVER', parseUnits('1', 15).toString()]);
      });

      it('should not revert in preprocessor if first symbol is not a number', async () => {
        const cmds = await app.callStatic.transform(ctxAddr, 'transfer DAI RECEIVER e18');
        checkStringStack(cmds, ['transfer', 'DAI', 'RECEIVER', 'e18']);
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

  // works, ok
  describe('DSL arrays', () => {
    /* Attention!
      Note:
      All skiped tests are needed to check that functionality works well. Don't
      forget to check, update or remove tests after each changing in the code of
      arrays functionality
    */
    describe('uint256 type', () => {
      describe('sumOf', () => {
        it('uint256: sum several values', async () => {
          const input = `
            uint256[] NUMBERS
            insert 1345 into NUMBERS
            uint256[] INDEXES
            insert 1 into INDEXES
            insert 1465 into NUMBERS
            insert 3 into INDEXES
            sumOf INDEXES
            sumOf NUMBERS
          `;

          const cmds = await app.callStatic.transform(ctxAddr, input);
          checkStringStack(cmds, [
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
            'sumOf',
            'INDEXES',
            'sumOf',
            'NUMBERS',
          ]);
        });
      });

      describe('declareArr', () => {
        it('declare array', async () => {
          const input = 'declareArr uint256 BALANCES';
          const cmds = await app.callStatic.transform(ctxAddr, input);
          checkStringStack(cmds, ['declareArr', 'uint256', 'BALANCES']);
        });

        it('declare array between several commands', async () => {
          const input = 'uint256 2 declareArr uint256 BALANCES bool false';
          const cmds = await app.callStatic.transform(ctxAddr, input);
          checkStringStack(cmds, [
            'uint256',
            '2',
            'declareArr',
            'uint256',
            'BALANCES',
            'bool',
            'false',
          ]);
        });

        it('declare array just before a command', async () => {
          const input = 'declareArr uint256 BALANCES bool false';
          const cmds = await app.callStatic.transform(ctxAddr, input);
          checkStringStack(cmds, ['declareArr', 'uint256', 'BALANCES', 'bool', 'false']);
        });

        it('declare array just after a command', async () => {
          const input = 'declareArr uint256 BALANCES bool false';
          const cmds = await app.callStatic.transform(ctxAddr, input);
          checkStringStack(cmds, ['declareArr', 'uint256', 'BALANCES', 'bool', 'false']);
        });

        it('declare three arrays', async () => {
          const input =
            'declareArr uint256 BALANCES declareArr uint256 VALUES declareArr uint256 INDEXES';
          const cmds = await app.callStatic.transform(ctxAddr, input);
          checkStringStack(cmds, [
            'declareArr',
            'uint256',
            'BALANCES',
            'declareArr',
            'uint256',
            'VALUES',
            'declareArr',
            'uint256',
            'INDEXES',
          ]);
        });
      });
    });

    describe('address type', () => {
      describe('declareArr', () => {
        it('declare array', async () => {
          const input = 'declareArr address REALTORS';
          const cmds = await app.callStatic.transform(ctxAddr, input);
          checkStringStack(cmds, ['declareArr', 'address', 'REALTORS']);
        });

        it('declare array between several commands', async () => {
          const input = 'uint256 2 declareArr address REALTORS bool false';
          const cmds = await app.callStatic.transform(ctxAddr, input);
          checkStringStack(cmds, [
            'uint256',
            '2',
            'declareArr',
            'address',
            'REALTORS',
            'bool',
            'false',
          ]);
        });

        it('declare array just before a command', async () => {
          const input = 'declareArr address REALTORS bool false';
          const cmds = await app.callStatic.transform(ctxAddr, input);
          checkStringStack(cmds, ['declareArr', 'address', 'REALTORS', 'bool', 'false']);
        });

        it('declare array just after a command', async () => {
          const input = 'declareArr address REALTORS bool false';
          const cmds = await app.callStatic.transform(ctxAddr, input);
          checkStringStack(cmds, ['declareArr', 'address', 'REALTORS', 'bool', 'false']);
        });

        it('declare three arrays', async () => {
          const input =
            'declareArr address REALTORS declareArr address OWNERS declareArr address DBs';
          const cmds = await app.callStatic.transform(ctxAddr, input);
          checkStringStack(cmds, [
            'declareArr',
            'address',
            'REALTORS',
            'declareArr',
            'address',
            'OWNERS',
            'declareArr',
            'address',
            'DBs',
          ]);
        });
      });
    });

    describe('struct type', () => {
      describe('sumOf', () => {
        it('struct: sum several values', async () => {
          const input = `
            struct[] USERS
            insert ALISA into USERS
            insert BOB into USERS
            insert MAX into USERS
            sumOf USERS.balance
          `;

          const cmds = await app.callStatic.transform(ctxAddr, input);
          checkStringStack(cmds, [
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
            'balance',
          ]);
        });
      });

      describe('declareArr', () => {
        it('declare array between several commands', async () => {
          const input = 'uint256 2 declareArr struct ACCOUNTS bool false';
          const cmds = await app.callStatic.transform(ctxAddr, input);
          checkStringStack(cmds, [
            'uint256',
            '2',
            'declareArr',
            'struct',
            'ACCOUNTS',
            'bool',
            'false',
          ]);
        });
      });
    });

    describe('Different type of arrays', () => {
      it('Use simplified declareArr command, that include additional code', async () => {
        const input = `
          uint256[] NUMBERS
          insert 123 into NUMBERS
          lengthOf NUMBERS
          address[] ADDRESSES
          insert 0x47f8a90ede3d84c7c0166bd84a4635e4675accfc into ADDRESSES
          get 0 ADDRESSES
          get 0 NUMBERS
          lengthOf ADDRESSES
          sumOf NUMBERS`;
        const cmds = await app.callStatic.transform(ctxAddr, input);
        checkStringStack(cmds, [
          'declareArr',
          'uint256',
          'NUMBERS',
          'push',
          '123',
          'NUMBERS',
          'lengthOf',
          'NUMBERS',
          'declareArr',
          'address',
          'ADDRESSES',
          'push',
          '0x47f8a90ede3d84c7c0166bd84a4635e4675accfc',
          'ADDRESSES',
          'get',
          '0',
          'ADDRESSES',
          'get',
          '0',
          'NUMBERS',
          'lengthOf',
          'ADDRESSES',
          'sumOf',
          'NUMBERS',
        ]);
      });
    });
  });

  // works, ok
  describe('Structs', () => {
    describe('uint256 type', () => {
      it('should return a simple struct with one uint256 parameter', async () => {
        const input = 'struct BOB {balance: 456}';
        const cmds = await app.callStatic.transform(ctxAddr, input);
        checkStringStack(cmds, ['struct', 'BOB', 'balance', '456', 'endStruct']);
      });

      it('should return a simple struct with two uint256 parameters', async () => {
        const input = 'struct BOB {balance: 456, lastPayment: 1000}';
        const cmds = await app.callStatic.transform(ctxAddr, input);
        checkStringStack(cmds, [
          'struct',
          'BOB',
          'balance',
          '456',
          'lastPayment',
          '1000',
          'endStruct',
        ]);
      });
    });

    describe('address type', () => {
      it('should return a simple struct with one address parameter', async () => {
        const input = 'struct BOB { account: 0x47f8a90ede3d84c7c0166bd84a4635e4675accfc }';
        const cmds = await app.callStatic.transform(ctxAddr, input);
        checkStringStack(cmds, [
          'struct',
          'BOB',
          'account',
          '0x47f8a90ede3d84c7c0166bd84a4635e4675accfc',
          'endStruct',
        ]);
      });

      it('should return a simple struct with two address parameters', async () => {
        const input = `struct BOB {
          myAccount: 0x47f8a90ede3d84c7c0166bd84a4635e4675accfc,
          wifesAccount: 0x27f8a90ede3d84c7c0166bd84a4635e4675accfc
        }`;
        const cmds = await app.callStatic.transform(ctxAddr, input);
        checkStringStack(cmds, [
          'struct',
          'BOB',
          'myAccount',
          '0x47f8a90ede3d84c7c0166bd84a4635e4675accfc',
          'wifesAccount',
          '0x27f8a90ede3d84c7c0166bd84a4635e4675accfc',
          'endStruct',
        ]);
      });
    });

    describe('arrays and structs', () => {
      // Note: this test fails due to gas limit
      it.skip('with different types of commands', async () => {
        // Only with structure operators are changed their place for in the list of commands
        // const input = `
        // var HEY > var EXPIRY
        // bool false
        // bool true
        // `;
        const input = `
            uint256 4567
            struct Bob {
              account: 0x47f8a90ede3d84c7c0166bd84a4635e4675accfc,
              lastPayment: 1000
            }

            struct Mary {
              account: 0x57f8a90ede3d84c7c0166bd84a4635e4675accfc,
              lastPayment: 1500
            }

            struct[] USERS
            insert Bob into USERS
            insert Mary into USERS
            (Bob.lastPayment > 1)
            bool false
            (blockTimestamp < var EXPIRY) or (var RISK != bool true)
          `;
        const cmds = await app.callStatic.transform(ctxAddr, input);
        checkStringStack(cmds, [
          'uint256',
          '4567',
          'struct',
          'Bob',
          'account',
          '0x47f8a90ede3d84c7c0166bd84a4635e4675accfc',
          'lastPayment',
          '1000',
          'endStruct',
          'struct',
          'Mary',
          'account',
          '0x57f8a90ede3d84c7c0166bd84a4635e4675accfc',
          'lastPayment',
          '1500',
          'endStruct',
          'declareArr',
          'struct',
          'USERS',
          'push',
          'Bob',
          'USERS',
          'push',
          'Mary',
          'USERS',
          'Bob.lastPayment',
          '1',
          '>',
          'bool',
          'false',
          'time',
          'var',
          'EXPIRY',
          '<',
          'var',
          'RISK',
          'bool',
          'true',
          '!=',
          'or',
        ]);
      });

      it('simple struct with uint256 and address parameters', async () => {
        const input = `
            struct Bob {
              account: 0x47f8a90ede3d84c7c0166bd84a4635e4675accfc,
              lastPayment: 1000
            }`;
        const cmds = await app.callStatic.transform(ctxAddr, input);
        checkStringStack(cmds, [
          'struct',
          'Bob',
          'account',
          '0x47f8a90ede3d84c7c0166bd84a4635e4675accfc',
          'lastPayment',
          '1000',
          'endStruct',
        ]);
      });

      it('push struct type values into array', async () => {
        const input = `
            struct Bob {
              lastPayment: 1000
            }

            struct Mary {
              lastPayment: 1500
            }

            struct[] USERS
            insert Bob into USERS
            insert Mary into USERS
          `;
        const cmds = await app.callStatic.transform(ctxAddr, input);
        checkStringStack(cmds, [
          'struct',
          'Bob',
          'lastPayment',
          '1000',
          'endStruct',
          'struct',
          'Mary',
          'lastPayment',
          '1500',
          'endStruct',
          'declareArr',
          'struct',
          'USERS',
          'push',
          'Bob',
          'USERS',
          'push',
          'Mary',
          'USERS',
        ]);
      });
    });
  });
});
