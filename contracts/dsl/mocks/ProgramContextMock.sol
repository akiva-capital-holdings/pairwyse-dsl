// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { ProgramContext } from '../ProgramContext.sol';

contract ProgramContextMock is ProgramContext {
    function setAppAddress(address _app) external {
        appAddr = _app;
    }
}
