import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import * as hre from 'hardhat';
import { BigNumber } from 'ethers';
import { hex4Bytes, checkStackTail } from '../../utils/utils';
import { deployAgreementMock } from '../../../scripts/utils/deploy.utils.mock';
import {
  activateRecord,
  deactivateRecord,
  archiveRecord,
  unarchiveRecord,
  setRecord,
  setRecords,
  parse,
} from '../../../scripts/utils/update.record.mock';

import { AgreementMock, MultisigMock } from '../../../typechain-types';
import { anyone, ONE_MONTH } from '../../utils/constants';
import { Records } from '../../types';

const { ethers, network } = hre;

describe('Simple Records in Agreement', () => {
  let app: AgreementMock;
  let multisig: MultisigMock;
  let appAddr: string;
  let parserAddr: string;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let anybody: SignerWithAddress;
  let NEXT_MONTH: number;
  let preprAddr: string;
  let snapshotId: number;

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
    [appAddr, parserAddr, , preprAddr] = await deployAgreementMock(hre, multisig.address);
    app = await ethers.getContractAt('AgreementMock', appAddr);
    await ethers.getContractAt('ParserMock', parserAddr);

    // Set variables
    await app.setStorageAddress(hex4Bytes('RECEIVER'), bob.address);
    await app.setStorageUint256(hex4Bytes('LOCK_TIME'), NEXT_MONTH);
  });

  beforeEach(async () => {
    // Return to the snapshot
    snapshotId = await network.provider.send('evm_snapshot');
    records = [];
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
      await expect(app.addRecordBlueprint(1, [], signatories)).to.be.revertedWith('AGR12');
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
      await expect(app.addRecordBlueprint(1, [], signatories)).to.be.revertedWith('AGR12');
    });
  });

  describe('Scenarios', () => {
    it('borrower/lender scenario', async () => {
      // Deploy Token contract
      const token = await (await ethers.getContractFactory('ERC20Premint'))
        .connect(bob)
        .deploy('Token', 'TKN', ethers.utils.parseEther('1000'));

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
        },
        {
          recordId: 2,
          requiredRecords: [],
          signatories: [bob.address],
          transactionStr: `transfer TOKEN_ADDR TOKEN_RECEIVER ${tenTokens}`,
          conditionStrings: ['blockTimestamp > var LOCK_TIME'],
        }
      );

      await setRecords(records, app);
      expect(records.length).equal(2);

      await parse(app, preprAddr);

      // Top up contract (ETH)
      await anybody.sendTransaction({ to: app.address, value: oneEth });

      // Top up contract (tokens)
      await token.transfer(app.address, tenTokens);
      expect(await token.balanceOf(app.address)).to.equal(tenTokens);
      // Execute transactions
      await expect(await app.fulfill(1, 0, alice.address)).to.changeEtherBalance(bob, oneEth);
      await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
      await expect(() => app.fulfill(2, 0, bob.address)).to.changeTokenBalance(
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
        transactionStr: 'transferFromVar DAI GP AGREEMENT GP_REMAINING',
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
          `(balanceOf DAI AGREEMENT) >=
              ((var INITIAL_FUNDS_TARGET * var P1) / 100)`,
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
      const token = await (await ethers.getContractFactory('ERC20Premint'))
        .connect(bob)
        .deploy('Token', 'TKN', ethers.utils.parseEther('1000'));

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
      };

      const { recordId } = record;

      await setRecord(record, app);

      await parse(app, preprAddr);
      const condStrLen = (await app.conditionStringsLen(recordId)).toNumber();
      expect(condStrLen).to.equal(1);

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
      });

      const { recordId } = records[0];

      await setRecord(records[0], app);

      await parse(app, preprAddr);

      // Parse all conditions and a transaction
      const condStrLen = (await app.conditionStringsLen(recordId)).toNumber();
      expect(condStrLen).to.equal(1);

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
      });

      const { recordId } = records[0];
      await setRecord(records[0], app);

      // Parse all conditions and a transaction
      await parse(app, preprAddr);

      const condStrLen = (await app.conditionStringsLen(recordId)).toNumber();
      expect(condStrLen).to.equal(1);

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

      // Set conditional transaction
      await app.addRecordBlueprint(recordId, requiredRecords, signatories);
      for (let j = 0; j < conditionStrings.length; j++) {
        await expect(app.addRecordCondition(recordId, conditionStrings[j])).to.be.revertedWith(
          'AGR5'
        );
      }
      await expect(app.addRecordTransaction(recordId, transactionStr)).to.be.revertedWith('AGR5');
    });
  });

  describe('Get actual record Id', () => {
    before(async () => {
      const mainRec = 'sendEth RECEIVER 1000000000000000000';
      const mainCond = 'blockTimestamp > var LOCK_TIME';
      records.push(
        {
          recordId: 96,
          requiredRecords: [],
          signatories: [alice.address],
          transactionStr: mainRec,
          conditionStrings: [mainCond],
        },
        {
          recordId: 956,
          requiredRecords: [],
          signatories: [alice.address],
          transactionStr: mainRec,
          conditionStrings: [mainCond],
        },
        {
          recordId: 11111,
          requiredRecords: [],
          signatories: [alice.address],
          transactionStr: mainRec,
          conditionStrings: [mainCond],
        }
      );

      // Set records
      for (let i = 0; i < records.length; i++) {
        const { recordId } = records[i];

        await setRecord(records[i], app);

        await parse(app, preprAddr);

        // Top up contract
        await anybody.sendTransaction({ to: app.address, value: oneEth });

        // Advance time
        // await ethers.provider.send('evm_increaseTime', [ONE_MONTH + ONE_MONTH]);
        await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
        await ethers.provider.send('evm_mine', []);

        // Validate again
        expect(await app.callStatic.validateConditions(recordId, 0)).equal(true);
      }
      const r96 = await app.records(96);
      const r956 = await app.records(956);
      const r11111 = await app.records(11111);
      expect(r96.recordString).equal(mainRec);
      expect(r96.isActive).equal(false);
      expect(r956.recordString).equal(mainRec);
      expect(r956.isActive).equal(false);
      expect(r11111.recordString).equal(mainRec);
      expect(r11111.isActive).equal(false);
      expect(records.length).equal(3);
    });

    it('Should return empty records Ids when all stil deactivated', async () => {
      const actualRecords = await app.getActiveRecords();
      expect(actualRecords.map((v: BigNumber) => v.toNumber())).eql([]);
    });

    it('Should return all of record Ids when all active', async () => {
      await activateRecord(app, multisig, 96);
      await activateRecord(app, multisig, 956);
      await activateRecord(app, multisig, 11111);
      const actualRecords = await app.getActiveRecords();
      expect(actualRecords.map((v: BigNumber) => v.toNumber())).eql([96, 956, 11111]);
    });

    it('Should return record Ids [96, 956] when 11111 archived', async () => {
      await activateRecord(app, multisig, 96);
      await activateRecord(app, multisig, 956);
      await activateRecord(app, multisig, 11111);
      await archiveRecord(app, multisig, 11111);
      const notArchivedRecords = await app.getActiveRecords();
      expect(notArchivedRecords.map((v: BigNumber) => v.toNumber())).eql([96, 956]);
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
      expect(notArchivedRecords.map((v: BigNumber) => v.toNumber())).eql([956, 11111]);
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
      expect(notArchivedRecords.map((v: BigNumber) => v.toNumber())).eql([96]);
    });
  });

  describe('Check statuses. Single record', () => {
    const recordId: number = 95;
    const transactionStr: string = 'sendEth RECEIVER 1000000000000000000';

    before(async () => {
      const LBT = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp;
      await app.setStorageUint256(hex4Bytes('LOCK_TIME'), LBT + ONE_MONTH);

      records.push({
        recordId,
        requiredRecords: [],
        signatories: [alice.address],
        conditionStrings: ['blockTimestamp > var LOCK_TIME'],
        transactionStr,
      });

      await setRecord(records[0], app);
      await parse(app, preprAddr);
    });

    it('record with one transaction', async () => {
      await activateRecord(app, multisig, recordId);

      // Parse all conditions and a transaction
      let condLen = (await app.conditionStringsLen(recordId)).toNumber();
      expect(condLen).to.equal(1);

      // Top up contract
      await anybody.sendTransaction({ to: app.address, value: oneEth });

      // Execute transaction
      await expect(app.connect(alice).execute(recordId)).to.be.revertedWith('AGR6');

      // Validate
      expect(await app.callStatic.validateConditions(recordId, 0)).equal(false);

      // Advance time
      // await ethers.provider.send('evm_increaseTime', [ONE_MONTH + ONE_MONTH]);
      await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
      await ethers.provider.send('evm_mine', []);

      // Parse all conditions and a transaction
      condLen = (await app.conditionStringsLen(recordId)).toNumber();
      expect(condLen).to.equal(1);

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

      // Check that record does not exist
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

      // Check that record does not exist when deactivateRecord
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

      // Check that returns error if executed unarchiveRecord for not-existing record
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
      const [aggr2Addr] = await deployAgreementMock(hre, appAddr);

      const aggr2 = await ethers.getContractAt('AgreementMock', aggr2Addr);
      await aggr1.setStorageUint256(hex4Bytes('RECORD_ID'), 23);
      await aggr1.setStorageAddress(hex4Bytes('AGREEMENT_ADDR'), aggr2Addr);
      const input = 'enableRecord RECORD_ID at AGREEMENT_ADDR';

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
      };

      // record for the Agreement2
      const record2 = {
        recordId: 23,
        requiredRecords: [],
        signatories: [bob.address],
        transactionStr: input2,
        conditionStrings: ['bool true'],
      };

      // the record sets to the apps
      await setRecord(record, aggr1);
      await setRecord(record2, aggr2);

      // parse all conditions and a transaction #1
      await parse(aggr1, preprAddr);

      // parse all conditions and a transaction #2
      await parse(aggr2, preprAddr);

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
      let ctxProgramAddr = await aggr1.contextProgram();
      let ctxP = await ethers.getContractAt('ProgramContextMock', ctxProgramAddr);
      let stackAddr = await ctxP.stack();
      const stack = await ethers.getContractAt('Stack', stackAddr);

      // check that stack is empty for the Aggreement2
      await checkStackTail(stack, [1, 1]); // enableRecord, true

      // check that record for the Aggreement2 can be executed
      await aggr2.connect(bob).execute(23);

      ctxProgramAddr = await aggr2.contextProgram();
      ctxP = await ethers.getContractAt('ProgramContextMock', ctxProgramAddr);
      stackAddr = await ctxP.stack();
      const stack2 = await ethers.getContractAt('Stack', stackAddr);
      // check that stack was changed for the Aggreement2
      // because of result of `uint256 6` (check input2)
      await checkStackTail(stack2, [1, 6]);
    });

    it('activates several existing records for two agreements', async () => {
      // creates Agreement2 + Agreement3
      // Agreement is the owner of Agreement2 and Agreement3
      const aggr1 = app; // just to have normal names inside this test
      const [aggr2Addr] = await deployAgreementMock(hre, appAddr);
      const [aggr3Addr] = await deployAgreementMock(hre, appAddr);

      const aggr2 = await ethers.getContractAt('AgreementMock', aggr2Addr);
      const aggr3 = await ethers.getContractAt('AgreementMock', aggr3Addr);
      await aggr1.setStorageUint256(hex4Bytes('RECORD_ID_1'), 34);
      await aggr1.setStorageUint256(hex4Bytes('RECORD_ID_2'), 15);
      await aggr1.setStorageUint256(hex4Bytes('RECORD_ID_3'), 41);
      await aggr1.setStorageAddress(hex4Bytes('AGREEMENT_ADDR'), aggr2Addr);
      await aggr1.setStorageAddress(hex4Bytes('AGREEMENT_ADDR_2'), aggr2Addr);
      await aggr1.setStorageAddress(hex4Bytes('AGREEMENT_ADDR_3'), aggr3Addr);
      // uses for the Agreement
      const input = `
        enableRecord RECORD_ID_1 at AGREEMENT_ADDR
        enableRecord RECORD_ID_2 at AGREEMENT_ADDR_2
        enableRecord RECORD_ID_3 at AGREEMENT_ADDR_3
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
      };

      // records for the Agreement2
      const records2 = [
        {
          recordId: 34,
          requiredRecords: [],
          signatories: [bob.address],
          transactionStr: input2,
          conditionStrings: ['bool true'],
        },
        {
          recordId: 15,
          requiredRecords: [],
          signatories: [bob.address],
          transactionStr: input21,
          conditionStrings: ['bool true'],
        },
      ];

      // record for the Agreement3
      const record3 = {
        recordId: 41,
        requiredRecords: [],
        signatories: [bob.address],
        transactionStr: input3,
        conditionStrings: ['bool true'],
      };

      // the record sets to the Agreement, Agreement2, Agreement3
      await setRecord(record, aggr1);
      await setRecords(records2, aggr2);
      await setRecord(record3, aggr3);

      // parse all conditions and a transactions
      await parse(aggr1, preprAddr);
      await parse(aggr2, preprAddr);
      await parse(aggr3, preprAddr);

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

      // create Stack instance for Aggreements
      let ctxProgramAddr = await aggr1.contextProgram();
      let ctxP = await ethers.getContractAt('ProgramContextMock', ctxProgramAddr);
      let stackAddr = await ctxP.stack();
      const stack2 = await ethers.getContractAt('Stack', stackAddr);

      ctxProgramAddr = await aggr2.contextProgram();
      ctxP = await ethers.getContractAt('ProgramContextMock', ctxProgramAddr);
      stackAddr = await ctxP.stack();
      const stack21 = await ethers.getContractAt('Stack', stackAddr);

      ctxProgramAddr = await aggr3.contextProgram();
      ctxP = await ethers.getContractAt('ProgramContextMock', ctxProgramAddr);
      stackAddr = await ctxP.stack();
      const stack3 = await ethers.getContractAt('Stack', stackAddr);

      // check that stack is empty for the Aggreement2, Aggreement3
      await checkStackTail(stack2, [1, 1, 1, 1]); // true, enableRecord, enableRecord, enableRecord
      await checkStackTail(stack21, []);
      await checkStackTail(stack3, []);

      // check that records for the Aggreement2 and Aggreement2 can be executed
      await aggr2.connect(bob).execute(34);

      // check that stacks were changed for the Aggreement2, Aggreement3
      // bool true, enableRecord, enableRecord, enableRecord
      await checkStackTail(stack2, [1, 1, 1, 1]);
      await checkStackTail(stack21, [1, 6]); // bool true, uint 6
      await checkStackTail(stack3, []);

      await aggr2.connect(bob).execute(15);

      // bool true, enableRecord, enableRecord, enableRecord
      await checkStackTail(stack2, [1, 1, 1, 1]);
      await checkStackTail(stack21, [1, 6, 1, 66]); //  bool true, uint 6, bool true, uint 66
      await checkStackTail(stack3, []);

      await aggr3.connect(bob).execute(41);
      // bool true, enableRecord, enableRecord, enableRecord
      await checkStackTail(stack2, [1, 1, 1, 1]);
      await checkStackTail(stack21, [1, 6, 1, 66]); // bool true, uint 6, bool true, uint 66
      await checkStackTail(stack3, [1, 45]); // bool true, uint 45
    });
  });
});
