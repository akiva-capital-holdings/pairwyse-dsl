import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import * as hre from 'hardhat';
import { ParserMock } from '../../typechain-types/dsl/mocks';
import { addSteps, hex4Bytes } from '../utils/utils';
import { deployAgreementMock, deployParserMock } from '../../scripts/utils/deploy.utils.mock';
import {
  activateRecord,
  deactivateRecord,
  archiveRecord,
  unarchiveRecord,
  setRecord,
  setRecords,
  parseConditions,
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

    // TODO: Make a snapshot. Test should not be depended on certain ID of record.
    // TODO: Tests can be simplified more to decrease time for its execution
    // snapshotId = await network.provider.send('evm_snapshot');
  });

  afterEach(async () => {
    // Return to the snapshot
    // await network.provider.send('evm_revert', [snapshotId]);
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
      await recordContext.setAppAddress(appAddr);
      const conditionContext = await ContextMock.deploy();
      recordContextAddr = recordContext.address;
      await conditionContext.setAppAddress(appAddr);

      recordId = 95;
      signatories = [alice.address];
      conditionString = 'blockTimestamp > var LOCK_TIME';
      transactionStr = 'sendEth RECEIVER 1000000000000000000';

      // Set record
      await app.addRecordBlueprint(recordId, [], signatories);
      await app.addRecordCondition(recordId, conditionString, conditionContext.address);
      await app.addRecordTransaction(recordId, transactionStr, recordContext.address);

      // Set msg senders
      await recordContext.setMsgSender(alice.address);
      await conditionContext.setMsgSender(alice.address);
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

      await parser.parse(
        preprAddr,
        await app.conditionContexts(recordId, 0),
        await app.conditionStrings(recordId, 0)
      );
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
      await parser.parse(
        preprAddr,
        await app.conditionContexts(recordId, 0),
        await app.conditionStrings(recordId, 0)
      );

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

    it.only('activates one existing record through DSL', async () => {
      // app Agreement is the owner of app2 Agreement
      let appAddr2 = await deployAgreementMock(hre, appAddr);
      let app2 = await ethers.getContractAt('AgreementMock', appAddr2);
      console.log(appAddr2);
      const input = `enable record 23 for ${appAddr2}`;

      // uses for the additional agreement (test will check that stack has last value `true` after execution)
      const input2 = `bool true`;

      // record for the main agreement
      let record = {
        recordId: 13,
        requiredRecords: [],
        signatories: [bob.address],
        transactionStr: input, // enables record for the additional agreement
        conditionStrings: ['bool true'],
        transactionCtx: await ContextCont.deploy(),
        conditionContexts: [await ContextCont.deploy()],
      };

      // record for the additional agreement
      let record2 = {
        recordId: 23,
        requiredRecords: [],
        signatories: [bob.address],
        transactionStr: input2,
        conditionStrings: ['bool true'],
        transactionCtx: await ContextCont.deploy(),
        conditionContexts: [await ContextCont.deploy()],
      };

      const {
        recordId: recordId1,
        conditionContexts: conditionContexts1,
        transactionCtx: transactionCtx1,
        transactionStr: transactionStr1,
      } = record;

      const {
        recordId: recordId2,
        conditionContexts: conditionContexts2,
        transactionCtx: transactionCtx2,
        transactionStr: transactionStr2,
      } = record2;

      // the record sets to the apps
      await setRecord(record, app);
      await setRecord(record2, app2);

      // Set app addresses & msg senders
      await transactionCtx1.setAppAddress(app.address);
      await transactionCtx1.setMsgSender(bob.address);
      await conditionContexts1[0].setAppAddress(app.address);
      await conditionContexts1[0].setMsgSender(bob.address);

      await transactionCtx2.setAppAddress(app2.address);
      await transactionCtx2.setMsgSender(bob.address);
      await conditionContexts2[0].setAppAddress(app2.address);
      await conditionContexts2[0].setMsgSender(bob.address);

      // Parse all conditions and a transaction #1
      await parseConditions(13, parser, app, preprAddr);
      await parser.parse(preprAddr, record.transactionCtx.address, record.transactionStr);

      // Parse all conditions and a transaction #2
      await parseConditions(23, parser, app2, preprAddr);
      await parser.parse(preprAddr, record2.transactionCtx.address, record2.transactionStr);

      // check that record can be activated for the main aggreement
      let recordResult = await app.records(13);
      expect(recordResult.isActive).to.be.equal(false);
      await activateRecord(app, multisig, 13);
      recordResult = await app.records(13);
      expect(recordResult.isActive).to.be.equal(true);

      // check that record is not activated for the additional aggreement
      recordResult = await app2.records(23);
      expect(recordResult.isActive).to.be.equal(false);

      // check that record for the additional aggreement can NOT be executed
      await expect(app2.connect(bob).execute(23)).to.be.revertedWith('AGR13');

      // execute 13 record that activates the 13 record in additional agreement
      await app.connect(bob).execute(13);
      // // check that record is activated for the additional aggreement
      // recordResult = await app2.records(23);
      // expect(recordResult.isActive).to.be.equal(true);

      // // check that record for the additional aggreement can be executed
      // await app2.fulfill(23, 0, bob.address);
    });

    it.skip('activates several existing records for two agreements', async () => {
      const input = `
        enable record 34 for addr2
        enable record 15 for addr2
        enable record 1 for addr3
      `;

      let record = await app.records(34);
      expect(record.isActive).to.be.equal(false);
      record = await app.records(15);
      expect(record.isActive).to.be.equal(false);
      record = await app.records(1);
      expect(record.isActive).to.be.equal(false);

      // create records
      // execute dsl code for different agreements

      record = await app.records(34);
      expect(record.isActive).to.be.equal(true);
      record = await app.records(15);
      expect(record.isActive).to.be.equal(true);
      record = await app.records(1);
      expect(record.isActive).to.be.equal(true);
    });
  });

  describe('Get actual record Id', () => {
    let localSnapshotId: number;

    before(async () => {
      const ContextMock = await ethers.getContractFactory('ContextMock');
      const recordContext = await ContextMock.deploy();
      await recordContext.setAppAddress(appAddr);
      const conditionContext = await ContextMock.deploy();
      await conditionContext.setAppAddress(appAddr);

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
        const {
          recordId,
          requiredRecords,
          signatories,
          conditionContexts,
          conditionStrings,
          transactionCtx,
          transactionStr,
        } = records[i];

        await setRecord(records[i], app);

        // Set msg senders
        await transactionCtx.setMsgSender(alice.address);
        await conditionContexts[0].setMsgSender(alice.address);

        // Parse all conditions and a transaction
        const condCtxLen = (await app.conditionContextsLen(recordId)).toNumber();

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
      await records[0].transactionCtx.setAppAddress(app.address);
      await records[0].transactionCtx.setMsgSender(alice.address);
      await records[0].conditionContexts[0].setAppAddress(app.address);
      await records[0].conditionContexts[0].setMsgSender(alice.address);

      await records[1].transactionCtx.setAppAddress(app.address);
      await records[1].transactionCtx.setMsgSender(bob.address);
      await records[1].conditionContexts[0].setAppAddress(app.address);
      await records[1].conditionContexts[0].setMsgSender(bob.address);

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
      await transactionCtx.setAppAddress(app.address);
      await transactionCtx.setMsgSender(alice.address);
      await conditionContexts[0].setAppAddress(app.address);
      await conditionContexts[0].setMsgSender(alice.address);

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
      await transactionCtx.setAppAddress(app.address);
      await transactionCtx.setMsgSender(alice.address);
      await conditionContexts[0].setAppAddress(app.address);
      await conditionContexts[0].setMsgSender(alice.address);

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
      await transactionCtx.setAppAddress(app.address);
      await transactionCtx.setMsgSender(alice.address);
      await transactionCtx.setMsgSender(anybody.address);
      await conditionContexts[0].setAppAddress(app.address);
      await conditionContexts[0].setMsgSender(alice.address);
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

  describe('Enable record', () => {
    it('activates existing record', async () => {});
  });
});
