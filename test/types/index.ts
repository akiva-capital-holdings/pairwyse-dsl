import { Contract, ContractTransaction } from 'ethers';

export type OpConditionalTxFunc = (
  opcodes: Contract
) => (ctx: string) => Promise<ContractTransaction>;

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

export type TxObject = {
  txId: number;
  requiredTxs: number[];
  signatory: string;
  conditions: string[];
  transaction: string;
};
