// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0 ;

interface ERC20 {
    function transfer(address recipient, uint256 amount) external returns(bool);
    function balanceOf(address account)external view returns(uint256);
    function allowance(address owner, address spender) external view returns(uint256);
    function approve(address spender, uint256 amount)external returns(bool);
    function transferFrom(address sender,address recipient, uint256 amount)external returns(bool);
    function name() external view returns(string memory);
    function symbol() external view returns(string memory);
    function totalSupply() external view returns(uint256); 
}

contract MotraPresale{
    
    address public owner;
    address public tokenAddress;
    uint256 public tokenPrice;
    uint256 public soldTokens;

    modifier onlyOwner(){
        _;
    }

    constructor(){}

    function updateToken(){}

    function updateTokenPresalePrice(){}

    function mathMultiply(){}

    function buyToken(){}

    function getTokenInfo(){}

    function transfertoOwner(){}

    function withdrawAllTokens(){}
}