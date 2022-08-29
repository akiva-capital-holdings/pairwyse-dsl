// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IParser } from '../interfaces/IParser.sol';
import { IContext } from '../interfaces/IContext.sol';
import { Executor } from '../libs/Executor.sol';
import { StringUtils } from '../libs/StringUtils.sol';
import { UnstructuredStorageMock } from '../mocks/UnstructuredStorageMock.sol';

// import 'hardhat/console.sol';

// TODO: do we need this contract actually? Will it be usable after making Roles?
contract App is UnstructuredStorageMock {
    using StringUtils for string;

    address public parser;
    address public ctx;
    address public preprocessor;

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    constructor(
        address _parser,
        address _preprocessor,
        address _ctx
    ) {
        parser = _parser;
        preprocessor = _preprocessor;
        ctx = _ctx;
        _setupContext();
    }

    function setStorageArrayUint256(string memory _name, uint256[] memory _data) public {
        for (uint256 i; i < _data.length; i++) {
            bytes32 _nameWithIndex = bytes32(keccak256(abi.encodePacked(_name, '_', i)));
            setStorageUint256(_nameWithIndex, _data[i]);
        }
    }

    function getStorageArrayUint256(string memory _name, uint256 _index)
        public
        view
        returns (uint256)
    {
        bytes32 _nameWithIndex = bytes32(keccak256(abi.encodePacked(_name, '_', _index)));
        return getStorageUint256(_nameWithIndex);
    }

    function parse(string memory _program) external {
        IParser(parser).parse(preprocessor, ctx, _program);
    }

    function execute() external payable {
        IContext(ctx).setMsgValue(msg.value);
        Executor.execute(ctx);
    }

    function _setupContext() internal {
        IContext(ctx).setMsgSender(msg.sender);
    }
}
