import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import * as hre from 'hardhat';
import { ParserMock } from '../../typechain-types/dsl/mocks';
import { hex4Bytes, checkStackTail } from '../utils/utils';
import { deployAgreementMock, deployParserMock } from '../../scripts/utils/deploy.utils.mock';
import {
  setApp,
  activateRecord,
  deactivateRecord,
  archiveRecord,
  unarchiveRecord,
  setRecord,
  setRecords,
  parseConditions,
  parseConditionsList,
} from '../../scripts/utils/update.record.mock';

import { deployPreprocessor } from '../../scripts/utils/deploy.utils';
import { AgreementMock, ContextMock__factory } from '../../typechain-types';
import { anyone, ONE_MONTH } from '../utils/constants';
import { Records } from '../types';
import { MultisigMock } from '../../typechain-types/agreement/mocks/MultisigMock';

const { ethers, network } = hre;
// TODO: rename everywhere in the project 'Conditional Transactions' to 'Records'

describe('Simple Records in Agreement', () => {
  let app: AgreementMock;
  let multisig: MultisigMock;
  let appAddr: string;
  let parser: ParserMock;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let anybody: SignerWithAddress;
  let NEXT_MONTH: number;
  let snapshotId: number;
  let preprAddr: string;
  let ContextCont: ContextMock__factory;

  const oneEth = ethers.utils.parseEther('1');
  const tenTokens = ethers.utils.parseEther('10');

  let records: Records[] = [];

  before(async () => {
    multisig = await (await ethers.getContractFactory('MultisigMock')).deploy();
    const LAST_BLOCK_TIMESTAMP = (
      await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
    ).timestamp;
    NEXT_MONTH = LAST_BLOCK_TIMESTAMP + ONE_MONTH;

    [alice, bob, anybody] = await ethers.getSigners();

    // Deploy contracts
    appAddr = await deployAgreementMock(hre, multisig.address);
    preprAddr = await deployPreprocessor(hre);
    app = await ethers.getContractAt('AgreementMock', appAddr);
    ContextCont = await ethers.getContractFactory('ContextMock');

    const parserAddr = await deployParserMock(hre);
    parser = await ethers.getContractAt('ParserMock', parserAddr);

    // Set variables
    await app.setStorageAddress(hex4Bytes('RECEIVER'), bob.address);
    await app.setStorageUint256(hex4Bytes('LOCK_TIME'), NEXT_MONTH);

    // TODO: Tests can be simplified more to decrease time for its execution
    snapshotId = await network.provider.send('evm_snapshot');
  });

  afterEach(async () => {
    // Return to the snapshot
    await network.provider.send('evm_revert', [snapshotId]);
    records = [];
  });

  describe('`anyone` address in the signatories', () => {
    it('should revert if `anyone` address is the last address in the list', async () => {
      // it not possible to update transaction with alice, bobo and 0xFfFF address
      const signatories = [alice.address, bob.address, anyone];
      await expect(app.addRecordBlueprint(1, [], signatories)).to.be.revertedWith('AGR4');
    });

    it('should revert if `anyone` address is the first address in the list', async () => {
      const signatories = [anyone, bob.address, alice.address];
      await expect(app.addRecordBlueprint(1, [], signatories)).to.be.revertedWith('AGR4');
    });

    it('should revert if `anyone` and zero addresses in the list', async () => {
      const signatories = [ethers.constants.AddressZero, anyone];
      await expect(app.addRecordBlueprint(1, [], signatories)).to.be.revertedWith('AGR4');
    });

    it('should revert if `anyone` was provided twice', async () => {
      const signatories = [anyone, anyone];
      await expect(app.addRecordBlueprint(1, [], signatories)).to.be.revertedWith('AGR4');
    });

    it('should revert if signatories was not provided', async () => {
      await expect(app.addRecordBlueprint(1, [], [])).to.be.revertedWith('AGR4');
    });

    it('should revert if `zeroAddress` address is the in the list', async () => {
      const signatories = [bob.address, alice.address, ethers.constants.AddressZero];
      await expect(app.addRecordBlueprint(1, [], signatories)).to.be.revertedWith('AGR4');
    });
  });

  describe('Check statuses. Single record', () => {
    let recordId: number;
    let signatories: string[] = [];
    let conditionString: string;
    let transactionStr: string;
    let recordContextAddr: string;
    let localSnapshotId: number;

    before(async () => {
      const ContextMock = await ethers.getContractFactory('ContextMock');
      const recordContext = await ContextMock.deploy();
      const conditionContext = await ContextMock.deploy();
      recordContextAddr = recordContext.address;
      await setApp(recordContext, app, alice.address);
      await setApp(conditionContext, app, alice.address);

      recordId = 95;
      signatories = [alice.address];
      conditionString = 'blockTimestamp > var LOCK_TIME';
      transactionStr = 'sendEth RECEIVER 1000000000000000000';

      // Set record
      await app.addRecordBlueprint(recordId, [], signatories);
      await app.addRecordCondition(recordId, conditionString, conditionContext.address);
      await app.addRecordTransaction(recordId, transactionStr, recordContext.address);

      localSnapshotId = await network.provider.send('evm_snapshot');
    });

    afterEach(async () => {
      // Return to the snapshot
      await network.provider.send('evm_revert', [localSnapshotId]);
    });

    it('record with one transaction', async () => {
      await activateRecord(app, multisig, recordId);
      // Parse all conditions and a transaction
      const condCtxLen = (await app.conditionContextsLen(recordId)).toNumber();
      expect(condCtxLen).to.equal(1);

      await parseConditions(recordId, parser, app, preprAddr);
      await parser.parse(preprAddr, recordContextAddr, transactionStr);

      // Top up contract
      await anybody.sendTransaction({ to: app.address, value: oneEth });

      // Execute transaction
      await expect(app.connect(alice).execute(recordId)).to.be.revertedWith('AGR6');

      // Validate
      expect(await app.callStatic.validateConditions(recordId, 0)).equal(false);

      // Advance time
      // await ethers.provider.send('evm_increaseTime', [ONE_MONTH + ONE_MONTH]);
      await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
      await parseConditions(recordId, parser, app, preprAddr);

      // Validate again
      expect(await app.callStatic.validateConditions(recordId, 0)).equal(true);

      await expect(await app.fulfill(recordId, 0, alice.address)).to.changeEtherBalance(
        bob,
        oneEth
      );
      await expect(app.fulfill(recordId, 0, alice.address)).to.be.revertedWith('AGR7');
    });

    it('active record', async () => {
      let record = await app.records(recordId);
      // Check that record deactivated yet
      expect(record.isActive).to.be.equal(false);

      // Check that record does not exist when unArchiveRecord
      // AGR9
      await expect(activateRecord(app, multisig, 999)).to.be.revertedWith('Delegate call failure');

      // Check that record was activated
      await activateRecord(app, multisig, recordId);
      record = await app.records(recordId);
      expect(record.isActive).to.be.equal(true);

      // Check that record was deactivated
      await deactivateRecord(app, multisig, recordId);
      record = await app.records(recordId);
      expect(record.isActive).to.be.equal(false);

      // Check that additional deactivating will reverted
      await expect(deactivateRecord(app, multisig, recordId)).to.be.revertedWith(
        'Delegate call failure'
      ); // AGR10

      // Check that record does not exist when unArchiveRecord
      // AGR9
      await expect(deactivateRecord(app, multisig, 999)).to.be.revertedWith(
        'Delegate call failure'
      );

      // Check that record can be activated after deactivated status
      await activateRecord(app, multisig, recordId);
      record = await app.records(recordId);
      expect(record.isActive).to.be.equal(true);
    });

    it('archived record', async () => {
      let record = await app.records(recordId);
      // Check that record is not archived yet
      expect(record.isArchived).to.be.equal(false);

      // Check that record is archived
      await archiveRecord(app, multisig, recordId);
      record = await app.records(recordId);
      expect(record.isArchived).to.be.equal(true);

      // Check that record does not exist
      // AGR9
      await expect(archiveRecord(app, multisig, 999)).to.be.revertedWith('Delegate call failure');

      // Check that archived record is still archived
      await archiveRecord(app, multisig, recordId);
      record = await app.records(recordId);
      expect(record.isArchived).to.be.equal(true);

      // Check that record is unArchived
      await unarchiveRecord(app, multisig, recordId);
      record = await app.records(recordId);
      expect(record.isArchived).to.be.equal(false);

      // Check that secondary unAchived will reverted
      await expect(unarchiveRecord(app, multisig, recordId)).to.be.revertedWith(
        'Delegate call failure'
      ); // AGR10

      // Check that returns error if executed unArchiveRecord for not-existing record
      // AGR9
      await expect(unarchiveRecord(app, multisig, 999)).to.be.revertedWith('Delegate call failure');

      // Check that archived record is archived after unarchived processing
      await archiveRecord(app, multisig, recordId);
      record = await app.records(recordId);
      expect(record.isArchived).to.be.equal(true);
    });

    it('activates one existing record through DSL', async () => {
      // This test works. It can be used if needs to activate
      // only one record for two different agreements

      // creates Agreement2
      // Agreement is the owner of Agreement2
      const aggr1 = app; // just to have normal names inside this test
      const aggr2Addr = await deployAgreementMock(hre, appAddr);

      const aggr2 = await ethers.getContractAt('AgreementMock', aggr2Addr);
      const input = `enableRecord 23 at ${aggr2Addr}`;

      // uses for the Agreement2 (test will check that stack has
      // value `6` after execution)
      const input2 = 'uint256 6';

      // record for the main agreement
      const record = {
        recordId: 13,
        requiredRecords: [],
        signatories: [bob.address],
        transactionStr: input, // enables record for the additional agreement
        conditionStrings: ['bool true'],
        transactionCtx: await ContextCont.deploy(),
        conditionContexts: [await ContextCont.deploy()],
      };

      // record for the Agreement2
      const record2 = {
        recordId: 23,
        requiredRecords: [],
        signatories: [bob.address],
        transactionStr: input2,
        conditionStrings: ['bool true'],
        transactionCtx: await ContextCont.deploy(),
        conditionContexts: [await ContextCont.deploy()],
      };

      const { conditionContexts: CC1, transactionCtx: TC1 } = record;
      const { conditionContexts: CC2, transactionCtx: TC2 } = record2;

      // the record sets to the apps

      await setRecord(record, aggr1);
      await setRecord(record2, aggr2);

      // Set Agreement and Agreement2 addresses & msg senders
      await setApp(TC1, aggr1, bob.address);
      await setApp(TC2, aggr2, bob.address);
      await setApp(CC1[0], aggr1, bob.address);
      await setApp(CC2[0], aggr2, bob.address);

      // parse all conditions and a transaction #1
      await parseConditions(13, parser, aggr1, preprAddr);
      await parser.parse(preprAddr, record.transactionCtx.address, record.transactionStr);

      // parse all conditions and a transaction #2
      await parseConditions(23, parser, aggr2, preprAddr);
      await parser.parse(preprAddr, record2.transactionCtx.address, record2.transactionStr);

      // check that record can be activated for the main Aggreement
      let recordResult = await aggr1.records(13);
      expect(recordResult.isActive).to.be.equal(false);
      await activateRecord(aggr1, multisig, 13);
      recordResult = await aggr1.records(13);
      expect(recordResult.isActive).to.be.equal(true);

      // check that record for the Aggreement2 can NOT be executed
      await expect(aggr2.connect(bob).execute(23)).to.be.revertedWith('AGR13');

      // check that record is not activated for the additional aggreement
      recordResult = await aggr2.records(23);
      expect(recordResult.isActive).to.be.equal(false);

      // execute 13 record that activates the 13 record in Aggreement2
      await aggr1.connect(bob).execute(13);

      // check that record is activated for the Aggreement2
      recordResult = await aggr2.records(23);
      expect(recordResult.isActive).to.be.equal(true);

      // create Stack instance
      const stackAddr = await TC2.stack();
      const stack = await ethers.getContractAt('Stack', stackAddr);

      // check that stack is empty for the Aggreement2
      await checkStackTail(stack, []);

      // check that record for the Aggreement2 can be executed
      await aggr2.connect(bob).execute(23);

      // check that stack was changed for the Aggreement2
      // because of result of `uint256 6` (check input2)
      await checkStackTail(stack, [6]);
    });

    it('activates several existing records for two agreements', async () => {
      // creates Agreement2 + Agreement3
      // Agreement is the owner of Agreement2 and Agreement3
      const aggr1 = app; // just to have normal names inside this test
      const aggr2Addr = await deployAgreementMock(hre, appAddr);
      const aggr3Addr = await deployAgreementMock(hre, appAddr);

      const aggr2 = await ethers.getContractAt('AgreementMock', aggr2Addr);
      const aggr3 = await ethers.getContractAt('AgreementMock', aggr3Addr);

      // uses for the Agreement
      const input = `
        enableRecord 34 at ${aggr2Addr}
        enableRecord 15 at ${aggr2Addr}
        enableRecord 41 at ${aggr3Addr}
      `;
      // uses for the Agreement2
      const input2 = 'uint256 6';
      const input21 = 'uint256 66';
      // uses for the Agreement3
      const input3 = 'uint256 45';

      // record for the main Agreement
      const record = {
        recordId: 40,
        requiredRecords: [],
        signatories: [bob.address],
        transactionStr: input, // enables records2 and record3
        conditionStrings: ['bool true'],
        transactionCtx: await ContextCont.deploy(),
        conditionContexts: [await ContextCont.deploy()],
      };

      // records for the Agreement2
      const records2 = [
        {
          recordId: 34,
          requiredRecords: [],
          signatories: [bob.address],
          transactionStr: input2,
          conditionStrings: ['bool true'],
          transactionCtx: await ContextCont.deploy(),
          conditionContexts: [await ContextCont.deploy()],
        },
        {
          recordId: 15,
          requiredRecords: [],
          signatories: [bob.address],
          transactionStr: input21,
          conditionStrings: ['bool true'],
          transactionCtx: await ContextCont.deploy(),
          conditionContexts: [await ContextCont.deploy()],
        },
      ];

      // record for the Agreement3
      const record3 = {
        recordId: 41,
        requiredRecords: [],
        signatories: [bob.address],
        transactionStr: input3,
        conditionStrings: ['bool true'],
        transactionCtx: await ContextCont.deploy(),
        conditionContexts: [await ContextCont.deploy()],
      };

      const { conditionContexts: CC, transactionCtx: TC } = record;
      const { conditionContexts: CC2, transactionCtx: TC2 } = records2[0];
      const { conditionContexts: CC21, transactionCtx: TC21 } = records2[1];
      const { conditionContexts: CC3, transactionCtx: TC3 } = record3;

      // the record sets to the Agreement, Agreement2, Agreement3
      await setRecord(record, aggr1);
      await setRecords(records2, aggr2);
      await setRecord(record3, aggr3);

      // Set Agreement, Agreement2, Agreement3 addresses & msg senders
      // params: context, agreement, msg.sender
      await setApp(TC, aggr1, bob.address);
      await setApp(TC2, aggr2, bob.address);
      await setApp(TC21, aggr2, bob.address);
      await setApp(TC3, aggr3, bob.address);
      await setApp(CC[0], aggr1, bob.address);
      await setApp(CC2[0], aggr2, bob.address);
      await setApp(CC21[0], aggr2, bob.address);
      await setApp(CC3[0], aggr3, bob.address);

      // parse all conditions and a transactions
      await parseConditions(40, parser, aggr1, preprAddr);
      await parseConditionsList([34, 15], parser, aggr2, preprAddr);
      await parseConditions(41, parser, aggr3, preprAddr);
      await parser.parse(preprAddr, TC.address, record.transactionStr);
      await parser.parse(preprAddr, TC2.address, records2[0].transactionStr);
      await parser.parse(preprAddr, TC21.address, records2[1].transactionStr);
      await parser.parse(preprAddr, TC3.address, record3.transactionStr);

      // check that record can be activated for the main Aggreement
      let recordResult = await aggr1.records(40);
      expect(recordResult.isActive).to.be.equal(false);
      await activateRecord(aggr1, multisig, 40);
      recordResult = await aggr1.records(40);
      expect(recordResult.isActive).to.be.equal(true);

      // check that records for the Aggreement2 and Aggreement3 can NOT be executed
      await expect(aggr2.connect(bob).execute(34)).to.be.revertedWith('AGR13');
      await expect(aggr2.connect(bob).execute(15)).to.be.revertedWith('AGR13');
      await expect(aggr3.connect(bob).execute(41)).to.be.revertedWith('AGR13');

      // check that records is not activated for the Aggreement2 and Aggreement3
      recordResult = await aggr2.records(34);
      expect(recordResult.isActive).to.be.equal(false);
      recordResult = await aggr2.records(15);
      expect(recordResult.isActive).to.be.equal(false);
      recordResult = await aggr2.records(41);
      expect(recordResult.isActive).to.be.equal(false);

      // execute 40 record that activates the 34, 15, 41 record in Aggreement2, Aggreement3
      await aggr1.connect(bob).execute(40);

      // check that record is activated for the Aggreement2
      recordResult = await aggr2.records(34);
      expect(recordResult.isActive).to.be.equal(true);
      recordResult = await aggr2.records(15);
      expect(recordResult.isActive).to.be.equal(true);
      recordResult = await aggr3.records(41);
      expect(recordResult.isActive).to.be.equal(true);

      // create Stack instance for Aggreement2
      const stackAddr2 = await TC2.stack();
      const stackAddr21 = await TC21.stack();
      const stackAddr3 = await TC3.stack();
      const stack2 = await ethers.getContractAt('Stack', stackAddr2);
      const stack21 = await ethers.getContractAt('Stack', stackAddr21);
      const stack3 = await ethers.getContractAt('Stack', stackAddr3);

      // check that stack is empty for the Aggreement2, Aggreement3
      await checkStackTail(stack2, []);
      await checkStackTail(stack21, []);
      await checkStackTail(stack3, []);

      // check that records for the Aggreement2 and Aggreement2 can be executed
      await aggr2.connect(bob).execute(34);
      await aggr2.connect(bob).execute(15);
      await aggr3.connect(bob).execute(41);

      // check that stacks were changed for the Aggreement2, Aggreement3
      await checkStackTail(stack2, [6]);
      await checkStackTail(stack21, [66]);
      await checkStackTail(stack3, [45]);
    });
  });

  describe('Get actual record Id', () => {
    let localSnapshotId: number;

    before(async () => {
      const ContextMock = await ethers.getContractFactory('ContextMock');
      const recordContext = await ContextMock.deploy();
      const conditionContext = await ContextMock.deploy();

      records.push(
        {
          recordId: 96,
          requiredRecords: [],
          signatories: [alice.address],
          transactionStr: 'sendEth RECEIVER 1000000000000000000',
          conditionStrings: ['blockTimestamp > var LOCK_TIME'],
          transactionCtx: recordContext,
          conditionContexts: [conditionContext],
        },
        {
          recordId: 956,
          requiredRecords: [],
          signatories: [alice.address],
          transactionStr: 'sendEth RECEIVER 1000000000000000000',
          conditionStrings: ['blockTimestamp > var LOCK_TIME'],
          transactionCtx: recordContext,
          conditionContexts: [conditionContext],
        },
        {
          recordId: 11111,
          requiredRecords: [],
          signatories: [alice.address],
          transactionStr: 'sendEth RECEIVER 1000000000000000000',
          conditionStrings: ['blockTimestamp > var LOCK_TIME'],
          transactionCtx: recordContext,
          conditionContexts: [conditionContext],
        }
      );

      // Set records
      for (let i = 0; i < records.length; i++) {
        const { recordId, conditionContexts, transactionCtx, transactionStr } = records[i];

        await setRecord(records[i], app);

        // Set app and msg senders
        await setApp(recordContext, app, alice.address);
        await setApp(conditionContexts[0], app, alice.address);

        await parseConditions(recordId, parser, app, preprAddr);
        await parser.parse(preprAddr, transactionCtx.address, transactionStr);

        // Top up contract
        await anybody.sendTransaction({ to: app.address, value: oneEth });

        // Advance time
        // await ethers.provider.send('evm_increaseTime', [ONE_MONTH + ONE_MONTH]);
        await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
        await parseConditions(recordId, parser, app, preprAddr);

        // Validate again
        expect(await app.callStatic.validateConditions(recordId, 0)).equal(true);
      }

      expect(records.length).equal(3);
    });

    beforeEach(async () => {
      localSnapshotId = await network.provider.send('evm_snapshot');
    });

    afterEach(async () => {
      // Return to the snapshot
      await network.provider.send('evm_revert', [localSnapshotId]);
    });

    it('Should return empty records Ids when all stil deactivated', async () => {
      const actualRecords = await app.getActiveRecords();
      expect(actualRecords.map((v) => v.toNumber())).eql([]);
    });

    it('Should return all of record Ids when all active', async () => {
      await activateRecord(app, multisig, 96);
      await activateRecord(app, multisig, 956);
      await activateRecord(app, multisig, 11111);
      const actualRecords = await app.getActiveRecords();
      expect(actualRecords.map((v) => v.toNumber())).eql([96, 956, 11111]);
    });

    it('Should return record Ids [96, 956] when 11111 archived', async () => {
      await activateRecord(app, multisig, 96);
      await activateRecord(app, multisig, 956);
      await activateRecord(app, multisig, 11111);
      await archiveRecord(app, multisig, 11111);
      const notArchivedRecords = await app.getActiveRecords();
      expect(notArchivedRecords.map((v) => v.toNumber())).eql([96, 956]);
    });

    it('Should return [] when all archived', async () => {
      await activateRecord(app, multisig, 96);
      await activateRecord(app, multisig, 956);
      await activateRecord(app, multisig, 11111);
      await archiveRecord(app, multisig, 96);
      await archiveRecord(app, multisig, 956);
      await archiveRecord(app, multisig, 11111);
      const notArchivedRecords = await app.getActiveRecords();
      expect(notArchivedRecords).eql([]);
    });

    it('Should return [956, 11111] when 96 executed', async () => {
      await activateRecord(app, multisig, 96);
      await activateRecord(app, multisig, 956);
      await activateRecord(app, multisig, 11111);
      await app.fulfill(96, 0, alice.address);
      const notArchivedRecords = await app.getActiveRecords();
      expect(notArchivedRecords.map((v) => v.toNumber())).eql([956, 11111]);
    });

    it('Should return [] when all executed', async () => {
      await activateRecord(app, multisig, 96);
      await activateRecord(app, multisig, 956);
      await activateRecord(app, multisig, 11111);
      await app.fulfill(96, 0, alice.address);
      await app.fulfill(956, 0, alice.address);
      await app.fulfill(11111, 0, alice.address);
      const notArchivedRecords = await app.getActiveRecords();
      expect(notArchivedRecords).eql([]);
    });

    it('Should return [96] when 956 activated and archived + 11111 just archived', async () => {
      await activateRecord(app, multisig, 96);
      await activateRecord(app, multisig, 956);
      await archiveRecord(app, multisig, 956);
      await archiveRecord(app, multisig, 11111);
      const notArchivedRecords = await app.getActiveRecords();
      expect(notArchivedRecords.map((v) => v.toNumber())).eql([96]);
    });
  });

  describe('Scenarios', () => {
    it('borrower/lender scenario', async () => {
      // Deploy Token contract
      const token = await (await ethers.getContractFactory('Token'))
        .connect(bob)
        .deploy(ethers.utils.parseEther('1000'));

      // Set variables
      await app.setStorageAddress(hex4Bytes('ETH_RECEIVER'), bob.address);
      await app.setStorageAddress(hex4Bytes('TOKEN_RECEIVER'), alice.address);
      await app.setStorageUint256(hex4Bytes('LOCK_TIME'), NEXT_MONTH);
      await app.setStorageUint256(hex4Bytes('TOKEN_ADDR'), token.address);

      // Define Records
      records.push(
        {
          recordId: 1,
          requiredRecords: [],
          signatories: [alice.address],
          transactionStr: 'sendEth ETH_RECEIVER 1000000000000000000',
          conditionStrings: ['bool true'],
          transactionCtx: await ContextCont.deploy(),
          conditionContexts: [await ContextCont.deploy()],
        },
        {
          recordId: 2,
          requiredRecords: [],
          signatories: [bob.address],
          transactionStr: `transfer TOKEN_ADDR TOKEN_RECEIVER ${tenTokens}`,
          conditionStrings: ['blockTimestamp > var LOCK_TIME'],
          transactionCtx: await ContextCont.deploy(),
          conditionContexts: [await ContextCont.deploy()],
        }
      );

      await setRecords(records, app);
      const { recordId: recordId0 } = records[0];
      const { recordId: recordId1 } = records[1];
      expect(records.length).equal(2);

      // Set app addresses & msg senders
      await setApp(records[0].transactionCtx, app, alice.address);
      await setApp(records[0].conditionContexts[0], app, alice.address);
      await setApp(records[1].transactionCtx, app, bob.address);
      await setApp(records[1].conditionContexts[0], app, bob.address);

      // Parse all conditions and a transaction #1
      await parseConditions(recordId0, parser, app, preprAddr);
      await parser.parse(preprAddr, records[0].transactionCtx.address, records[0].transactionStr);

      // Parse all conditions and a transaction #2
      await parseConditions(recordId1, parser, app, preprAddr);
      await parser.parse(preprAddr, records[1].transactionCtx.address, records[1].transactionStr);

      // Top up contract (ETH)
      await anybody.sendTransaction({ to: app.address, value: oneEth });

      // Top up contract (tokens)
      await token.transfer(app.address, tenTokens);
      expect(await token.balanceOf(app.address)).to.equal(tenTokens);

      // Execute transactions
      await expect(await app.fulfill(recordId0, 0, alice.address)).to.changeEtherBalance(
        bob,
        oneEth
      );
      await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
      await expect(() => app.fulfill(recordId1, 0, bob.address)).to.changeTokenBalance(
        token,
        alice,
        tenTokens
      );
    });
  });

  describe('More than one condition', () => {
    it('checks length of the condition strings', async () => {
      const record = {
        recordId: 9,
        requiredRecords: [],
        signatories: [alice.address],
        transactionStr: 'transferFromVar DAI GP TRANSACTIONS_CONT GP_REMAINING',
        conditionStrings: [
          `var GP_INITIAL +
          var LP_TOTAL >= var INITIAL_FUNDS_TARGET`,
          `(var DEPOSIT_MIN_PERCENT * var LP_TOTAL
              / var P1) setUint256 TWO_PERCENT`,
          `
          (var TWO_PERCENT > var GP_INITIAL)
          ifelse POS NEG
          end
          POS {
            (var TWO_PERCENT - var GP_INITIAL
            ) setUint256 GP_REMAINING
          }
          NEG {
            0 setUint256 GP_REMAINING
          }`,
          'time >= var LOW_LIM',
          'time <= var UP_LIM',
          `(balanceOf DAI TRANSACTIONS_CONT) >=
              ((var INITIAL_FUNDS_TARGET * var P1) / 100)`,
        ],
        transactionCtx: await ContextCont.deploy(),
        conditionContexts: [
          await ContextCont.deploy(),
          await ContextCont.deploy(),
          await ContextCont.deploy(),
          await ContextCont.deploy(),
          await ContextCont.deploy(),
          await ContextCont.deploy(),
        ],
      };

      await setRecord(record, app);
      const condStrLen = (await app.conditionStringsLen(9)).toNumber();
      expect(condStrLen).to.equal(6);
    });
  });

  describe('Required records', () => {
    it('validate', async () => {
      // Deploy Token contract
      const token = await (await ethers.getContractFactory('Token'))
        .connect(bob)
        .deploy(ethers.utils.parseEther('1000'));

      // Set variables
      await app.setStorageAddress(hex4Bytes('TOKEN_ADDR'), token.address);
      await app.setStorageAddress(hex4Bytes('BOB'), bob.address);
      await app.setStorageAddress(hex4Bytes('ALICE'), alice.address);
      await app.setStorageUint256(hex4Bytes('LOCK_TIME'), NEXT_MONTH);

      const record = {
        recordId: 8,
        requiredRecords: [3],
        signatories: [bob.address],
        transactionStr: `transferFrom TOKEN_ADDR BOB ALICE ${tenTokens.toString()}`,
        conditionStrings: ['blockTimestamp > var LOCK_TIME'],
        transactionCtx: await ContextCont.deploy(),
        conditionContexts: [await ContextCont.deploy()],
      };

      const { recordId, conditionContexts, transactionCtx, transactionStr } = record;

      await setRecord(record, app);

      // Set app addresses & msg senders
      await setApp(transactionCtx, app, alice.address);
      await setApp(conditionContexts[0], app, alice.address);

      // Parse all conditions and a transaction
      const condCtxLen = (await app.conditionContextsLen(recordId)).toNumber();
      expect(condCtxLen).to.equal(1);
      const condStrLen = (await app.conditionStringsLen(recordId)).toNumber();
      expect(condStrLen).to.equal(1);

      await parseConditions(recordId, parser, app, preprAddr);
      await parser.parse(preprAddr, transactionCtx.address, transactionStr);

      // Validate required records
      expect(await app.validateRequiredRecords(recordId)).equal(false);
    });
  });

  describe('Signatories', () => {
    it('verify', async () => {
      records.push({
        recordId: 7,
        requiredRecords: [],
        signatories: [bob.address],
        transactionStr: 'bool true',
        conditionStrings: ['bool true'],
        transactionCtx: await ContextCont.deploy(),
        conditionContexts: [await ContextCont.deploy()],
      });

      const { recordId, conditionContexts, transactionCtx, transactionStr } = records[0];

      await setRecord(records[0], app);

      // Set app addresses & msg senders
      await setApp(transactionCtx, app, alice.address);
      await setApp(conditionContexts[0], app, alice.address);

      // Parse all conditions and a transaction
      const condCtxLen = (await app.conditionContextsLen(recordId)).toNumber();
      expect(condCtxLen).to.equal(1);
      const condStrLen = (await app.conditionStringsLen(recordId)).toNumber();
      expect(condStrLen).to.equal(1);

      await parseConditions(recordId, parser, app, preprAddr);
      await parser.parse(preprAddr, transactionCtx.address, transactionStr);

      // Check signatories
      expect(await app.connect(alice).verify(recordId)).equal(false);
      expect(await app.connect(bob).verify(recordId)).equal(true);
    });

    it('more than one signatories', async () => {
      records.push({
        recordId: 12,
        requiredRecords: [],
        signatories: [alice.address, anybody.address],
        transactionStr: 'sendEth RECEIVER 1000000000000000000',
        conditionStrings: ['bool true'],
        transactionCtx: await ContextCont.deploy(),
        conditionContexts: [await ContextCont.deploy()],
      });

      const { recordId, conditionContexts, transactionCtx, transactionStr } = records[0];
      await setRecord(records[0], app);

      // Set app addresses & msg senders
      await setApp(transactionCtx, app, alice.address);
      await transactionCtx.setMsgSender(anybody.address);
      await setApp(conditionContexts[0], app, alice.address);
      await conditionContexts[0].setMsgSender(anybody.address);

      // Parse all conditions and a transaction
      const condCtxLen = (await app.conditionContextsLen(recordId)).toNumber();
      expect(condCtxLen).to.equal(1);
      const condStrLen = (await app.conditionStringsLen(recordId)).toNumber();
      expect(condStrLen).to.equal(1);
      await parseConditions(recordId, parser, app, preprAddr);
      await parser.parse(preprAddr, transactionCtx.address, transactionStr);

      // Top up contract
      await anybody.sendTransaction({ to: app.address, value: oneEth });

      // Execute first transaction
      await expect(await app.fulfill(recordId, 0, alice.address)).to.changeEtherBalance(
        bob,
        oneEth
      );

      // Top up contract
      await anybody.sendTransaction({ to: app.address, value: oneEth });

      // Execute second transaction
      await expect(await app.fulfill(recordId, 0, anybody.address)).to.changeEtherBalance(
        bob,
        oneEth
      );
    });
  });

  describe('Empty parameters', () => {
    it('check 0 conditions', async () => {
      const recordId = 3;
      const requiredRecords: any = [];
      const signatories = [bob.address];
      const transactionStr = '';
      const conditionStrings = [''];
      const transactionCtx = await ContextCont.deploy();
      const conditionContexts = [await ContextCont.deploy()];

      // Set conditional transaction
      await app.addRecordBlueprint(recordId, requiredRecords, signatories);
      for (let j = 0; j < conditionContexts.length; j++) {
        await expect(
          app.addRecordCondition(recordId, conditionStrings[j], conditionContexts[j].address)
        ).to.be.revertedWith('AGR5');
      }
      await expect(
        app.addRecordTransaction(recordId, transactionStr, transactionCtx.address)
      ).to.be.revertedWith('AGR5');
    });
  });
});
