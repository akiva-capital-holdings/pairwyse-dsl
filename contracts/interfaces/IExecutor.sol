// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from "./IContext.sol";

interface IExecutor {
    function opcodes() external returns (address);

    function execute(IContext _ctx) external;
}
