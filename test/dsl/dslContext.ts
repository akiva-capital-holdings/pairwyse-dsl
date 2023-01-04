import * as hre from 'hardhat';
import { expect } from 'chai';

import { DSLContextMock } from '../../typechain-types/dsl/mocks';
import { deployOpcodeLibs } from '../../scripts/utils/deploy.utils';

const { ethers, network } = hre;

describe('DSLContext', () => {
  let app: DSLContextMock;
  let snapshotId: number;

  enum OpcodeLibNames {
    ComparisonOpcodes,
    BranchingOpcodes,
    LogicalOpcodes,
    OtherOpcodes,
  }

  before(async () => {
    const [random] = await ethers.getSigners();
    const [
      comparisonOpcodesLibAddr,
      branchingOpcodesLibAddr,
      logicalOpcodesLibAddr,
      otherOpcodesLibAddr,
    ] = await deployOpcodeLibs(hre);
    app = await (
      await ethers.getContractFactory('DSLContextMock')
    ).deploy(
      comparisonOpcodesLibAddr,
      branchingOpcodesLibAddr,
      logicalOpcodesLibAddr,
      otherOpcodesLibAddr
    );
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
        app.addOpcode(
          '|',
          '0x91',
          '0x00000000',
          '0x00000000',
          OpcodeLibNames.ComparisonOpcodes,
          2,
          true
        )
      ).to.be.revertedWith('CTX2');
    });

    it('error: duplicate opcode', async () => {
      await expect(
        app.addOpcode(
          '+',
          '0x02',
          '0x00000001',
          '0x00000000',
          OpcodeLibNames.ComparisonOpcodes,
          2,
          true
        )
      ).to.be.revertedWith('CTX3');
      await expect(
        app.addOpcode(
          '*',
          '0x01',
          '0x00000001',
          '0x00000000',
          OpcodeLibNames.ComparisonOpcodes,
          2,
          true
        )
      ).to.be.revertedWith('CTX3');
    });

    it('success', async () => {
      const name = '|';
      const opcode = '0x91';
      const opSelector = '0x00000001';
      const asmSelector = '0x00000000';
      await app.addOpcode(
        name,
        opcode,
        opSelector,
        asmSelector,
        OpcodeLibNames.ComparisonOpcodes,
        2,
        true
      );
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
});
