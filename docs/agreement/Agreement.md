## Agreement

Financial Agreement written in DSL between two or more users

Agreement contract that is used to implement any custom logic of a
financial agreement. Ex. lender-borrower agreement

### recordIds

```solidity
uint256[] recordIds
```

### parser

```solidity
address parser
```

### contextProgram

```solidity
address contextProgram
```

### contextDSL

```solidity
address contextDSL
```

### ownerAddr

```solidity
address ownerAddr
```

### nextParseIndex

```solidity
uint256 nextParseIndex
```

### records

```solidity
mapping(uint256 => struct IAgreement.Record) records
```

### onlyOwner

```solidity
modifier onlyOwner()
```

### constructor

```solidity
constructor(address _parser, address _ownerAddr, address _dslContext) public
```

Sets parser address, creates new contextProgram instance, and setups contextProgram

### receive

```solidity
receive() external payable
```

### archiveRecord

```solidity
function archiveRecord(uint256 _recordId) external
```

_archive any of the existing records by recordId._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |

### unarchiveRecord

```solidity
function unarchiveRecord(uint256 _recordId) external
```

_unarchive any of the existing records by recordId_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |

### activateRecord

```solidity
function activateRecord(uint256 _recordId) external
```

_activates the existing records by recordId, only awailable for ownerAddr_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |

### deactivateRecord

```solidity
function deactivateRecord(uint256 _recordId) external
```

_deactivates the existing records by recordId, only awailable for ownerAddr_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |

### parseFinished

```solidity
function parseFinished() external view returns (bool _result)
```

_returns true if parsing was finished for the record including
conditions otherwise, it returns false
The `finished parsing` therm means that all record and conditions
already parsed and have got their bytecodes, so all bytecodes
already storing in the Agreement smart contract_

### parse

```solidity
function parse(address _preProc) external returns (bool _result)
```

_Parse DSL code from the user and set the program bytecode in Agreement contract_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _preProc | address | Preprocessor address |

### _parse

```solidity
function _parse(uint256 _recordId, address _preProc, string _code, bool _isRecord) internal
```

_Parse DSL code and set the program bytecode in Agreement contract_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |
| _preProc | address | Preprocessor address |
| _code | string | DSL code for the record of the condition |
| _isRecord | bool | a flag that shows if provided _code is a record or not (a condition then) |

### update

```solidity
function update(uint256 _recordId, uint256[] _requiredRecords, address[] _signatories, string _recordString, string[] _conditionStrings) public
```

_Updates Agreement contract by DSL code for the record
and its conditions. All records that will be updated still
need to be parsed. Please, check the `parse` function for more details
TODO: rename this function to addRecord_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |
| _requiredRecords | uint256[] | array of required records in the record |
| _signatories | address[] | array of signatories in the record |
| _recordString | string | string of record DSL transaction |
| _conditionStrings | string[] | the array of conditions string for the record |

### execute

```solidity
function execute(uint256 _recordId) external payable virtual
```

_Check if the recorcID is executable (validate all conditions before
record execution, check signatures)._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |

### _verifyRecord

```solidity
function _verifyRecord(uint256 _recordId) internal
```

### conditionString

```solidity
function conditionString(uint256 _recordId, uint256 i) external view returns (string)
```

_Returns the condition string for provided recordID
and index for the searching condition string_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |
| i | uint256 |  |

### getActiveRecords

```solidity
function getActiveRecords() external view returns (uint256[])
```

_Sorted all records and return array of active records in Agreement_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256[] | activeRecords array of active records in Agreement |

### getRecord

```solidity
function getRecord(uint256 _recordId) external view returns (uint256[] _requiredRecords, address[] _signatories, string[] _conditions, string _record, bool _isActive)
```

_return valuses for preview record before execution_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| _requiredRecords | uint256[] | array of required records in the record |
| _signatories | address[] | array of signatories in the record |
| _conditions | string[] | array of conditions in the record |
| _record | string | string of record DSL transaction |
| _isActive | bool | true if the record is active |

### _checkSignatories

```solidity
function _checkSignatories(address[] _signatories) internal view
```

_Checks input _signatures that only one 'ANYONE' address exists in the
list or that 'ANYONE' address does not exist in signatures at all_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _signatories | address[] | the list of addresses |

### _verify

```solidity
function _verify(uint256 _recordId) internal view returns (bool)
```

Verify that the user who wants to execute the record is amoung the signatories for this Record

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | ID of the record |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true if the user is allowed to execute the record, false - otherwise |

### _validateRequiredRecords

```solidity
function _validateRequiredRecords(uint256 _recordId) internal view returns (bool)
```

_Check that all records required by this records were executed_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | ID of the record |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | true all the required records were executed, false - otherwise |

### _addRecordBlueprint

```solidity
function _addRecordBlueprint(uint256 _recordId, uint256[] _requiredRecords, address[] _signatories) internal
```

_Define some basic values for a new record_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | is the ID of a transaction |
| _requiredRecords | uint256[] | transactions ids that have to be executed |
| _signatories | address[] | addresses that can execute the chosen transaction |

### _addRecordCondition

```solidity
function _addRecordCondition(uint256 _recordId, string _conditionStr) internal
```

_Conditional Transaction: Append a condition to already existing conditions
inside Record_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |
| _conditionStr | string | DSL code for condition |

### _addRecordTransaction

```solidity
function _addRecordTransaction(uint256 _recordId, string _recordString) internal
```

_Adds a transaction that should be executed if all
conditions inside Record are met_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |
| _recordString | string | DSL code for record string |

### _validateConditions

```solidity
function _validateConditions(uint256 _recordId, uint256 _msgValue) internal returns (bool)
```

_Validate all conditions for the certain record ID_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID to execute |
| _msgValue | uint256 | Value that were sent along with function execution // TODO: possibly remove this argument |

### _fulfill

```solidity
function _fulfill(uint256 _recordId, uint256 _msgValue, address _signatory) internal returns (bool result)
```

_Fulfill Record_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID to execute |
| _msgValue | uint256 | Value that were sent along with function execution // TODO: possibly remove this argument |
| _signatory | address | The user that is executing the Record |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| result | bool | Boolean whether the record was successfully executed or not |

### _execute

```solidity
function _execute(uint256 _msgValue, bytes _program) private
```

_Execute Record_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _msgValue | uint256 | Value that were sent along with function execution      // TODO: possibly remove this argument |
| _program | bytes | provided bytcode of the program |

### _activeRecordsLen

```solidity
function _activeRecordsLen() internal view returns (uint256)
```

_return length of active records for getActiveRecords_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | count length of active records array |

### conditionStringsLen

```solidity
function conditionStringsLen(uint256 _recordId) public view returns (uint256)
```

### _seeLast

```solidity
function _seeLast() private view returns (uint256)
```

### _anyone

```solidity
function _anyone() private view returns (address)
```

### _checkEmptyString

```solidity
function _checkEmptyString(string _string) private pure
```

### _checkZeroAddress

```solidity
function _checkZeroAddress(address _address) private pure
```

### _getProgram

```solidity
function _getProgram() private view returns (bytes)
```

