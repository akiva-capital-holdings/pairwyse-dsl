// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from '../interfaces/IContext.sol';
import { Executor } from '../libs/Executor.sol';
import { Storage } from '../helpers/Storage.sol';

contract ExecutorMock is Storage {
    function execute(IContext _ctx) public {
        Executor.execute(_ctx);
    }
}
