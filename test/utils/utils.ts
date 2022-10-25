/* eslint-disable camelcase */

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumber, Contract, ContractTransaction, utils } from 'ethers';
import { formatEther } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import { Suite, Test } from 'mocha';
import { Stack__factory, Stack, Context, ERC20 } from '../../typechain-types';
import { MultisigMock } from '../../typechain-types/agreement/mocks/MultisigMock';
import { DynamicTestData, OpConditionalTxFunc, TxObject } from '../types';
import { ONE_DAY, ONE_MONTH, ONE_YEAR } from './constants';
import { activateRecord } from '../../scripts/utils/update.record';

/**
 * Apply keccak256 to `str`, cut the result to the first 4 bytes, append
 * 28 bytes (32b - 4b) of zeros
 * @param str Input string
 * @returns bytes4(keccak256(str))
 */
export const hex4Bytes = (str: string) =>
  utils
    .keccak256(utils.toUtf8Bytes(str))
    .split('')
    .map((x, i) => (i < 10 ? x : '0'))
    .join('');

export const hex4BytesShort = (str: string) => hex4Bytes(str).slice(2, 2 + 8);

/**
 * Converts bignumber to a 32-bytes hex string
 * @example bnToLongHexString(BigNumber.from('17')) ->
 *          0000000000000000000000000000000000000000000000000000000000000011
 * @param bn Input number
 * @returns padded string with the number in hex format (without '0x')
 */
export const bnToLongHexString = (num: BigNumber | string) => {
  if (typeof num === 'string') {
    num = BigNumber.from(num);
  }
  return utils.hexZeroPad(num.toHexString(), 32).substring(2);
};

/**
 * Push values to stack
 * @param context context: Context
 * @param ST Stack: Stack__factory
 * @param arr Array of values to put in stack. They are put in stack one-by-one
 *            from the beginning of the array
 */
export const pushToStack = async (
  context: Context,
  ST: Stack__factory,
  arr: (string | number | BigNumber)[]
) => {
  const contextStackAddress = await context.stack();
  const stack = ST.attach(contextStackAddress);

  for (let i = 0; i < arr.length; ++i) {
    await stack.push(arr[i]);
  }
};

/**
 * Checks stack length
 * @param stack stack: Stack
 * @param expectedLen Expected length of the stack
 * @param badLenErr [optional] error message for incorrect stack length
 */
export const checkStackLength = async (
  stack: Stack,
  expectedLen: number,
  badLenErr = 'Bad stack length'
) => {
  // check stack length
  const stackLen = await stack.length();
  expect(stackLen.toNumber()).to.equal(expectedLen, badLenErr);
};

/**
 * Checks stack length and it's last value
 * @param stack stack: Stack
 * @param expectedLen Expected length of the stack
 * @param expectedValue Expected value on the top of the stack (last value)
 * @param badValueErr [optional] error message for incorrect stack value
 */
export const checkStack = async (
  stack: Stack,
  expectedLen: number,
  expectedValue: number | string | BigNumber,
  indexFromEnd: number = 0,
  badValueErr = 'Bad stack value'
) => {
  // check stack length
  await checkStackLength(stack, expectedLen);
  const stackLen = await stack.length();
  // check result
  const value = await stack.stack(stackLen.toNumber() - 1 - indexFromEnd);
  expect(value).to.equal(expectedValue, badValueErr);
};

export async function checkStackTail(
  stack: Stack,
  expectedValues: (number | string | BigNumber)[],
  badValueErr = 'Bad stack value'
) {
  // check stack length
  await checkStackLength(stack, expectedValues.length);
  for (let i = 0; i < expectedValues.length; i++) {
    await checkStack(
      stack,
      expectedValues.length,
      expectedValues[expectedValues.length - 1 - i],
      i,
      badValueErr
    );
  }
}

/**
 * Test stack with two values that combines into a single value after the
 * operation. Ex. 1 > 2 = 0
 * @param ST Stack: Stack__factory
 * @param context context: Context
 * @param opcodes opcodes: Opcodes
 * @param opFunc opcode function (>, <, =, ...)
 * @param value1 First value to the stack
 * @param value2 Second value to the stack
 * @param result Expected result after applying opFunc to value1 and value2
 */
export const testTwoInputOneOutput = async (
  ST: Stack__factory,
  context: Context,
  opcodes: Contract,
  opFunc: OpConditionalTxFunc,
  value1: number,
  value2: number,
  result: number
) => {
  await pushToStack(context, ST, [value1, value2]);
  await opFunc(opcodes)(context.address);
  const contextStackAddress = await context.stack();
  const stack = ST.attach(contextStackAddress);
  await checkStack(stack, 1, result);
};

