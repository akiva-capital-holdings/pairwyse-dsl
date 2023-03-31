/**
 * (c) 2023 Pairwyse Foundation.  All Rights Reserved.
 * 
 * For LICENSE details, please visit:
 * https://github.com/akiva-capital-holdings/pairwyse-dsl/blob/master/LICENSE
 *
 */
 
pragma solidity ^0.8.0;

import { ProgramContext } from '../ProgramContext.sol';

contract ProgramContextMock is ProgramContext {
    function setAppAddress(address _app) external {
        appAddr = _app;
    }
}
