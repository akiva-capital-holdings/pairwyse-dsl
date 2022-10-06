import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import * as hre from 'hardhat';
import { ParserMock } from '../../typechain-types/dsl/mocks';
import { addSteps, hex4Bytes } from '../utils/utils';
import { deployAgreementMock, deployParserMock } from '../../scripts/utils/deploy.utils.mock';
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

  const archiveRecord = async (_app: AgreementMock, _multisig: MultisigMock, _recordId: number) => {
    const { data } = await app.populateTransaction.archiveRecord(_recordId);
    await _multisig.executeTransaction(_app.address, data as string, 0);
  };

  const unarchiveRecord = async (
    _app: AgreementMock,
    _multisig: MultisigMock,
    _recordId: number
  ) => {
    const { data } = await app.populateTransaction.unArchiveRecord(_recordId);
    await _multisig.executeTransaction(_app.address, data as string, 0);
  };

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
  });

  beforeEach(async () => {
    // Make a snapshot
    snapshotId = await network.provider.send('evm_snapshot');
  });

  afterEach(async () => {
    records = [];
    // Return to the snapshot
    await network.provider.send('evm_revert', [snapshotId]);
  });

  it('get record', async () => {
    const txId = '96';
    const requiredTxs = [1, 29, 18];
    const signatories = [alice.address, bob.address];
    const transaction = 'sendEth RECEIVER 1000000000000000000';
    const conditions = ['blockTimestamp > var LOCK_TIME', 'bool true'];
    await addSteps(
      preprAddr,
      [{ txId, requiredTxs, signatories, conditions, transaction }],
      appAddr,
      multisig
    );

    // Get Records Value
    const record = await app.getRecord(96);
    expect(record.txsRequiredRecords.map((v) => v.toNumber())).eql([1, 29, 18]);
    expect(record.txsSignatories).eql([alice.address, bob.address]);
    expect(record.txsConditions).eql(['blockTimestamp > var LOCK_TIME', 'bool true']);
    expect(record.txsTransaction).to.be.equal('sendEth RECEIVER 1000000000000000000');

    // Get Values Length
    expect(await app.signatoriesLen(96)).to.be.equal(2);
    expect(await app.requiredRecordsLen(96)).to.be.equal(3);
    expect(await app.conditionStringsLen(96)).to.be.equal(2);
  });

  it('archived transaction', async () => {
    // Set variables
    await app.setStorageAddress(hex4Bytes('RECEIVER'), bob.address);
    await app.setStorageUint256(hex4Bytes('LOCK_TIME'), NEXT_MONTH);

    const ContextMock = await ethers.getContractFactory('ContextMock');
    const transactionContext = await ContextMock.deploy();
    await transactionContext.setAppAddress(appAddr);
    const conditionContext = await ContextMock.deploy();
    await conditionContext.setAppAddress(appAddr);

    records.push({
      recordId: 96,
      requiredRecords: [],
      signatories: [alice.address],
      transactionStr: 'sendEth RECEIVER 1000000000000000000',
      conditionStrings: ['blockTimestamp > var LOCK_TIME'],
      transactionCtx: transactionContext,
      conditionContexts: [conditionContext],
    });

    // Set conditional transaction
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

      // Set conditional transaction
      await app.addRecordBlueprint(recordId, requiredRecords, signatories);
      for (let j = 0; j < conditionContexts.length; j++) {
        await app.addRecordCondition(recordId, conditionStrings[j], conditionContexts[j].address);
      }
      await app.addRecordTransaction(recordId, transactionStr, transactionCtx.address);

      // Set msg senders
      await transactionCtx.setMsgSender(alice.address);
      await conditionContexts[0].setMsgSender(alice.address);

      // Check that record unarchived yet
      const unArchivedRecord = await app.txs(recordId);
      expect(unArchivedRecord.isArchived).to.be.equal(false);

      // Check that record was actually archived
      await archiveRecord(app, multisig, recordId);
      const firstArchivedRecord = await app.txs(recordId);
      expect(firstArchivedRecord.isArchived).to.be.equal(true);

      // Check that record does not exist
      // AGR9
      await expect(archiveRecord(app, multisig, 999)).to.be.revertedWith('Delegate call failure');

      // Check that secondary archived record still archived
      await archiveRecord(app, multisig, recordId);
      const secondArchivedRecord = await app.txs(recordId);
      expect(secondArchivedRecord.isArchived).to.be.equal(true);

      // Check that record was actually unArchived
      await unarchiveRecord(app, multisig, recordId);
      const firstUnArchivedRecord = await app.txs(recordId);
      expect(firstUnArchivedRecord.isArchived).to.be.equal(false);

      // Check that secondary unAchived will reverted
      await expect(unarchiveRecord(app, multisig, recordId)).to.be.revertedWith(
        'Delegate call failure'
      ); // AGR10

      // Check that record does not exist when unArchiveRecord
      // AGR9
      await expect(unarchiveRecord(app, multisig, 999)).to.be.revertedWith('Delegate call failure');

      // Check that third archived record was actually archived after unachived
      await archiveRecord(app, multisig, recordId);
      const thirdArchivedRecord = await app.txs(recordId);
      expect(thirdArchivedRecord.isArchived).to.be.equal(true);
    }
  });

  describe('Get actual record Id', () => {
    before(async () => {
      await app.setStorageAddress(hex4Bytes('RECEIVER'), bob.address);
      await app.setStorageUint256(hex4Bytes('LOCK_TIME'), NEXT_MONTH);

      const ContextMock = await ethers.getContractFactory('ContextMock');
      const transactionContext = await ContextMock.deploy();
      await transactionContext.setAppAddress(appAddr);
      const conditionContext = await ContextMock.deploy();
      await conditionContext.setAppAddress(appAddr);

      records.push(
        {
          recordId: 96,
          requiredRecords: [],
          signatories: [alice.address],
          transactionStr: 'sendEth RECEIVER 1000000000000000000',
          conditionStrings: ['blockTimestamp > var LOCK_TIME'],
          transactionCtx: transactionContext,
          conditionContexts: [conditionContext],
        },
        {
          recordId: 956,
          requiredRecords: [],
          signatories: [alice.address],
          transactionStr: 'sendEth RECEIVER 1000000000000000000',
          conditionStrings: ['blockTimestamp > var LOCK_TIME'],
          transactionCtx: transactionContext,
          conditionContexts: [conditionContext],
        },
        {
          recordId: 11111,
          requiredRecords: [],
          signatories: [alice.address],
          transactionStr: 'sendEth RECEIVER 1000000000000000000',
          conditionStrings: ['blockTimestamp > var LOCK_TIME'],
          transactionCtx: transactionContext,
          conditionContexts: [conditionContext],
        }
      );

      // Set conditional transaction
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

        // Set conditional transaction
        await app.addRecordBlueprint(recordId, requiredRecords, signatories);
        for (let j = 0; j < conditionContexts.length; j++) {
          await app.addRecordCondition(recordId, conditionStrings[j], conditionContexts[j].address);
        }
        await app.addRecordTransaction(recordId, transactionStr, transactionCtx.address);

        // Set msg senders
        // TODO: do we really need kind of these tests if we will have Roles?
        await transactionCtx.setMsgSender(alice.address);
        await conditionContexts[0].setMsgSender(alice.address);

        // Parse all conditions and a transaction
        const condCtxLen = (await app.conditionContextsLen(recordId)).toNumber();

        for (let j = 0; j < condCtxLen; j++) {
          await parser.parse(
            preprAddr,
            await app.conditionContexts(recordId, j),
            await app.conditionStrings(recordId, j)
          );
        }
        await parser.parse(preprAddr, transactionCtx.address, transactionStr);

        // Top up contract
        await anybody.sendTransaction({ to: app.address, value: oneEth });

        // Advance time
        // await ethers.provider.send('evm_increaseTime', [ONE_MONTH + ONE_MONTH]);
        await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
        for (let j = 0; j < condCtxLen; j++) {
          await parser.parse(
            preprAddr,
            await app.conditionContexts(recordId, j),
            await app.conditionStrings(recordId, j)
          );
        }

        // Validate again
        expect(await app.callStatic.validateConditions(recordId, 0)).equal(true);
      }
    });

    beforeEach(async () => {
      // Make a snapshot
      snapshotId = await network.provider.send('evm_snapshot');
    });

    afterEach(async () => {
      records = [];
      // Return to the snapshot
      await network.provider.send('evm_revert', [snapshotId]);
    });

    it('Should return all of record Ids when all active', async () => {
      const actualRecords = await app.getActiveRecords();
      expect(actualRecords.map((v) => v.toNumber())).eql([96, 956, 11111]);
    });

    it('Should return record Ids [96, 956] when 11111 archibed', async () => {
      await archiveRecord(app, multisig, 11111);
      const notArchivedRecords = await app.getActiveRecords();
      expect(notArchivedRecords.map((v) => v.toNumber())).eql([96, 956]);
    });

    it('Should return [] when all archibed', async () => {
      await archiveRecord(app, multisig, 96);
      await archiveRecord(app, multisig, 956);
      await archiveRecord(app, multisig, 11111);
      const notArchivedRecords = await app.getActiveRecords();
      expect(notArchivedRecords).eql([]);
    });

    it('Should return [956, 11111] when 96 executed', async () => {
      await app.fulfill(96, 0, alice.address);
      const notArchivedRecords = await app.getActiveRecords();
      expect(notArchivedRecords.map((v) => v.toNumber())).eql([956, 11111]);
    });

    it('Should return [] when all executed', async () => {
      await app.fulfill(96, 0, alice.address);
      await app.fulfill(956, 0, alice.address);
      await app.fulfill(11111, 0, alice.address);
      const notArchivedRecords = await app.getActiveRecords();
      expect(notArchivedRecords).eql([]);
    });
  });

  it('record with one transaction', async () => {
    // Set variables
    await app.setStorageAddress(hex4Bytes('RECEIVER'), bob.address);
    await app.setStorageUint256(hex4Bytes('LOCK_TIME'), NEXT_MONTH);

    const ContextMock = await ethers.getContractFactory('ContextMock');
    const transactionContext = await ContextMock.deploy();
    await transactionContext.setAppAddress(appAddr);
    const conditionContext = await ContextMock.deploy();
    await conditionContext.setAppAddress(appAddr);

    records.push({
      recordId: 1,
      requiredRecords: [],
      signatories: [alice.address],
      transactionStr: 'sendEth RECEIVER 1000000000000000000',
      conditionStrings: ['blockTimestamp > var LOCK_TIME'],
      transactionCtx: transactionContext,
      conditionContexts: [conditionContext],
    });

    // Set conditional transaction
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

      // Set conditional transaction
      await app.addRecordBlueprint(recordId, requiredRecords, signatories);
      for (let j = 0; j < conditionContexts.length; j++) {
        await app.addRecordCondition(recordId, conditionStrings[j], conditionContexts[j].address);
      }
      await app.addRecordTransaction(recordId, transactionStr, transactionCtx.address);

      // Set msg senders
      // TODO: do we really need kind of these tests if we will have Roles?
      await transactionCtx.setMsgSender(alice.address);
      await conditionContexts[0].setMsgSender(alice.address);

      // Parse all conditions and a transaction
      const condCtxLen = (await app.conditionContextsLen(recordId)).toNumber();
      expect(condCtxLen).to.equal(1);

      for (let j = 0; j < condCtxLen; j++) {
        await parser.parse(
          preprAddr,
          await app.conditionContexts(recordId, j),
          await app.conditionStrings(recordId, j)
        );
      }
      await parser.parse(preprAddr, transactionCtx.address, transactionStr);

      // Top up contract
      await anybody.sendTransaction({ to: app.address, value: oneEth });

      // Execute transaction
      await expect(app.connect(alice).execute(recordId)).to.be.revertedWith('AGR6');

      // Validate
      expect(await app.callStatic.validateConditions(recordId, 0)).equal(false);

      // Advance time
      // await ethers.provider.send('evm_increaseTime', [ONE_MONTH + ONE_MONTH]);
      await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
      for (let j = 0; j < condCtxLen; j++) {
        await parser.parse(
          preprAddr,
          await app.conditionContexts(recordId, j),
          await app.conditionStrings(recordId, j)
        );
      }

      // Validate again
      expect(await app.callStatic.validateConditions(recordId, 0)).equal(true);
      await expect(await app.fulfill(recordId, 0, alice.address)).to.changeEtherBalance(
        bob,
        oneEth
      );
      await expect(app.fulfill(recordId, 0, alice.address)).to.be.revertedWith('AGR7');
    }
  });

  it('more than one condition', async () => {
    records.push({
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
    });
    // Set conditional transaction
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

      // Set conditional transaction
      await app.addRecordBlueprint(recordId, requiredRecords, signatories);
      for (let j = 0; j < conditionContexts.length; j++) {
        await app.addRecordCondition(recordId, conditionStrings[j], conditionContexts[j].address);
      }
      await app.addRecordTransaction(recordId, transactionStr, transactionCtx.address);
      const condStrLen = (await app.conditionStringsLen(recordId)).toNumber();
      expect(condStrLen).to.equal(6);
    }
  });

  it('validate required records', async () => {
    // Deploy Token contract
    const token = await (await ethers.getContractFactory('Token'))
      .connect(bob)
      .deploy(ethers.utils.parseEther('1000'));

    // Set variables
    await app.setStorageAddress(hex4Bytes('TOKEN_ADDR'), token.address);
    await app.setStorageAddress(hex4Bytes('BOB'), bob.address);
    await app.setStorageAddress(hex4Bytes('ALICE'), alice.address);
    await app.setStorageUint256(hex4Bytes('LOCK_TIME'), NEXT_MONTH);

    records.push({
      recordId: 1,
      requiredRecords: [3],
      signatories: [bob.address],
      transactionStr: `transferFrom TOKEN_ADDR BOB ALICE ${tenTokens.toString()}`,
      conditionStrings: ['blockTimestamp > var LOCK_TIME'],
      transactionCtx: await ContextCont.deploy(),
      conditionContexts: [await ContextCont.deploy()],
    });
    // Set conditional transaction
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

      // Set conditional transaction
      await app.addRecordBlueprint(recordId, requiredRecords, signatories);
      for (let j = 0; j < conditionContexts.length; j++) {
        await app.addRecordCondition(recordId, conditionStrings[j], conditionContexts[j].address);
      }
      await app.addRecordTransaction(recordId, transactionStr, transactionCtx.address);

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
      for (let j = 0; j < condCtxLen; j++) {
        await parser.parse(
          preprAddr,
          await app.conditionContexts(recordId, j),
          await app.conditionStrings(recordId, j)
        );
      }
      await parser.parse(preprAddr, transactionCtx.address, transactionStr);

      // Validate required records
      expect(await app.validateRequiredRecords(recordId)).equal(false);
    }
  });

  it('verify signatories', async () => {
    records.push({
      recordId: 1,
      requiredRecords: [],
      signatories: [bob.address],
      transactionStr: 'bool true',
      conditionStrings: ['bool true'],
      transactionCtx: await ContextCont.deploy(),
      conditionContexts: [await ContextCont.deploy()],
    });
    // Set conditional transaction
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

      // Set conditional transaction
      await app.addRecordBlueprint(recordId, requiredRecords, signatories);
      for (let j = 0; j < conditionContexts.length; j++) {
        await app.addRecordCondition(recordId, conditionStrings[j], conditionContexts[j].address);
      }
      await app.addRecordTransaction(recordId, transactionStr, transactionCtx.address);

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
      for (let j = 0; j < condCtxLen; j++) {
        await parser.parse(
          preprAddr,
          await app.conditionContexts(recordId, j),
          await app.conditionStrings(recordId, j)
        );
      }
      await parser.parse(preprAddr, transactionCtx.address, transactionStr);

      // Check signatories
      expect(await app.connect(alice).verify(recordId)).equal(false);
      expect(await app.connect(bob).verify(recordId)).equal(true);
    }
  });

  it('check 0 conditions', async () => {
    records.push({
      recordId: 3,
      requiredRecords: [],
      signatories: [bob.address],
      transactionStr: '',
      conditionStrings: [''],
      transactionCtx: await ContextCont.deploy(),
      conditionContexts: [await ContextCont.deploy()],
    });
    // Set conditional transaction
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
    }
  });

  it('test more than one signatories', async () => {
    // Set variables
    await app.setStorageAddress(hex4Bytes('RECEIVER'), bob.address);
    await app.setStorageUint256(hex4Bytes('LOCK_TIME'), NEXT_MONTH);

    records.push({
      recordId: 12,
      requiredRecords: [],
      signatories: [alice.address, anybody.address],
      transactionStr: 'sendEth RECEIVER 1000000000000000000',
      conditionStrings: ['bool true'],
      transactionCtx: await ContextCont.deploy(),
      conditionContexts: [await ContextCont.deploy()],
    });

    // Set conditional transaction
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

      // Set conditional transaction
      await app.addRecordBlueprint(recordId, requiredRecords, signatories);
      for (let j = 0; j < conditionContexts.length; j++) {
        await app.addRecordCondition(recordId, conditionStrings[j], conditionContexts[j].address);
      }
      await app.addRecordTransaction(recordId, transactionStr, transactionCtx.address);

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
      for (let j = 0; j < condCtxLen; j++) {
        await parser.parse(
          preprAddr,
          await app.conditionContexts(recordId, j),
          await app.conditionStrings(recordId, j)
        );
      }
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
    }
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

      // Define Conditional Transactions
      records.push({
        recordId: 1,
        requiredRecords: [],
        signatories: [alice.address],
        transactionStr: 'sendEth ETH_RECEIVER 1000000000000000000',
        conditionStrings: ['bool true'],
        transactionCtx: await ContextCont.deploy(),
        conditionContexts: [await ContextCont.deploy()],
      });
      records.push({
        recordId: 2,
        requiredRecords: [],
        signatories: [bob.address],
        transactionStr: `transfer TOKEN_ADDR TOKEN_RECEIVER ${tenTokens}`,
        conditionStrings: ['blockTimestamp > var LOCK_TIME'],
        transactionCtx: await ContextCont.deploy(),
        conditionContexts: [await ContextCont.deploy()],
      });

      // Set conditional transaction #1
      const { recordId: recordId0 } = records[0];
      await app.addRecordBlueprint(recordId0, records[0].requiredRecords, records[0].signatories);
      await app.addRecordCondition(
        recordId0,
        records[0].conditionStrings[0],
        records[0].conditionContexts[0].address
      );
      await app.addRecordTransaction(
        recordId0,
        records[0].transactionStr,
        records[0].transactionCtx.address
      );

      // Set conditional transaction #2
      const { recordId: recordId1 } = records[1];
      await app.addRecordBlueprint(recordId1, records[1].requiredRecords, records[1].signatories);
      await app.addRecordCondition(
        recordId1,
        records[1].conditionStrings[0],
        records[1].conditionContexts[0].address
      );
      await app.addRecordTransaction(
        recordId1,
        records[1].transactionStr,
        records[1].transactionCtx.address
      );

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
      const condCtxLen0 = (await app.conditionContextsLen(recordId0)).toNumber();
      for (let i = 0; i < condCtxLen0; i++) {
        await parser.parse(
          preprAddr,
          await app.conditionContexts(recordId0, i),
          await app.conditionStrings(recordId0, i)
        );
      }
      await parser.parse(preprAddr, records[0].transactionCtx.address, records[0].transactionStr);

      // Parse all conditions and a transaction #2
      const condCtxLen1 = (await app.conditionContextsLen(recordId1)).toNumber();
      for (let i = 0; i < condCtxLen1; i++) {
        await parser.parse(
          preprAddr,
          await app.conditionContexts(recordId1, i),
          await app.conditionStrings(recordId1, i)
        );
      }
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
});
