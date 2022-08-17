// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { Executor } from '../libs/Executor.sol';
import { UnstructuredStorage } from '../../dsl/libs/UnstructuredStorage.sol';

contract ExecutorMock {
    function execute(address _ctxAddr) public {
        Executor.execute(_ctxAddr);
    }
}
