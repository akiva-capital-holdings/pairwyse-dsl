## MultiTranche

### deadline

```solidity
uint256 deadline
```

### WUSDC

```solidity
contract IERC20Mintable WUSDC
```

### compounds

```solidity
mapping(address => address) compounds
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

_Uploads pre-defined records to Governance contract directly_

### _setDefaultVariables

```solidity
function _setDefaultVariables() internal
```

### _setParameters

```solidity
function _setParameters(uint256 _recordId, string _record, string _condition) internal
```

_Uploads pre-defined records to MultiTranche contract directly.
Uses a simple condition string `bool true`.
Records still have to be parsed using a preprocessor before execution. Such record becomes
non-upgradable. Check `isUpgradableRecord` modifier_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recordId | uint256 | is the record ID |
| _record | string | is a string of the main record for execution |
| _condition | string | is a string of the condition that will be checked before record execution |

### _setEnterRecord

```solidity
function _setEnterRecord() internal
```

_If DEPOSITS_DEADLINE hasn't passed, then to enter the MultiTranche contract:
1. Understand how much USDC a user wants to deposit
2. Transfer USDC from the user to the MultiTranche
3. Mint WUSDC to the user's wallet in exchange for his/her USDC_

### _setDepositRecord

```solidity
function _setDepositRecord() internal
```

_If DEPOSITS_DEADLINE is passed to deposit USDC to MultiTranche:
1. Deposit all collected on MultiTranche USDC to Compound.
   As a result MultiTranche receives cUSDC tokens from Compound
2. Remember the deposit time in DEPOSIT_TIME variable_

### _setWithdrawRecord

```solidity
function _setWithdrawRecord() internal
```

_If USDC lock time is passed:
1. Understand how much WUSDC a user wants to withdraw
2. Withdraw requested amount of USDC from Compound
3. Burn user's WUSDC
4. Send USDC to the user_

