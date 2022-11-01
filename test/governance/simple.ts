import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import * as hre from 'hardhat';
import { checkStackTail } from '../utils/utils';
import { deployBaseMock } from '../../scripts/utils/deploy.utils.mock';

import {
  activateRecord,
  deactivateRecord,
  archiveRecord,
  unarchiveRecord,
} from '../../scripts/utils/update.record.mock';
import { deployOpcodeLibs } from '../../scripts/utils/deploy.utils';
import { GovernanceMock } from '../../typechain-types';
import { ONE_MONTH } from '../utils/constants';

const { ethers, network } = hre;

describe('Governance', () => {
  let app: GovernanceMock;
  let context: string;
  let conditionContext: string;
  let parserAddr: string;
  let executorLibAddr: string;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let NEXT_MONTH: number;
  let snapshotId: number;
  let preprAddr: string;
  let tokenAddr: string;
  let record1 = 'uint256 4';
  let record2 = 'uint256 6';
  let record3 = 'uint256 8';
  let record4 = 'uint256 1';
  let ID1 = 0;
  let ID2 = 1;
  let ID3 = 2;
  let ID4 = 3;

  before(async () => {
    const LAST_BLOCK_TIMESTAMP = (
      await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
    ).timestamp;
    NEXT_MONTH = LAST_BLOCK_TIMESTAMP + ONE_MONTH;

    [alice, bob] = await ethers.getSigners();

    // Deploy Token contract
    const token = await (await ethers.getContractFactory('Token'))
      .connect(alice)
      .deploy(ethers.utils.parseEther('1000'));
    await token.deployed();
    tokenAddr = token.address;

    const [
      comparisonOpcodesLibAddr,
      branchingOpcodesLibAddr,
      logicalOpcodesLibAddr,
      otherOpcodesLibAddr,
    ] = await deployOpcodeLibs(hre);

    [parserAddr, executorLibAddr, preprAddr] = await deployBaseMock(hre);

    const MockContract = await hre.ethers.getContractFactory('GovernanceMock', {
      libraries: {
        ComparisonOpcodes: comparisonOpcodesLibAddr,
        BranchingOpcodes: branchingOpcodesLibAddr,
        LogicalOpcodes: logicalOpcodesLibAddr,
        OtherOpcodes: otherOpcodesLibAddr,
        Executor: executorLibAddr,
      },
    });
    app = await MockContract.deploy(parserAddr, alice.address, tokenAddr, NEXT_MONTH);
    await app.deployed();
    context = await app.context();
    conditionContext = await app.conditionContext();
  });

  beforeEach(async () => {
    snapshotId = await network.provider.send('evm_snapshot');
  });

  afterEach(async () => {
    // Return to the snapshot
    await network.provider.send('evm_revert', [snapshotId]);
  });

  it('constructor params are set correctly', async () => {
    expect(await app.ownerAddr()).to.be.equal(alice.address);
    expect(await app.deadline()).to.be.equal(NEXT_MONTH);
    expect(await app.getActiveRecordsLen()).to.be.equal(4);
    expect(await app.recordIds(0)).to.be.equal(0);
    expect(await app.recordIds(1)).to.be.equal(1);
    expect(await app.recordIds(2)).to.be.equal(2);
    expect(await app.recordIds(3)).to.be.equal(3);

    let record = await app.records(0);
    expect(record.transactionString).to.be.equal(record1);
    expect(record.isActive).to.be.equal(true);
    expect(record.isArchived).to.be.equal(false);
    record = await app.records(1);
    expect(record.transactionString).to.be.equal(record2);
    expect(record.isActive).to.be.equal(true);
    expect(record.isArchived).to.be.equal(false);
    record = await app.records(2);
    expect(record.transactionString).to.be.equal(record3);
    expect(record.isActive).to.be.equal(true);
    expect(record.isArchived).to.be.equal(false);
    record = await app.records(3);
    expect(record.transactionString).to.be.equal(record4);
    expect(record.isActive).to.be.equal(true);
    expect(record.isArchived).to.be.equal(false);
    // checks that the 5th one does not exist
    record = await app.records(5);
    expect(record.transactionString).to.be.equal('');
  });

  it('4 pre-defined records can be executed', async () => {
    // create Stack instance
    const ctx = await ethers.getContractAt('ContextMock', context);
    const stackAddr = await ctx.stack();
    const stack = await ethers.getContractAt('Stack', stackAddr);

    // check that stack is empty for the Aggreement2
    await checkStackTail(stack, []);

    let stackLen = await stack.length();
    expect(stackLen).to.be.equal(0);
    let record = await app.records(ID1);
    expect(record.isExecuted).to.be.equal(false);

    await app.parse(record1, context, preprAddr);
    await app.parse('bool true', conditionContext, preprAddr);
    expect(await app.connect(alice).execute(ID1));
    record = await app.records(ID1);
    expect(record.isExecuted).to.be.equal(true);
    await expect(app.connect(alice).execute(ID1)).to.be.revertedWith('AGR7');
    // value for record1
    await checkStackTail(stack, [4]);

    // check the second record
    await app.parse(record2, context, preprAddr);
    expect(await app.connect(alice).execute(ID2));
    record = await app.records(ID2);
    expect(record.isExecuted).to.be.equal(true);
    await expect(app.connect(alice).execute(ID2)).to.be.revertedWith('AGR7');
    // value for record2
    await checkStackTail(stack, [6]);

    // check the third record
    await app.parse(record3, context, preprAddr);
    expect(await app.connect(alice).execute(ID3));
    record = await app.records(ID3);
    expect(record.isExecuted).to.be.equal(true);
    await expect(app.connect(alice).execute(ID3)).to.be.revertedWith('AGR7');
    // value for record3
    await checkStackTail(stack, [8]);

    // check the forth record
    await app.parse(record4, context, preprAddr);
    expect(await app.connect(alice).execute(ID4));
    record = await app.records(ID4);
    expect(record.isExecuted).to.be.equal(true);
    await expect(app.connect(alice).execute(ID4)).to.be.revertedWith('AGR7');
    // value for record4
    await checkStackTail(stack, [1]);
  });

  it('4 pre-defined records cannot be activated', async () => {
    // check the first recors
    let record = await app.records(ID1);
    expect(record.isActive).to.be.equal(true);
    record = await app.records(ID2);
    expect(record.isActive).to.be.equal(true);
    record = await app.records(ID3);
    expect(record.isActive).to.be.equal(true);
    record = await app.records(ID4);
    expect(record.isActive).to.be.equal(true);

    await expect(app.connect(alice).deactivateRecord(ID1)).to.be.revertedWith('AGR14');
    await expect(app.connect(alice).deactivateRecord(ID2)).to.be.revertedWith('AGR14');
    await expect(app.connect(alice).deactivateRecord(ID3)).to.be.revertedWith('AGR14');
    await expect(app.connect(alice).deactivateRecord(ID4)).to.be.revertedWith('AGR14');

    record = await app.records(ID1);
    expect(record.isActive).to.be.equal(true);
    record = await app.records(ID2);
    expect(record.isActive).to.be.equal(true);
    record = await app.records(ID3);
    expect(record.isActive).to.be.equal(true);
    record = await app.records(ID4);
    expect(record.isActive).to.be.equal(true);

    await expect(app.connect(alice).activateRecord(ID1)).to.be.revertedWith('AGR14');
    await expect(app.connect(alice).activateRecord(ID2)).to.be.revertedWith('AGR14');
    await expect(app.connect(alice).activateRecord(ID3)).to.be.revertedWith('AGR14');
    await expect(app.connect(alice).activateRecord(ID4)).to.be.revertedWith('AGR14');

    record = await app.records(ID1);
    expect(record.isActive).to.be.equal(true);
    record = await app.records(ID2);
    expect(record.isActive).to.be.equal(true);
    record = await app.records(ID3);
    expect(record.isActive).to.be.equal(true);
    record = await app.records(ID4);
    expect(record.isActive).to.be.equal(true);
  });

  it('4 pre-defined records cannot be archived', async () => {
    let record = await app.records(ID1);
    expect(record.isArchived).to.be.equal(false);
    record = await app.records(ID2);
    expect(record.isArchived).to.be.equal(false);
    record = await app.records(ID3);
    expect(record.isArchived).to.be.equal(false);
    record = await app.records(ID4);
    expect(record.isArchived).to.be.equal(false);

    await expect(app.connect(alice).archiveRecord(ID1)).to.be.revertedWith('AGR14');
    await expect(app.connect(alice).archiveRecord(ID2)).to.be.revertedWith('AGR14');
    await expect(app.connect(alice).archiveRecord(ID3)).to.be.revertedWith('AGR14');
    await expect(app.connect(alice).archiveRecord(ID4)).to.be.revertedWith('AGR14');

    record = await app.records(ID1);
    expect(record.isArchived).to.be.equal(false);
    record = await app.records(ID2);
    expect(record.isArchived).to.be.equal(false);
    record = await app.records(ID3);
    expect(record.isArchived).to.be.equal(false);
    record = await app.records(ID4);
    expect(record.isArchived).to.be.equal(false);

    await expect(app.connect(alice).unarchiveRecord(ID1)).to.be.revertedWith('AGR14');
    await expect(app.connect(alice).unarchiveRecord(ID2)).to.be.revertedWith('AGR14');
    await expect(app.connect(alice).unarchiveRecord(ID3)).to.be.revertedWith('AGR14');
    await expect(app.connect(alice).unarchiveRecord(ID4)).to.be.revertedWith('AGR14');

    record = await app.records(ID1);
    expect(record.isArchived).to.be.equal(false);
    record = await app.records(ID2);
    expect(record.isArchived).to.be.equal(false);
    record = await app.records(ID3);
    expect(record.isArchived).to.be.equal(false);
    record = await app.records(ID4);
    expect(record.isArchived).to.be.equal(false);
  });

  it('4 pre-defined records cannot be updated', async () => {
    await expect(
      app
        .connect(alice)
        .update(ID1, [], [bob.address], 'uint256 111', ['2 < 3'], context, [context])
    ).to.be.revertedWith('AGR14');

    await expect(
      app
        .connect(alice)
        .update(ID2, [], [bob.address], 'uint256 111', ['2 < 3'], context, [context])
    ).to.be.revertedWith('AGR14');

    await expect(
      app
        .connect(alice)
        .update(ID3, [], [bob.address], 'uint256 111', ['2 < 3'], context, [context])
    ).to.be.revertedWith('AGR14');

    await expect(
      app
        .connect(alice)
        .update(ID4, [], [bob.address], 'uint256 111', ['2 < 3'], context, [context])
    ).to.be.revertedWith('AGR14');

    // double check that DSL string code still are the same
    let record = await app.records(0);
    expect(record.transactionString).to.be.equal(record1);
    record = await app.records(1);
    expect(record.transactionString).to.be.equal(record2);
    record = await app.records(2);
    expect(record.transactionString).to.be.equal(record3);
    record = await app.records(3);
    expect(record.transactionString).to.be.equal(record4);
  });
});
