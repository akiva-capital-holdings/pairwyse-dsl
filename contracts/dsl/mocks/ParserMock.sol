// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from '../interfaces/IContext.sol';
import { Parser } from '../Parser.sol';

contract ParserMock is Parser {
    function parseCodeExt(address _ctxAddr, string[] memory _code) external {
        _parseCode(_ctxAddr, _code);
    }
}
