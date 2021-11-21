import {
  Context,
  Opcodes,
  Stack__factory,
  StackValue__factory,
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
  // eslint-disable-next-line camelcase
  Stack: Stack__factory,
  // eslint-disable-next-line camelcase
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
  const stack = await Stack.attach(contextStackAddress);

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
