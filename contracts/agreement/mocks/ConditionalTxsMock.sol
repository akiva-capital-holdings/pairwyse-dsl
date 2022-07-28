// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { ConditionalTxs } from '../ConditionalTxs.sol';
import { IERC20 } from '../../dsl/interfaces/IERC20.sol';

// import 'hardhat/console.sol';

contract ConditionalTxsMock is ConditionalTxs {
    function cleanTx(uint256[] memory _txIds, address[] memory _signatories) external {
        for (uint256 i = 0; i < _txIds.length; i++) {
            txs[_txIds[i]].isExecuted = false;
            for (uint256 j = 0; j < _signatories.length; j++) {
                isExecutedBySignatory[_txIds[i]][_signatories[j]] = false;
            }
        }
    }

    // send fund back to the _address
    function returnFunds(address _address) external {
        payable(_address).transfer(address(this).balance);
    }

    // send tokens back to the sender
    function returnTokens(address _token) external {
        uint256 amount = IERC20(_token).balanceOf(address(this));
        IERC20(_token).transfer(msg.sender, amount);
    }
}
