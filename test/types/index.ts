import { Opcodes } from "../../typechain";
import { ContractTransaction } from "ethers";

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
