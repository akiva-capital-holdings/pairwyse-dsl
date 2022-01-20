import { ContractTransaction } from "ethers";
import { Opcodes } from "../../typechain";

export type OpConditionalTxFunc = (opcodes: Opcodes) => (ctx: string) => Promise<ContractTransaction>;

export interface TestCaseUint256 {
  name: string;
  value1: number;
  value2: number;
  result: number;
}

export interface TestOp {
  opFunc: OpConditionalTxFunc;
  testCases: TestCaseUint256[];
}

export interface Testcase {
  name: string;
  expr: string;
  expected: unknown[];
}
