## MultiTranche

### deadline

```solidity
uint256 deadline
```

### baseRecord

```solidity
mapping(uint256 => bool) baseRecord
```

### wusdc

```solidity
contract IERC20Mintable wusdc
```

### constructor

```solidity
constructor(address _parser, address _ownerAddr, address _dslContext) public
```

Sets parser address, creates new Context instance, and setups Context

### _setBaseRecords

```solidity
function _setBaseRecords() internal
```

_Uploads 4 pre-defined records to Governance contract directly_

### _setDefaultVariables

```solidity
function _setDefaultVariables() internal
```

### _setParameters

```solidity
function _setParameters(uint256 _recordId, string _record, string _condition, uint256 _requiredRecordsLength) internal
```

_Uploads 4 pre-defined records to Governance contract directly.
Uses a simple condition string `bool true`.
Records still have to be parsed using a preprocessor before execution. Such record becomes
non-upgradable. Check `isUpgradableRecord` modifier_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | is the record ID |
| _record | string | is a string of the main record for execution |
| _condition | string | is a string of the condition that will be checked before record execution |
| _requiredRecordsLength | uint256 | is a flag for required records before execution |

### _setEnterRecord

```solidity
function _setEnterRecord() internal
```

_To enter the MultiTranche contract:
1. Understand how much USDC a user wants to deposit
2. Transfer USDC from the user to the MultiTranche
3. Mint WUSDC to the user's wallet in exchange for his/her USDC_

### _setDepositAllRecord

```solidity
function _setDepositAllRecord() internal
```

_If the deposits deadline has passed anyone can trigger the deposit of all USDC to
     Compound. This is done in the following way:
1. Understand how much USDC there are on the MultiTranche contract
2. Deposit all USDC to Compound
3. Remember in a variable when the deposit happened_

### _setWithdrawRecord

```solidity
function _setWithdrawRecord() internal
```

_If USDC lock time is passed:
1. Understand how much WUSDC a user wants to withdraw
2. Withdraw requested amount of USDC from Compound
3. Burn user's WUSDC
4. Send USDC to the user_

