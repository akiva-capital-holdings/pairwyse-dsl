/* eslint-disable camelcase */

import { expect } from 'chai';
import { Contract, ethers } from 'ethers';
import { Stack__factory, StackValue__factory, Stack, Context, StackValue } from '../../typechain';
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
  expectedValue: number | string,
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
  expectedValues: number[],
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
  expectedValues: number[],
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
