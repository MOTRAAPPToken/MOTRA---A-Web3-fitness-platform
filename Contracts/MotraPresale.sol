// SPDX-License-Identifier: MIT
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
    function decimals() external view returns(uint8); 
}

contract MotraPresale{
    
    address public owner;
    address public tokenAddress;
    uint256 public tokenPrice;
    uint256 public totalSoldTokens;
    uint8 public tokenDecimals;
    bool private locked; // for re-entrency gaurd

    event TokensPurchased(address indexed buyer, uint256 amount, uint256 cost);
    event TokenUpdated(address indexed token);
    event PriceUpdated(uint256 newPrice);
    event TokensWithdrawn(uint256 amount);
    event EthReceived(address indexed sender, uint256 amount);


    modifier onlyOwner(){
        require(msg.sender==owner,"only Owner is allowed");
        _;
    }

    modifier nonReentrant() {
    require(!locked, "No reentrancy");
    locked = true;
    _;
    locked = false;
    }

    constructor(){
        owner = msg.sender;
    }

    function updateToken(address _tokenAddress) public onlyOwner{
        require(_tokenAddress != address(0), "Zero address");
        tokenAddress = _tokenAddress;
        tokenDecimals = ERC20(_tokenAddress).decimals();
        emit TokenUpdated(tokenAddress);
    }

    function updateTokenPresalePrice(uint _tokenPrice) public onlyOwner{
        tokenPrice = _tokenPrice;
        emit PriceUpdated(tokenPrice);
    }

    function buyToken(uint256 _buyAmount) public payable nonReentrant{
        require(_buyAmount > 0, "Amount should be greater than zero.");
        require(msg.value == _buyAmount * tokenPrice, "insufficent ETH");

        ERC20 token = ERC20(tokenAddress);

        uint256 amountWithDecimals = _buyAmount * (10 ** uint256(tokenDecimals)); 

        require(amountWithDecimals <= token.balanceOf(address(this)), "Token Sold out this round");
        require(token.transfer(msg.sender, amountWithDecimals), "Txn failed");
        payable(owner).transfer(msg.value);
        totalSoldTokens += amountWithDecimals;

        emit TokensPurchased(msg.sender, amountWithDecimals, tokenPrice);
    }

    function getTokenInfo()public view returns(string memory name, string memory symbol, uint balance, uint totalSupply, uint price, address tokenAdd){
        ERC20 token = ERC20(tokenAddress);
        return(token.name(), token.symbol(), token.balanceOf(address(this)), token.totalSupply(), tokenPrice, tokenAddress);
    }

    receive() external payable {
    (bool success, ) = owner.call{value: msg.value}("");
    require(success, "Donation/accidental transfer failed");
    emit EthReceived(msg.sender, msg.value);
    }

    function withdrawAllTokens() public onlyOwner nonReentrant {
        ERC20 token = ERC20(tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "No tokens left in the contract");
        require(token.transfer(owner, balance), "Withdraw failed");
        emit TokensWithdrawn(balance);
    }
}