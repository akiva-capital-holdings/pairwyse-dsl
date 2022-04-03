import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Preprocessor } from '../../typechain';
import { Testcase } from '../types';

describe('Preprocessor', () => {
  let app: Preprocessor;
  let ctxAddr: string;

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

    await ctx.addOperatorExt('xor', 2);
    await ctx.addOperatorExt('or', 2);

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
  });

  describe('infix to postfix', () => {
    const tests: Testcase[] = [
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
          'blockTimestamp',
          'loadLocal',
          'uint256',
          'INIT',
          '>', // A
          'blockTimestamp',
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
        expr: '(((uint256 1 or uint256 5) or uint256 7) and uint256 0)',
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
        const stack = await (await ethers.getContractFactory('Stack')).deploy();
        const inputArr = jsTransform(expr);
        const res = await app.callStatic.infixToPostfix(ctxAddr, inputArr, stack.address);
        expect(res).to.eql(expected);
      });
    };

    tests.forEach((testcase) => infixToPostfixTest(testcase));
  });

  describe('split', () => {
    it('simple case', async () => {
      const input = 'loadLocal address SENDER == msgSender';
      const res = await app.callStatic.split(input);
      expect(res).to.eql(jsTransform(input));
    });

    it('extra spaces', async () => {
      const input = 'loadLocal      address SENDER == msgSender';
      const res = await app.callStatic.split(input);
      expect(res).to.eql(jsTransform(input));
    });

    it('parenthesis', async () => {
      const input = '(((uint256 1 or uint256 5) or uint256 7) and uint256 0)';
      const res = await app.callStatic.split(input);
      expect(res).to.eql(jsTransform(input));
    });

    it('new line symbol', async () => {
      const input = `
          loadLocal address SENDER
            ==
          msgSender
        `;
      const res = await app.callStatic.split(input);
      expect(res).to.eql(jsTransform(input));
    });

    it('all together', async () => {
      const input = `
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
        `;

      const res = await app.callStatic.split(input);
      expect(res).to.eql(jsTransform(input));
    });
  });

  describe('Execute high-level DSL', () => {
    it('parenthesis', async () => {
      const cmds = await app.callStatic.transform(
        ctxAddr,
        '(((uint256 1 or uint256 5) or uint256 7) and uint256 1)'
      );
      const expected = [
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
      ];
      expect(cmds).to.eql(expected);
    });

    describe('parenthesis matter', () => {
      it('first', async () => {
        const cmds = await app.callStatic.transform(
          ctxAddr,
          'uint256 1 or uint256 0 or uint256 1 and uint256 0'
        );
        const expected = [
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
        ];

        expect(cmds).to.eql(expected);
      });

      it('second', async () => {
        const cmds = await app.callStatic.transform(
          ctxAddr,
          '((uint256 1 or uint256 0) or uint256 1) and uint256 0'
        );
        const expected = [
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
        ];

        expect(cmds).to.eql(expected);
      });

      it('third', async () => {
        const cmds = await app.callStatic.transform(
          ctxAddr,
          '(uint256 1 or uint256 0) or (uint256 1 and uint256 0)'
        );
        const expected = [
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
        ];

        expect(cmds).to.eql(expected);
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
      const expected = [
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
      ];
      expect(cmds).to.eql(expected);
    });

    it('if expression', async () => {
      const ONE = new Array(64).join('0') + 1;
      const TWO = new Array(64).join('0') + 2;
      const FOUR = new Array(64).join('0') + 4;

      const program = `
        bool true
        if action

        uint256 ${FOUR}
        end

        action {
          uint256 ${ONE}
          uint256 ${TWO}
        }
        `;

      const cmds = await app.callStatic.transform(ctxAddr, program);
      const expected = [
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
      ];
      expect(cmds).to.eql(expected);
    });

    it('if-else expression', async () => {
      const ONE = new Array(64).join('0') + 1;
      const TWO = new Array(64).join('0') + 2;
      const THREE = new Array(64).join('0') + 3;
      const FOUR = new Array(64).join('0') + 4;

      const program = `
        bool true
        ifelse good bad

        uint256 ${FOUR}
        end

        good {
          uint256 ${ONE}
          uint256 ${TWO}
        }
        
        bad {
          uint256 ${THREE}
        }
        `;

      const cmds = await app.callStatic.transform(ctxAddr, program);
      const expected = [
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
      ];
      expect(cmds).to.eql(expected);
    });
  });

  describe('Single line comment in user-input', async () => {
    it('commented one-line command', async () => {
      const input = '// uint256 2 * uint256 5';
      const cmds = await app.callStatic.transform(ctxAddr, input);
      expect(cmds).to.eql([]);
    });

    it('commented all lines of program', async () => {
      const input = `
        // uint256 2 * uint256 5
        // bool true
      `;
      const cmds = await app.callStatic.transform(ctxAddr, input);
      expect(cmds).to.eql([]);
    });

    it('a comment located next to the command line', async () => {
      const input = `
        // uint256 2 * uint256 5
        bool true
      `;
      const cmds = await app.callStatic.transform(ctxAddr, input);
      expect(cmds).to.eql(['bool', 'true']);
    });

    it('a comment located between two lines of commands', async () => {
      const input = `
        bool false
        // uint256 2 * uint256 5
        bool true
      `;
      const cmds = await app.callStatic.transform(ctxAddr, input);
      expect(cmds).to.eql(['bool', 'false', 'bool', 'true']);
    });

    it('a comment located next to the command (w/o spaces) ', async () => {
      const input = `
        bool true//uint256 2 * uint256 5
      `;
      const expected = ['bool', 'true'];
      const cmds = await app.callStatic.transform(ctxAddr, input);
      expect(cmds).to.eql(expected);
    });

    it('a comment located just after the command (with end line) ', async () => {
      const input = `
        bool true//smth
        bool false
      `;
      const expected = ['bool', 'true', 'bool', 'false'];
      const cmds = await app.callStatic.transform(ctxAddr, input);
      expect(cmds).to.eql(expected);
    });

    it('a comment located next to the command (with space)', async () => {
      const input = `
        bool true// uint256 2 * uint256 5
      `;
      const expected = ['bool', 'true'];
      const cmds = await app.callStatic.transform(ctxAddr, input);
      expect(cmds).to.eql(expected);
    });

    it('a comment located just before the command (with space)', async () => {
      const input = `
        bool true //uint256 2 * uint256 5
      `;
      const expected = ['bool', 'true'];
      const cmds = await app.callStatic.transform(ctxAddr, input);
      expect(cmds).to.eql(expected);
    });

    it('comments located before and below the command', async () => {
      const input = `
        //123
        bool true
        // uint256 2 * uint256 5
      `;
      const cmds = await app.callStatic.transform(ctxAddr, input);
      expect(cmds).to.eql(['bool', 'true']);
    });

    it('a comment contains another single comment', async () => {
      const input = `
        //bool false//uint256 2 * uint256 5
        bool true
      `;
      const cmds = await app.callStatic.transform(ctxAddr, input);
      expect(cmds).to.eql(['bool', 'true']);
    });

    it('a comment contains a multiple comment', async () => {
      const input = `
        //bool false/*uint256 2 * uint256 5*/
        bool true
      `;
      const cmds = await app.callStatic.transform(ctxAddr, input);
      expect(cmds).to.eql(['bool', 'true']);
    });

    it('a comment located before the command', async () => {
      const input = `
        //bool false
        bool true
      `;
      const cmds = await app.callStatic.transform(ctxAddr, input);
      expect(cmds).to.eql(['bool', 'true']);
    });

    it('a comment located below the command', async () => {
      const input = `
        bool true
        //bool false
      `;
      const cmds = await app.callStatic.transform(ctxAddr, input);
      expect(cmds).to.eql(['bool', 'true']);
    });

  });

  describe('Multiple line comments in user-input', async () => {
    it('commented one-line command with spaces', async () => {
      const input = `
        /* uint256 2 * uint256 5 */
      `;
      const cmds = await app.callStatic.transform(ctxAddr, input);
      expect(cmds).to.eql([]);
    });

    it('commented all lines of program with \\n symbols', async () => {
      const input = `
        /*
        uint256 2 * uint256 5
        bool true
        smt
        */
      `;
      const cmds = await app.callStatic.transform(ctxAddr, input);
      expect(cmds).to.eql([]);
    });

    it('a multi comment that located next to the command line', async () => {
      // contains a single comment inside
      const input = `
        uint256 2 * uint256 5
        /*
        //bool true
        smt
        */
      `;
      const cmds = await app.callStatic.transform(ctxAddr, input);
      expect(cmds).to.eql(['uint256', '2', '*' , 'uint256', '5']);
    });

    it('comments located before and below the command', async () => {
      const input = `
        uint256 2 * uint256 5
        /*
        //123
        smt
        */
        bool true
      `;
      const cmds = await app.callStatic.transform(ctxAddr, input);
      expect(cmds).to.eql(['uint256', '2', '*' , 'uint256', '5', 'bool', 'true']);
    });

    it('if a comment was not closed', async () => {
      // returns only the first command
      const input = `
        bool false
        // wow test
        /*
        smt
        bool true
      `;
      const cmds = await app.callStatic.transform(ctxAddr, input);
      expect(cmds).to.eql(['bool', 'false']);
    });

    it('different comments located between two lines of commands', async () => {
      const input = `
        // wow test
        uint256 2 * uint256 5
        /*
        //123
        smt
        */
        bool true
        // wow test 2
      `;
      const cmds = await app.callStatic.transform(ctxAddr, input);
      expect(cmds).to.eql(['uint256', '2', '*' , 'uint256', '5', 'bool', 'true']);
    });

    it('comment contains the command (w/o spaces) ', async () => {
      const input = `
        /*uint256 2 * uint256 5*/
      `;
      const cmds = await app.callStatic.transform(ctxAddr, input);
      expect(cmds).to.eql([]);
    });

    it(`a comment opens before and closes at the beginning of the command`, async () => {
        const input = `
        /*
        uint256 2 * uint256 5
        */bool true
        `;
        const cmds = await app.callStatic.transform(ctxAddr, input);
        expect(cmds).to.eql(['bool', 'true']);
    });

    it('a comment located before the command', async () => {
      const input = `
        /*
        uint256 2 * uint256 5
        */bool true
        `;
        const cmds = await app.callStatic.transform(ctxAddr, input);
        expect(cmds).to.eql(['bool', 'true']);
    });

    it('a comment located below the command', async () => {
      const input = `
        bool true
        /*
        uint256 2 * uint256 5
        */
        `;
        const cmds = await app.callStatic.transform(ctxAddr, input);
        expect(cmds).to.eql(['bool', 'true']);
    });

    it('a comment contains a multiple comment', async () => {
      const input = `
        bool true
        /*
        uint256 /*2 * uint256 5*/
        */
        `;
        const cmds = await app.callStatic.transform(ctxAddr, input);
        expect(cmds).to.eql(['bool', 'true', '*/']);
    });

    it('a comment opens next to the command and closes below', async () => {
      const input = `
        bool true/*uint256 2 * uint256 5
        */
        `;
        const cmds = await app.callStatic.transform(ctxAddr, input);
        expect(cmds).to.eql(['bool', 'true']);
    });

    it('mix comments and commands', async () => {
      const input = `
        /*123
        */bool false
        //
        uint256 2 * uint256 5 //
        //
        bool true/* abc test
        */

        uint256 11111//commenthere/**/
        /*bool true */ bool false//comment here

        `;
        const cmds = await app.callStatic.transform(ctxAddr, input);
        expect(cmds).to.eql([
          'bool', 'false', 'uint256', '2', '*' ,
          'uint256', '5', 'bool', 'true', 'uint256',
          '11111', 'bool', 'false'
        ]);
    });
  });
});
