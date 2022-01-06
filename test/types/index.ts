import { ContractTransaction } from "ethers";
import { Opcodes } from "../../typechain";

export type OpEvalFunc = (opcodes: Opcodes) => () => Promise<ContractTransaction>;

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

export interface Testcase {
  name: string;
  expr: string;
  expected: string[];
}
