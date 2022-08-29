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

    function setArrayUint256(bytes32 _name, uint256[] memory _data) public {
        IContext(ctx).setArrayUint256(_name, _data);
    }

    function getUint256ByIndex(bytes32 _name, uint256 _index) public view returns (uint256) {
        return IContext(ctx).getUint256ByIndex(_name, _index);
    }

    function setArrayAddresses(bytes32 _name, address[] memory _data) public {
        IContext(ctx).setArrayAddresses(_name, _data);
    }

    function getAddressByIndex(bytes32 _name, uint256 _index) public view returns (address) {
        return IContext(ctx).getAddressByIndex(_name, _index);
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
