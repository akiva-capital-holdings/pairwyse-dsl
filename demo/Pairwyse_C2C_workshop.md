# Pairwyse Workshops

## 1.  Contract-to-Contract bylaw governance workshop

### Prelim 1 - Deploy Pairwyse development sandbox

[Follow instructions for smart contract and UI test dApp setup](https://github.com/akiva-capital-holdings/pairwyse-dsl/blob/workshops/demo/v2/FE-demo-v2.md)

### Prelim 2 - Deploy mock currency token for the demo

![]()

### Prelim 3 - Wallet addresses for ALICE, BOB, CHARLES, DIANA, ELAINE and FARUK


### Demo - DAO token-to-treasury-to-governance agreement interfacing


[Step 1] - ALICE Deploys GOV token with 200000e18 supply


[Step 2] - BOB Deploys FOUNDRY token with 5e1 supply


[Step 3] - CHARLES Deploys TREASURY agreement with the following logic and state

Definitions:

USDC token address (mock currency)
GOV token address
FOUNDRY token address
TREASURY agreement address

Update:

record id:    `1`
signatory:    `0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF`
condition:    `(balanceOf FOUNDRY MSG_SENDER) > 0`
transaction:  `(transferFrom USDC MSG_SENDER TREASURY 1e18) and (transfer GOV MSG_SENDER 1e18)`


[Step 4] - DIANA deploys GOVERNANCE agreement with the following state

Definitions:

`TREASURY` as address (agreement)
`GOV` as address (token)


[Step 5] - CHARLES transfers ownership of TREASURY agreement to the GOVERNANCE agreement

```
agreement = await ethers.getContractAt('Agreement', '<enter treasury agreement address here>');
await agreement.transferOwnership('<enter governance agreement address here>')
await agreement.ownerAddr() // confirm new owner
```

[Step 6] - ELAINE makes an on-chain bylaw proposal for the TREASURY agreement

Definitions:

`SPECIAL_EXPIRY` as number (first deadline as UTC seconds)
`FUNDING_EXPIRY` as number (second deadline as UTC seconds)

Bylaw Update Proposal:

record id:    `2`
signatory:    `0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF`
condition:    `(((balanceOf GOV MSG_SENDER) > 0) and (time < SPECIAL_EXPIRY)) or (((balanceOf USDC) > 100000e18) and (time > SPECIAL_EXPIRY) and (time < FUNDING_EXPIRY))`
transaction:  `((allowance USDC MSG_SENDER TREASURY) setUint256 ALLOWANCE) and (transferFromVar USDC MSG_SENDER TREASURY ALLOWANCE) and (transferVar GOV MSG_SENDER ALLOWANCE)`


[Step 7] - DIANA creates the governance vote for ELAINE's treasury bylaw proposal

Definitions:
`DEADLINE` as number (UTC in seconds)
`1` as number with value 1 (certain bylaw transactions require explicit definitions)

Governance bylaw update:

record id:    `1`
signatory:    `0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF`
condition:    `((balanceOf GOV MSG_SENDER) > 0) and (time < DEADLINE)`
transaction:  `declareArr address YES declareArr address NO`

record id:    `2`
signatory:    `0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF`
condition:    `((balanceOf GOV MSG_SENDER) > 0) and (time < DEADLINE)`
transaction:  `insert MSG_SENDER into YES`

record id:    `3`
signatory:    `0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF`
condition:    `((balanceOf GOV MSG_SENDER) > 0) and (time < DEADLINE)`
transaction:  `insert MSG_SENDER into NO`

record id:    `4`
signatory:    `0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF`
condition:    `((votersBalance GOV YES) > (votersBalance GOV NO)) and (time > DEADLINE)`
transaction:  `enableRecords 2 at TREASURY`


[Step 8] - BOB sends 1e1 FOUNDRY tokens each to ALICE, CHARLES, DIANA, ELAINE

* This enables the peers to receive early purchase rights once the DAO is fully activated


[Step 9] - ALICE sends 200000e18 to ASTRO_PROTOCOL

* The mock DAO is not officially activated until ALICE sends all GOV tokens to the treasury contract


[Step 10] - ALICE, BOB, CHARLES, DIANA, ELAINE claim their early bird status

* Each peer executes bylaw 1 on the TREASURY agreement making them the first ceremonial DAO members
* One peer executes bylaw 1 on the GOVERNANCE agreement to activate the vote
* Each peer votes to approve or reject the activation of record 2 on the TREASURY agreement
* If the vote is affirmative, a general GOV token sale will be activate with the peers receiving earlybird purchase rights


[Step 11] - Assuming an affirmative vote, the founding peers make one-time token purchases is various amounts. After passage of the special expiry, FARUK purchases the remaining tokens to become the new DAO's sixth member



## 2.  Technical Workshop - DAO constitutional charter instrumentation

Pairwyse smart contracts maintain a dual layer architecture, a fixed solidity charter atop which turing computable bylaw programs (turing bylaws in the form of DSL-mediated on-chain contract upgrades)

![]()

The goal of this workshop is crafting a governance contract with a solidity charter possessing elevated security (ownerless governance contract) and constitutionally-enforced governance votes on upgrade proposals to smart contracts owned by the governance contract

```
contract DAO is Agreement {

    uint256 vote_number;
    address governance_token;
    string governance_token_symbol;

    address ANYONE = 0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF;

    constructor(
        address _parser,
        address _dslContext,
        address _goverance_token
    ) {
        _checkZeroAddress(_parser);
        _checkZeroAddress(_dslContext);
	_checkZeroAddress(_ownerAddr);

        contextDSL = _dslContext;
	parser = _parser;  /* optional:  governance language model customisations */
        ownerAddr = address(this);

        governance_token = _goverance_token;		
        string governance_token_symbol = IERC20(governance_token).symbol();

        UnstructuredStorage.setStorageAddress(
            bytes4(keccak256(abi.encodePacked(governance_token_symbol))),
            governance_token
        );

        vote_number = 0;
    }

    function initiateVote(
        uint256 _record_id,
        address _target_agreement,
        uint256 _deadline,
    ) public {

        /* option:  enforcement of deadline requirements */

        uint256 memory vote_bylaw_id_1 = (vote_number * 4) + 1;
        uint256 memory vote_bylaw_id_2 = vote_bylaw_id_1 + 1;
        uint256 memory vote_bylaw_id_3 = vote_bylaw_id_2 + 1;
        uint256 memory vote_bylaw_id_4 = vote_bylaw_id_3 + 1;

        vote_number = vote_number + 1;

        string memory vote_number_suffix = _uintToString(vote_number);
        string memory _record_id_string = _uintToString(_record_id);
        string memory _target_agreement_string = _addressToString(_target_agreement);
        string memory _deadline_vote = string(abi.encodePacked("DEADLINE", "_", vote_number_suffix);

        UnstructuredStorage.setStorageUint256(
            bytes4(keccak256(abi.encodePacked(_deadline_vote))), // optional:  date-time converters
            _deadline
        );

        UnstructuredStorage.setStorageUint256(
            bytes4(keccak256(abi.encodePacked(_record_id_string))), // optional:  record id alias  
            _record_id
        );

        UnstructuredStorage.setStorageAddress(
            bytes4(keccak256(abi.encodePacked( _target_agreement_string ))),  // optional:  contract alias
            _target_agreement
        );

        string memory _voting_conditon = string(abi.encodePacked(
            "((balanceOf ", governance_token_symbol, " MSG_SENDER) > 0) and (time < ", _deadline_vote, ")"
        ));

        string memory _affirmative_vote_condition = string(abi.encodePacked(
            "((votersBalance ", governance_token_symbol, " YES_", vote_number_suffix,") > (votersBalance ", governance_token_symbol, " NO_", vote_number_suffix, ")) and (time > ", _deadline_vote,")"
        ));	

        string memory _bylaw_activation_transaction = string(abi.encodePacked(
            "enableRecords ", _record_id_string," at ", _target_agreement_string
        ));
	
        /* Constitution:  An existing token holder must second the vote in order for voting to be activated before the deadline */
        _setVoteParameters(
            vote_bylaw_id_1, // RECORD ID
            _voting_conditon // CONDITIONS
            string(abi.encodePacked(
                "declareArr address YES_", vote_number_suffix, " declareArr address NO_", vote_number_suffix // TRANSACTION	
            )); 
        );
 
        /* Constitution:  A record of affirmative votes will be registered before the deadline */
        _setVoteParameters(
            vote_bylaw_id_2, // RECORD ID
            _voting_conditon // CONDITIONS
            string(abi.encodePacked(
                "insert MSG_SENDER into YES_", vote_number_suffix // TRANSACTION
            )) 
        );

        /* Constitution:  A record of negative votes will be registered will be registered before the deadline */
        _setVoteParameters(
            vote_bylaw_id_3, // RECORD ID
            _voting_conditon, // CONDITIONS
            string(abi.encodePacked(
                "insert MSG_SENDER into NO_", vote_number_suffix // TRANSACTION
            )) 
        );

        // Constitution:  If the aggregate token balance for YES votes is greater than that of NO votes, the bylaw record at the target agreement will be officially enacted
        _setVoteParameters(
            vote_bylaw_id_4, // RECORD ID
            _affirmative_vote_condition, // CONDITIONS
            _bylaw_activation_transaction, // TRANSACTION
        );

        /* emit DAOVoteInitiated() // optional:  public notice of vote initiation */
    }

    function _uintToString(uint256 number) internal pure returns (string) { /* method or library of choice */ }

    function _addressToString(uint256 number) internal pure returns (string) { /* method or library of choice */ }

    function _setVoteParameters(
        uint256 _recordId,
        string memory _record,
        string memory _condition,
        uint256 _requiredRecordsLength
    ) internal {	
        /* can follow constitutional pattern of _setParameters in Governance.sol */
        /* optional:  rights protection and scope enforcement implementations */
        /* optional:  invoke votes for other token holder classes (e.g. users, depositors, creditors, etc)
    }
    /* optional:  governance contract ownership transfer protocol * /
    /* optional:  definition restrictions * /
    /* optional:  language restrictions * /
    
}
```

[![]()]() 

## 3.  Business Workshop - DAO Capital Instrument Basics

[![]()]() 

## 4.  Risk Workshop - Scope Enforcement Basics

[![]()]()

## 5.  BFT DAO genesis Workshop

![]()

[![]()]() 