/**
 * Returns number of bytes in hex string
 * @param bytes Hex value in string
 * @returns Number
 */
export const getBytesStringLength = (bytes: string) => bytes.replace('0x', '').length / 2;

/**
 * Converts raw uint256 string to padded hex value
 * @param uint256Str String or number representing raw uint256 value
 * @param pad Pad size in bytes
 * @returns Padded hex uint256
 */
export const uint256StrToHex = (uint256Str: string | number, pad = 32) => {
  const uint256Raw = BigNumber.from(uint256Str).toHexString().substring(2);

  // Note: each byte is represented with 2 symbols inside the string. Ex. 32bytes is 64 symbols,
  //       2 symbols per byte
  const padding = '0'.repeat(pad * 2 - uint256Raw.length);

  return padding.concat(uint256Raw);
};

/**
 * Executes transaction, checks token balance change, and returns transaction hash.
 * @param _tx Function that returns Ethereum transaction to be called. This transaction will do the
 *            balance changing for _accounts.
 * @param _token Token address to check
 * @param _accounts Accounts which balance should change
 * @param _expectedBalances Amounts on which _accounts balance should change
 * @returns _tx transaction hash
 */
export const changeTokenBalanceAndGetTxHash = async (
  _tx: () => Promise<ContractTransaction>,
  _token: ERC20,
  _accounts: SignerWithAddress[],
  _expectedBalances: BigNumber[]
) => {
  const balsBefore = await Promise.all(
    _accounts.map(async (_acc) => _token.balanceOf(_acc.address))
  );
  const { hash } = await _tx();
  const balsAfter = await Promise.all(
    _accounts.map(async (_acc) => _token.balanceOf(_acc.address))
  );
  for (let i = 0; i < balsBefore.length; i++) {
    expect(balsAfter[i].sub(balsBefore[i])).to.equal(_expectedBalances[i]);
  }
  return hash;
};

export const addSteps = async (
  preprocessorAddr: string,
  steps: TxObject[],
  agreementAddress: string,
  multisig: MultisigMock
) => {
  let recordContext;
  const agreement = await ethers.getContractAt('Agreement', agreementAddress);
  for await (const step of steps) {
    console.log(`\n---\n\n🧩 Adding Term #${step.txId} to Agreement`);
    recordContext = await (await ethers.getContractFactory('Context')).deploy();
    await recordContext.setAppAddress(agreementAddress);
    const cdCtxsAddrs = []; // conditional context Addresses

    console.log('\nTerm Conditions');

    for (let j = 0; j < step.conditions.length; j++) {
      const conditionContract = await (await ethers.getContractFactory('Context')).deploy();
      await conditionContract.setAppAddress(agreementAddress);
      cdCtxsAddrs.push(conditionContract.address);
      await agreement.parse(step.conditions[j], conditionContract.address, preprocessorAddr);
      console.log(
        `\n\taddress: \x1b[35m${conditionContract.address}\x1b[0m\n\tcondition ${
          j + 1
        }:\n\t\x1b[33m${step.conditions[j]}\x1b[0m`
      );
    }
    await agreement.parse(step.transaction, recordContext.address, preprocessorAddr);
    console.log('\nTerm transaction');
    console.log(`\n\taddress: \x1b[35m${recordContext.address}\x1b[0m`);
    console.log(`\t\x1b[33m${step.transaction}\x1b[0m`);

    // Create Raw transaction
    const { data } = await agreement.populateTransaction.update(
      step.txId,
      step.requiredTxs,
      step.signatories,
      step.transaction,
      step.conditions,
      recordContext.address,
      cdCtxsAddrs
    );

    // Send this raw transaction with Multisig contract
    const { hash } = await multisig.executeTransaction(agreement.address, data as string, 0);

    // Activate records
    await activateRecord(agreement, multisig, Number(step.txId));

    console.log(`\nAgreement update transaction hash: \n\t\x1b[35m${hash}\x1b[0m`);
  }
};

/**
 * Note: `dynamicTestData` is used to pass variables by reference (not by value). This is needed as
 * we can set variables from `dynamicTestData` object only after this function is being called
 * (but the the test that this function generated wasn't yet executed). By the time when the test
 * exectutes, all the values from `dynamicTestData` object should be already set.
 */
