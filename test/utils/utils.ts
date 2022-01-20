/* eslint-disable camelcase */

import { expect } from "chai";
import { ethers } from "ethers";
import { Opcodes, Stack__factory, StackValue__factory, Stack, ContextMock, StackValue } from "../../typechain";
import { OpConditionalTxFunc } from "../types";

/**
 * Apply keccak256 to `str`, cut the result to the first 4 bytes, append
 * 28 bytes (32b - 4b) of zeros
 * @param str Input string
 * @returns bytes4(keccak256(str))
 */
export const hex4Bytes = (str: string) =>
  ethers.utils
    .keccak256(ethers.utils.toUtf8Bytes(str))
    .split("")
    .map((x, i) => (i < 10 ? x : "0"))
    .join("");

export const hex4BytesShort = (str: string) => hex4Bytes(str).slice(2, 2 + 8);

/**
 * Push values to stack
 * @param SV StackValue: StackValue__factory
 * @param context context: ContextMock
 * @param ST Stack: Stack__factory
 * @param arr Array of values to put in stack. They are put in stack one-by-one
 *            from the beginning of the array
 * @returns created stack
 */
export const pushToStack = async (SV: StackValue__factory, context: ContextMock, ST: Stack__factory, arr: number[]) => {
  const stackValues: StackValue[] = [];

  for (let i = 0; i < arr.length; ++i) {
    const sv = await SV.deploy();
    stackValues.push(sv);
  }

  const contextStackAddress = await context.stack();
  const stack = ST.attach(contextStackAddress);

  for (let i = 0; i < stackValues.length; ++i) {
    await stackValues[i].setUint256(arr[i]);
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
  expectedValue: number,
  indexFromEnd: number = 0,
  badLenErr = "Bad stack length",
  badValueErr = "Bad stack value"
) => {
  // check stack length
  const stackLen = await stack.length();
  expect(stackLen.toNumber()).to.equal(expectedLen, badLenErr);

  // get result
  const svResultAddress = await stack.stack(stackLen.toNumber() - 1 - indexFromEnd);
  const svResult = SV.attach(svResultAddress);
  expect((await svResult.getUint256()).toNumber()).to.equal(expectedValue, badValueErr);
};

export async function checkStackTail(
  SV: StackValue__factory,
  stack: Stack,
  expectedLen: number,
  expectedValues: number[],
  badLenErr = "Bad stack length",
  badValueErr = "Bad stack value"
) {
  for (let i = 0; i < expectedValues.length; i++) {
    await checkStack(SV, stack, expectedLen, expectedValues[expectedValues.length - 1 - i], i, badLenErr, badValueErr);
  }
}

/**
 * Test stack with two values that combines into a single value after the
 * operation. Ex. 1 > 2 = 0
 * @param ST Stack: Stack__factory
 * @param SV StackValue: StackValue__factory
 * @param context context: ContextMock
 * @param opcodes opcodes: Opcodes
 * @param opFunc opcode function (>, <, =, ...)
 * @param value1 First value to the stack
 * @param value2 Second value to the stack
 * @param result Expected result after applying opFunc to value1 and value2
 */
export const testTwoInputOneOutput = async (
  ST: Stack__factory,
  SV: StackValue__factory,
  context: ContextMock,
  opcodes: Opcodes,
  opFunc: OpConditionalTxFunc,
  value1: number,
  value2: number,
  result: number
) => {
  const stack = await pushToStack(SV, context, ST, [value1, value2]);
  await opFunc(opcodes)(context.address);
  await checkStack(SV, stack, 1, result);
};
