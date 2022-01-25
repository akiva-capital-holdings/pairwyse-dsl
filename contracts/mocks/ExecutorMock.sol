// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { Executor } from "../Executor.sol";
import { Storage } from "../helpers/Storage.sol";

contract ExecutorMock is Executor, Storage {
    // solhint-disable-next-line no-empty-blocks
    constructor(address _opcodes) Executor(_opcodes) {}
}
