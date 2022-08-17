// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IParserMock {
    function parse(
        address _preprAddr,
        address _ctxAddr,
        string memory _codeRaw
    ) external;

    function parseCodeExt(address _ctxAddr, string[] memory _codeRaw) external;
}
