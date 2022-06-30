// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { Agreement } from './Agreement.sol';

contract AgreementFactory {
    address[] public deployedAgreements;
    event NewAgreement(address agreement);

    function deployAgreement(address _parser) external returns (address _agreementAddr) {
        Agreement _agreement = new Agreement(_parser);
        _agreementAddr = address(_agreement);
        deployedAgreements.push(_agreementAddr);
        emit NewAgreement(_agreementAddr);
    }

    function getDeployedAgreementsLen() external view returns (uint256) {
        return deployedAgreements.length;
    }
}
