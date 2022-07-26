import { ethers } from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { formatEther, parseUnits } from 'ethers/lib/utils';
import { BigNumber } from 'ethers';
import { changeTokenBalanceAndGetTxHash, hex4Bytes } from '../utils/utils';
import { businessCaseSteps } from '../../scripts/data/agreement';
import { Token, Context__factory } from '../../typechain-types';
import { TxObject } from '../types';
import { AgreementMock, ConditionalTxsMock } from '../../typechain-types/agreement/mocks';

const dotenv = require('dotenv');

dotenv.config();

describe.skip('Agreement: business case', () => {
  let ContextCont: Context__factory;
  let agreement: AgreementMock;
  let whale: SignerWithAddress;
  let GP: SignerWithAddress;
  let LPs: SignerWithAddress[];
  let txsAddr: string;
  let txs: ConditionalTxsMock;
  let NEXT_MONTH: number;
  let NEXT_TWO_MONTH: number;
  let LAST_BLOCK_TIMESTAMP: number;
  let MAX_PERCENT: number;
  let dai: Token;

  const ONE_DAY = 60 * 60 * 24;
  const ONE_MONTH = ONE_DAY * 30;
  const ONE_YEAR = ONE_DAY * 365;

  const businessCaseTest = (
    name: string,
    GP_INITIAL: BigNumber,
    LP_INITIAL_ARR: BigNumber[],
    INITIAL_FUNDS_TARGET: BigNumber,
    CAPITAL_LOSS: BigNumber,
    CAPITAL_GAINS: BigNumber,
    DEPOSIT_MIN_PERCENT: number,
    PURCHASE_PERCENT: number,
    MANAGEMENT_FEE_PERCENTAGE: number,
    HURDLE: number,
    PROFIT_PART: number,
    GP_FAILS_TO_DO_GAP_DEPOSIT: boolean
  ) => {
    it(name, async () => {
      await cleanParam();

      MAX_PERCENT = 100 - DEPOSIT_MIN_PERCENT;
      // Start the test
      if (!CAPITAL_LOSS.isZero() && !CAPITAL_GAINS.isZero()) return;

      // Note: if we try do do illegal math (try to obtain a negative value ex. 5 - 10) or divide by
      //       0 then the DSL instruction will fall

      console.log('\n\nTesting Agreement Execution...\n\n');

      // Step 1
      console.log('\n🏃 Agreement Lifecycle - Txn #1');
      await dai.connect(whale).transfer(GP.address, GP_INITIAL);
      await dai.connect(GP).approve(txsAddr, GP_INITIAL);
      console.log(`GP Initial Deposit = ${formatEther(GP_INITIAL)} DAI`);

      await txs.setStorageAddress(hex4Bytes('DAI'), dai.address);
      await txs.setStorageAddress(hex4Bytes('GP'), GP.address);
      await txs.setStorageAddress(hex4Bytes('TRANSACTIONS_CONT'), txsAddr);
      await txs.setStorageUint256(hex4Bytes('INITIAL_FUNDS_TARGET'), INITIAL_FUNDS_TARGET);
      await txs.setStorageUint256(hex4Bytes('GP_INITIAL'), GP_INITIAL);
      await txs.setStorageUint256(hex4Bytes('MANAGEMENT_PERCENT'), MANAGEMENT_FEE_PERCENTAGE);
      await txs.setStorageUint256(hex4Bytes('DEPOSIT_MIN_PERCENT'), DEPOSIT_MIN_PERCENT);
      await txs.setStorageUint256(hex4Bytes('PLACEMENT_DATE'), NEXT_MONTH);

      let result = false;
      try {
        const txn1 = await agreement.connect(GP).execute(41);
        console.log(`Cash Balance = ${formatEther(await dai.balanceOf(txsAddr))} DAI`);
        console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
        console.log(`txn hash: \x1b[35m${txn1.hash}\x1b[0m`);
        result = true;
      } catch {
        await expect(agreement.connect(GP).execute(41)).to.be.revertedWith(
          'Agreement: tx condition is not satisfied'
        );
        console.log(`\x1b[33m
      Condition is not satisfied.
      GP must deposit a minimum ${DEPOSIT_MIN_PERCENT}% of the initial DAI funds target amount\x1b[0m
      `);
      }
      // Other tests have no sense if result is false
      if (!result) return;

      // Step 2
      console.log('\n🏃 Agreement Lifecycle - Txn #2');
      await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
      let LP_TOTAL = BigNumber.from(0);
      for await (const [i, LP_INITIAL] of LP_INITIAL_ARR.entries()) {
        console.log(`\tLP #${i + 1}`);
        const LP = LPs[i];
        await dai.connect(whale).transfer(LP.address, LP_INITIAL);
        await dai.connect(LP).approve(txsAddr, LP_INITIAL);
        console.log(`LP Initial Deposit = ${formatEther(LP_INITIAL)} DAI`);

        await txs.setStorageAddress(hex4Bytes('LP'), LP.address);
        await txs.setStorageUint256(hex4Bytes('LP_INITIAL'), LP_INITIAL);
        await txs.setStorageUint256(hex4Bytes('CLOSING_DATE'), NEXT_TWO_MONTH);
        const txn2 = await agreement.connect(LP).execute(42);
        console.log(`Cash Balance = ${formatEther(await dai.balanceOf(txsAddr))} DAI`);
        console.log(`signatory: \x1b[35m${LP.address}\x1b[0m`);
        console.log(`txn hash: \x1b[35m${txn2.hash}\x1b[0m`);
        const DSL_LP_TOTAL = await txs.getStorageUint256(hex4Bytes('LP_TOTAL'));
        console.log(`Total LP deposit = ${formatEther(DSL_LP_TOTAL)} DAI`);

        LP_TOTAL = LP_TOTAL.add(LP_INITIAL);
        expect(LP_TOTAL).to.equal(DSL_LP_TOTAL);
      }

      let GP_REMAINING = BigNumber.from(0);
      if (!GP_FAILS_TO_DO_GAP_DEPOSIT) {
        // Step 3
        console.log('\n🏃 Agreement Lifecycle - Txn #3');

        await ethers.provider.send('evm_setNextBlockTimestamp', [NEXT_TWO_MONTH]);
        GP_REMAINING = BigNumber.from(DEPOSIT_MIN_PERCENT)
          .mul(LP_TOTAL)
          .div(MAX_PERCENT)
          .sub(GP_INITIAL);
        await dai.connect(whale).transfer(GP.address, GP_REMAINING);
        await dai.connect(GP).approve(txsAddr, GP_REMAINING);
        console.log(`GP Gap Deposit = ${formatEther(GP_REMAINING)} DAI`);
        const GP_GAP_DEPOSIT_LOWER_TIME = NEXT_TWO_MONTH - ONE_DAY;
        const GP_GAP_DEPOSIT_UPPER_TIME = NEXT_TWO_MONTH + ONE_DAY;

        // Note: we give GP 2 days time to obtain P1 - MAX_PERCENT, P2 = DEPOSIT_MIN_PERCENT:
        // a P1% / P2% ratio of LP / GP deposits
        await txs.setStorageUint256(hex4Bytes('LOW_LIM'), GP_GAP_DEPOSIT_LOWER_TIME);
        await txs.setStorageUint256(hex4Bytes('UP_LIM'), GP_GAP_DEPOSIT_UPPER_TIME);
        await txs.setStorageUint256(hex4Bytes('P1'), MAX_PERCENT);
        const txn3Hash = await changeTokenBalanceAndGetTxHash(
          () => agreement.connect(GP).execute(43),
          dai,
          [GP],
          [GP_REMAINING.mul(-1)]
        );
        console.log(`Cash Balance = ${formatEther(await dai.balanceOf(txsAddr))} DAI`);
        console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
        console.log(`txn hash: \x1b[35m${txn3Hash}\x1b[0m`);
      }

      // Step 4
      console.log('\n🏃 Agreement Lifecycle - Txn #4');
      await ethers.provider.send('evm_setNextBlockTimestamp', [NEXT_TWO_MONTH + 2 * ONE_DAY]);
      await txs.setStorageUint256(hex4Bytes('FUND_INVESTMENT_DATE'), NEXT_TWO_MONTH + 7 * ONE_DAY);
      await txs.setStorageUint256(hex4Bytes('P1'), MAX_PERCENT);
      await txs.setStorageUint256(hex4Bytes('P2'), DEPOSIT_MIN_PERCENT);

      for (let i = 0; i < LP_INITIAL_ARR.length; i++) {
        const LP = LPs[i];
        const LP_INITIAL = LP_INITIAL_ARR[i];
        // Note: Extremely unsafe!!! LP can set LP.address and LP_INITIAL by itself
        await txs.setStorageUint256(hex4Bytes('LP_INITIAL'), LP_INITIAL);

        if (GP_FAILS_TO_DO_GAP_DEPOSIT) {
          console.log(`LP withdraws LP Initial Deposit = ${formatEther(LP_INITIAL)} DAI`);
          console.log(`GP withdraws GP Initial Deposit = ${formatEther(GP_INITIAL)} DAI`);
          const txn4Hash = await changeTokenBalanceAndGetTxHash(
            () => agreement.connect(LP).execute(44),
            dai,
            [GP, LP],
            [GP_INITIAL, LP_INITIAL]
          );
          console.log(`txn hash: \x1b[35m${txn4Hash}\x1b[0m`);
        } else {
          await expect(agreement.connect(LP).execute(44)).to.be.revertedWith(
            'Agreement: tx condition is not satisfied'
          );
          console.log(`\x1b[33m
      As GP did gap deposit, LP is not allowed to withdraw the funds.
      LP incurs transaction error if tries to withdraw funds after investment closing date\x1b[0m
      `);
        }
        console.log(`Cash Balance = ${formatEther(await dai.balanceOf(txsAddr))} DAI`);
        console.log(`signatory: \x1b[35m${LP.address}\x1b[0m`);
      }

      if (!GP_FAILS_TO_DO_GAP_DEPOSIT) {
        // Step 5
        console.log('\n🏃 Agreement Lifecycle - Txn #5');
        let DAI_BAL_OF_TXS = await dai.balanceOf(txsAddr);
        const PURCHASE_AMOUNT = DAI_BAL_OF_TXS.mul(PURCHASE_PERCENT).div(100);
        console.log(`GP ETH Asset Purchase = ${formatEther(PURCHASE_AMOUNT)} DAI`);
        const FUND_INVESTMENT_DATE = NEXT_TWO_MONTH + 7 * ONE_DAY;

        await ethers.provider.send('evm_setNextBlockTimestamp', [NEXT_TWO_MONTH + 7 * ONE_DAY]);
        await txs.setStorageUint256(hex4Bytes('FUND_INVESTMENT_DATE'), FUND_INVESTMENT_DATE);
        await txs.setStorageUint256(hex4Bytes('PURCHASE_AMOUNT'), PURCHASE_AMOUNT);
        await txs.setStorageUint256(hex4Bytes('PURCHASE_PERCENT'), PURCHASE_PERCENT);
        let txn5Hash;
        result = false;
        try {
          txn5Hash = await changeTokenBalanceAndGetTxHash(
            () => agreement.connect(GP).execute(45),
            dai,
            [GP],
            [PURCHASE_AMOUNT]
          );
          result = true;
        } catch {
          await expect(agreement.connect(GP).execute(45)).to.be.revertedWith(
            'Agreement: tx condition is not satisfied'
          );
          console.log(`\x1b[33m
        Condition is not satisfied.
        GP authorized to purchase the investment asset using up to 90% of total \
initiating funds\x1b[0m
          `);
        }
        // Other tests have no sense if result is false
        if (!result) return;

        console.log(`Cash Balance = ${formatEther(await dai.balanceOf(txsAddr))} DAI`);
        console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
        console.log(`txn hash: \x1b[35m${txn5Hash}\x1b[0m`);

        // Step 6
        console.log('\n🏃 Agreement Lifecycle - Txn #6');
        LP_TOTAL = await txs.getStorageUint256(hex4Bytes('LP_TOTAL'));
        const GP_PURCHASE_RETURN = PURCHASE_AMOUNT.sub(CAPITAL_LOSS).add(CAPITAL_GAINS);

        await ethers.provider.send('evm_setNextBlockTimestamp', [FUND_INVESTMENT_DATE + ONE_YEAR]);

        await txs.setStorageUint256(hex4Bytes('WHALE'), whale.address);
        await txs.setStorageUint256(hex4Bytes('GP_PURCHASE_RETURN'), GP_PURCHASE_RETURN);
        await dai.connect(whale).approve(txsAddr, GP_PURCHASE_RETURN);
        console.log(`Fund Investment Return = ${formatEther(GP_PURCHASE_RETURN)} DAI`);

        const cashBalanceBefore = await dai.balanceOf(txsAddr);
        const txn6 = await agreement.connect(GP).execute(46);
        const cashBalanceAfter = await dai.balanceOf(txsAddr);

        // TODO: balances should be equal
        // console.log(cashBalanceBefore.toString());
        // console.log(cashBalanceAfter.toString());
        // console.log(CAPITAL_GAINS.toString());

        // if (!cashBalanceAfter.eq(cashBalanceBefore.add(CAPITAL_GAINS))) {
        //   console.log(`\x1b[33m
        // Calculation balances error. Check if CAPITAL GAINS affect for cash balance\x1b[0m
        //   `);
        //   return;
        // }
        console.log(`Cash Balance = ${formatEther(await dai.balanceOf(txsAddr))} DAI`);
        console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
        console.log(`txn hash: \x1b[35m${txn6.hash}\x1b[0m`);

        // Step 7a
        console.log('\n🏃 Agreement Lifecycle - Txn #71');
        const MANAGEMENT_FEE = LP_TOTAL.mul(MANAGEMENT_FEE_PERCENTAGE).div(100);
        console.log(`GP Management Fee = ${formatEther(MANAGEMENT_FEE)} DAI`);

        const txn71Hash = await changeTokenBalanceAndGetTxHash(
          () => agreement.connect(GP).execute(471),
          dai,
          [GP],
          [MANAGEMENT_FEE]
        );
        console.log(`Cash Balance = ${formatEther(await dai.balanceOf(txsAddr))} DAI`);
        console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
        console.log(`txn hash: \x1b[35m${txn71Hash}\x1b[0m`);

        // Step 7b

        console.log('\n🏃 Agreement Lifecycle - Txn #72');
        DAI_BAL_OF_TXS = await dai.balanceOf(txsAddr);
        let PROFIT = DAI_BAL_OF_TXS.add(MANAGEMENT_FEE)
          .sub(GP_INITIAL)
          .sub(LP_TOTAL)
          .sub(GP_REMAINING);
        PROFIT = PROFIT.gt(0) ? PROFIT : BigNumber.from(0);
        console.log(`Fund Profit = ${formatEther(PROFIT)} DAI`);
        const THRESHOLD = LP_TOTAL.mul(HURDLE).div(100);
        const DELTA = PROFIT.gt(THRESHOLD) ? PROFIT.sub(THRESHOLD) : BigNumber.from(0);
        const CARRY = DELTA.mul(PROFIT_PART).div(100);

        console.log(`GP Carry Charge = ${formatEther(CARRY)} DAI`);

        await txs.setStorageUint256(hex4Bytes('HURDLE'), HURDLE);
        await txs.setStorageUint256(hex4Bytes('PROFIT_PART'), PROFIT_PART);

        const txn72Hash = await changeTokenBalanceAndGetTxHash(
          () => agreement.connect(GP).execute(472),
          dai,
          [GP],
          [CARRY]
        );
        console.log(`Cash Balance = ${formatEther(await dai.balanceOf(txsAddr))} DAI`);
        console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
        console.log(`txn hash: \x1b[35m${txn72Hash}\x1b[0m`);

        // Step 7c
        console.log('\n🏃 Agreement Lifecycle - Txn #73');
        DAI_BAL_OF_TXS = await dai.balanceOf(txsAddr);
        const LOSS = PROFIT.gt(0)
          ? BigNumber.from(0)
          : GP_INITIAL.add(LP_TOTAL).add(GP_REMAINING).sub(DAI_BAL_OF_TXS).sub(MANAGEMENT_FEE);
        console.log(`Fund Total Loss = ${formatEther(LOSS)} DAI`);
        const GP_PRINICIPAL = LOSS.gt(GP_INITIAL.add(GP_REMAINING))
          ? BigNumber.from(0)
          : GP_INITIAL.add(GP_REMAINING).sub(LOSS);
        console.log(`GP Principal = ${formatEther(GP_PRINICIPAL)} DAI`);

        const txn73Hash = await changeTokenBalanceAndGetTxHash(
          () => agreement.connect(GP).execute(473),
          dai,
          [GP],
          [GP_PRINICIPAL]
        );
        console.log(`Cash Balance = ${formatEther(await dai.balanceOf(txsAddr))} DAI`);
        console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
        console.log(`txn hash: \x1b[35m${txn73Hash}\x1b[0m`);

        // Step 8a
        console.log('\n🏃 Agreement Lifecycle - Txn #81');

        for (let i = 0; i < LP_INITIAL_ARR.length; i++) {
          const LP = LPs[i];
          const LP_INITIAL = LP_INITIAL_ARR[i];
          // Note: Extremely unsafe!!! LP can set LP.address and LP_INITIAL by itself
          await txs.setStorageUint256(hex4Bytes('LP_INITIAL'), LP_INITIAL);
          await txs.setStorageUint256(hex4Bytes('LP'), LP.address);

          const ALL_LPS_PROFIT = PROFIT.gt(0) ? PROFIT.sub(CARRY) : BigNumber.from(0);
          const LP_PROFIT = ALL_LPS_PROFIT.mul(LP_INITIAL).div(LP_TOTAL);
          console.log(`LP Investment Profit = ${formatEther(LP_PROFIT)} DAI`);

          const txn81Hash = await changeTokenBalanceAndGetTxHash(
            () => agreement.connect(LP).execute(481),
            dai,
            [LP],
            [LP_PROFIT]
          );
          DAI_BAL_OF_TXS = await dai.balanceOf(txsAddr);
          console.log(`Cash Balance = ${formatEther(DAI_BAL_OF_TXS)} DAI`);
          console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
          console.log(`txn hash: \x1b[35m${txn81Hash}\x1b[0m`);
        }

        // Step 8b
        console.log('\n🏃 Agreement Lifecycle - Txn #82');

        for (let i = 0; i < LP_INITIAL_ARR.length; i++) {
          const LP = LPs[i];
          const LP_INITIAL = LP_INITIAL_ARR[i];
          // Note: Extremely unsafe!!! LP can set LP.address and LP_INITIAL by itself
          await txs.setStorageUint256(hex4Bytes('LP_INITIAL'), LP_INITIAL);
          await txs.setStorageUint256(hex4Bytes('LP'), LP.address);

          const MANAGEMENT_FEE_LP = MANAGEMENT_FEE.mul(LP_INITIAL).div(LP_TOTAL);
          const UNCOVERED_NET_LOSSES = GP_INITIAL.sub(GP_REMAINING).gte(LOSS)
            ? BigNumber.from(0)
            : LOSS.sub(GP_INITIAL).sub(GP_REMAINING);
          console.log(`Uncovered Net Losses = ${formatEther(UNCOVERED_NET_LOSSES)} DAI`);
          const LP_PRINCIPAL = LP_INITIAL.sub(MANAGEMENT_FEE_LP).sub(UNCOVERED_NET_LOSSES);
          console.log(`LP Principal = ${formatEther(LP_PRINCIPAL)} DAI`);

          const txn82Hash = await changeTokenBalanceAndGetTxHash(
            () => agreement.connect(LP).execute(482),
            dai,
            [LP],
            [LP_PRINCIPAL]
          );
          console.log(`Cash Balance = ${formatEther(await dai.balanceOf(txsAddr))} DAI`);
          console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
          console.log(`txn hash: \x1b[35m${txn82Hash}\x1b[0m`);
        }
      }

      // clean transaction history inside of the contracts
      await cleanParam();
    });
  };

  before(async () => {
    [, , , whale, GP, ...LPs] = await ethers.getSigners();

    const address = process.env.AGREEMENT_ADDR;
    if (address) {
      agreement = (await ethers.getContractAt('Agreement', address)) as AgreementMock;
    } else {
      // TODO: what should we do if the user did not set the AGREEMENT_ADDR?
      console.log('The agreement address is undefined');
    }
    txsAddr = await agreement.txs();
    txs = (await ethers.getContractAt('ConditionalTxs', txsAddr)) as ConditionalTxsMock;
  });

  beforeEach(async () => {
    LAST_BLOCK_TIMESTAMP = (
      await ethers.provider.getBlock(
        // eslint-disable-next-line no-underscore-dangle
        ethers.provider._lastBlockNumber /* it's -2 but the resulting block number is correct */
      )
    ).timestamp;

    NEXT_MONTH = LAST_BLOCK_TIMESTAMP + ONE_MONTH;
    NEXT_TWO_MONTH = LAST_BLOCK_TIMESTAMP + 2 * ONE_MONTH;

    // returns funds to executor. Prevent errors in next
    // tests that might be occurred in previous tests
    await agreement.connect(whale).returnFunds();
    await txs.setStorageUint256(hex4Bytes('LP_TOTAL'), 0);
    await txs.setStorageUint256(hex4Bytes('GP_REMAINING'), 0);
    await txs.setStorageUint256(hex4Bytes('TWO_PERCENT'), 0);
    dai = await (await ethers.getContractFactory('Token'))
      .connect(whale)
      .deploy(parseUnits('100000000', 18));
  });

  afterEach(async () => {
    // returns funds to executor
    await agreement.connect(whale).returnFunds();
    await agreement.connect(whale).returnTokens(dai.address);
  });

  async function cleanParam() {
    const addresses: string[] = [whale.address, GP.address];
    for (let i = 0; i < LPs.length; i++) {
      const LP = LPs[i];
      addresses.push(LP.address);
    }
    await txs.cleanTx([41, 42, 43, 44, 45, 46, 471, 472, 473, 481, 482], addresses);
  }

  describe.skip('Lifecycle Test Multiple LPs', () => {
    businessCaseTest(
      'Scenario 1: LPs deposit; GP balances; Profit Realized',
      parseUnits('20', 18), // GP_INITIAL
      [parseUnits('300', 18), parseUnits('900', 18)], // LP_INITIAL_ARR
      parseUnits('1000', 18), // INITIAL_FUNDS_TARGET
      parseUnits('0', 18), // CAPITAL_LOSS
      parseUnits('200', 18), // CAPITAL_GAINS
      2, // DEPOSIT_MIN_PERCENT
      91, // PURCHASE_PERCENT
      2, // MANAGEMENT_FEE_PERCENTAGE
      9, // HURDLE
      20, // PROFIT_PART
      false // GP_FAILS_TO_DO_GAP_DEPOSIT
    );
  });

  describe.skip('Lifecycle Test one LP', () => {
    businessCaseTest(
      'Scenario 1:  LP deposits; GP balances; Profit Realized',
      parseUnits('20', 18), // GP_INITIAL
      [parseUnits('990', 18)], // LP_INITIAL
      parseUnits('1000', 18), // INITIAL_FUNDS_TARGET
      parseUnits('0', 18), // CAPITAL_LOSS
      parseUnits('200', 18), // CAPITAL_GAINS
      2, // DEPOSIT_MIN_PERCENT
      90, // PURCHASE_PERCENT
      2, // MANAGEMENT_FEE_PERCENTAGE
      9, // HURDLE
      20, // PROFIT_PART
      false // GP_FAILS_TO_DO_GAP_DEPOSIT
    );

    businessCaseTest(
      'Scenario 2:  GP fails to balance LP deposit',
      parseUnits('20', 18), // GP_INITIAL
      [parseUnits('990', 18)], // LP_INITIAL
      parseUnits('1000', 18), // INITIAL_FUNDS_TARGET
      parseUnits('0', 18), // CAPITAL_LOSS
      parseUnits('200', 18), // CAPITAL_GAINS,
      2, // DEPOSIT_MIN_PERCENT
      90, // PURCHASE_PERCENT
      2, // MANAGEMENT_FEE_PERCENTAGE
      9, // HURDLE
      20, // PROFIT_PART
      true // GP_FAILS_TO_DO_GAP_DEPOSIT
    );

    businessCaseTest(
      'Scenario 3:  Loss incurred, fully covered by GP',
      parseUnits('20', 18), // GP_INITIAL
      [parseUnits('990', 18)], // LP_INITIAL
      parseUnits('1000', 18), // INITIAL_FUNDS_TARGET
      parseUnits('10', 18), // CAPITAL_LOSS
      parseUnits('0', 18), // CAPITAL_GAINS
      2, // DEPOSIT_MIN_PERCENT
      90, // PURCHASE_PERCENT
      2, // MANAGEMENT_FEE_PERCENTAGE
      9, // HURDLE
      20, // PROFIT_PART
      false // GP_FAILS_TO_DO_GAP_DEPOSIT
    );
    businessCaseTest(
      'Scenario 4:  Loss incurred, not fully covered by GP',
      parseUnits('20', 18), // GP_INITIAL
      [parseUnits('990', 18)], // LP_INITIAL
      parseUnits('1000', 18), // INITIAL_FUNDS_TARGET
      parseUnits('100', 18), // CAPITAL_LOSS
      parseUnits('0', 18), // CAPITAL_GAINS,
      2, // DEPOSIT_MIN_PERCENT
      90, // PURCHASE_PERCENT
      2, // MANAGEMENT_FEE_PERCENTAGE
      9, // HURDLE
      20, // PROFIT_PART
      false // GP_FAILS_TO_DO_GAP_DEPOSIT
    );

    businessCaseTest(
      'Scenario 5: Using bigger values, PURCHASE_PERCENT less than 90',
      parseUnits('20000', 18), // GP_INITIAL
      [parseUnits('990000', 18)], // LP_INITIAL
      parseUnits('1000000', 18), // INITIAL_FUNDS_TARGET
      parseUnits('0', 18), // CAPITAL_LOSS
      parseUnits('200000', 18), // CAPITAL_GAINS,
      2, // DEPOSIT_MIN_PERCENT
      89, // PURCHASE_PERCENT
      2, // MANAGEMENT_FEE_PERCENTAGE
      9, // HURDLE
      20, // PROFIT_PART
      false // GP_FAILS_TO_DO_GAP_DEPOSIT
    );

    businessCaseTest(
      'Scenario 6:  GP_INITIAL less than needed',
      parseUnits('20', 18), // GP_INITIAL
      [parseUnits('990000', 18)], // LP_INITIAL
      parseUnits('100000', 18), // INITIAL_FUNDS_TARGET
      parseUnits('0', 18), // CAPITAL_LOSS
      parseUnits('200000', 18), // CAPITAL_GAINS,
      2, // DEPOSIT_MIN_PERCENT
      89, // PURCHASE_PERCENT
      2, // MANAGEMENT_FEE_PERCENTAGE
      9, // HURDLE
      20, // PROFIT_PART
      false // GP_FAILS_TO_DO_GAP_DEPOSIT
    );

    businessCaseTest(
      'Scenario 7:  PURCHASE_PERCENT more than 90',
      parseUnits('20', 18), // GP_INITIAL
      [parseUnits('990', 18)], // LP_INITIAL
      parseUnits('1000', 18), // INITIAL_FUNDS_TARGET
      parseUnits('0', 18), // CAPITAL_LOSS
      parseUnits('200', 18), // CAPITAL_GAINS
      2, // DEPOSIT_MIN_PERCENT
      91, // PURCHASE_PERCENT
      2, // MANAGEMENT_FEE_PERCENTAGE
      9, // HURDLE
      20, // PROFIT_PART
      false // GP_FAILS_TO_DO_GAP_DEPOSIT
    );

    businessCaseTest(
      'Scenario 8:  HURDLE is 1 percent',
      parseUnits('20', 18), // GP_INITIAL
      [parseUnits('990', 18)], // LP_INITIAL
      parseUnits('1000', 18), // INITIAL_FUNDS_TARGET
      parseUnits('0', 18), // CAPITAL_LOSS
      parseUnits('200', 18), // CAPITAL_GAINS
      2, // DEPOSIT_MIN_PERCENT
      89, // PURCHASE_PERCENT
      2, // MANAGEMENT_FEE_PERCENTAGE
      1, // HURDLE
      20, // PROFIT_PART
      false // GP_FAILS_TO_DO_GAP_DEPOSIT
    );

    businessCaseTest(
      'Scenario 9:  MANAGEMENT_FEE_PERCENTAGE is 33%',
      parseUnits('20', 18), // GP_INITIAL
      [parseUnits('990', 18)], // LP_INITIAL
      parseUnits('1000', 18), // INITIAL_FUNDS_TARGET
      parseUnits('0', 18), // CAPITAL_LOSS
      parseUnits('200', 18), // CAPITAL_GAINS
      2, // DEPOSIT_MIN_PERCENT
      90, // PURCHASE_PERCENT
      33, // MANAGEMENT_FEE_PERCENTAGE
      9, // HURDLE
      20, // PROFIT_PART
      false // GP_FAILS_TO_DO_GAP_DEPOSIT
    );

    businessCaseTest(
      'Scenario 10:  Carry Charge is 0%',
      parseUnits('20', 18), // GP_INITIAL
      [parseUnits('990', 18)], // LP_INITIAL
      parseUnits('1000', 18), // INITIAL_FUNDS_TARGET
      parseUnits('0', 18), // CAPITAL_LOSS
      parseUnits('200', 18), // CAPITAL_GAINS
      2, // DEPOSIT_MIN_PERCENT
      90, // PURCHASE_PERCENT
      2, // MANAGEMENT_FEE_PERCENTAGE
      9, // HURDLE
      0, // PROFIT_PART
      false // GP_FAILS_TO_DO_GAP_DEPOSIT
    );

    businessCaseTest(
      'Scenario 11:  CAPITAL_GAINS capital gains is big',
      parseUnits('20', 18), // GP_INITIAL
      [parseUnits('990', 18)], // LP_INITIAL
      parseUnits('1000', 18), // INITIAL_FUNDS_TARGET
      parseUnits('0', 18), // CAPITAL_LOSS
      parseUnits('333333', 18), // CAPITAL_GAINS
      2, // DEPOSIT_MIN_PERCENT
      90, // PURCHASE_PERCENT
      2, // MANAGEMENT_FEE_PERCENTAGE
      9, // HURDLE
      20, // PROFIT_PART
      false // GP_FAILS_TO_DO_GAP_DEPOSIT
    );

    businessCaseTest(
      'Scenario 12: smart contract does not store funds if values are small',
      parseUnits('1999999', 0), // GP_INITIAL
      [parseUnits('98555555', 0)], // LP_INITIAL
      parseUnits('99999999', 0), // INITIAL_FUNDS_TARGET
      parseUnits('0', 0), // CAPITAL_LOSS
      parseUnits('23636363', 0), // CAPITAL_GAINS
      2, // DEPOSIT_MIN_PERCENT
      90, // PURCHASE_PERCENT
      2, // MANAGEMENT_FEE_PERCENTAGE
      9, // HURDLE
      20, // PROFIT_PART
      false // GP_FAILS_TO_DO_GAP_DEPOSIT
    );

    businessCaseTest(
      'Scenario 13:  smart contract does not store funds if values too small',
      parseUnits('1998', 0), // GP_INITIAL
      [parseUnits('99999', 0)], // LP_INITIAL
      parseUnits('99900', 0), // INITIAL_FUNDS_TARGET
      parseUnits('0', 0), // CAPITAL_LOSS
      parseUnits('19111', 0), // CAPITAL_GAINS
      2, // DEPOSIT_MIN_PERCENT
      90, // PURCHASE_PERCENT
      2, // MANAGEMENT_FEE_PERCENTAGE
      9, // HURDLE
      20, // PROFIT_PART
      false // GP_FAILS_TO_DO_GAP_DEPOSIT
    );

    businessCaseTest(
      'Scenario 14: DEPOSIT_MIN_PERCENT is 1%',
      parseUnits('10', 18), // GP_INITIAL
      [parseUnits('999', 18)], // LP_INITIAL
      parseUnits('1000', 18), // INITIAL_FUNDS_TARGET
      parseUnits('0', 18), // CAPITAL_LOSS
      parseUnits('200', 18), // CAPITAL_GAINS
      1, // DEPOSIT_MIN_PERCENT
      90, // PURCHASE_PERCENT
      2, // MANAGEMENT_FEE_PERCENTAGE
      9, // HURDLE
      20, // PROFIT_PART
      false // GP_FAILS_TO_DO_GAP_DEPOSIT
    );

    // used the 34% / 66% percentage, as in the third agreement we have dividing values by 66 %
    // P1 = 100 - 34
    // ex. loadLocal uint256 DEPOSIT_MIN_PERCENT * loadLocal uint256 LP_INITIAL / loadLocal uint256
    // P1
    businessCaseTest(
      'Scenario 15: Should be non zero value in the end of contract. Correct LP investment profit',
      parseUnits('340000', 0), // GP_INITIAL
      [parseUnits('900000', 0)], // LP_INITIAL
      parseUnits('1000000', 0), // INITIAL_FUNDS_TARGET
      parseUnits('0', 0), // CAPITAL_LOSS
      parseUnits('340000', 0), // CAPITAL_GAINS
      34, // DEPOSIT_MIN_PERCENT
      90, // PURCHASE_PERCENT
      2, // MANAGEMENT_FEE_PERCENTAGE
      9, // HURDLE
      20, // PROFIT_PART
      false // GP_FAILS_TO_DO_GAP_DEPOSIT
    );
  });
});
