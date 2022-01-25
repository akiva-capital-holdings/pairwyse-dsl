// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IParser } from "../interfaces/IParser.sol";
import { IContext } from "../interfaces/IContext.sol";
import { IExecutor } from "../interfaces/IExecutor.sol";
import { Storage } from "../helpers/Storage.sol";

// import "hardhat/console.sol";

contract App is Storage {
    IParser public parser;
    IExecutor public executor;
    IContext public ctx;

    receive() external payable {
        payable(parser.opcodes()).transfer(msg.value);
    }

    constructor(
        IParser _parser,
        IExecutor _executor,
        IContext _ctx
    ) {
        parser = _parser;
        executor = _executor;
        ctx = _ctx;
        setupContext();
    }

    function parse(string memory _program) external {
        resetContext();
        parser.parse(ctx, _program);
    }

    function execute() external {
        executor.execute(ctx);
    }

    function resetContext() public {
        ctx.stack().clear();
        ctx.setPc(0);
    }

    function setupContext() internal {
        parser.initOpcodes(ctx);
        ctx.setAppAddress(address(this));
        ctx.setMsgSender(msg.sender);
    }
}
