## AgreementMock

### constructor

```solidity
constructor(address _parser, address _ownerAddr) public
```

### verify

```solidity
function verify(uint256 _recordId) public view returns (bool)
```

### validateRequiredRecords

```solidity
function validateRequiredRecords(uint256 _recordId) public view returns (bool)
```

### validateConditions

```solidity
function validateConditions(uint256 _recordId, uint256 _msgValue) public returns (bool)
```

### addRecordBlueprint

```solidity
function addRecordBlueprint(uint256 _recordId, uint256[] _requiredRecords, address[] _signatories) external
```

### addRecordCondition

```solidity
function addRecordCondition(uint256 _recordId, string _conditionStr, address _conditionCtx) public
```

### addRecordTransaction

```solidity
function addRecordTransaction(uint256 _recordId, string _transactionString, address _recordContext) public
```

### fulfill

```solidity
function fulfill(uint256 _recordId, uint256 _msgValue, address _signatory) external returns (bool)
```

### setRecordContext

```solidity
function setRecordContext(uint256 _recordId, address _context) external
```

