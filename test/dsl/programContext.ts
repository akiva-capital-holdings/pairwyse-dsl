import { expect } from 'chai';
import { ethers, network } from 'hardhat';
import { ProgramContextMock } from '../../typechain-types/dsl/mocks';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

describe.skip('ProgramContext', () => {
  let app: ProgramContextMock;
  let random: SignerWithAddress;
  let alice: SignerWithAddress;
  let snapshotId: number;

  before(async () => {
    [random, alice] = await ethers.getSigners();
    const ProgramContext = await ethers.getContractFactory('ProgramContextMock');
    app = await ProgramContext.deploy();
    await app.setAppAddress(random.address);
  });

  beforeEach(async () => {
    snapshotId = await network.provider.send('evm_snapshot');
  });

  afterEach(async () => {
    await network.provider.send('evm_revert', [snapshotId]);
  });

  describe('program', () => {
    it('get slice', async () => {
      await app.connect(random).setProgram('0x01020304');

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
    it('setMsgSender', async () => {
      await expect(app.setMsgSender(ethers.constants.AddressZero)).to.be.revertedWith('CTX1');
      const [addr] = await ethers.getSigners();
      await app.setMsgSender(addr.address);
      expect(await app.msgSender()).to.equal(addr.address);
    });

    it('setMsgValue', async () => {
      await app.setMsgValue(345);
      expect(await app.msgValue()).to.equal(345);

      await app.setMsgValue(0);
      expect(await app.msgValue()).to.equal(0);
    });
  });
});
