/* eslint-disable camelcase */

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumber, Contract, ContractTransaction, ethers } from 'ethers';
import {
  Stack__factory,
  StackValue__factory,
  Stack,
  Context,
  StackValue,
  ERC20,
} from '../../typechain-types';
import { OpConditionalTxFunc } from '../types';

/**
 * Apply keccak256 to `str`, cut the result to the first 4 bytes, append
 * 28 bytes (32b - 4b) of zeros
 * @param str Input string
 * @returns bytes4(keccak256(str))
 */
export const hex4Bytes = (str: string) =>
  ethers.utils
    .keccak256(ethers.utils.toUtf8Bytes(str))
    .split('')
    .map((x, i) => (i < 10 ? x : '0'))
    .join('');

export const hex4BytesShort = (str: string) => hex4Bytes(str).slice(2, 2 + 8);

/**
 * Push values to stack
 * @param SV StackValue: StackValue__factory
 * @param context context: Context
 * @param ST Stack: Stack__factory
 * @param arr Array of values to put in stack. They are put in stack one-by-one
 *            from the beginning of the array
 * @returns created stack
 */
export const pushToStack = async (
  SV: StackValue__factory,
  context: Context,
  ST: Stack__factory,
  arr: (string | number)[]
) => {
  const stackValues: StackValue[] = [];

  for (let i = 0; i < arr.length; ++i) {
    const sv = await SV.deploy();
    stackValues.push(sv);
  }

  const contextStackAddress = await context.stack();
  const stack = ST.attach(contextStackAddress);

  for (let i = 0; i < stackValues.length; ++i) {
    if (typeof arr[i] === 'number') {
      await stackValues[i].setUint256(arr[i] as number);
    } else if (typeof arr[i] === 'string') {
      await stackValues[i].setString(arr[i] as string);
    }
    await stack.push(stackValues[i].address);
  }

  return stack;
};

/**
 * Checks stack length and it's value
 * @param SV StackValue: StackValue__factory
 * @param stack stack: Stack
 * @param expectedLen Expected length of the stack
 * @param expectedValue Expected value on the top of the stack (last value)
 * @param badLenErr [optional] error message for incorrect stack length
 * @param badValueErr [optional] error message for incorrect stack value
 */
export const checkStack = async (
  SV: StackValue__factory,
  stack: Stack,
  expectedLen: number,
  expectedValue: number | string | BigNumber,
  indexFromEnd: number = 0,
  type: 'string' | 'number' = 'number',
  badLenErr = 'Bad stack length',
  badValueErr = 'Bad stack value'
) => {
  // check stack length
  const stackLen = await stack.length();
  expect(stackLen.toNumber()).to.equal(expectedLen, badLenErr);

  // get result
  const svResultAddress = await stack.stack(stackLen.toNumber() - 1 - indexFromEnd);
  const svResult = SV.attach(svResultAddress);

  if (type === 'number') {
    expect(await svResult.getUint256()).to.equal(expectedValue, badValueErr);
  } else if (type === 'string') {
    expect(await svResult.getString()).to.equal(expectedValue, badValueErr);
  }
};

export async function checkStackTail(
  SV: StackValue__factory,
  stack: Stack,
  expectedLen: number,
  expectedValues: (number | string)[],
  type: 'string' | 'number' = 'number',
  badLenErr = 'Bad stack length',
  badValueErr = 'Bad stack value'
) {
  for (let i = 0; i < expectedValues.length; i++) {
    await checkStack(
      SV,
      stack,
      expectedLen,
      expectedValues[expectedValues.length - 1 - i],
      i,
      type,
      badLenErr,
      badValueErr
    );
  }
}

export async function checkStackTailv2(
  SV: StackValue__factory,
  stack: Stack,
  expectedValues: (number | string)[],
  type: 'string' | 'number' = 'number',
  badLenErr = 'Bad stack length',
  badValueErr = 'Bad stack value'
) {
  for (let i = 0; i < expectedValues.length; i++) {
    await checkStack(
      SV,
      stack,
      expectedValues.length,
      expectedValues[expectedValues.length - 1 - i],
      i,
      type,
      badLenErr,
      badValueErr
    );
  }
}

/**
 * Test stack with two values that combines into a single value after the
 * operation. Ex. 1 > 2 = 0
 * @param ST Stack: Stack__factory
 * @param SV StackValue: StackValue__factory
 * @param context context: Context
 * @param opcodes opcodes: Opcodes
 * @param opFunc opcode function (>, <, =, ...)
 * @param value1 First value to the stack
 * @param value2 Second value to the stack
 * @param result Expected result after applying opFunc to value1 and value2
 */
export const testTwoInputOneOutput = async (
  ST: Stack__factory,
  SV: StackValue__factory,
  context: Context,
  opcodes: Contract,
  opFunc: OpConditionalTxFunc,
  value1: number,
  value2: number,
  result: number
) => {
  const stack = await pushToStack(SV, context, ST, [value1, value2]);
  await opFunc(opcodes)(context.address);
  await checkStack(SV, stack, 1, result);
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
