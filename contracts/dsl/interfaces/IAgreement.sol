// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IAgreement {
    event Parsed(address indexed preProccessor, string code);

    event RecordArchived(uint256 indexed recordId);
    event RecordUnarchived(uint256 indexed recordId);
    event RecordActivated(uint256 indexed recordId);
    event RecordDeactivated(uint256 indexed recordId);

    event RecordExecuted(
        address indexed signatory,
        uint256 indexed recordId,
        uint256 providedAmount,
        string transaction
    );

    event NewRecord(
        uint256 recordId,
        uint256[] requiredRecords, // required transactions that have to be executed
        address[] signatories, // addresses that can execute the transaction
        string transaction, // DSL code string ex. `uint256 5 > uint256 3`
        //  DSL code strings that have to be executed successfully before the `transaction DSL code`
        string[] conditionStrings
    );

    /*
        all mappings were moved to the Record struct as it uses less gas during contract deloyment
    */
    struct Record {
        bool isExecuted;
        bool isArchived;
        bool isActive;
        uint256[] requiredRecords;
        address[] signatories;
        string transactionString;
        string[] conditionStrings;
        bytes transactionProgram;
        bytes[] conditions; // condition program in bytes
        mapping(address => bool) isExecutedBySignatory;
        mapping(string => bool) isConditionSet;
        mapping(string => bool) isRecordSet;
    }
}
