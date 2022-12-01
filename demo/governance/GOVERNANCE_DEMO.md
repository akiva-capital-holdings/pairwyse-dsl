# Governance Demo

1. **Solidity.** Run the hardhat node via `npx hardhat node` command. Keep it running in the separate terminal window.
<!-- 2. **Solidity.** Deploy ERC20 token that will be used for the governance process. For that use the following command:

```
npx hardhat deploy-and-mint:erc20 --network localhost --supply 100000
```

Save the deployed contract address somewhere for the later use. --> 2. **Solidity.**

2. Deploy contracts to localhost, copy & paste their addresses on Front End, replace agreement bytecode on Front End.

```
npx hardhat run scripts/deploy.demoV2.ts --network localhost
```

3. **Front End.** Deploy Agreement via Front End. Save the deployed contract address somewhere for the later use.
4. **MetaMask.** Top up Agreement contract with 1 ETH.
   ```
   npx hardhat top-up:agreement \
      --network localhost \
      --agreement <deployed Agreement address> \
      --amount 1
   ```
5. **Front End.** Set variable `BOB` with value `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`

6. **Solidity.** Deploy Governance contract which will be the owner of the Agreement that you've deployed earlier. For that use the following command:

```
  npx hardhat deploy:governance \
    --network localhost \
    --agreement <deployed Agreement address> \
    --owner <your address from which you're deploying>
```

7. **Solidity.** Setup Governance contract

   ```
   npx hardhat setup:governance \
      --network localhost \
      --parser <deployed Parser address> \
      --preprocessor <deployed Preprocessor address> \
      --governance <deployed Governance address>
   ```

8. **Solidity.** Change Agreement ownership to Governance contract address.

   ```
   npx hardhat transfer-ownership:agreement \
      --network localhost \
      --agreement <deployed Agreement address> \
      --new-owner <Governance contract address>
   ```

9. **Front End.** Setup a new record in Agreement
   RecordId: `123`
   Signatories: `0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266`
   Conditions: [`bool true`]
   Transaction: `sendEth BOB 1e18`

10. **Front End.** Set variables in Governance contract
    await governance.setStorageUint256(hex4Bytes('RECORD_ID'), agreementRecordId);
    await governance.setStorageAddress(hex4Bytes('AGREEMENT_ADDR'), agreement.address);
    await governance.setStorageUint256(hex4Bytes('DEADLINE'), votingDeadline);

<!-- ```
npx hardhat set:number \
   --network localhost \
   --target <Governance contract address> \
   --name RECORD_ID \
   --value 123
```

```
npx hardhat set:address \
   --network localhost \
   --target <Governance contract address> \
   --name AGREEMENT_ADDR \
   --value <Agreement contract address>
``` -->

```
npx hardhat set:number \
   --network localhost \
   --target <Governance contract address> \
   --name DEADLINE \
   --value <any future timestamp less than 1 month in the future>
```

1.  **Front End.** Vote using Governance contract
    await governance.connect(alice).execute(0); // setup
    await governance.connect(bob).execute(1); // yes
    await governance.connect(carl).execute(1); // yes

2.  **Solidity.** Increase EVM time

```
npx hardhat advance-time \
   --by 2592000 \
   --network localhost
```

3.  **Front End.** Execute the 3d record in Governance to calculate the voting results
4.  **Front End.** Execute the Agreement record
5.  **Metamask.** Check that Bobs balance has changed.
