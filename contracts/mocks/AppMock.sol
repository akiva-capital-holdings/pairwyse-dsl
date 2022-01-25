// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { Parser } from "../Parser.sol";
import { Context } from "../Context.sol";
import { Executor } from "../Executor.sol";
import { Storage } from "../helpers/Storage.sol";

// import "hardhat/console.sol";

contract AppMock is Storage {
    Parser public parser;
    Executor public executor;
    Context public ctx;

    receive() external payable {
        payable(parser.opcodes()).transfer(msg.value);
    }

    constructor(
        Parser _parser,
        Executor _executor,
        Context _ctx
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
