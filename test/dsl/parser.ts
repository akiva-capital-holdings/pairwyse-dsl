import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers, network } from 'hardhat';
import { deployBaseMock } from '../../scripts/data/deploy.utils.mock';
import { Context, ParserMock } from '../../typechain-types';
import { hex4Bytes } from '../utils/utils';

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

    [appAddr /* parser address */, , preprocessorAddr] = await deployBaseMock();
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

    it('var TMSTAMP < var NEXT_MONTH', async () => {
      await app.parse(preprocessorAddr, ctxAddr, 'var TMSTAMP < var NEXT_MONTH');
      const expected = '0x1bbddc72951ba75b67d703';
      expect(await ctx.program()).to.equal(expected);
    });

    it('AMOUNT > 5', async () => {
      await app.parse(preprocessorAddr, ctxAddr, 'AMOUNT > 5');
      expect(await ctx.program()).equal(
        '0x1b1a3a187d1a000000000000000000000000000000000000000000000000000000000000000504'
      );
    });

    it('NUMBER > NUMBER2', async () => {
      await app.parse(preprocessorAddr, ctxAddr, 'NUMBER > NUMBER2');
      expect(await ctx.program()).equal('0x1b545cbf771bb66353ab04');
    });

    it('((time > init) and (time < expiry)) or (risk != true)', async () => {
      await app.parse(
        preprocessorAddr,
        ctxAddr,
        `
          (var TMSTAMP > var INIT)
          and
          (var TMSTAMP < var EXPIRY)
          or
          (var RISK != bool true)
          `
      );
      const expected = '0x1bbddc72951bb687035e041bbddc72951b9dc69bb503121b55248f7c18011413';
      expect(await ctx.program()).to.equal(expected);
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
});
