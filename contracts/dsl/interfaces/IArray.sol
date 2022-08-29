// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IArray {
    struct ArrayObj {
        string _type; // type for the array
        address[] addressValues; // for address variables
        uint256[] uint256Values; // for uint256 variables
    }

    function getUint256Array(string memory _name) external view returns (uint256[] memory);

    function getAddressArray(string memory _name) external view returns (address[] memory);

    function getAddressByIndex(string memory _name, uint256 _index) external view returns (address);

    function getUint256ByIndex(string memory _name, uint256 _index) external view returns (uint256);

    function setArrayAddresses(string memory _name, address[] memory _addresses) external;

    function setArrayUint256(string memory _name, uint256[] memory _values) external;

    // function getListUint256FromStr(string memory _listStr) external returns (uint256[] memory);
}
