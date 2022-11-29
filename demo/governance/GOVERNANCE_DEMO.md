# Governance Demo

1. **Solidity.** Run the hardhat node via `npx hardhat node` command. Keep it running in the separate terminal window.
2. **Front End.** Deploy Agreement via Front End. Copy its address.
3. **Solidity.** Deploy ERC20 token that will be used for the governance process. For that use the following command:

```
npx hardhat deploy-and-mint:erc20 --network localhost --supply 100000
```

Save the deployed token address somewhere for the later use.

4. **Solidity.** Deploy Governance contract which will be the owner of the Agreement that you've deployed earlier. For that use the following command:

```
  npx hardhat deploy-n-setup:governance \
    --network localhost \
    --agreement <deployed Agreement address> \
    --owner <your address from which you're deploying> \
    --token <deployed token address>
```

5. **Front End.**
   Update Agreement:
   const conditions = ['bool true'];
   const transaction = '(uint256 5) setUint256 AGREEMENT_RESULT';
6. **Front End.**
   // await governance.setStorageUint256(hex4Bytes('RECORD_ID'), txId);
   // await governance.setStorageAddress(hex4Bytes('AGREEMENT_ADDR'), agreementAddr);
   // await governance.setStorageUint256(hex4Bytes('GOV_BALANCE'), 55);
