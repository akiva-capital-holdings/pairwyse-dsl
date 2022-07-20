// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { Executor } from '../libs/Executor.sol';
import { Storage } from '../helpers/Storage.sol';

contract ExecutorMock is Storage {
    function execute(address _ctxAddr) public {
        Executor.execute(_ctxAddr);
    }
}
