// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IPreprocessor {
    function transform(address _ctxAddr, string memory _program)
        external
        view
        returns (string[] memory);
}
