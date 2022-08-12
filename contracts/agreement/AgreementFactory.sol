// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { Agreement } from './Agreement.sol';

/**
 * @dev Factory to generate Agreement contract instances
 */
contract AgreementFactory {
    address[] public deployedAgreements;
    // TODO: event NewAgreement(address creator, address owner, address agreement);
    event NewAgreement(address agreement);

    /**
     * @dev Deploy new Agreement contract
     * @param _parser Parser contract instance
     * @return _agreementAddr Address of newly created Agreement
     */
    function deployAgreement(address _parser) external returns (address _agreementAddr) {
        Agreement _agreement = new Agreement(_parser);
        _agreementAddr = address(_agreement);
        deployedAgreements.push(_agreementAddr);
        emit NewAgreement(_agreementAddr);
    }

    /**
     * @dev Get length of the deployed agreement array
     * @return The length of the array
     */
    function getDeployedAgreementsLen() external view returns (uint256) {
        return deployedAgreements.length;
    }
}
