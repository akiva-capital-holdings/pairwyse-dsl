import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Contract, ContractTransaction } from 'ethers';
import { Agreement, ContextMock, Token } from '../../typechain-types';

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
  txId: string | number;
  requiredTxs: (string | number)[];
  signatories: string[];
  conditions: string[];
  transaction: string;
};

export type DynamicTestData = {
  GP: SignerWithAddress;
  LPs: SignerWithAddress[];
  whale: SignerWithAddress;
  agreement: Agreement;
  dai: Token;
  PLACEMENT_DATE: number;
  CLOSING_DATE: number;
};

export type Records = {
  recordId: number;
  requiredRecords: number[];
  signatories: string[];
  transactionStr: string;
  conditionStrings: string[];
  transactionCtx: ContextMock;
  conditionContexts: ContextMock[];
};
