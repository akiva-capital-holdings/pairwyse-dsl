/* eslint-disable camelcase */

import {
  Context,
  Opcodes,
  Stack__factory,
  StackValue__factory,
  Stack,
  ContextMock,
  StackValue,
} from "../typechain";
import { ContractTransaction } from "ethers";
import { expect } from "chai";

export type OpEvalFunc = (
  opcodes: Opcodes
) => () => Promise<ContractTransaction>;

export interface TestCaseUint256 {
  name: string;
  value1: number;
  value2: number;
  result: number;
}

export interface TestOp {
  opFunc: OpEvalFunc;
  testCases: TestCaseUint256[];
}

export const testTwoInputOneOutput = async (
  Stack: Stack__factory,
  StackValue: StackValue__factory,
  context: Context,
  opcodes: Opcodes,
  opFunc: OpEvalFunc,
  value1: number,
  value2: number,
  result: number
) => {
  const sv1 = await StackValue.deploy();
  const sv2 = await StackValue.deploy();

  const contextStackAddress = await context.stack();
  const stack = Stack.attach(contextStackAddress);

  // push two values
  await sv1.setUint256(value1);
  await stack.push(sv1.address);

  await sv2.setUint256(value2);
  await stack.push(sv2.address);

  await opFunc(opcodes)();

  // stack size is 1
  expect(await stack.length(), "Wrong stack size").to.equal(1);

  // get result
  const svResultAddress = await stack.stack(0);
  const svResult = StackValue.attach(svResultAddress);
  expect(await svResult.getUint256()).to.equal(result);
};

export const pushToStack = async (
  SV: StackValue__factory,
  context: ContextMock,
  ST: Stack__factory,
  arr: number[]
) => {
  // const sv1 = await StackValue.deploy();
  // const sv2 = await StackValue.deploy();
  // const sv3 = await StackValue.deploy();
  // const sv4 = await StackValue.deploy();

  // // push four values
  // await sv1.setUint256(0);
  // await stack.push(sv1.address);

  // await sv2.setUint256(1);
  // await stack.push(sv2.address);

  // await sv3.setUint256(1);
  // await stack.push(sv3.address);

  // await sv4.setUint256(1);
  // await stack.push(sv4.address);

  const stackValues: StackValue[] = [];

  // arr.forEach(async () => SV.deploy());
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

export const checkStack = async (
  SV: StackValue__factory,
  stack: Stack,
  expectedLen: number,
  expectedValue: number,
  badLenErr = "Bad stack length",
  badValueErr = "Bad stack value"
) => {
  // stack size is 3
  const stackLen = await stack.length();
  expect(stackLen.toNumber()).to.equal(expectedLen, badLenErr);

  // get result
  const svResultAddress = await stack.stack(stackLen.toNumber() - 1);
  const svResult = SV.attach(svResultAddress);
  expect((await svResult.getUint256()).toNumber()).to.equal(
    expectedValue,
    badValueErr
  );
};
