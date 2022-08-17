// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { Executor } from '../libs/Executor.sol';
import { UnstructuredStorageMock } from './UnstructuredStorageMock.sol';

contract ExecutorMock is UnstructuredStorageMock {
    function execute(address _ctxAddr) public {
        Executor.execute(_ctxAddr);
    }
}
