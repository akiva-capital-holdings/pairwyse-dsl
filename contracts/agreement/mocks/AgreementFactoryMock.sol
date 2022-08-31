// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { AgreementMock } from './AgreementMock.sol';

// import { AgreementFactory } from '../AgreementFactory.sol';

/**
 * @dev Factory to generate Agreement contract instances
 */
// Note: this is a mock contract as it uses AgreementMock. No more changes from the original contract
contract AgreementFactoryMock {
    address[] public deployedAgreements;
    event NewAgreement(address agreement);

    /**
     * @dev Deploy new Agreement contract
     * @param _parser Parser contract instance
     * @return _agreementAddr Address of newly created Agreement
     */
    function deployAgreement(address _parser) external returns (address _agreementAddr) {
        AgreementMock _agreement = new AgreementMock(_parser);
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
