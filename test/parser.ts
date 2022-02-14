import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Context, ParserMock } from '../typechain';

describe.only('Parser', () => {
  let sender: SignerWithAddress;
  let app: ParserMock;
  let ctx: Context;
  let ctxAddr: string;

  before(async () => {
    [sender] = await ethers.getSigners();

    // Deploy StringUtils library
    const stringLib = await (await ethers.getContractFactory('StringUtils')).deploy();

    // Deploy Parser
    const ParserCont = await ethers.getContractFactory('ParserMock', {
      libraries: { StringUtils: stringLib.address },
    });
    app = await ParserCont.deploy();
  });

  beforeEach(async () => {
    // Deploy & setup Context
    ctx = await (await ethers.getContractFactory('Context')).deploy();
    ctxAddr = ctx.address;
    await ctx.initOpcodes();
    await ctx.setAppAddress(app.address);
    await ctx.setMsgSender(sender.address);
  });

  describe('parse', () => {
    it('error: delegatecall to asmSelector failed', async () => {
      await expect(app.parse(ctxAddr, 'uint256')).to.be.revertedWith(
        'delegatecall to asmSelector failed'
      );
    });

    it('uint256 1122334433', async () => {
      await app.parse(ctxAddr, 'uint256 1122334433');
      const expected = '0x1a0000000000000000000000000000000000000000000000000000000042e576e1';
      expect(await ctx.program()).to.equal(expected);
    });

    it('loadLocal uint256 TIMESTAMP < loadLocal uint256 NEXT_MONTH', async () => {
      await app.parse(ctxAddr, 'loadLocal uint256 TIMESTAMP < loadLocal uint256 NEXT_MONTH');
      const expected = '0x1b011b7b16d41b01a75b67d703';
      expect(await ctx.program()).to.equal(expected);
    });

    it('((time > init) and (time < expiry)) or (risk != true)', async () => {
      await app.parse(
        ctxAddr,
        `
          (loadLocal uint256 TIMESTAMP > loadLocal uint256 INIT)
          and
          (loadLocal uint256 TIMESTAMP < loadLocal uint256 EXPIRY)
          or
          (loadLocal bool RISK != bool true)
          `
      );
      const expected =
        '0x1b011b7b16d41b01b687035e041b011b7b16d41b019dc69bb503121b0255248f7c18011413';
      expect(await ctx.program()).to.equal(expected);
    });

    it('should throw at unknownExpr', async () => {
      await expect(app.parse(ctxAddr, 'unknownExpr')).to.be.revertedWith(
        'Parser: "unknownExpr" command is unknown'
      );
      await expect(app.parse(ctxAddr, '?!')).to.be.revertedWith('Parser: "?!" command is unknown');
    });

    it.only('if-else condition', async () => {
      const ONE = new Array(64).join('0') + 1;
      const TWO = new Array(64).join('0') + 2;
      const THREE = new Array(64).join('0') + 3;
      const FOUR = new Array(64).join('0') + 4;

      // to Preprocessor
      // await app.parse(
      //   ctxAddr,
      //   `
      //   bool true
      //   bnz good bad

      //   uint256 ${FOUR}
      //   end

      //   good {
      //     uint256 ${ONE}
      //     uint256 ${TWO}
      //   }

      //   bad {
      //     uint256 ${THREE}
      //   }
      //   `
      // );

      // to Parser
      await app.parseCodeExt(ctxAddr, [
        'bool',
        'true',
        'bnz',
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

      // to Executor
      const expected =
        '0x' +
        '18' + // bool
        '01' + // true
        '23' + // bnz
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
});
