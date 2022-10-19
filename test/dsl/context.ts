import { expect } from 'chai';
import { ethers, network } from 'hardhat';
import { ContextMock } from '../../typechain-types/dsl/mocks';

describe('Context', () => {
  let app: ContextMock;
  let snapshotId: number;

  enum OpcodeLibNames {
    ComparisonOpcodes,
    BranchingOpcodes,
    LogicalOpcodes,
    OtherOpcodes,
  }

  before(async () => {
    const [random] = await ethers.getSigners();
    const ContextCont = await ethers.getContractFactory('ContextMock');
    app = await ContextCont.deploy();
    await app.setAppAddress(random.address);
  });

  beforeEach(async () => {
    snapshotId = await network.provider.send('evm_snapshot');
  });

  afterEach(async () => {
    await network.provider.send('evm_revert', [snapshotId]);
  });

  describe('Operators', () => {
    it('check initOpcodes after deployment', async () => {
      expect(await app.operatorsLen()).to.equal(15);
      // check the first operaror
      expect(await app.operators(0)).to.equal('==');
      // check the middle operaror
      expect(await app.operators(7)).to.equal('!');
      // check the last operator
      expect(await app.operators(14)).to.equal('/');
    });

    it('should add the operator', async () => {
      await app.addOperatorExt('+', 999);
      expect(await app.operatorsLen()).to.equal(16);
      expect(await app.opsPriors('+')).to.equal(999);
      expect(await app.operators(15)).to.equal('+');
    });

    it('should add the opcode for the operator', async () => {
      const name = '|';
      const opcode = '0x91';
      const opSelector = '0x00000001';
      const asmSelector = '0x00000000';
      await app.addOpcodeForOperatorExt(
        name,
        opcode,
        opSelector,
        asmSelector,
        OpcodeLibNames.ComparisonOpcodes,
        999
      );
      expect(await app.opCodeByName(name)).to.equal(opcode);
      expect(await app.selectorByOpcode(opcode)).to.equal(opSelector);
      expect(await app.asmSelectors(name)).to.equal(asmSelector);

      expect(await app.operatorsLen()).to.equal(16);
      expect(await app.opsPriors('|')).to.equal(999);
      expect(await app.operators(15)).to.equal('|');
    });
  });

  describe('addOpcode', () => {
    it('error: empty opcode selector', async () => {
      await expect(
        app.addOpcode('|', '0x91', '0x00000000', '0x00000000', OpcodeLibNames.ComparisonOpcodes)
      ).to.be.revertedWith('CTX2');
    });
    it('error: duplicate opcode', async () => {
      await expect(
        app.addOpcode('+', '0x02', '0x00000001', '0x00000000', OpcodeLibNames.ComparisonOpcodes)
      ).to.be.revertedWith('CTX3');
      await expect(
        app.addOpcode('*', '0x01', '0x00000001', '0x00000000', OpcodeLibNames.ComparisonOpcodes)
      ).to.be.revertedWith('CTX3');
    });
    it('success', async () => {
      const name = '|';
      const opcode = '0x91';
      const opSelector = '0x00000001';
      const asmSelector = '0x00000000';
      await app.addOpcode(name, opcode, opSelector, asmSelector, OpcodeLibNames.ComparisonOpcodes);
      expect(await app.opCodeByName(name)).to.equal(opcode);
      expect(await app.selectorByOpcode(opcode)).to.equal(opSelector);
      expect(await app.asmSelectors(name)).to.equal(asmSelector);
    });
  });

  describe('addOpcodeBranch', () => {
    it('error: duplicate opcode', async () => {
      await expect(
        app.addOpcodeBranchExt('loadRemote', 'bool', '0x01', '0x00000002')
      ).to.be.revertedWith('CTX5');
      await expect(
        app.addOpcodeBranchExt('loadRemote', 'uint256', '0x02', '0x00000002')
      ).to.be.revertedWith('CTX5');
    });

    it('success', async () => {
      const baseOpName = 'loadRemoteNewTest'; // some branching witg different name
      const branchName = 'uint256';
      const branchCode = '0x81';
      const selector = '0x00000081';
      await app.addOpcodeBranchExt(baseOpName, branchName, branchCode, selector);
      expect(await app.branchSelectors(baseOpName, branchCode)).to.equal(selector);
      expect(await app.branchCodes(baseOpName, branchName)).to.equal(branchCode);
    });
  });

  describe('program', () => {
    it('get slice', async () => {
      await app.setProgram('0x01020304');

      expect(await app.programAt(0, 1), 'Wrong bytes slice').to.equal('0x01');
      expect(await app.programAt(1, 1), 'Wrong bytes slice').to.equal('0x02');
      expect(await app.programAt(2, 1), 'Wrong bytes slice').to.equal('0x03');
      expect(await app.programAt(3, 1), 'Wrong bytes slice').to.equal('0x04');
    });

    it('overflow', async () => {
      await app.setProgram('0x01020304');
      await expect(app.programAt(4, 1)).to.be.revertedWith('CTX4');
    });

    it('setProgram', async () => {
      await app.setPc('0x03');
      expect(await app.pc()).to.equal('0x03');
      await app.setProgram('0x123456');
      expect(await app.program()).to.equal('0x123456');
      expect(await app.pc()).to.equal('0x00');
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
  });

  describe('settings', () => {
    it('setAppAddress', async () => {
      await expect(app.setAppAddress(ethers.constants.AddressZero)).to.be.revertedWith('CTX1');
      const [addr] = await ethers.getSigners();
      await app.setAppAddress(addr.address);
      expect(await app.appAddr()).to.equal(addr.address);
    });

    it('setMsgSender', async () => {
      await expect(app.setMsgSender(ethers.constants.AddressZero)).to.be.revertedWith('CTX1');
      const [addr] = await ethers.getSigners();
      await app.setMsgSender(addr.address);
      expect(await app.msgSender()).to.equal(addr.address);
    });
  });
});
