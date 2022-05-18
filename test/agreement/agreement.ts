import { ethers } from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { formatEther, parseEther, parseUnits } from 'ethers/lib/utils';
import { BigNumber, Contract } from 'ethers';
import { changeTokenBalanceAndGetTxHash, hex4Bytes } from '../utils/utils';
import { aliceAndBobSteps, aliceBobAndCarl, businessCaseSteps } from '../data/agreement';
import { Agreement } from '../../typechain/Agreement';
import { Parser } from '../../typechain/Parser';
import { ConditionalTxs, Context__factory } from '../../typechain';
import { TxObject } from '../types';

describe.only('Agreement', () => {
  let ContextCont: Context__factory;
  let parser: Parser;
  let agreement: Agreement;
  let whale: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carl: SignerWithAddress;
  let GP: SignerWithAddress;
  let LPs: SignerWithAddress[];
  let anybody: SignerWithAddress;
  let comparatorOpcodesLib: Contract;
  let logicalOpcodesLib: Contract;
  let setOpcodesLib: Contract;
  let otherOpcodesLib: Contract;
  let txsAddr: string;
  let txs: ConditionalTxs;
  let NEXT_MONTH: number;
  let NEXT_TWO_MONTH: number;
  let LAST_BLOCK_TIMESTAMP: number;
  let MAX_PERCENT: number;

  const ONE_DAY = 60 * 60 * 24;
  const ONE_MONTH = ONE_DAY * 30;
  const ONE_YEAR = ONE_DAY * 365;

  // Add tx objects to Agreement
  const addSteps = async (steps: TxObject[], Ctx: Context__factory) => {
    let txCtx;

    for await (const step of steps) {
      console.log(`\n---\n\n🧩 Adding Term #${step.txId} to Agreement`);
      txCtx = await Ctx.deploy();
      const cdCtxsAddrs = [];

      console.log('\nTerm Conditions');

      for (let j = 0; j < step.conditions.length; j++) {
        const cond = await Ctx.deploy();
        cdCtxsAddrs.push(cond.address);
        await agreement.parse(step.conditions[j], cond.address);
        console.log(
          `\n\taddress: \x1b[35m${cond.address}\x1b[0m\n\tcondition ${j + 1}:\n\t\x1b[33m${
            step.conditions[j]
          }\x1b[0m`
        );
      }
      await agreement.parse(step.transaction, txCtx.address);
      console.log('\nTerm transaction');
      console.log(`\n\taddress: \x1b[35m${txCtx.address}\x1b[0m`);
      console.log(`\t\x1b[33m${step.transaction}\x1b[0m`);

      const { hash } = await agreement.update(
        step.txId,
        step.requiredTxs,
        step.signatories,
        step.transaction,
        step.conditions,
        txCtx.address,
        cdCtxsAddrs
      );
      console.log(`\nAgreement update transaction hash: \n\t\x1b[35m${hash}\x1b[0m`);
    }
  };

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
      // ✅ Step 0 | Setup
      // Set variables
      LAST_BLOCK_TIMESTAMP = (
        await ethers.provider.getBlock(
          // eslint-disable-next-line no-underscore-dangle
          ethers.provider._lastBlockNumber /* it's -2 but the resulting block number is correct */
        )
      ).timestamp;
      NEXT_MONTH = LAST_BLOCK_TIMESTAMP + ONE_MONTH;
      NEXT_TWO_MONTH = LAST_BLOCK_TIMESTAMP + 2 * ONE_MONTH;
      MAX_PERCENT = 100 - DEPOSIT_MIN_PERCENT;
      // Start the test
      if (!CAPITAL_LOSS.isZero() && !CAPITAL_GAINS.isZero()) return;
      const dai = await (await ethers.getContractFactory('Token'))
        .connect(whale)
        .deploy(parseUnits('100000000', 18));

      // Note: if we try do do illegal math (try to obtain a negative value ex. 5 - 10) or divide by
      //       0 then the DSL instruction will fall

      // Add tx objects to Agreement
      const LP_ARR = LPs.filter((_, i) => i < LP_INITIAL_ARR.length);
      console.log('\n\nUpdating Agreement Terms and Conditions...');

      if (!process.env.AGREEMENT_ADDR) {
        console.log('\n\nSkip adding steps to Agreement');
        await addSteps(businessCaseSteps(GP, LP_ARR), ContextCont);
      }

      console.log('\n\nAgreement Updated with new Terms & Conditions');
      console.log('\n\nTesting Agreement Execution...\n\n');

      LAST_BLOCK_TIMESTAMP = (
        await ethers.provider.getBlock(
          // eslint-disable-next-line no-underscore-dangle
          ethers.provider._lastBlockNumber /* it's -2 but the resulting block number is correct */
        )
      ).timestamp;

      NEXT_MONTH = LAST_BLOCK_TIMESTAMP + ONE_MONTH;
      NEXT_TWO_MONTH = LAST_BLOCK_TIMESTAMP + 2 * ONE_MONTH;
      let EXPECTED_CONTRACT_BAL_BN = BigNumber.from('0');
      let EXPECTED_CONTRACT_BAL = 0;

      // ✅ Step 1
      console.log('\n🏃 Agreement Lifecycle - Txn #1');
      await dai.connect(whale).transfer(GP.address, GP_INITIAL);
      await dai.connect(GP).approve(txsAddr, GP_INITIAL);
      console.log(`GP Initial Deposit = ${formatEther(GP_INITIAL)} DAI`);

      await txs.setStorageAddress(hex4Bytes('DAI'), dai.address);
      await txs.setStorageAddress(hex4Bytes('GP'), GP.address);
      await txs.setStorageAddress(hex4Bytes('TRANSACTIONS_CONT'), txsAddr);
      await txs.setStorageUint256(hex4Bytes('INITIAL_FUNDS_TARGET'), INITIAL_FUNDS_TARGET);
      await txs.setStorageUint256(hex4Bytes('GP_INITIAL'), GP_INITIAL);
      await txs.setStorageUint256(hex4Bytes('PLACEMENT_DATE'), NEXT_MONTH);
      await txs.setStorageUint256(hex4Bytes('MANAGEMENT_PERCENT'), MANAGEMENT_FEE_PERCENTAGE);
      await txs.setStorageUint256(hex4Bytes('DEPOSIT_MIN_PERCENT'), DEPOSIT_MIN_PERCENT);
      // let result = false;
      // try {
      const txn1 = await agreement.connect(GP).execute(1);

      EXPECTED_CONTRACT_BAL_BN = EXPECTED_CONTRACT_BAL_BN.add(GP_INITIAL);
      EXPECTED_CONTRACT_BAL += GP_INITIAL.toNumber();
      let daiBal = await dai.balanceOf(txsAddr);
      expect(daiBal).to.equal(EXPECTED_CONTRACT_BAL_BN);

      console.log({
        realContractBal: daiBal.toString(),
        calcBalBN: EXPECTED_CONTRACT_BAL_BN.toString(),
        calcBalNumber: EXPECTED_CONTRACT_BAL,
      });

      console.log(`Cash Balance = ${formatEther(daiBal)} DAI`);
      console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
      console.log(`txn hash: \x1b[35m${txn1.hash}\x1b[0m`);
      // result = true;
      // } catch {
      //   await expect(agreement.connect(GP).execute(1)).to.be.revertedWith(
      //     'Agreement: tx condition is not satisfied'
      //   );
      //   console.log(`\x1b[33m
      // Condition is not satisfied.
      // GP must deposit a minimum ${DEPOSIT_MIN_PERCENT}% of the initial DAI funds target amount\x1b[0m
      // `);
      // }
      // Other tests have no sense if result is false
      // if (!result) return;

      // ✅ Step 2
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

        const txn2 = await agreement.connect(LP).execute(2);

        EXPECTED_CONTRACT_BAL_BN = EXPECTED_CONTRACT_BAL_BN.add(LP_INITIAL);
        EXPECTED_CONTRACT_BAL += LP_INITIAL.toNumber();
        daiBal = await dai.balanceOf(txsAddr);
        expect(daiBal).to.equal(EXPECTED_CONTRACT_BAL_BN);

        console.log({
          realContractBal: daiBal.toString(),
          calcBalBN: EXPECTED_CONTRACT_BAL_BN.toString(),
          calcBalNumber: EXPECTED_CONTRACT_BAL,
        });

        console.log(`Cash Balance = ${formatEther(daiBal)} DAI`);
        console.log(`signatory: \x1b[35m${LP.address}\x1b[0m`);
        console.log(`txn hash: \x1b[35m${txn2.hash}\x1b[0m`);
        const DSL_LP_TOTAL = await txs.getStorageUint256(hex4Bytes('LP_TOTAL'));
        console.log(`Total LP deposit = ${formatEther(DSL_LP_TOTAL)} DAI`);

        LP_TOTAL = LP_TOTAL.add(LP_INITIAL);
        expect(LP_TOTAL).to.equal(DSL_LP_TOTAL);
      }

      let GP_REMAINING_BN = BigNumber.from(0);
      let GP_REMAINING = 0;
      if (!GP_FAILS_TO_DO_GAP_DEPOSIT) {
        // ✅ Step 3
        console.log('\n🏃 Agreement Lifecycle - Txn #3');

        await ethers.provider.send('evm_setNextBlockTimestamp', [NEXT_TWO_MONTH]);
        GP_REMAINING_BN = BigNumber.from(DEPOSIT_MIN_PERCENT)
          .mul(LP_TOTAL)
          .div(MAX_PERCENT)
          .sub(GP_INITIAL);
        GP_REMAINING_BN = GP_REMAINING_BN.lt(0) ? BigNumber.from(0) : GP_REMAINING_BN;
        GP_REMAINING =
          (DEPOSIT_MIN_PERCENT * LP_TOTAL.toNumber()) / MAX_PERCENT - GP_INITIAL.toNumber();
        GP_REMAINING = GP_REMAINING < 0 ? 0 : GP_REMAINING;

        await dai.connect(whale).transfer(GP.address, GP_REMAINING_BN);
        await dai.connect(GP).approve(txsAddr, GP_REMAINING_BN);
        console.log(`GP Gap Deposit = ${formatEther(GP_REMAINING_BN)} DAI`);
        const GP_GAP_DEPOSIT_LOWER_TIME = NEXT_TWO_MONTH - ONE_DAY;
        const GP_GAP_DEPOSIT_UPPER_TIME = NEXT_TWO_MONTH + ONE_DAY;

        // Note: we give GP 2 days time to obtain P1 - MAX_PERCENT, P2 = DEPOSIT_MIN_PERCENT:
        // a P1% / P2% ratio of LP / GP deposits
        await txs.setStorageUint256(hex4Bytes('LOW_LIM'), GP_GAP_DEPOSIT_LOWER_TIME);
        await txs.setStorageUint256(hex4Bytes('UP_LIM'), GP_GAP_DEPOSIT_UPPER_TIME);
        await txs.setStorageUint256(hex4Bytes('P1'), MAX_PERCENT);

        const txn3Hash = await changeTokenBalanceAndGetTxHash(
          () => agreement.connect(GP).execute(3),
          dai,
          [GP],
          [GP_REMAINING_BN.mul(-1)]
        );

        EXPECTED_CONTRACT_BAL_BN = EXPECTED_CONTRACT_BAL_BN.add(GP_REMAINING_BN);
        EXPECTED_CONTRACT_BAL += GP_REMAINING;
        daiBal = await dai.balanceOf(txsAddr);
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
            () => agreement.connect(LP).execute(4),
            dai,
            [GP, LP],
            [GP_INITIAL, LP_INITIAL]
          );
          console.log(`txn hash: \x1b[35m${txn4Hash}\x1b[0m`);
        } else {
          await expect(agreement.connect(LP).execute(4)).to.be.revertedWith(
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
        // ✅ Step 5
        console.log('\n🏃 Agreement Lifecycle - Txn #5');
        let DAI_BAL_OF_TXS = await dai.balanceOf(txsAddr);
        const PURCHASE_AMOUNT_BN = DAI_BAL_OF_TXS.mul(PURCHASE_PERCENT).div(100);
        const PURCHASE_AMOUNT = (EXPECTED_CONTRACT_BAL * PURCHASE_PERCENT) / 100;
        console.log(`GP ETH Asset Purchase = ${formatEther(PURCHASE_AMOUNT_BN)} DAI`);
        const FUND_INVESTMENT_DATE = NEXT_TWO_MONTH + 7 * ONE_DAY;

        await ethers.provider.send('evm_setNextBlockTimestamp', [NEXT_TWO_MONTH + 7 * ONE_DAY]);
        await txs.setStorageUint256(hex4Bytes('FUND_INVESTMENT_DATE'), FUND_INVESTMENT_DATE);
        await txs.setStorageUint256(hex4Bytes('PURCHASE_AMOUNT'), PURCHASE_AMOUNT_BN);
        await txs.setStorageUint256(hex4Bytes('PURCHASE_PERCENT'), PURCHASE_PERCENT);
        // let txn5Hash;
        // result = false;
        // try {
        const txn5Hash = await changeTokenBalanceAndGetTxHash(
          () => agreement.connect(GP).execute(5),
          dai,
          [GP],
          [PURCHASE_AMOUNT_BN]
        );
        //           result = true;
        //         } catch {
        //           await expect(agreement.connect(GP).execute(5)).to.be.revertedWith(
        //             'Agreement: tx condition is not satisfied'
        //           );
        //           console.log(`\x1b[33m
        //         Condition is not satisfied.
        //         GP authorized to purchase the investment asset using up to 90% of total \
        // initiating funds\x1b[0m
        //           `);
        //         }
        EXPECTED_CONTRACT_BAL_BN = EXPECTED_CONTRACT_BAL_BN.sub(PURCHASE_AMOUNT_BN);
        EXPECTED_CONTRACT_BAL -= PURCHASE_AMOUNT;
        daiBal = await dai.balanceOf(txsAddr);
        expect(daiBal).to.equal(EXPECTED_CONTRACT_BAL_BN);

        console.log({
          realContractBal: daiBal.toString(),
          calcBalBN: EXPECTED_CONTRACT_BAL_BN.toString(),
          calcBalNumber: EXPECTED_CONTRACT_BAL,
        });

        // Other tests have no sense if result is false
        // if (!result) return;

        console.log(`Cash Balance = ${formatEther(daiBal)} DAI`);
        console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
        console.log(`txn hash: \x1b[35m${txn5Hash}\x1b[0m`);

        // ✅ Step 6
        console.log('\n🏃 Agreement Lifecycle - Txn #6');
        LP_TOTAL = await txs.getStorageUint256(hex4Bytes('LP_TOTAL'));
        const WHALE = whale.address;
        const GP_PURCHASE_RETURN_BN = PURCHASE_AMOUNT_BN.sub(CAPITAL_LOSS).add(CAPITAL_GAINS);
        const GP_PURCHASE_RETURN =
          PURCHASE_AMOUNT - CAPITAL_LOSS.toNumber() + CAPITAL_GAINS.toNumber();
        console.log({ GP_PURCHASE_RETURN_BN: GP_PURCHASE_RETURN_BN.toString() });

        await ethers.provider.send('evm_setNextBlockTimestamp', [FUND_INVESTMENT_DATE + ONE_YEAR]);

        await txs.setStorageUint256(hex4Bytes('WHALE'), WHALE);
        await txs.setStorageUint256(hex4Bytes('GP_PURCHASE_RETURN'), GP_PURCHASE_RETURN_BN);
        await dai.connect(whale).approve(txsAddr, GP_PURCHASE_RETURN_BN);
        console.log(`Fund Investment Return = ${formatEther(GP_PURCHASE_RETURN_BN)} DAI`);

        const cashBalanceBefore = await dai.balanceOf(txsAddr);
        const txn6 = await agreement.connect(GP).execute(6);
        const cashBalanceAfter = await dai.balanceOf(txsAddr);

        EXPECTED_CONTRACT_BAL_BN = EXPECTED_CONTRACT_BAL_BN.add(GP_PURCHASE_RETURN_BN);
        EXPECTED_CONTRACT_BAL += GP_PURCHASE_RETURN;
        daiBal = await dai.balanceOf(txsAddr);
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
          // console.log(`\x1b[33m
          // Calculation balances error. Check if CAPITAL GAINS affect for cash balance\x1b[0m
          //   `);
          throw new Error(
            'Calculation balances error. Check if CAPITAL GAINS affect for cash balance'
          );
        }
        console.log(`Cash Balance = ${formatEther(daiBal)} DAI`);
        console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
        console.log(`txn hash: \x1b[35m${txn6.hash}\x1b[0m`);

        // ✅ Step 7a
        console.log('\n🏃 Agreement Lifecycle - Txn #71');
        const MANAGEMENT_FEE_BN = LP_TOTAL.mul(MANAGEMENT_FEE_PERCENTAGE).div(100);
        const MANAGEMENT_FEE = (LP_TOTAL.toNumber() * MANAGEMENT_FEE_PERCENTAGE) / 100;
        console.log(`GP Management Fee = ${formatEther(MANAGEMENT_FEE_BN)} DAI`);

        const txn71Hash = await changeTokenBalanceAndGetTxHash(
          () => agreement.connect(GP).execute(71),
          dai,
          [GP],
          [MANAGEMENT_FEE_BN]
        );

        EXPECTED_CONTRACT_BAL_BN = EXPECTED_CONTRACT_BAL_BN.sub(MANAGEMENT_FEE_BN);
        EXPECTED_CONTRACT_BAL -= MANAGEMENT_FEE;
        daiBal = await dai.balanceOf(txsAddr);
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
        console.log('\n🏃 Agreement Lifecycle - Txn #72');
        DAI_BAL_OF_TXS = await dai.balanceOf(txsAddr);

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

        await txs.setStorageUint256(hex4Bytes('HURDLE'), HURDLE);
        await txs.setStorageUint256(hex4Bytes('PROFIT_PART'), PROFIT_PART);

        const txn72Hash = await changeTokenBalanceAndGetTxHash(
          () => agreement.connect(GP).execute(72),
          dai,
          [GP],
          [CARRY_BN]
        );

        EXPECTED_CONTRACT_BAL_BN = EXPECTED_CONTRACT_BAL_BN.sub(CARRY_BN);
        EXPECTED_CONTRACT_BAL -= CARRY;
        daiBal = await dai.balanceOf(txsAddr);
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
        console.log('\n🏃 Agreement Lifecycle - Txn #73');
        DAI_BAL_OF_TXS = await dai.balanceOf(txsAddr);
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
          () => agreement.connect(GP).execute(73),
          dai,
          [GP],
          [GP_PRINICIPAL_BN]
        );

        EXPECTED_CONTRACT_BAL_BN = EXPECTED_CONTRACT_BAL_BN.sub(GP_PRINICIPAL_BN);
        EXPECTED_CONTRACT_BAL -= GP_PRINICIPAL;
        daiBal = await dai.balanceOf(txsAddr);
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
        console.log('\n🏃 Agreement Lifecycle - Txn #81');

        for (let i = 0; i < LP_INITIAL_ARR.length; i++) {
          const LP = LPs[i];
          const LP_INITIAL = LP_INITIAL_ARR[i];
          // Note: Extremely unsafe!!! LP can set LP.address and LP_INITIAL by itself
          await txs.setStorageUint256(hex4Bytes('LP_INITIAL'), LP_INITIAL);
          await txs.setStorageUint256(hex4Bytes('LP'), LP.address);

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
            () => agreement.connect(LP).execute(81),
            dai,
            [LP],
            [LP_PROFIT_BN]
          );

          EXPECTED_CONTRACT_BAL_BN = EXPECTED_CONTRACT_BAL_BN.sub(LP_PROFIT_BN);
          EXPECTED_CONTRACT_BAL -= LP_PROFIT;
          daiBal = await dai.balanceOf(txsAddr);
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
        console.log('\n🏃 Agreement Lifecycle - Txn #82');

        for (let i = 0; i < LP_INITIAL_ARR.length; i++) {
          const LP = LPs[i];
          const LP_INITIAL = LP_INITIAL_ARR[i];
          // Note: Extremely unsafe!!! LP can set LP.address and LP_INITIAL by itself
          await txs.setStorageUint256(hex4Bytes('LP_INITIAL'), LP_INITIAL);
          await txs.setStorageUint256(hex4Bytes('LP'), LP.address);

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
            () => agreement.connect(LP).execute(82),
            dai,
            [LP],
            [LP_PRINCIPAL_BN]
          );

          EXPECTED_CONTRACT_BAL_BN = EXPECTED_CONTRACT_BAL_BN.sub(LP_PRINCIPAL_BN);
          EXPECTED_CONTRACT_BAL -= LP_PRINCIPAL;
          daiBal = await dai.balanceOf(txsAddr);
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
        expect(await dai.balanceOf(txsAddr)).to.equal(0);
      }
    });
  };

  before(async () => {
    [whale, alice, bob, carl, GP, anybody, ...LPs] = await ethers.getSigners();

    LAST_BLOCK_TIMESTAMP = (
      await ethers.provider.getBlock(
        // eslint-disable-next-line no-underscore-dangle
        ethers.provider._lastBlockNumber /* it's -2 but the resulting block number is correct */
      )
    ).timestamp;

    NEXT_MONTH = LAST_BLOCK_TIMESTAMP + ONE_MONTH;
    NEXT_TWO_MONTH = LAST_BLOCK_TIMESTAMP + 2 * ONE_MONTH;

    ContextCont = await ethers.getContractFactory('Context');

    // Deploy libraries
    const opcodeHelpersLib = await (await ethers.getContractFactory('OpcodeHelpers')).deploy();
    comparatorOpcodesLib = await (
      await ethers.getContractFactory('ComparatorOpcodes', {
        libraries: {
          OpcodeHelpers: opcodeHelpersLib.address,
        },
      })
    ).deploy();
    logicalOpcodesLib = await (
      await ethers.getContractFactory('LogicalOpcodes', {
        libraries: {
          OpcodeHelpers: opcodeHelpersLib.address,
        },
      })
    ).deploy();
    setOpcodesLib = await (
      await ethers.getContractFactory('SetOpcodes', {
        libraries: {
          OpcodeHelpers: opcodeHelpersLib.address,
        },
      })
    ).deploy();
    otherOpcodesLib = await (
      await ethers.getContractFactory('OtherOpcodes', {
        libraries: {
          OpcodeHelpers: opcodeHelpersLib.address,
        },
      })
    ).deploy();
    const stringLib = await (await ethers.getContractFactory('StringUtils')).deploy();
    const byteLib = await (await ethers.getContractFactory('ByteUtils')).deploy();

    // Deploy Parser
    const ParserCont = await ethers.getContractFactory('Parser', {
      libraries: { StringUtils: stringLib.address, ByteUtils: byteLib.address },
    });
    parser = await ParserCont.deploy();
  });

  beforeEach(async () => {
    const executorLib = await (await ethers.getContractFactory('Executor')).deploy();
    // Deploy Agreement
    agreement = await (
      await ethers.getContractFactory('Agreement', {
        libraries: {
          ComparatorOpcodes: comparatorOpcodesLib.address,
          LogicalOpcodes: logicalOpcodesLib.address,
          SetOpcodes: setOpcodesLib.address,
          OtherOpcodes: otherOpcodesLib.address,
          Executor: executorLib.address,
        },
      })
    ).deploy(parser.address);

    console.log({ agreementAddr: agreement.address });

    txsAddr = await agreement.txs();
    txs = await ethers.getContractAt('ConditionalTxs', txsAddr);
  });

  it('one condition', async () => {
    // Set variables
    await txs.setStorageAddress(hex4Bytes('RECEIVER'), bob.address);
    await txs.setStorageUint256(hex4Bytes('LOCK_TIME'), NEXT_MONTH);

    const txId = 1;
    const requiredTxs: number[] = [];
    const signatories = [alice.address];
    const conditions = ['blockTimestamp > loadLocal uint256 LOCK_TIME'];
    const transaction = 'sendEth RECEIVER 1000000000000000000';

    // Update
    await addSteps([{ txId, requiredTxs, signatories, conditions, transaction }], ContextCont);

    // Top up contract
    const oneEthBN = parseEther('1');

    await anybody.sendTransaction({ to: txsAddr, value: oneEthBN });

    /**
     * Execute
     */
    // Bad signatory
    await expect(agreement.connect(anybody).execute(txId)).to.be.revertedWith(
      'Agreement: bad tx signatory'
    );

    // Condition isn't satisfied
    await expect(agreement.connect(alice).execute(txId)).to.be.revertedWith(
      'Agreement: tx condition is not satisfied'
    );

    // Execute transaction
    await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
    await expect(await agreement.connect(alice).execute(txId)).to.changeEtherBalance(bob, oneEthBN);

    // Tx already executed
    await expect(agreement.connect(alice).execute(txId)).to.be.revertedWith(
      'ConditionalTxs: txn already was executed'
    );
  });

  it('Alice (borrower) and Bob (lender)', async () => {
    const oneEth = parseEther('1');
    const tenTokens = parseEther('10');
    const token = await (await ethers.getContractFactory('Token'))
      .connect(bob)
      .deploy(parseEther('1000'));

    // Set variables
    await txs.setStorageAddress(hex4Bytes('TOKEN_ADDR'), token.address);
    await txs.setStorageAddress(hex4Bytes('ALICE'), alice.address);
    await txs.setStorageAddress(hex4Bytes('BOB'), bob.address);

    // Add tx objects to Agreement
    await addSteps(aliceAndBobSteps(alice, bob, oneEth, tenTokens), ContextCont);

    // Alice deposits 1 ETH to SC
    await expect(agreement.connect(alice).execute(1, { value: 0 })).to.be.revertedWith(
      'Agreement: tx fulfilment error'
    );
    await expect(
      agreement.connect(alice).execute(1, { value: parseEther('2') })
    ).to.be.revertedWith('Agreement: tx fulfilment error');
    await expect(agreement.connect(bob).execute(2)).to.be.revertedWith(
      'ConditionalTxs: required tx #1 was not executed'
    );
    await expect(agreement.connect(alice).execute(3)).to.be.revertedWith(
      'ConditionalTxs: required tx #2 was not executed'
    );

    await agreement.connect(alice).execute(1, { value: oneEth });

    expect(await ethers.provider.getBalance(txsAddr)).to.equal(oneEth);
    await expect(agreement.connect(alice).execute(1, { value: oneEth })).to.be.revertedWith(
      'ConditionalTxs: txn already was executed'
    );

    // Bob lends 10 tokens to Alice
    await token.connect(bob).approve(txsAddr, tenTokens);
    await expect(() => agreement.connect(bob).execute(2)).to.changeTokenBalance(
      token,
      alice,
      tenTokens
    );

    // Alice returns 10 tokens to Bob and collects 1 ETH
    expect(await token.balanceOf(alice.address)).to.equal(tenTokens);
    await token.connect(alice).approve(txsAddr, tenTokens);
    await expect(await agreement.connect(alice).execute(3)).to.changeEtherBalance(alice, oneEth);
    expect(await token.balanceOf(alice.address)).to.equal(0);
  });

  it('Alice (borrower), Bob (lender), and Carl (insurer)', async () => {
    const oneEth = parseEther('1');
    const tenTokens = parseEther('10');
    const token = await (await ethers.getContractFactory('Token'))
      .connect(bob)
      .deploy(parseEther('1000'));
    await token.connect(bob).transfer(carl.address, tenTokens);

    // Set variables
    await txs.setStorageAddress(hex4Bytes('TOKEN_ADDR'), token.address);
    await txs.setStorageAddress(hex4Bytes('ALICE'), alice.address);
    await txs.setStorageUint256(hex4Bytes('EXPIRY'), NEXT_MONTH);
    await txs.setStorageAddress(hex4Bytes('BOB'), bob.address);
    await txs.setStorageAddress(hex4Bytes('CARL'), carl.address);
    await txs.setStorageAddress(hex4Bytes('TRANSACTIONS'), txsAddr);

    // Add tx objects to Agreement
    await addSteps(aliceBobAndCarl(alice, bob, carl, oneEth, tenTokens), ContextCont);

    // Alice deposits 1 ETH to SC
    console.log('Alice deposits 1 ETH to SC');
    await agreement.connect(alice).execute(1, { value: oneEth });
    expect(await ethers.provider.getBalance(txsAddr)).to.equal(oneEth);

    // Carl deposits 10 tokens to SC
    console.log('Carl deposits 10 tokens to SC');
    // console.log((await token.balanceOf(carl.address)).toString());
    await token.connect(carl).approve(txsAddr, tenTokens);
    await expect(() => agreement.connect(carl).execute(2)).to.changeTokenBalance(
      token,
      txs,
      tenTokens
    );

    // Bob lends 10 tokens to Alice
    console.log('Bob lends 10 tokens to Alice');
    await token.connect(bob).approve(txsAddr, tenTokens);
    await expect(() => agreement.connect(bob).execute(3)).to.changeTokenBalance(
      token,
      alice,
      tenTokens
    );

    // Alice returns 10 tokens to Bob and collects 1 ETH
    console.log('Alice returns 10 tokens to Bob and collects 1 ETH');
    expect(await token.balanceOf(alice.address)).to.equal(tenTokens);
    await token.connect(alice).approve(txsAddr, tenTokens);
    await expect(await agreement.connect(alice).execute(4)).to.changeEtherBalance(alice, oneEth);
    expect(await token.balanceOf(alice.address)).to.equal(0);

    // // If Alice didn't return 10 tokens to Bob before EXPIRY
    // // then Bob can collect 10 tokens from Carl
    // await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
    // console.log(
    //   'If Alice didn not return 10 tokens to Bob before EXPIRY then ' +
    //     'Bob can collect 10 tokens from Carl'
    // );
    // await expect(() => agreement.connect(bob).execute(5)).to.changeTokenBalance(
    //   token,
    //   bob,
    //   tenTokens
    // );

    // If 10 tokens are stil on Agreement SC, Carl collects back 10 tokens
    await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
    console.log('If 10 tokens are stil on Agreement SC, Carl collects back 10 tokens');
    await expect(() => agreement.connect(carl).execute(6)).to.changeTokenBalance(
      token,
      carl,
      tenTokens
    );
  });

  describe.only('Lifecycle Test', () => {
    businessCaseTest(
      'Scenario 0: Try to get math errors. LP deposits; GP balances; Profit Realized',
      // BigNumber.from('23000000000000000023'), // GP_INITIAL
      // [BigNumber.from('977000000000000000977')], // LP_INITIAL
      // BigNumber.from('1031000000000000001031'), // INITIAL_FUNDS_TARGET
      // BigNumber.from(0), // CAPITAL_LOSS
      // BigNumber.from('197000000000000000197'), // CAPITAL_GAINS
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

    // businessCaseTest(
    //   'Scenario 1:  LP deposits; GP balances; Profit Realized',
    //   parseUnits('20', 18), // GP_INITIAL
    //   [parseUnits('990', 18)], // LP_INITIAL
    //   parseUnits('1000', 18), // INITIAL_FUNDS_TARGET
    //   parseUnits('0', 18), // CAPITAL_LOSS
    //   parseUnits('200', 18), // CAPITAL_GAINS
    //   2, // DEPOSIT_MIN_PERCENT
    //   90, // PURCHASE_PERCENT
    //   2, // MANAGEMENT_FEE_PERCENTAGE
    //   9, // HURDLE
    //   20, // PROFIT_PART
    //   false // GP_FAILS_TO_DO_GAP_DEPOSIT
    // );

    // businessCaseTest(
    //   'Scenario 1.5:  Multiple LPs; LPs deposit; GP balances; Profit Realized',
    //   parseUnits('20', 18), // GP_INITIAL
    //   [parseUnits('300', 18), parseUnits('900', 18)], // LP_INITIAL_ARR
    //   parseUnits('1000', 18), // INITIAL_FUNDS_TARGET
    //   parseUnits('0', 18), // CAPITAL_LOSS
    //   parseUnits('200', 18), // CAPITAL_GAINS
    //   2, // DEPOSIT_MIN_PERCENT
    //   91, // PURCHASE_PERCENT
    //   2, // MANAGEMENT_FEE_PERCENTAGE
    //   9, // HURDLE
    //   20, // PROFIT_PART
    //   false // GP_FAILS_TO_DO_GAP_DEPOSIT
    // );

    // businessCaseTest(
    //   'Scenario 2:  GP fails to balance LP deposit',
    //   parseUnits('20', 18), // GP_INITIAL
    //   [parseUnits('990', 18)], // LP_INITIAL
    //   parseUnits('1000', 18), // INITIAL_FUNDS_TARGET
    //   parseUnits('0', 18), // CAPITAL_LOSS
    //   parseUnits('200', 18), // CAPITAL_GAINS,
    //   2, // DEPOSIT_MIN_PERCENT
    //   90, // PURCHASE_PERCENT
    //   2, // MANAGEMENT_FEE_PERCENTAGE
    //   9, // HURDLE
    //   20, // PROFIT_PART
    //   true // GP_FAILS_TO_DO_GAP_DEPOSIT
    // );
    // businessCaseTest(
    //   'Scenario 3:  Loss incurred, fully covered by GP',
    //   parseUnits('20', 18), // GP_INITIAL
    //   [parseUnits('990', 18)], // LP_INITIAL
    //   parseUnits('1000', 18), // INITIAL_FUNDS_TARGET
    //   parseUnits('10', 18), // CAPITAL_LOSS
    //   parseUnits('0', 18), // CAPITAL_GAINS
    //   2, // DEPOSIT_MIN_PERCENT
    //   90, // PURCHASE_PERCENT
    //   2, // MANAGEMENT_FEE_PERCENTAGE
    //   9, // HURDLE
    //   20, // PROFIT_PART
    //   false // GP_FAILS_TO_DO_GAP_DEPOSIT
    // );
    // businessCaseTest(
    //   'Scenario 4:  Loss incurred, not fully covered by GP',
    //   parseUnits('20', 18), // GP_INITIAL
    //   [parseUnits('990', 18)], // LP_INITIAL
    //   parseUnits('1000', 18), // INITIAL_FUNDS_TARGET
    //   parseUnits('100', 18), // CAPITAL_LOSS
    //   parseUnits('0', 18), // CAPITAL_GAINS,
    //   2, // DEPOSIT_MIN_PERCENT
    //   90, // PURCHASE_PERCENT
    //   2, // MANAGEMENT_FEE_PERCENTAGE
    //   9, // HURDLE
    //   20, // PROFIT_PART
    //   false // GP_FAILS_TO_DO_GAP_DEPOSIT
    // );

    // businessCaseTest(
    //   'Scenario 5: Using bigger values, PURCHASE_PERCENT less than 90',
    //   parseUnits('20000', 18), // GP_INITIAL
    //   [parseUnits('990000', 18)], // LP_INITIAL
    //   parseUnits('1000000', 18), // INITIAL_FUNDS_TARGET
    //   parseUnits('0', 18), // CAPITAL_LOSS
    //   parseUnits('200000', 18), // CAPITAL_GAINS,
    //   2, // DEPOSIT_MIN_PERCENT
    //   89, // PURCHASE_PERCENT
    //   2, // MANAGEMENT_FEE_PERCENTAGE
    //   9, // HURDLE
    //   20, // PROFIT_PART
    //   false // GP_FAILS_TO_DO_GAP_DEPOSIT
    // );

    // businessCaseTest(
    //   'Scenario 6:  GP_INITIAL less than needed',
    //   parseUnits('20', 18), // GP_INITIAL
    //   [parseUnits('990000', 18)], // LP_INITIAL
    //   parseUnits('100000', 18), // INITIAL_FUNDS_TARGET
    //   parseUnits('0', 18), // CAPITAL_LOSS
    //   parseUnits('200000', 18), // CAPITAL_GAINS,
    //   2, // DEPOSIT_MIN_PERCENT
    //   89, // PURCHASE_PERCENT
    //   2, // MANAGEMENT_FEE_PERCENTAGE
    //   9, // HURDLE
    //   20, // PROFIT_PART
    //   false // GP_FAILS_TO_DO_GAP_DEPOSIT
    // );

    // businessCaseTest(
    //   'Scenario 7:  PURCHASE_PERCENT more than 90',
    //   parseUnits('20', 18), // GP_INITIAL
    //   [parseUnits('990', 18)], // LP_INITIAL
    //   parseUnits('1000', 18), // INITIAL_FUNDS_TARGET
    //   parseUnits('0', 18), // CAPITAL_LOSS
    //   parseUnits('200', 18), // CAPITAL_GAINS
    //   2, // DEPOSIT_MIN_PERCENT
    //   91, // PURCHASE_PERCENT
    //   2, // MANAGEMENT_FEE_PERCENTAGE
    //   9, // HURDLE
    //   20, // PROFIT_PART
    //   false // GP_FAILS_TO_DO_GAP_DEPOSIT
    // );

    // businessCaseTest(
    //   'Scenario 8:  HURDLE is 1 percent',
    //   parseUnits('20', 18), // GP_INITIAL
    //   [parseUnits('990', 18)], // LP_INITIAL
    //   parseUnits('1000', 18), // INITIAL_FUNDS_TARGET
    //   parseUnits('0', 18), // CAPITAL_LOSS
    //   parseUnits('200', 18), // CAPITAL_GAINS
    //   2, // DEPOSIT_MIN_PERCENT
    //   89, // PURCHASE_PERCENT
    //   2, // MANAGEMENT_FEE_PERCENTAGE
    //   1, // HURDLE
    //   20, // PROFIT_PART
    //   false // GP_FAILS_TO_DO_GAP_DEPOSIT
    // );

    // businessCaseTest(
    //   'Scenario 9:  MANAGEMENT_FEE_PERCENTAGE is 33%',
    //   parseUnits('20', 18), // GP_INITIAL
    //   [parseUnits('990', 18)], // LP_INITIAL
    //   parseUnits('1000', 18), // INITIAL_FUNDS_TARGET
    //   parseUnits('0', 18), // CAPITAL_LOSS
    //   parseUnits('200', 18), // CAPITAL_GAINS
    //   2, // DEPOSIT_MIN_PERCENT
    //   90, // PURCHASE_PERCENT
    //   33, // MANAGEMENT_FEE_PERCENTAGE
    //   9, // HURDLE
    //   20, // PROFIT_PART
    //   false // GP_FAILS_TO_DO_GAP_DEPOSIT
    // );

    // businessCaseTest(
    //   'Scenario 10:  Carry Charge is 0%',
    //   parseUnits('20', 18), // GP_INITIAL
    //   [parseUnits('990', 18)], // LP_INITIAL
    //   parseUnits('1000', 18), // INITIAL_FUNDS_TARGET
    //   parseUnits('0', 18), // CAPITAL_LOSS
    //   parseUnits('200', 18), // CAPITAL_GAINS
    //   2, // DEPOSIT_MIN_PERCENT
    //   90, // PURCHASE_PERCENT
    //   2, // MANAGEMENT_FEE_PERCENTAGE
    //   9, // HURDLE
    //   0, // PROFIT_PART
    //   false // GP_FAILS_TO_DO_GAP_DEPOSIT
    // );

    // businessCaseTest(
    //   'Scenario 11:  CAPITAL_GAINS capital gains is big',
    //   parseUnits('20', 18), // GP_INITIAL
    //   [parseUnits('990', 18)], // LP_INITIAL
    //   parseUnits('1000', 18), // INITIAL_FUNDS_TARGET
    //   parseUnits('0', 18), // CAPITAL_LOSS
    //   parseUnits('333333', 18), // CAPITAL_GAINS
    //   2, // DEPOSIT_MIN_PERCENT
    //   90, // PURCHASE_PERCENT
    //   2, // MANAGEMENT_FEE_PERCENTAGE
    //   9, // HURDLE
    //   20, // PROFIT_PART
    //   false // GP_FAILS_TO_DO_GAP_DEPOSIT
    // );

    // businessCaseTest(
    //   'Scenario 12: smart contract does not store funds if values are small',
    //   parseUnits('1999999', 0), // GP_INITIAL
    //   [parseUnits('98555555', 0)], // LP_INITIAL
    //   parseUnits('99999999', 0), // INITIAL_FUNDS_TARGET
    //   parseUnits('0', 0), // CAPITAL_LOSS
    //   parseUnits('23636363', 0), // CAPITAL_GAINS
    //   2, // DEPOSIT_MIN_PERCENT
    //   90, // PURCHASE_PERCENT
    //   2, // MANAGEMENT_FEE_PERCENTAGE
    //   9, // HURDLE
    //   20, // PROFIT_PART
    //   false // GP_FAILS_TO_DO_GAP_DEPOSIT
    // );

    // businessCaseTest(
    //   'Scenario 13:  smart contract does not store funds if values too small',
    //   parseUnits('1998', 0), // GP_INITIAL
    //   [parseUnits('99999', 0)], // LP_INITIAL
    //   parseUnits('99900', 0), // INITIAL_FUNDS_TARGET
    //   parseUnits('0', 0), // CAPITAL_LOSS
    //   parseUnits('19111', 0), // CAPITAL_GAINS
    //   2, // DEPOSIT_MIN_PERCENT
    //   90, // PURCHASE_PERCENT
    //   2, // MANAGEMENT_FEE_PERCENTAGE
    //   9, // HURDLE
    //   20, // PROFIT_PART
    //   false // GP_FAILS_TO_DO_GAP_DEPOSIT
    // );

    // businessCaseTest(
    //   'Scenario 14: DEPOSIT_MIN_PERCENT is 1%',
    //   parseUnits('10', 18), // GP_INITIAL
    //   [parseUnits('999', 18)], // LP_INITIAL
    //   parseUnits('1000', 18), // INITIAL_FUNDS_TARGET
    //   parseUnits('0', 18), // CAPITAL_LOSS
    //   parseUnits('200', 18), // CAPITAL_GAINS
    //   1, // DEPOSIT_MIN_PERCENT
    //   90, // PURCHASE_PERCENT
    //   2, // MANAGEMENT_FEE_PERCENTAGE
    //   9, // HURDLE
    //   20, // PROFIT_PART
    //   false // GP_FAILS_TO_DO_GAP_DEPOSIT
    // );

    // // used the 34% / 66% percentage, as in the third agreement we have dividing values by 66 %
    // // P1 = 100 - 34
    // // ex. loadLocal uint256 DEPOSIT_MIN_PERCENT * loadLocal uint256 LP_INITIAL / loadLocal uint256 P1
    // businessCaseTest(
    //   'Scenario 15: Should be non zero value in the end of a contract. Correct LP investment profit',
    //   parseUnits('340000', 0), // GP_INITIAL
    //   [parseUnits('900000', 0)], // LP_INITIAL
    //   parseUnits('1000000', 0), // INITIAL_FUNDS_TARGET
    //   parseUnits('0', 0), // CAPITAL_LOSS
    //   parseUnits('340000', 0), // CAPITAL_GAINS
    //   34, // DEPOSIT_MIN_PERCENT
    //   90, // PURCHASE_PERCENT
    //   2, // MANAGEMENT_FEE_PERCENTAGE
    //   9, // HURDLE
    //   20, // PROFIT_PART
    //   false // GP_FAILS_TO_DO_GAP_DEPOSIT
    // );
  });
});
