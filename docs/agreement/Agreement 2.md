## Agreement

Financial Agreement written in DSL between two or more users

Agreement contract that is used to implement any custom logic of a
financial agreement. Ex. lender-borrower agreement

### parser

```solidity
contract IParser parser
```

### context

```solidity
contract IProgramContext context
```

### contextDSL

```solidity
address contextDSL
```

### ownerAddr

```solidity
address ownerAddr
```

### ValueTypes

```solidity
enum ValueTypes {
  ADDRESS,
  UINT256,
  BYTES32,
  BOOL
}
```

### Parsed

```solidity
event Parsed(address preProccessor, string code)
```

### RecordArchived

```solidity
event RecordArchived(uint256 recordId)
```

### RecordUnarchived

```solidity
event RecordUnarchived(uint256 recordId)
```

### RecordActivated

```solidity
event RecordActivated(uint256 recordId)
```

### RecordDeactivated

```solidity
event RecordDeactivated(uint256 recordId)
```

### RecordExecuted

```solidity
event RecordExecuted(address signatory, uint256 recordId, uint256 providedAmount, string transaction)
```

### NewRecord

```solidity
event NewRecord(uint256 recordId, uint256[] requiredRecords, address[] signatories, string transaction, string[] conditionStrings)
```

### isReserved

```solidity
modifier isReserved(string varName)
```

### doesVariableExist

```solidity
modifier doesVariableExist(string varName, enum Agreement.ValueTypes valueType)
```

### onlyOwner

```solidity
modifier onlyOwner()
```

### Record

```solidity
struct Record {
  bool isExecuted;
  bool isArchived;
  bool isActive;
  string transactionString;
}
```

### Variable

```solidity
struct Variable {
  string varName;
  enum Agreement.ValueTypes valueType;
  bytes32 varHex;
  uint256 varId;
  address varCreator;
}
```

### records

```solidity
mapping(uint256 => struct Agreement.Record) records
```

<<<<<<< HEAD
### variables

```solidity
mapping(uint256 => struct Agreement.Variable) variables
```

### conditionContexts

```solidity
mapping(uint256 => address[]) conditionContexts
```

=======
>>>>>>> 989c6dc (Separate context, simplify governance, upgrade agreement)
### conditionStrings

```solidity
mapping(uint256 => string[]) conditionStrings
```

### signatories

```solidity
mapping(uint256 => address[]) signatories
```

### requiredRecords

```solidity
mapping(uint256 => uint256[]) requiredRecords
```

### isExecutedBySignatory

```solidity
mapping(uint256 => mapping(address => bool)) isExecutedBySignatory
```

### recordIds

```solidity
uint256[] recordIds
```

### varIds

```solidity
uint256[] varIds
```

### constructor

```solidity
constructor(address _parser, address _ownerAddr, address _dslContext) public
```

Sets parser address, creates new Context instance, and setups Context

<<<<<<< HEAD
### transferOwnership

```solidity
function transferOwnership(address _newOwner) public
=======
### receive

```solidity
receive() external payable
>>>>>>> 989c6dc (Separate context, simplify governance, upgrade agreement)
```

### getStorageBool

```solidity
function getStorageBool(bytes32 position) external view returns (bool data)
```

### getStorageAddress

```solidity
function getStorageAddress(bytes32 position) external view returns (address data)
```

### getStorageUint256

```solidity
function getStorageUint256(bytes32 position) external view returns (uint256 data)
```

### setStorageBool

```solidity
function setStorageBool(string varName, bool data) external
```

### setStorageAddress

```solidity
function setStorageAddress(string varName, address data) external
```

### setStorageBytes32

```solidity
function setStorageBytes32(string varName, bytes32 data) external
```

### setStorageUint256

```solidity
function setStorageUint256(string varName, uint256 data) external
```

### conditionLen

```solidity
function conditionLen(uint256 _recordId) external view returns (uint256)
```

_Based on Record ID returns the number of conditions_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Number of conditions of the Record |

### signatoriesLen

```solidity
function signatoriesLen(uint256 _recordId) external view returns (uint256)
```

_Based on Record ID returns the number of signatures_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Number of signatures in records |

### requiredRecordsLen

```solidity
function requiredRecordsLen(uint256 _recordId) external view returns (uint256)
```

_Based on Record ID returns the number of required records_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Number of required records |

### conditionStringsLen

```solidity
function conditionStringsLen(uint256 _recordId) external view returns (uint256)
```

_Based on Record ID returns the number of condition strings_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Number of Condition strings of the Record |

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
function getRecord(uint256 _recordId) external view returns (uint256[] _requiredRecords, address[] _signatories, string[] _conditions, string _transaction, bool _isActive)
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
| _transaction | string | string of transaction |
| _isActive | bool | true if the record is active |

### archiveRecord

```solidity
function archiveRecord(uint256 _recordId) external
```

_archived any of the existing records by recordId._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | Record ID |

### parse

```solidity
function parse(string _code, address _preProc) external
```

_Parse DSL code from the user and set the program bytecode in Context contract_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _code | string | DSL code input from the user |
| _preProc | address | Preprocessor address |

### update

```solidity
function update(uint256 _recordId, uint256[] _requiredRecords, address[] _signatories, string _transactionString, string[] _conditionStrings) external
```

### execute

```solidity
function execute(uint256 _recordId) external payable
```

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

### _addNewVariable

```solidity
function _addNewVariable(string _varName, enum Agreement.ValueTypes _valueType) internal returns (bytes32 position)
```

_Created and save new Variable of seted Value_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _varName | string | seted value name in type of string |
| _valueType | enum Agreement.ValueTypes | seted value type number |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| position | bytes32 | return _varName in type of bytes32 |

### _verify

```solidity
function _verify(uint256 _recordId) internal view returns (bool)
```

_Verify that the user who wants to execute the record is amoung the signatories for this Record_

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
function _addRecordTransaction(uint256 _recordId, string _transactionString) internal
```

_Adds a transaction that should be executed if all
conditions inside Record are met_

### _validateConditions

```solidity
function _validateConditions(uint256 _recordId, uint256 _msgValue) internal returns (bool)
```

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

### _activeRecordsLen

```solidity
function _activeRecordsLen() internal view returns (uint256)
```

_return length of active records for getActiveRecords_

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | count length of active records array |

