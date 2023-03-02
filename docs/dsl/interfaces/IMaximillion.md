## IMaximillion

### repayBehalf

```solidity
function repayBehalf(address borrower) external payable
```

msg.sender sends Ether to repay an account's borrow in the cEther market

_The provided Ether is applied towards the borrow balance, any excess is refunded_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| borrower | address | The address of the borrower account to repay on behalf of |


