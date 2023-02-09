import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import * as hre from 'hardhat';
import { ethers, network } from 'hardhat';
import { expect } from 'chai';
import { parseEther } from 'ethers/lib/utils';
import {
  deployAgreement,
  deployOpcodeLibs,
  deployStringUtils,
} from '../../../../scripts/utils/deploy.utils';
import { deployBaseMock } from '../../../../scripts/utils/deploy.utils.mock';
import { Agreement, ERC20Premint, Governance } from '../../../../typechain-types';
import { ONE_MONTH } from '../../../utils/constants';
import { hex4Bytes } from '../../../utils/utils';
import { parse } from '../../../../scripts/utils/update.record';

describe('Governance', () => {
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carl: SignerWithAddress;
  let david: SignerWithAddress;
  let agreement: Agreement;
  let agreementAddr: string;
  let tokenAddr: string;
  let token: ERC20Premint;
  let governance: Governance;
  let preprAddr: string;
  let parserAddr: string;
  let executorLibAddr: string;
  let txId: string;
  let snapshotId: number;
  let NEXT_MONTH: number;

  before(async () => {
    [alice, bob, carl, david] = await ethers.getSigners();
    const LAST_BLOCK_TIMESTAMP = (
      await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
    ).timestamp;
    NEXT_MONTH = LAST_BLOCK_TIMESTAMP + ONE_MONTH;

    // Deploy Token contract
    token = await (await ethers.getContractFactory('ERC20Premint'))
      .connect(alice)
      .deploy('Token', 'TKN', ethers.utils.parseEther('1000'));
    await token.deployed();
    tokenAddr = token.address;

    /**
     * Governance contract is deployed; it will be an owner of Agreement.
     */
    const [
      comparisonOpcodesLibAddr,
      branchingOpcodesLibAddr,
      logicalOpcodesLibAddr,
      otherOpcodesLibAddr,
      complexOpcodesLibAddr,
    ] = await deployOpcodeLibs(hre);
    [parserAddr, executorLibAddr, preprAddr] = await deployBaseMock(hre);
    const GovernanceContract = await hre.ethers.getContractFactory('Governance', {
      libraries: {
        Executor: executorLibAddr,
      },
    });

    const DSLctx = await (
      await ethers.getContractFactory('DSLContextMock')
    ).deploy(
      comparisonOpcodesLibAddr,
      branchingOpcodesLibAddr,
      logicalOpcodesLibAddr,
      otherOpcodesLibAddr,
      complexOpcodesLibAddr
    );
    await DSLctx.deployed();
    governance = await GovernanceContract.deploy(
      parserAddr,
      alice.address,
      tokenAddr,
      DSLctx.address,
      NEXT_MONTH
    );
    await governance.deployed();
    await parse(governance, preprAddr);

    /**
     * Alice creates a new record in Agreement. This record is disabled
     */
    // Create Agreement contract
    const stringUtilsAddr = await deployStringUtils(hre);
    agreementAddr = await deployAgreement(hre, governance.address, stringUtilsAddr);
    agreement = await ethers.getContractAt('Agreement', agreementAddr);
    txId = '133';
    const conditions = ['bool true'];
    const transaction = '(uint256 5) setUint256 AGREEMENT_RESULT';

    await governance.setStorageUint256(hex4Bytes('RECORD_ID'), txId);
    await governance.setStorageAddress(hex4Bytes('AGREEMENT_ADDR'), agreementAddr);
    await governance.setStorageAddress(hex4Bytes('TOKEN'), tokenAddr);

    // Check that added record can not be executable for now
    await agreement.connect(alice).update(
      txId,
      [], // required records
      [alice.address],
      transaction,
      conditions
    );

    await parse(agreement, preprAddr);
  });

  beforeEach(async () => {
    snapshotId = await network.provider.send('evm_snapshot');
  });

  afterEach(async () => {
    await network.provider.send('evm_revert', [snapshotId]);
  });

  it(
    'Voters vote "YES" by majority of the voters ' +
      'AND by majority of the tokens that voted.' +
      'The target Agreement record IS activated.',
    async () => {
      // Check that the agreement record is not active
      await expect(agreement.execute(txId)).to.be.revertedWith('AGR13');
      let record = await agreement.records(txId);
      expect(record.isActive).to.be.equal(false);

      /**
       * Governance voting occurs. If consensus is met - enable the target record.
       */
      // Check the setRecord data and execution
      let recordGov = await governance.records(0);
      expect(recordGov.isActive).to.be.equal(true);
      expect(recordGov.isExecuted).to.be.equal(false);

      // Top up voters wallets with voting tokens
      expect(await token.balanceOf(alice.address)).equal(parseEther('1000'));
      await token.connect(alice).transfer(carl.address, 500000);
      await token.connect(alice).transfer(david.address, 500000);

      // Alice executes the base record
      await governance.connect(alice).execute(0);
      recordGov = await governance.records(0);
      expect(recordGov.isActive).to.be.equal(true);
      expect(recordGov.isExecuted).to.be.equal(true);

      // Check that the base record was already executed
      await expect(governance.connect(alice).execute(0)).to.be.revertedWith('AGR7');

      // Check that account cannot vote without voting tokens
      await expect(governance.connect(bob).execute(1)).to.be.revertedWith('AGR6');
      await token.connect(alice).transfer(bob.address, 500000);

      // Other voters vote
      await governance.connect(bob).execute(1); // yes vote
      await governance.connect(carl).execute(1); // yes vote
      await governance.connect(david).execute(2); // no vote

      // It's not possible to vote twice
      await expect(governance.connect(bob).execute(1)).to.be.revertedWith('AGR7');
      // ... or change the vote
      await expect(governance.connect(bob).execute(2)).to.be.revertedWith('GOV1');

      // Check the yesRecord data and execution
      recordGov = await governance.records(1);
      expect(recordGov.isActive).to.be.equal(true);
      expect(recordGov.isExecuted).to.be.equal(false);

      // Check the noRecord data and execution
      recordGov = await governance.records(2);
      expect(recordGov.isActive).to.be.equal(true);
      expect(recordGov.isExecuted).to.be.equal(false);

      // Check the CheckRecord data and execution
      recordGov = await governance.records(3);
      expect(recordGov.isActive).to.be.equal(true);
      expect(recordGov.isExecuted).to.be.equal(false);

      // Deadline condition isn't satisfied
      await expect(governance.connect(alice).execute(3)).to.be.revertedWith('AGR6');

      // Increase time that is more that deadline and execute the record
      await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);

      // Calculate voting results after the voting deadline
      await governance.connect(alice).execute(3);
      await expect(governance.connect(carl).execute(3)).to.be.revertedWith('AGR1');
      await expect(governance.connect(alice).execute(3)).to.be.revertedWith('AGR7');

      recordGov = await governance.records(3);
      expect(recordGov.isActive).to.be.equal(true);
      expect(recordGov.isExecuted).to.be.equal(true);

      // Check that the target record in agreement was activated
      record = await agreement.records(txId);
      expect(record.isActive).to.be.equal(true);

      // Check that the result in agreement contract of the AGREEMENT_RESULT variable is zero
      expect(await agreement.getStorageUint256(hex4Bytes('AGREEMENT_RESULT'))).to.be.equal(0);

      // Check that record in agreement can be executed
      await agreement.execute(txId);

      // Check that the result in agreement contract of the AGREEMENT_RESULT variable is 5
      expect(await agreement.getStorageUint256(hex4Bytes('AGREEMENT_RESULT'))).to.be.equal(5);

      // Check that no one can vote anymore because of deadline
      await expect(governance.connect(bob).execute(2)).to.be.revertedWith('AGR6');
      await expect(governance.connect(carl).execute(2)).to.be.revertedWith('AGR6');
      await expect(governance.connect(david).execute(2)).to.be.revertedWith('AGR6');
    }
  );

  it(
    'Voters vote "NO" by majority of the voters' +
      ' AND by majority of the tokens that voted.' +
      'The target Agreement record isnt activated.',
    async () => {
      // Check that the agreement record is not active
      await expect(agreement.execute(txId)).to.be.revertedWith('AGR13');
      let record = await agreement.records(txId);
      expect(record.isActive).to.be.equal(false);

      /**
       * Governance voting occurs. If consensus is met -> enable the target record.
       */
      // Check the setRecord data and execution
      let recordGov = await governance.records(0);
      expect(recordGov.isActive).to.be.equal(true);
      expect(recordGov.isExecuted).to.be.equal(false);

      await governance.connect(alice).execute(0); // sets DSL code for the base record
      recordGov = await governance.records(0);
      expect(recordGov.isActive).to.be.equal(true);
      expect(recordGov.isExecuted).to.be.equal(true);

      // Check that the base record has already been created
      await expect(governance.connect(alice).execute(0)).to.be.revertedWith('AGR7');

      // Filling account wallets
      await token.connect(alice).transfer(carl.address, 500000);
      await token.connect(alice).transfer(david.address, 500000);

      // Check that account cannot vote with an empty wallet
      await expect(governance.connect(bob).execute(1)).to.be.revertedWith('AGR6');
      await token.connect(alice).transfer(bob.address, 500000);

      // Accounts make their vote
      await governance.connect(bob).execute(2); // no vote
      await governance.connect(carl).execute(2); // no vote
      await governance.connect(david).execute(1); // yes vote

      // Check the yesRecord data and execution
      recordGov = await governance.records(1);
      expect(recordGov.isActive).to.be.equal(true);
      expect(recordGov.isExecuted).to.be.equal(false);

      // Check the noRecord data and execution
      recordGov = await governance.records(2);
      expect(recordGov.isActive).to.be.equal(true);
      expect(recordGov.isExecuted).to.be.equal(false);

      // Check the CheckRecord data and execution
      recordGov = await governance.records(3);
      expect(recordGov.isActive).to.be.equal(true);
      expect(recordGov.isExecuted).to.be.equal(false);

      // Deadline condition isn't satisfied
      await expect(governance.connect(alice).execute(3)).to.be.revertedWith('AGR6');

      // Increase time that is more that deadline and execute the record
      await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);

      // The balance of those who voted "NO" is greater, so the record 3 is not fulfilled
      await expect(governance.connect(alice).execute(3)).to.be.revertedWith('AGR6');

      recordGov = await governance.records(3);
      expect(recordGov.isActive).to.be.equal(true);
      expect(recordGov.isExecuted).to.be.equal(false);

      // Check that the transaction entry has not been activated
      record = await agreement.records(txId);
      expect(record.isActive).to.be.equal(false);

      // Check that the result in agreement contract of the AGREEMENT_RESULT variable is zero
      expect(await agreement.getStorageUint256(hex4Bytes('AGREEMENT_RESULT'))).to.be.equal(0);

      // Check that record in agreement can't be executed
      await expect(agreement.execute(txId)).to.be.revertedWith('AGR1');

      // Check that AGREEMENT_RESULT variable's result in the agreement is still zero
      expect(await agreement.getStorageUint256(hex4Bytes('AGREEMENT_RESULT'))).to.be.equal(0);

      // Check that no one can vote anymore because of deadline
      await expect(governance.connect(bob).execute(2)).to.be.revertedWith('AGR6');
      await expect(governance.connect(carl).execute(2)).to.be.revertedWith('AGR6');
      await expect(governance.connect(david).execute(2)).to.be.revertedWith('AGR6');
    }
  );

  it(
    'Voters vote "YES" by minority of the voters' +
      'BUT they hold the majority of the tokens. ' +
      'The target Agreement record IS activated.',
    async () => {
      // Check that the agreement record is not active
      await expect(agreement.execute(txId)).to.be.revertedWith('AGR13');
      let record = await agreement.records(txId);
      expect(record.isActive).to.be.equal(false);

      /**
       * Governance voting occurs. If consensus is met -> enable the target record.
       */
      // Check the setRecord data and execution
      let recordGov = await governance.records(0);
      expect(recordGov.isActive).to.be.equal(true);
      expect(recordGov.isExecuted).to.be.equal(false);

      await governance.connect(alice).execute(0); // sets DSL code for the base record
      recordGov = await governance.records(0);
      expect(recordGov.isActive).to.be.equal(true);
      expect(recordGov.isExecuted).to.be.equal(true);

      // Check that the base record has already been created
      await expect(governance.connect(alice).execute(0)).to.be.revertedWith('AGR7');

      // Filling account wallets
      await token.connect(alice).transfer(carl.address, 100000);
      await token.connect(alice).transfer(david.address, 500000);

      // Check that account cannot vote with an empty wallet
      await expect(governance.connect(bob).execute(1)).to.be.revertedWith('AGR6');
      await token.connect(alice).transfer(bob.address, 100000);

      // Accounts make their vote. The David has the majority of voting power
      await governance.connect(bob).execute(1); // yes vote
      await governance.connect(carl).execute(1); // yes vote
      await governance.connect(david).execute(2); // no vote

      // Check the yesRecord data and execution
      recordGov = await governance.records(1);
      expect(recordGov.isActive).to.be.equal(true);
      expect(recordGov.isExecuted).to.be.equal(false);

      // Check the noRecord data and execution
      recordGov = await governance.records(2);
      expect(recordGov.isActive).to.be.equal(true);
      expect(recordGov.isExecuted).to.be.equal(false);

      // Check the CheckRecord data and execution
      recordGov = await governance.records(3);
      expect(recordGov.isActive).to.be.equal(true);
      expect(recordGov.isExecuted).to.be.equal(false);

      // Deadline condition isn't satisfied
      await expect(governance.connect(alice).execute(3)).to.be.revertedWith('AGR6');

      // Increase time that is more that deadline and execute the record
      await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);

      // The balance of those who voted "NO" is greater, so the record 3 is not fulfilled
      await expect(governance.connect(alice).execute(3)).to.be.revertedWith('AGR6');
      recordGov = await governance.records(3);
      expect(recordGov.isActive).to.be.equal(true);
      expect(recordGov.isExecuted).to.be.equal(false);

      // Check that the transaction entry has not been activated
      record = await agreement.records(txId);
      expect(record.isActive).to.be.equal(false);

      // Check that the result in agreement contract of the AGREEMENT_RESULT variable is zero
      expect(await agreement.getStorageUint256(hex4Bytes('AGREEMENT_RESULT'))).to.be.equal(0);

      // Check that record in agreement can't be executed
      await expect(agreement.execute(txId)).to.be.revertedWith('AGR1');

      // Check that AGREEMENT_RESULT variable's result in the agreement is still zero
      expect(await agreement.getStorageUint256(hex4Bytes('AGREEMENT_RESULT'))).to.be.equal(0);

      // Check that no one can vote anymore because of deadline
      await expect(governance.connect(bob).execute(2)).to.be.revertedWith('AGR6');
      await expect(governance.connect(carl).execute(2)).to.be.revertedWith('AGR6');
      await expect(governance.connect(david).execute(2)).to.be.revertedWith('AGR6');
    }
  );
});
