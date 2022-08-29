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

    // Make a snapshot
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

    it('loadLocal uint256 TIMESTAMP < loadLocal uint256 NEXT_MONTH', async () => {
      await app.parse(
        preprocessorAddr,
        ctxAddr,
        'loadLocal uint256 TIMESTAMP < loadLocal uint256 NEXT_MONTH'
      );
      const expected = '0x1b011b7b16d41b01a75b67d703';
      expect(await ctx.program()).to.equal(expected);
    });

    it('((time > init) and (time < expiry)) or (risk != true)', async () => {
      await app.parse(
        preprocessorAddr,
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

  describe('setVariable', () => {
    it('should set the global variable (uint256)', async () => {
      const name = 'TEST_NUMBER';
      expect(await app.isVariable('TEST_NUMBER')).to.be.equal(false);
      expect(await app.savedProgram('TEST_NUMBER')).to.be.equal('0x');
      await app.setVariableExt(ctxAddr, name, 'uint256');
      expect(await app.isVariable('TEST_NUMBER')).to.be.equal(true);
      /*
        1b - opcode for loadLocal command
        01 - branchCode for loadLocal command with uint256 type
        1cc054ab - bytecode for a `TEST_NUMBER` name
      */
      expect(await app.savedProgram('TEST_NUMBER')).to.be.equal('0x1b011cc054ab');
    });

    it('reverts if try to set empty global variable name', async () => {
      expect(await app.isVariable('')).to.be.equal(false);
      expect(await app.savedProgram('')).to.be.equal('0x');
      await expect(app.setVariableExt(ctxAddr, '', 'uint256')).to.be.revertedWith('PRS2');
      expect(await app.isVariable('')).to.be.equal(false);
      expect(await app.savedProgram('')).to.be.equal('0x');
    });
  });

  describe('Load local variables without loadLocal opcode', async () => {
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
        'A',
        'uint256',
        '2',
        '+',
        'setUint256',
        'SUM',
      ];
      expect(await app.savedProgram('A')).to.be.equal('0x');
      expect(await app.savedProgram('SUM')).to.be.equal('0x');
      await app.parseCodeExt(ctxAddr, code);

      expect(await app.savedProgram('A')).to.be.equal(
        '0x' +
          '1b' + // opcode for loadLocal command
          '01' + // branchCode for loadLocal command with uint256 type
          '03783fac' // bytecode for an `A` name
      );
      expect(await app.savedProgram('SUM')).to.be.equal(
        '0x' +
          '1b' + // opcode for loadLocal command
          '01' + // branchCode for loadLocal command with uint256 type
          '2df384fb' // bytecode for a `SUM` name
      );
      expect(await ctx.program()).to.equal(
        '0x' +
          '1a' + // uint256
          `${SIX}` + // 6
          '2e' + // setUint256
          '03783fac' + // bytecode for an `A` name
          '1b' + // loadLocal
          '01' + // branchCode for loadLocal command with uint256 type
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
          `545cbf77${
            // bytecode for a `NUMBER` name
            appAddrHex.toLowerCase()
          }`
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
          `f11f9a5d${
            // bytecode for a `BOOL_VALUE` name
            appAddrHex.toLowerCase()
          }`
      );
    });
    // TODO: add for other types
  });

  describe.skip('DSL arrays', () => {
    it('load array with the first values', async () => {
      await app.parseCodeExt(ctxAddr, ['loadArray', 'uint256', 'NUMBERS', '1']);
      expect(await ctx.program()).to.equal(
        '0x' +
          '31' +
          '01' +
          '1fff709e' +
          '0000000000000000000000000000000000000000000000000000000000000001'
      );
    });
  });
});