export const businessCaseTest = ({
  name,
  dynamicTestData,
  GP_INITIAL,
  LP_INITIAL_ARR,
  INITIAL_FUNDS_TARGET,
  CAPITAL_LOSS,
  CAPITAL_GAINS,
  DEPOSIT_MIN_PERCENT,
  PURCHASE_PERCENT,
  MANAGEMENT_FEE_PERCENTAGE,
  HURDLE,
  PROFIT_PART,
  GP_FAILS_TO_DO_GAP_DEPOSIT,
  base,
  suiteInstance,
}: {
  name: string;
  dynamicTestData: DynamicTestData;
  GP_INITIAL: BigNumber;
  LP_INITIAL_ARR: BigNumber[];
  INITIAL_FUNDS_TARGET: BigNumber;
  CAPITAL_LOSS: BigNumber;
  CAPITAL_GAINS: BigNumber;
  DEPOSIT_MIN_PERCENT: number;
  PURCHASE_PERCENT: number;
  MANAGEMENT_FEE_PERCENTAGE: number;
  HURDLE: number;
  PROFIT_PART: number;
  GP_FAILS_TO_DO_GAP_DEPOSIT: boolean;
  base: string;
  suiteInstance: Suite;
}) => {
  suiteInstance.addTest(
    new Test(name, async () => {
      let txId = base.concat('1');
      const { GP, LPs, whale, agreement, dai, PLACEMENT_DATE, CLOSING_DATE } = dynamicTestData;
      const MAX_PERCENT = 100 - DEPOSIT_MIN_PERCENT;

      // Start the test
      if (!CAPITAL_LOSS.isZero() && !CAPITAL_GAINS.isZero()) return;

      // Note: if we try do do illegal math (try to obtain a negative value ex. 5 - 10) or divide by
      //       0 then the DSL instruction will fall

      console.log('\n\nTesting Agreement Execution...\n\n');

      // Step 1
      console.log('\n🏃 Agreement Lifecycle - Txn #1');
      await dai.connect(whale).transfer(GP.address, GP_INITIAL);
      await dai.connect(GP).approve(agreement.address, GP_INITIAL);
      console.log(`GP Initial Deposit = ${formatEther(GP_INITIAL)} DAI`);

      await agreement.setStorageAddress(hex4Bytes('DAI'), dai.address);
      await agreement.setStorageAddress(hex4Bytes('GP'), GP.address);
      await agreement.setStorageAddress(hex4Bytes('TRANSACTIONS_CONT'), agreement.address);
      await agreement.setStorageUint256(hex4Bytes('INITIAL_FUNDS_TARGET'), INITIAL_FUNDS_TARGET);
      await agreement.setStorageUint256(hex4Bytes('GP_INITIAL'), GP_INITIAL);
      await agreement.setStorageUint256(hex4Bytes('MANAGEMENT_PERCENT'), MANAGEMENT_FEE_PERCENTAGE);
      await agreement.setStorageUint256(hex4Bytes('DEPOSIT_MIN_PERCENT'), DEPOSIT_MIN_PERCENT);
      await agreement.setStorageUint256(hex4Bytes('PLACEMENT_DATE'), PLACEMENT_DATE);

      console.log({
        INITIAL_FUNDS_TARGET: INITIAL_FUNDS_TARGET.toString(),
        GP_INITIAL: GP_INITIAL.toString(),
        MANAGEMENT_FEE_PERCENTAGE,
        DEPOSIT_MIN_PERCENT,
        PLACEMENT_DATE,
      });

      let result = false;
      try {
        const txn1 = await agreement.connect(GP).execute(txId);
        console.log(`Cash Balance = ${formatEther(await dai.balanceOf(agreement.address))} DAI`);
        console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
        console.log(`txn hash: \x1b[35m${txn1.hash}\x1b[0m`);
        result = true;
      } catch (err) {
        await expect(agreement.connect(GP).execute(txId)).to.be.revertedWith('AGR6');
        console.log(`\x1b[33m
      Condition is not satisfied.
      GP must deposit a minimum ${DEPOSIT_MIN_PERCENT}% \
of the initial DAI funds target amount\x1b[0m
        `);
      }
      // Other tests have no sense if result is false
      if (!result) return;

      // Step 2
      txId = base.concat('2');
      console.log('\n🏃 Agreement Lifecycle - Txn #2');
      await ethers.provider.send('evm_increaseTime', [ONE_MONTH]);
      let LP_TOTAL = BigNumber.from(0);
      for await (const [i, LP_INITIAL] of LP_INITIAL_ARR.entries()) {
        console.log(`\tLP #${i + 1}`);
        const LP = LPs[i];
        await dai.connect(whale).transfer(LP.address, LP_INITIAL);
        await dai.connect(LP).approve(agreement.address, LP_INITIAL);
        console.log(`LP Initial Deposit = ${formatEther(LP_INITIAL)} DAI`);

        await agreement.setStorageAddress(hex4Bytes('LP'), LP.address);
        await agreement.setStorageUint256(hex4Bytes('LP_INITIAL'), LP_INITIAL);
        await agreement.setStorageUint256(hex4Bytes('CLOSING_DATE'), CLOSING_DATE);
        const txn2 = await agreement.connect(LP).execute(txId);
        console.log(`Cash Balance = ${formatEther(await dai.balanceOf(agreement.address))} DAI`);
        console.log(`signatory: \x1b[35m${LP.address}\x1b[0m`);
        console.log(`txn hash: \x1b[35m${txn2.hash}\x1b[0m`);
        const DSL_LP_TOTAL = await agreement.getStorageUint256(hex4Bytes('LP_TOTAL'));
        console.log(`Total LP deposit = ${formatEther(DSL_LP_TOTAL)} DAI`);

        LP_TOTAL = LP_TOTAL.add(LP_INITIAL);
        expect(LP_TOTAL).to.equal(DSL_LP_TOTAL);
      }

      let GP_REMAINING = BigNumber.from(0);
      if (!GP_FAILS_TO_DO_GAP_DEPOSIT) {
        // Step 3
        txId = base.concat('3');
        console.log('\n🏃 Agreement Lifecycle - Txn #3');
        await ethers.provider.send('evm_setNextBlockTimestamp', [CLOSING_DATE]);
        GP_REMAINING = BigNumber.from(DEPOSIT_MIN_PERCENT)
          .mul(LP_TOTAL)
          .div(MAX_PERCENT)
          .sub(GP_INITIAL);
        await dai.connect(whale).transfer(GP.address, GP_REMAINING);
        await dai.connect(GP).approve(agreement.address, GP_REMAINING);
        console.log(`GP Gap Deposit = ${formatEther(GP_REMAINING)} DAI`);
        const GP_GAP_DEPOSIT_LOWER_TIME = CLOSING_DATE - ONE_DAY;
        const GP_GAP_DEPOSIT_UPPER_TIME = CLOSING_DATE + ONE_DAY;

        // Note: we give GP 2 days time to obtain P1 - MAX_PERCENT, P2 = DEPOSIT_MIN_PERCENT:
        // a P1% / P2% ratio of LP / GP deposits
        await agreement.setStorageUint256(hex4Bytes('LOW_LIM'), GP_GAP_DEPOSIT_LOWER_TIME);
        await agreement.setStorageUint256(hex4Bytes('UP_LIM'), GP_GAP_DEPOSIT_UPPER_TIME);
        await agreement.setStorageUint256(hex4Bytes('P1'), MAX_PERCENT);
        const txn3Hash = await changeTokenBalanceAndGetTxHash(
          () => agreement.connect(GP).execute(txId),
          dai,
          [GP],
          [GP_REMAINING.mul(-1)]
        );
        console.log(`Cash Balance = ${formatEther(await dai.balanceOf(agreement.address))} DAI`);
        console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
        console.log(`txn hash: \x1b[35m${txn3Hash}\x1b[0m`);
      }

      // Step 4
      txId = base.concat('4');
      console.log('\n🏃 Agreement Lifecycle - Txn #4');
      await ethers.provider.send('evm_setNextBlockTimestamp', [CLOSING_DATE + 2 * ONE_DAY]);
      await agreement.setStorageUint256(
        hex4Bytes('FUND_INVESTMENT_DATE'),
        CLOSING_DATE + 7 * ONE_DAY
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
        console.log(`Cash Balance = ${formatEther(await dai.balanceOf(agreement.address))} DAI`);
        console.log(`signatory: \x1b[35m${LP.address}\x1b[0m`);
      }

      if (!GP_FAILS_TO_DO_GAP_DEPOSIT) {
        // Step 5
        txId = base.concat('5');
        console.log('\n🏃 Agreement Lifecycle - Txn #5');
        let DAI_BAL_OF_TXS = await dai.balanceOf(agreement.address);
        const PURCHASE_AMOUNT = DAI_BAL_OF_TXS.mul(PURCHASE_PERCENT).div(100);
        console.log(`GP ETH Asset Purchase = ${formatEther(PURCHASE_AMOUNT)} DAI`);
        const FUND_INVESTMENT_DATE = CLOSING_DATE + 7 * ONE_DAY;

        await ethers.provider.send('evm_setNextBlockTimestamp', [CLOSING_DATE + 7 * ONE_DAY]);
        await agreement.setStorageUint256(hex4Bytes('FUND_INVESTMENT_DATE'), FUND_INVESTMENT_DATE);
        await agreement.setStorageUint256(hex4Bytes('PURCHASE_AMOUNT'), PURCHASE_AMOUNT);
        await agreement.setStorageUint256(hex4Bytes('PURCHASE_PERCENT'), PURCHASE_PERCENT);
        let txn5Hash;
        result = false;
        try {
          txn5Hash = await changeTokenBalanceAndGetTxHash(
            () => agreement.connect(GP).execute(txId),
            dai,
            [GP],
            [PURCHASE_AMOUNT]
          );
          result = true;
        } catch {
          await expect(agreement.connect(GP).execute(txId)).to.be.revertedWith('AGR6');
          console.log(`\x1b[33m
        Condition is not satisfied.
        GP authorized to purchase the investment asset using up to 90% of total \
initiating funds\x1b[0m
          `);
        }
        // Other tests have no sense if result is false
        if (!result)
          throw new Error(
            'Condition is not satisfied. GP authorized to purchase the investment asset using \
up to 90% of total initiating funds'
          );

        console.log(`Cash Balance = ${formatEther(await dai.balanceOf(agreement.address))} DAI`);
        console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
        console.log(`txn hash: \x1b[35m${txn5Hash}\x1b[0m`);

        // Step 6
        txId = base.concat('6');
        console.log('\n🏃 Agreement Lifecycle - Txn #6');
        LP_TOTAL = await agreement.getStorageUint256(hex4Bytes('LP_TOTAL'));
        const GP_PURCHASE_RETURN = PURCHASE_AMOUNT.sub(CAPITAL_LOSS).add(CAPITAL_GAINS);

        await ethers.provider.send('evm_setNextBlockTimestamp', [FUND_INVESTMENT_DATE + ONE_YEAR]);

        await agreement.setStorageUint256(hex4Bytes('WHALE'), whale.address);
        await agreement.setStorageUint256(hex4Bytes('GP_PURCHASE_RETURN'), GP_PURCHASE_RETURN);
        await dai.connect(whale).approve(agreement.address, GP_PURCHASE_RETURN);
        console.log(`Fund Investment Return = ${formatEther(GP_PURCHASE_RETURN)} DAI`);

        const txn6 = await agreement.connect(GP).execute(txId);
        console.log(`Cash Balance = ${formatEther(await dai.balanceOf(agreement.address))} DAI`);
        console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
        console.log(`txn hash: \x1b[35m${txn6.hash}\x1b[0m`);

        // Step 7a
        txId = base.concat('71');
        console.log('\n🏃 Agreement Lifecycle - Txn #71');
        const MANAGEMENT_FEE = LP_TOTAL.mul(MANAGEMENT_FEE_PERCENTAGE).div(100);
        console.log(`GP Management Fee = ${formatEther(MANAGEMENT_FEE)} DAI`);

        const txn71Hash = await changeTokenBalanceAndGetTxHash(
          () => agreement.connect(GP).execute(txId),
          dai,
          [GP],
          [MANAGEMENT_FEE]
        );
        console.log(`Cash Balance = ${formatEther(await dai.balanceOf(agreement.address))} DAI`);
        console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
        console.log(`txn hash: \x1b[35m${txn71Hash}\x1b[0m`);

        // Step 7b
        txId = base.concat('72');
        console.log('\n🏃 Agreement Lifecycle - Txn #72');
        DAI_BAL_OF_TXS = await dai.balanceOf(agreement.address);
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

        await agreement.setStorageUint256(hex4Bytes('HURDLE'), HURDLE);
        await agreement.setStorageUint256(hex4Bytes('PROFIT_PART'), PROFIT_PART);

        const txn72Hash = await changeTokenBalanceAndGetTxHash(
          () => agreement.connect(GP).execute(txId),
          dai,
          [GP],
          [CARRY]
        );
        console.log(`Cash Balance = ${formatEther(await dai.balanceOf(agreement.address))} DAI`);
        console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
        console.log(`txn hash: \x1b[35m${txn72Hash}\x1b[0m`);

        // Step 7c
        txId = base.concat('73');
        console.log('\n🏃 Agreement Lifecycle - Txn #73');
        DAI_BAL_OF_TXS = await dai.balanceOf(agreement.address);
        const LOSS = PROFIT.gt(0)
          ? BigNumber.from(0)
          : GP_INITIAL.add(LP_TOTAL).add(GP_REMAINING).sub(DAI_BAL_OF_TXS).sub(MANAGEMENT_FEE);
        console.log(`Fund Total Loss = ${formatEther(LOSS)} DAI`);
        const GP_PRINICIPAL = LOSS.gt(GP_INITIAL.add(GP_REMAINING))
          ? BigNumber.from(0)
          : GP_INITIAL.add(GP_REMAINING).sub(LOSS);
        console.log(`GP Principal = ${formatEther(GP_PRINICIPAL)} DAI`);

        const txn73Hash = await changeTokenBalanceAndGetTxHash(
          () => agreement.connect(GP).execute(txId),
          dai,
          [GP],
          [GP_PRINICIPAL]
        );
        console.log(`Cash Balance = ${formatEther(await dai.balanceOf(agreement.address))} DAI`);
        console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
        console.log(`txn hash: \x1b[35m${txn73Hash}\x1b[0m`);

        // Step 8a
        txId = base.concat('81');
        console.log('\n🏃 Agreement Lifecycle - Txn #81');
        for (let i = 0; i < LP_INITIAL_ARR.length; i++) {
          const LP = LPs[i];
          const LP_INITIAL = LP_INITIAL_ARR[i];
          // Note: Extremely unsafe!!! LP can set LP.address and LP_INITIAL by itself
          await agreement.setStorageUint256(hex4Bytes('LP_INITIAL'), LP_INITIAL);
          await agreement.setStorageUint256(hex4Bytes('LP'), LP.address);

          const ALL_LPS_PROFIT = PROFIT.gt(0) ? PROFIT.sub(CARRY) : BigNumber.from(0);
          const LP_PROFIT = ALL_LPS_PROFIT.mul(LP_INITIAL).div(LP_TOTAL);
          console.log(`LP Investment Profit = ${formatEther(LP_PROFIT)} DAI`);

          const txn81Hash = await changeTokenBalanceAndGetTxHash(
            () => agreement.connect(LP).execute(txId),
            dai,
            [LP],
            [LP_PROFIT]
          );
          DAI_BAL_OF_TXS = await dai.balanceOf(agreement.address);
          console.log(`Cash Balance = ${formatEther(DAI_BAL_OF_TXS)} DAI`);
          console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
          console.log(`txn hash: \x1b[35m${txn81Hash}\x1b[0m`);
        }

        // Step 8b
        txId = base.concat('82');
        console.log('\n🏃 Agreement Lifecycle - Txn #82');
        for (let i = 0; i < LP_INITIAL_ARR.length; i++) {
          const LP = LPs[i];
          const LP_INITIAL = LP_INITIAL_ARR[i];
          // Note: Extremely unsafe!!! LP can set LP.address and LP_INITIAL by itself
          await agreement.setStorageUint256(hex4Bytes('LP_INITIAL'), LP_INITIAL);
          await agreement.setStorageUint256(hex4Bytes('LP'), LP.address);

          const MANAGEMENT_FEE_LP = MANAGEMENT_FEE.mul(LP_INITIAL).div(LP_TOTAL);
          const UNCOVERED_NET_LOSSES = GP_INITIAL.sub(GP_REMAINING).gte(LOSS)
            ? BigNumber.from(0)
            : LOSS.sub(GP_INITIAL).sub(GP_REMAINING);
          console.log(`Uncovered Net Losses = ${formatEther(UNCOVERED_NET_LOSSES)} DAI`);
          const LP_PRINCIPAL = LP_INITIAL.sub(MANAGEMENT_FEE_LP).sub(UNCOVERED_NET_LOSSES);
          console.log(`LP Principal = ${formatEther(LP_PRINCIPAL)} DAI`);

          const txn82Hash = await changeTokenBalanceAndGetTxHash(
            () => agreement.connect(LP).execute(txId),
            dai,
            [LP],
            [LP_PRINCIPAL]
          );
          console.log(`Cash Balance = ${formatEther(await dai.balanceOf(agreement.address))} DAI`);
          console.log(`signatory: \x1b[35m${GP.address}\x1b[0m`);
          console.log(`txn hash: \x1b[35m${txn82Hash}\x1b[0m`);
        }
      }
    })
  );
};
