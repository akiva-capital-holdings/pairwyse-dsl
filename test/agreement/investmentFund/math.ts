import * as hre from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { formatEther, parseUnits } from 'ethers/lib/utils';
import { BigNumber } from 'ethers';
import dotenv from 'dotenv';
import { addSteps, changeTokenBalanceAndGetTxHash, hex4Bytes } from '../../utils/utils';
import { businessCaseSteps } from '../../../scripts/data/agreement';
import { Token } from '../../../typechain-types';
import { Agreement } from '../../../typechain-types/agreement';
import { deployAgreement, deployPreprocessor } from '../../../scripts/utils/deploy.utils';
import { ONE_DAY, ONE_MONTH, ONE_YEAR } from '../../utils/constants';
import { MultisigMock } from '../../../typechain-types/agreement/mocks/MultisigMock';

const { ethers, network } = hre;
dotenv.config();

describe('Agreement: Investment Fund tests math', () => {
  let agreement: Agreement;
  let agreementAddr: string;
  let preprocessorAddr: string;
  let multisig: MultisigMock;
  let alice: SignerWithAddress;
  let GP: SignerWithAddress;
  let LPs: SignerWithAddress[];
  let NEXT_MONTH: number;
  let NEXT_TWO_MONTH: number;
  let MAX_PERCENT: number;
  let dai: Token;
  let snapshotId: number;

  // TODO: merge with test/utils/utils/businessCaseTest()
  const businessCaseTestDivisionErrors = (
    name: string,
    base: string,
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
      // ✅ Step 0 | Setup
      // Set variables

      MAX_PERCENT = 100 - DEPOSIT_MIN_PERCENT;
      // Start the test
      if (!CAPITAL_LOSS.isZero() && !CAPITAL_GAINS.isZero()) return;

      // Note: if we try do do illegal math (try to obtain a negative value ex. 5 - 10) or divide by
      //       0 then the DSL instruction will fall

      console.log('\n\nTesting Agreement Execution...\n\n');

      let EXPECTED_CONTRACT_BAL_BN = BigNumber.from('0');
      let EXPECTED_CONTRACT_BAL = 0;

      // ✅ Step 1
      let txId = base.concat('1');
      console.log(`\n🏃 Agreement Lifecycle - Txn #${txId}`);
      await dai.connect(alice).transfer(GP.address, GP_INITIAL);
      await dai.connect(GP).approve(agreementAddr, GP_INITIAL);
      console.log(`GP Initial Deposit = ${formatEther(GP_INITIAL)} DAI`);
      await agreement.setStorageAddress(hex4Bytes('DAI'), dai.address);
      await agreement.setStorageAddress(hex4Bytes('GP'), GP.address);
      await agreement.setStorageAddress(hex4Bytes('TRANSACTIONS_CONT'), agreementAddr);
      await agreement.setStorageUint256(hex4Bytes('INITIAL_FUNDS_TARGET'), INITIAL_FUNDS_TARGET);
      await agreement.setStorageUint256(hex4Bytes('GP_INITIAL'), GP_INITIAL);
      await agreement.setStorageUint256(hex4Bytes('PLACEMENT_DATE'), NEXT_MONTH);
      await agreement.setStorageUint256(hex4Bytes('MANAGEMENT_PERCENT'), MANAGEMENT_FEE_PERCENTAGE);
      await agreement.setStorageUint256(hex4Bytes('DEPOSIT_MIN_PERCENT'), DEPOSIT_MIN_PERCENT);

      const txn1 = await agreement.connect(GP).execute(txId);
      EXPECTED_CONTRACT_BAL_BN = EXPECTED_CONTRACT_BAL_BN.add(GP_INITIAL);
      EXPECTED_CONTRACT_BAL += GP_INITIAL.toNumber();
      let daiBal = await dai.balanceOf(agreementAddr);
      expect(daiBal).to.equal(EXPECTED_CONTRACT_BAL_BN);

      console.log({
        realContractBal: daiBal.toString(),
        calcBalBN: EXPECTED_CONTRACT_BAL_BN.toString(),
        calcBalNumber: EXPECTED_CONTRACT_BAL,
      });

      console.log(`Cash Balance = ${formatEther(daiBal)} DAI`);
      console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
      console.log(`txn hash: \x1b[35m${txn1.hash}\x1b[0m`);

      // ✅ Step 2
      txId = base.concat('2');
      console.log(`\n🏃 Agreement Lifecycle - Txn #${txId}`);
      await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
      let LP_TOTAL = BigNumber.from(0);
      for await (const [i, LP_INITIAL] of LP_INITIAL_ARR.entries()) {
        console.log(`\tLP #${i + 1}`);
        const LP = LPs[i];
        await dai.connect(alice).transfer(LP.address, LP_INITIAL);
        await dai.connect(LP).approve(agreementAddr, LP_INITIAL);
        console.log(`LP Initial Deposit = ${formatEther(LP_INITIAL)} DAI`);

        await agreement.setStorageAddress(hex4Bytes('LP'), LP.address);
        await agreement.setStorageUint256(hex4Bytes('LP_INITIAL'), LP_INITIAL);
        await agreement.setStorageUint256(hex4Bytes('CLOSING_DATE'), NEXT_TWO_MONTH);

        const txn2 = await agreement.connect(LP).execute(txId);

        EXPECTED_CONTRACT_BAL_BN = EXPECTED_CONTRACT_BAL_BN.add(LP_INITIAL);
        EXPECTED_CONTRACT_BAL += LP_INITIAL.toNumber();
        daiBal = await dai.balanceOf(agreementAddr);
        expect(daiBal).to.equal(EXPECTED_CONTRACT_BAL_BN);

        console.log({
          realContractBal: daiBal.toString(),
          calcBalBN: EXPECTED_CONTRACT_BAL_BN.toString(),
          calcBalNumber: EXPECTED_CONTRACT_BAL,
        });

        console.log(`Cash Balance = ${formatEther(daiBal)} DAI`);
        console.log(`signatory: \x1b[35m${LP.address}\x1b[0m`);
        console.log(`txn hash: \x1b[35m${txn2.hash}\x1b[0m`);
        const DSL_LP_TOTAL = await agreement.getStorageUint256(hex4Bytes('LP_TOTAL'));
        console.log(`Total LP deposit = ${formatEther(DSL_LP_TOTAL)} DAI`);

        LP_TOTAL = LP_TOTAL.add(LP_INITIAL);
        expect(LP_TOTAL).to.equal(DSL_LP_TOTAL);
      }

      let GP_REMAINING_BN: BigNumber;
      let GP_REMAINING = 0;
      if (!GP_FAILS_TO_DO_GAP_DEPOSIT) {
        // ✅ Step 3
        txId = base.concat('3');
        console.log(`\n🏃 Agreement Lifecycle - Txn #${txId}`);

        await ethers.provider.send('evm_setNextBlockTimestamp', [NEXT_TWO_MONTH]);
        GP_REMAINING_BN = BigNumber.from(DEPOSIT_MIN_PERCENT)
          .mul(LP_TOTAL)
          .div(MAX_PERCENT)
          .sub(GP_INITIAL);
        GP_REMAINING_BN = GP_REMAINING_BN.lt(0) ? BigNumber.from(0) : GP_REMAINING_BN;
        GP_REMAINING =
          (DEPOSIT_MIN_PERCENT * LP_TOTAL.toNumber()) / MAX_PERCENT - GP_INITIAL.toNumber();
        GP_REMAINING = GP_REMAINING < 0 ? 0 : GP_REMAINING;

        await dai.connect(alice).transfer(GP.address, GP_REMAINING_BN);
        await dai.connect(GP).approve(agreementAddr, GP_REMAINING_BN);
        console.log(`GP Gap Deposit = ${formatEther(GP_REMAINING_BN)} DAI`);
        const GP_GAP_DEPOSIT_LOWER_TIME = NEXT_TWO_MONTH - ONE_DAY;
        const GP_GAP_DEPOSIT_UPPER_TIME = NEXT_TWO_MONTH + ONE_DAY;

        // Note: we give GP 2 days time to obtain P1 - MAX_PERCENT, P2 = DEPOSIT_MIN_PERCENT:
        // a P1% / P2% ratio of LP / GP deposits
        await agreement.setStorageUint256(hex4Bytes('LOW_LIM'), GP_GAP_DEPOSIT_LOWER_TIME);
        await agreement.setStorageUint256(hex4Bytes('UP_LIM'), GP_GAP_DEPOSIT_UPPER_TIME);
        await agreement.setStorageUint256(hex4Bytes('P1'), MAX_PERCENT);

        const txn3Hash = await changeTokenBalanceAndGetTxHash(
          () => agreement.connect(GP).execute(txId),
          dai,
          [GP],
          [GP_REMAINING_BN.mul(-1)]
        );

        EXPECTED_CONTRACT_BAL_BN = EXPECTED_CONTRACT_BAL_BN.add(GP_REMAINING_BN);
        EXPECTED_CONTRACT_BAL += GP_REMAINING;
        daiBal = await dai.balanceOf(agreementAddr);
        expect(daiBal).to.equal(EXPECTED_CONTRACT_BAL_BN);

        console.log({
          realContractBal: daiBal.toString(),
          calcBalBN: EXPECTED_CONTRACT_BAL_BN.toString(),
          calcBalNumber: EXPECTED_CONTRACT_BAL,
        });

        console.log(`Cash Balance = ${formatEther(daiBal)} DAI`);
        console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
        console.log(`txn hash: \x1b[35m${txn3Hash}\x1b[0m`);
      }

      // ✅ Step 4
      txId = base.concat('4');
      console.log('\n🏃 Agreement Lifecycle - Txn #4');
      await ethers.provider.send('evm_setNextBlockTimestamp', [NEXT_TWO_MONTH + 2 * ONE_DAY]);
      await agreement.setStorageUint256(
        hex4Bytes('FUND_INVESTMENT_DATE'),
        NEXT_TWO_MONTH + 7 * ONE_DAY
      );
      await agreement.setStorageUint256(hex4Bytes('P1'), MAX_PERCENT);
      await agreement.setStorageUint256(hex4Bytes('P2'), DEPOSIT_MIN_PERCENT);

      for (let i = 0; i < LP_INITIAL_ARR.length; i++) {
        const LP = LPs[i];
        const LP_INITIAL = LP_INITIAL_ARR[i];
        // Note: Extremely unsafe!!! LP can set LP.address and LP_INITIAL by itself
        await agreement.setStorageUint256(hex4Bytes('LP_INITIAL'), LP_INITIAL);

        if (GP_FAILS_TO_DO_GAP_DEPOSIT) {
          console.log(`LP withdraws LP Initial Deposit = ${formatEther(LP_INITIAL)} DAI`);
          console.log(`GP withdraws GP Initial Deposit = ${formatEther(GP_INITIAL)} DAI`);
          const txn4Hash = await changeTokenBalanceAndGetTxHash(
            () => agreement.connect(LP).execute(txId),
            dai,
            [GP, LP],
            [GP_INITIAL, LP_INITIAL]
          );
          console.log(`txn hash: \x1b[35m${txn4Hash}\x1b[0m`);
        } else {
          await expect(agreement.connect(LP).execute(txId)).to.be.revertedWith('AGR6');
          console.log(`\x1b[33m
      As GP did gap deposit, LP is not allowed to withdraw the funds.
      LP incurs transaction error if tries to withdraw funds after investment closing date\x1b[0m
      `);
        }

        console.log({
          realContractBal: daiBal.toString(),
          calcBalBN: EXPECTED_CONTRACT_BAL_BN.toString(),
          calcBalNumber: EXPECTED_CONTRACT_BAL,
        });

        console.log(`Cash Balance = ${formatEther(await dai.balanceOf(agreementAddr))} DAI`);
        console.log(`signatory: \x1b[35m${LP.address}\x1b[0m`);
      }

      if (!GP_FAILS_TO_DO_GAP_DEPOSIT) {
        // ✅ Step 5
        txId = base.concat('5');
        console.log('\n🏃 Agreement Lifecycle - Txn #5');
        const DAI_BAL_OF_TXS = await dai.balanceOf(agreementAddr);
        const PURCHASE_AMOUNT_BN = DAI_BAL_OF_TXS.mul(PURCHASE_PERCENT).div(100);
        const PURCHASE_AMOUNT = (EXPECTED_CONTRACT_BAL * PURCHASE_PERCENT) / 100;
        console.log(`GP ETH Asset Purchase = ${formatEther(PURCHASE_AMOUNT_BN)} DAI`);
        const FUND_INVESTMENT_DATE = NEXT_TWO_MONTH + 7 * ONE_DAY;

        await ethers.provider.send('evm_setNextBlockTimestamp', [NEXT_TWO_MONTH + 7 * ONE_DAY]);
        await agreement.setStorageUint256(hex4Bytes('FUND_INVESTMENT_DATE'), FUND_INVESTMENT_DATE);
        await agreement.setStorageUint256(hex4Bytes('PURCHASE_AMOUNT'), PURCHASE_AMOUNT_BN);
        await agreement.setStorageUint256(hex4Bytes('PURCHASE_PERCENT'), PURCHASE_PERCENT);

        const txn5Hash = await changeTokenBalanceAndGetTxHash(
          () => agreement.connect(GP).execute(txId),
          dai,
          [GP],
          [PURCHASE_AMOUNT_BN]
        );

        EXPECTED_CONTRACT_BAL_BN = EXPECTED_CONTRACT_BAL_BN.sub(PURCHASE_AMOUNT_BN);
        EXPECTED_CONTRACT_BAL -= PURCHASE_AMOUNT;
        daiBal = await dai.balanceOf(agreementAddr);
        expect(daiBal).to.equal(EXPECTED_CONTRACT_BAL_BN);

        console.log({
          realContractBal: daiBal.toString(),
          calcBalBN: EXPECTED_CONTRACT_BAL_BN.toString(),
          calcBalNumber: EXPECTED_CONTRACT_BAL,
        });

        console.log(`Cash Balance = ${formatEther(daiBal)} DAI`);
        console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
        console.log(`txn hash: \x1b[35m${txn5Hash}\x1b[0m`);

        // ✅ Step 6
        txId = base.concat('6');
        console.log('\n🏃 Agreement Lifecycle - Txn #6');
        LP_TOTAL = await agreement.getStorageUint256(hex4Bytes('LP_TOTAL'));
        const WHALE = alice.address;
        const GP_PURCHASE_RETURN_BN = PURCHASE_AMOUNT_BN.sub(CAPITAL_LOSS).add(CAPITAL_GAINS);
        const GP_PURCHASE_RETURN =
          PURCHASE_AMOUNT - CAPITAL_LOSS.toNumber() + CAPITAL_GAINS.toNumber();
        console.log({ GP_PURCHASE_RETURN_BN: GP_PURCHASE_RETURN_BN.toString() });

        await ethers.provider.send('evm_setNextBlockTimestamp', [FUND_INVESTMENT_DATE + ONE_YEAR]);

        await agreement.setStorageUint256(hex4Bytes('WHALE'), WHALE);
        await agreement.setStorageUint256(hex4Bytes('GP_PURCHASE_RETURN'), GP_PURCHASE_RETURN_BN);
        await dai.connect(alice).approve(agreementAddr, GP_PURCHASE_RETURN_BN);
        console.log(`Fund Investment Return = ${formatEther(GP_PURCHASE_RETURN_BN)} DAI`);

        const cashBalanceBefore = await dai.balanceOf(agreementAddr);
        const txn6 = await agreement.connect(GP).execute(txId);
        const cashBalanceAfter = await dai.balanceOf(agreementAddr);

        EXPECTED_CONTRACT_BAL_BN = EXPECTED_CONTRACT_BAL_BN.add(GP_PURCHASE_RETURN_BN);
        EXPECTED_CONTRACT_BAL += GP_PURCHASE_RETURN;
        daiBal = await dai.balanceOf(agreementAddr);
        expect(daiBal).to.equal(EXPECTED_CONTRACT_BAL_BN);

        console.log({
          realContractBal: daiBal.toString(),
          calcBalBN: EXPECTED_CONTRACT_BAL_BN.toString(),
          calcBalNumber: EXPECTED_CONTRACT_BAL,
        });

        console.log({ CAPITAL_GAINS: CAPITAL_GAINS.toString() });
        console.log({ cashBalanceBefore: cashBalanceBefore.toString() });
        console.log({ cashBalanceAfter: cashBalanceAfter.toString() });

        if (!cashBalanceAfter.eq(cashBalanceBefore.add(GP_PURCHASE_RETURN_BN))) {
          throw new Error(
            'Calculation balances error. Check if CAPITAL GAINS affect for cash balance'
          );
        }
        console.log(`Cash Balance = ${formatEther(daiBal)} DAI`);
        console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
        console.log(`txn hash: \x1b[35m${txn6.hash}\x1b[0m`);

        // ✅ Step 7a
        txId = base.concat('71');
        console.log('\n🏃 Agreement Lifecycle - Txn #71');
        const MANAGEMENT_FEE_BN = LP_TOTAL.mul(MANAGEMENT_FEE_PERCENTAGE).div(100);
        const MANAGEMENT_FEE = (LP_TOTAL.toNumber() * MANAGEMENT_FEE_PERCENTAGE) / 100;
        console.log(`GP Management Fee = ${formatEther(MANAGEMENT_FEE_BN)} DAI`);

        const txn71Hash = await changeTokenBalanceAndGetTxHash(
          () => agreement.connect(GP).execute(txId),
          dai,
          [GP],
          [MANAGEMENT_FEE_BN]
        );

        EXPECTED_CONTRACT_BAL_BN = EXPECTED_CONTRACT_BAL_BN.sub(MANAGEMENT_FEE_BN);
        EXPECTED_CONTRACT_BAL -= MANAGEMENT_FEE;
        daiBal = await dai.balanceOf(agreementAddr);
        expect(daiBal).to.equal(EXPECTED_CONTRACT_BAL_BN);

        console.log({
          realContractBal: daiBal.toString(),
          calcBalBN: EXPECTED_CONTRACT_BAL_BN.toString(),
          calcBalNumber: EXPECTED_CONTRACT_BAL,
        });

        console.log(`Cash Balance = ${formatEther(daiBal)} DAI`);
        console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
        console.log(`txn hash: \x1b[35m${txn71Hash}\x1b[0m`);

        // ✅ Step 7b
        txId = base.concat('72');
        console.log('\n🏃 Agreement Lifecycle - Txn #72');

        let PROFIT_BN = BigNumber.from(EXPECTED_CONTRACT_BAL_BN)
          .add(MANAGEMENT_FEE_BN)
          .sub(GP_INITIAL)
          .sub(LP_TOTAL)
          .sub(GP_REMAINING);
        PROFIT_BN = PROFIT_BN.gt(0) ? PROFIT_BN : BigNumber.from(0);
        let PROFIT =
          EXPECTED_CONTRACT_BAL +
          MANAGEMENT_FEE -
          GP_INITIAL.toNumber() -
          LP_TOTAL.toNumber() -
          GP_REMAINING;
        PROFIT = PROFIT > 0 ? PROFIT : 0;

        console.log(`Fund Profit = ${formatEther(PROFIT_BN)} DAI`);
        const THRESHOLD_BN = LP_TOTAL.mul(HURDLE).div(100);
        const THRESHOLD = (LP_TOTAL.toNumber() * HURDLE) / 100;
        const DELTA_BN = PROFIT_BN.gt(THRESHOLD_BN)
          ? PROFIT_BN.sub(THRESHOLD_BN)
          : BigNumber.from(0);
        const DELTA = PROFIT > THRESHOLD ? PROFIT - THRESHOLD : 0;
        const CARRY_BN = DELTA_BN.mul(PROFIT_PART).div(100);
        const CARRY = (DELTA * PROFIT_PART) / 100;

        console.log(`GP Carry Charge = ${formatEther(CARRY_BN)} DAI`);

        await agreement.setStorageUint256(hex4Bytes('HURDLE'), HURDLE);
        await agreement.setStorageUint256(hex4Bytes('PROFIT_PART'), PROFIT_PART);

        const txn72Hash = await changeTokenBalanceAndGetTxHash(
          () => agreement.connect(GP).execute(txId),
          dai,
          [GP],
          [CARRY_BN]
        );

        EXPECTED_CONTRACT_BAL_BN = EXPECTED_CONTRACT_BAL_BN.sub(CARRY_BN);
        EXPECTED_CONTRACT_BAL -= CARRY;
        daiBal = await dai.balanceOf(agreementAddr);
        expect(daiBal).to.equal(EXPECTED_CONTRACT_BAL_BN);

        console.log({
          realContractBal: daiBal.toString(),
          calcBalBN: EXPECTED_CONTRACT_BAL_BN.toString(),
          calcBalNumber: EXPECTED_CONTRACT_BAL,
        });

        console.log(`Cash Balance = ${formatEther(daiBal)} DAI`);
        console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
        console.log(`txn hash: \x1b[35m${txn72Hash}\x1b[0m`);

        // ✅ Step 7c
        txId = base.concat('73');
        console.log('\n🏃 Agreement Lifecycle - Txn #73');
        const LOSS_BN = PROFIT_BN.gt(0)
          ? BigNumber.from(0)
          : GP_INITIAL.add(LP_TOTAL)
              .add(GP_REMAINING)
              .sub(EXPECTED_CONTRACT_BAL)
              .sub(MANAGEMENT_FEE_BN);
        const LOSS =
          PROFIT > 0
            ? 0
            : GP_INITIAL.toNumber() +
              LP_TOTAL.toNumber() +
              GP_REMAINING -
              EXPECTED_CONTRACT_BAL -
              MANAGEMENT_FEE;

        console.log(`Fund Total Loss = ${formatEther(LOSS_BN)} DAI`);
        const GP_PRINICIPAL_BN = LOSS_BN.gt(GP_INITIAL.add(GP_REMAINING))
          ? BigNumber.from(0)
          : GP_INITIAL.add(GP_REMAINING).sub(LOSS_BN);
        const GP_PRINICIPAL =
          LOSS > GP_INITIAL.toNumber() + GP_REMAINING
            ? 0
            : GP_INITIAL.toNumber() + GP_REMAINING - LOSS;
        console.log(`GP Principal = ${formatEther(GP_PRINICIPAL_BN)} DAI`);

        const txn73Hash = await changeTokenBalanceAndGetTxHash(
          () => agreement.connect(GP).execute(txId),
          dai,
          [GP],
          [GP_PRINICIPAL_BN]
        );

        EXPECTED_CONTRACT_BAL_BN = EXPECTED_CONTRACT_BAL_BN.sub(GP_PRINICIPAL_BN);
        EXPECTED_CONTRACT_BAL -= GP_PRINICIPAL;
        daiBal = await dai.balanceOf(agreementAddr);
        expect(daiBal).to.equal(EXPECTED_CONTRACT_BAL_BN);

        console.log({
          realContractBal: daiBal.toString(),
          calcBalBN: EXPECTED_CONTRACT_BAL_BN.toString(),
          calcBalNumber: EXPECTED_CONTRACT_BAL,
        });

        console.log(`Cash Balance = ${formatEther(daiBal)} DAI`);
        console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
        console.log(`txn hash: \x1b[35m${txn73Hash}\x1b[0m`);

        // ✅ Step 8a
        txId = base.concat('81');
        console.log('\n🏃 Agreement Lifecycle - Txn #81');

        for (let i = 0; i < LP_INITIAL_ARR.length; i++) {
          const LP = LPs[i];
          const LP_INITIAL = LP_INITIAL_ARR[i];
          // Note: Extremely unsafe!!! LP can set LP.address and LP_INITIAL by itself
          await agreement.setStorageUint256(hex4Bytes('LP_INITIAL'), LP_INITIAL);
          await agreement.setStorageUint256(hex4Bytes('LP'), LP.address);

          const ALL_LPS_PROFIT_BN = PROFIT_BN.gt(0) ? PROFIT_BN.sub(CARRY_BN) : BigNumber.from(0);
          const ALL_LPS_PROFIT = PROFIT > 0 ? PROFIT - CARRY : 0;
          const LP_PROFIT_BN = ALL_LPS_PROFIT_BN.mul(LP_INITIAL).div(LP_TOTAL);
          const LP_PROFIT = (ALL_LPS_PROFIT * LP_INITIAL.toNumber()) / LP_TOTAL.toNumber();
          console.log({
            LP_PROFIT_BN: LP_PROFIT_BN.toString(),
            ALL_LPS_PROFIT_BN: ALL_LPS_PROFIT_BN.toString(),
            LP_INITIAL: LP_INITIAL.toString(),
            LP_TOTAL: LP_TOTAL.toString(),
          });
          console.log(`LP Investment Profit = ${formatEther(LP_PROFIT_BN)} DAI`);

          const txn81Hash = await changeTokenBalanceAndGetTxHash(
            () => agreement.connect(LP).execute(txId),
            dai,
            [LP],
            [LP_PROFIT_BN]
          );

          EXPECTED_CONTRACT_BAL_BN = EXPECTED_CONTRACT_BAL_BN.sub(LP_PROFIT_BN);
          EXPECTED_CONTRACT_BAL -= LP_PROFIT;
          daiBal = await dai.balanceOf(agreementAddr);
          expect(daiBal).to.equal(EXPECTED_CONTRACT_BAL_BN);

          console.log({
            realContractBal: daiBal.toString(),
            calcBalBN: EXPECTED_CONTRACT_BAL_BN.toString(),
            calcBalNumber: EXPECTED_CONTRACT_BAL,
          });

          console.log(`Cash Balance = ${formatEther(daiBal)} DAI`);
          console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
          console.log(`txn hash: \x1b[35m${txn81Hash}\x1b[0m`);
        }

        // ✅ Step 8b
        txId = base.concat('82');
        console.log('\n🏃 Agreement Lifecycle - Txn #82');

        for (let i = 0; i < LP_INITIAL_ARR.length; i++) {
          const LP = LPs[i];
          const LP_INITIAL = LP_INITIAL_ARR[i];
          // Note: Extremely unsafe!!! LP can set LP.address and LP_INITIAL by itself
          await agreement.setStorageUint256(hex4Bytes('LP_INITIAL'), LP_INITIAL);
          await agreement.setStorageUint256(hex4Bytes('LP'), LP.address);

          const MANAGEMENT_FEE_LP_BN = MANAGEMENT_FEE_BN.mul(LP_INITIAL).div(LP_TOTAL);
          const MANAGEMENT_FEE_LP = (MANAGEMENT_FEE * LP_INITIAL.toNumber()) / LP_TOTAL.toNumber();
          const UNCOVERED_NET_LOSSES_BN = GP_INITIAL.sub(GP_REMAINING).gte(LOSS_BN)
            ? BigNumber.from(0)
            : LOSS_BN.sub(GP_INITIAL).sub(GP_REMAINING);
          const UNCOVERED_NET_LOSSES =
            GP_INITIAL.toNumber() - GP_REMAINING >= LOSS
              ? 0
              : LOSS - GP_INITIAL.toNumber() - GP_REMAINING;
          console.log(`Uncovered Net Losses = ${formatEther(UNCOVERED_NET_LOSSES_BN)} DAI`);
          const LP_PRINCIPAL_BN = LP_INITIAL.sub(MANAGEMENT_FEE_LP_BN).sub(UNCOVERED_NET_LOSSES_BN);
          const LP_PRINCIPAL = LP_INITIAL.toNumber() - MANAGEMENT_FEE_LP - UNCOVERED_NET_LOSSES;
          console.log(`LP Principal = ${formatEther(LP_PRINCIPAL_BN)} DAI`);

          const txn82Hash = await changeTokenBalanceAndGetTxHash(
            () => agreement.connect(LP).execute(txId),
            dai,
            [LP],
            [LP_PRINCIPAL_BN]
          );

          EXPECTED_CONTRACT_BAL_BN = EXPECTED_CONTRACT_BAL_BN.sub(LP_PRINCIPAL_BN);
          EXPECTED_CONTRACT_BAL -= LP_PRINCIPAL;
          daiBal = await dai.balanceOf(agreementAddr);
          expect(daiBal).to.equal(EXPECTED_CONTRACT_BAL_BN);

          console.log({
            realContractBal: daiBal.toString(),
            calcBalBN: EXPECTED_CONTRACT_BAL_BN.toString(),
            calcBalNumber: EXPECTED_CONTRACT_BAL,
          });

          console.log(`Cash Balance = ${formatEther(daiBal)} DAI`);
          console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
          console.log(`txn hash: \x1b[35m${txn82Hash}\x1b[0m`);
        }

        // No funds should left on Agreement
        expect(await dai.balanceOf(agreementAddr)).to.equal(0);
      }
    });
  };

  before(async () => {
    multisig = await (await ethers.getContractFactory('MultisigMock')).deploy();
    agreementAddr = await deployAgreement(hre, multisig.address);
    preprocessorAddr = await deployPreprocessor(hre);
    agreement = await ethers.getContractAt('Agreement', agreementAddr);
    [alice, GP, ...LPs] = await ethers.getSigners();

    // `base = 6` - steps for businessCases with multiple LPs
    await addSteps(
      preprocessorAddr,
      businessCaseSteps(GP.address, [LPs[0].address, LPs[1].address], '6'),
      agreementAddr,
      multisig
    );

    const LAST_BLOCK_TIMESTAMP = (
      await ethers.provider.getBlock(await ethers.provider.getBlockNumber())
    ).timestamp;
    NEXT_MONTH = LAST_BLOCK_TIMESTAMP + ONE_MONTH;
    NEXT_TWO_MONTH = LAST_BLOCK_TIMESTAMP + 2 * ONE_MONTH;

    dai = await (await ethers.getContractFactory('Token'))
      .connect(alice)
      .deploy(parseUnits('100000000', 18));
  });

  beforeEach(async () => {
    snapshotId = await network.provider.send('evm_snapshot');
  });

  afterEach(async () => {
    await network.provider.send('evm_revert', [snapshotId]);
  });

  describe('Lifecycle Test', () => {
    const BASE = '6';
    businessCaseTestDivisionErrors(
      'Scenario 0: Try to get math errors. LP deposits; GP balances; Profit Realized',
      BASE, // base
      BigNumber.from('23'), // GP_INITIAL
      [BigNumber.from('257'), BigNumber.from('733')], // LP_INITIAL
      BigNumber.from('997'), // INITIAL_FUNDS_TARGET
      BigNumber.from(0), // CAPITAL_LOSS
      BigNumber.from('197'), // CAPITAL_GAINS
      2, // DEPOSIT_MIN_PERCENT
      90, // PURCHASE_PERCENT
      2, // MANAGEMENT_FEE_PERCENTAGE
      9, // HURDLE
      20, // PROFIT_PART
      false // GP_FAILS_TO_DO_GAP_DEPOSIT
    );
  });
});
