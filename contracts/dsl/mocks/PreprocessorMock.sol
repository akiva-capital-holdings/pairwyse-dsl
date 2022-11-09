// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { Preprocessor } from '../Preprocessor.sol';

contract PreprocessorMock is Preprocessor {
    function split(
        string memory _program,
        string memory _separators,
        string memory _separatorsToKeep
    ) external pure returns (string[] memory) {
        return _split(_program, _separators, _separatorsToKeep);
    }

    function infixToPostfix(address _ctxAddr, string[] memory _code)
        external
        returns (string[] memory)
    {
        return _infixToPostfix(_ctxAddr, _code);
    }

    function cleanString(string memory _program)
        external
        pure
        returns (string memory _cleanedProgram)
    {
        return _cleanString(_program);
    }
}
