import { expect } from 'chai';
import { ethers } from 'hardhat';
import { ContextMock } from '../../typechain';

describe('Context', () => {
  let app: ContextMock;

  enum OpcodeLibNames {
    ComparatorOpcodes,
    LogicalOpcodes,
    SetOpcodes,
    OtherOpcodes,
  }

  beforeEach(async () => {
    const ContextCont = await ethers.getContractFactory('ContextMock');
    app = await ContextCont.deploy();
  });

  describe('addOpcode', () => {
    it('error: empty opcode selector', async () => {
      await expect(
        app.addOpcode('+', '0x01', '0x00000000', '0x00000000', OpcodeLibNames.ComparatorOpcodes)
      ).to.be.revertedWith('Context: empty opcode selector');
    });
    it('error: duplicate opcode', async () => {
      await app.addOpcode(
        '+',
        '0x01',
        '0x00000001',
        '0x00000000',
        OpcodeLibNames.ComparatorOpcodes
      );
      await expect(
        app.addOpcode('+', '0x02', '0x00000001', '0x00000000', OpcodeLibNames.ComparatorOpcodes)
      ).to.be.revertedWith('Context: duplicate opcode name or code');
      await expect(
        app.addOpcode('*', '0x01', '0x00000001', '0x00000000', OpcodeLibNames.ComparatorOpcodes)
      ).to.be.revertedWith('Context: duplicate opcode name or code');
    });
    it('success', async () => {
      const name = '+';
      const opcode = '0x01';
      const opSelector = '0x00000001';
      const asmSelector = '0x00000000';
      await app.addOpcode(name, opcode, opSelector, asmSelector, OpcodeLibNames.ComparatorOpcodes);
      expect(await app.opCodeByName(name)).to.equal(opcode);
      expect(await app.selectorByOpcode(opcode)).to.equal(opSelector);
      expect(await app.asmSelectors(name)).to.equal(asmSelector);
    });
  });

  describe('addOpcodeBranch', () => {
    it('error: empty opcode selector', async () => {
      await expect(
        app.addOpcodeBranchExt('loadLocal', 'uint256', '0x01', '0x00000000')
      ).to.be.revertedWith('Context: empty opcode selector');
    });
    it('error: duplicate opcode', async () => {
      await app.addOpcodeBranchExt('loadLocal', 'uint256', '0x01', '0x00000001');
      await expect(
        app.addOpcodeBranchExt('loadLocal', 'bool', '0x01', '0x00000002')
      ).to.be.revertedWith('Context: duplicate opcode branch');
      await expect(
        app.addOpcodeBranchExt('loadLocal', 'uint256', '0x02', '0x00000002')
      ).to.be.revertedWith('Context: duplicate opcode branch');
    });
    it('success', async () => {
      const baseOpName = 'loadLocal';
      const branchName = 'uint256';
      const branchCode = '0x01';
      const selector = '0x00000001';
      await app.addOpcodeBranchExt(baseOpName, branchName, branchCode, selector);
      expect(await app.branchSelectors(baseOpName, branchCode)).to.equal(selector);
      expect(await app.branchCodes(baseOpName, branchName)).to.equal(branchCode);
    });
  });

  it('setProgram', async () => {
    await app.setPc('0x03');
    expect(await app.pc()).to.equal('0x03');
    await app.setProgram('0x123456');
    expect(await app.program()).to.equal('0x123456');
    expect(await app.pc()).to.equal('0x00');
  });

  describe('programAt & programSlice', () => {
    it('get slice', async () => {
      await app.setProgram('0x01020304');

      expect(await app.programAt(0, 1), 'Wrong bytes slice').to.equal('0x01');
      expect(await app.programAt(1, 1), 'Wrong bytes slice').to.equal('0x02');
      expect(await app.programAt(2, 1), 'Wrong bytes slice').to.equal('0x03');
      expect(await app.programAt(3, 1), 'Wrong bytes slice').to.equal('0x04');
    });

    it('overflow', async () => {
      await app.setProgram('0x01020304');
      await expect(app.programAt(4, 1)).to.be.revertedWith('Context: slicing out of range');
    });
  });

  it('setPc', async () => {
    await app.setPc(1);
    expect(await app.pc()).to.equal(1);
    await app.setPc(999);
    expect(await app.pc()).to.equal(999);
    await app.setPc(0);
    expect(await app.pc()).to.equal(0);
  });

  it('incPc', async () => {
    await app.setPc(5);
    await app.incPc(1);
    expect(await app.pc()).to.equal(6);
    await app.incPc(3);
    expect(await app.pc()).to.equal(9);
    await app.incPc(0);
    expect(await app.pc()).to.equal(9);
  });

  it('setAppAddress', async () => {
    await expect(app.setAppAddress(ethers.constants.AddressZero)).to.be.revertedWith(
      'Context: address is zero'
    );
    const [addr] = await ethers.getSigners();
    await app.setAppAddress(addr.address);
    expect(await app.appAddress()).to.equal(addr.address);
  });

  it('setMsgSender', async () => {
    await expect(app.setMsgSender(ethers.constants.AddressZero)).to.be.revertedWith(
      'Context: address is zero'
    );
    const [addr] = await ethers.getSigners();
    await app.setMsgSender(addr.address);
    expect(await app.msgSender()).to.equal(addr.address);
  });
});
