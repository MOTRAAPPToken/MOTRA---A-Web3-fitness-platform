// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function totalSupply() external view returns (uint256);
    function decimals() external view returns (uint8);
}

contract MotraPresale {
    address public owner;
    address public tokenAddress;
    address public usdtAddress;
    uint256 public tokenPrice;
    uint256 public usdtPrice;
    uint256 public totalSoldTokens;
    uint8 public tokenDecimals;
    bool public presaleActive;
    bool public usdtEnabled;
    
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    event TokensPurchased(address indexed buyer, uint256 amount, uint256 cost, string paymentMethod);
    event TokenUpdated(address indexed token);
    event USDTAddressUpdated(address indexed usdt);
    event PriceUpdated(uint256 newEthPrice, uint256 newUsdtPrice);
    event TokensWithdrawn(uint256 amount);
    event EthReceived(address indexed sender, uint256 amount);
    event PresaleStatusChanged(bool active);
    event USDTStatusChanged(bool enabled);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error OnlyOwner();
    error ZeroAddress();
    error ZeroAmount();
    error InsufficientETH();
    error InsufficientUSDT();
    error TokenSoldOut();
    error TransferFailed();
    error PresaleInactive();
    error USDTNotEnabled();
    error ReentrancyGuard();

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    modifier nonReentrant() {
        if (_status == _ENTERED) revert ReentrancyGuard();
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    modifier presaleIsActive() {
        if (!presaleActive) revert PresaleInactive();
        _;
    }

    modifier usdtIsEnabled() {
        if (!usdtEnabled) revert USDTNotEnabled();
        _;
    }

    constructor() {
        owner = msg.sender;
        _status = _NOT_ENTERED;
        presaleActive = false;
        usdtEnabled = false;
    }

    function updateToken(address _tokenAddress) external onlyOwner {
        if (_tokenAddress == address(0)) revert ZeroAddress();
        tokenAddress = _tokenAddress;
        tokenDecimals = IERC20(_tokenAddress).decimals();
        emit TokenUpdated(tokenAddress);
    }

    function updateUSDTAddress(address _usdtAddress) external onlyOwner {
        if (_usdtAddress == address(0)) revert ZeroAddress();
        usdtAddress = _usdtAddress;
        emit USDTAddressUpdated(usdtAddress);
    }

    function updateTokenPrices(uint256 _ethPrice, uint256 _usdtPrice) external onlyOwner {
        if (_ethPrice == 0) revert ZeroAmount();
        if (_usdtPrice == 0) revert ZeroAmount();
        
        tokenPrice = _ethPrice;
        usdtPrice = _usdtPrice;
        emit PriceUpdated(tokenPrice, usdtPrice);
    }

    function togglePresale() external onlyOwner {
        presaleActive = !presaleActive;
        emit PresaleStatusChanged(presaleActive);
    }

    function toggleUSDT() external onlyOwner {
        usdtEnabled = !usdtEnabled;
        emit USDTStatusChanged(usdtEnabled);
    }

    function buyTokenWithETH(uint256 _buyAmount) external payable nonReentrant presaleIsActive {
        if (_buyAmount == 0) revert ZeroAmount();
        if (tokenAddress == address(0)) revert ZeroAddress();
        
        uint256 totalCost = _buyAmount * tokenPrice;
        if (msg.value != totalCost) revert InsufficientETH();

        IERC20 token = IERC20(tokenAddress);
        uint256 amountWithDecimals = _buyAmount * (10 ** uint256(tokenDecimals));
        
        if (amountWithDecimals > token.balanceOf(address(this))) revert TokenSoldOut();
        
        if (!token.transfer(msg.sender, amountWithDecimals)) revert TransferFailed();
        
        (bool success, ) = payable(owner).call{value: msg.value}("");
        if (!success) revert TransferFailed();
        
        totalSoldTokens += amountWithDecimals;
        emit TokensPurchased(msg.sender, amountWithDecimals, totalCost, "ETH");
    }

    function buyToken(uint256 _buyAmount) external payable nonReentrant presaleIsActive {
        if (_buyAmount == 0) revert ZeroAmount();
        if (tokenAddress == address(0)) revert ZeroAddress();
        
        uint256 totalCost = _buyAmount * tokenPrice;
        if (msg.value != totalCost) revert InsufficientETH();

        IERC20 token = IERC20(tokenAddress);
        uint256 amountWithDecimals = _buyAmount * (10 ** uint256(tokenDecimals));
        
        if (amountWithDecimals > token.balanceOf(address(this))) revert TokenSoldOut();
        
        if (!token.transfer(msg.sender, amountWithDecimals)) revert TransferFailed();
        
        (bool success, ) = payable(owner).call{value: msg.value}("");
        if (!success) revert TransferFailed();
        
        totalSoldTokens += amountWithDecimals;
        emit TokensPurchased(msg.sender, amountWithDecimals, totalCost, "ETH");
    }

    function buyTokenWithUSDT(uint256 _buyAmount) external nonReentrant presaleIsActive usdtIsEnabled {
        if (_buyAmount == 0) revert ZeroAmount();
        if (tokenAddress == address(0)) revert ZeroAddress();
        if (usdtAddress == address(0)) revert ZeroAddress();
        
        uint256 totalCost = _buyAmount * usdtPrice;
        
        IERC20 token = IERC20(tokenAddress);
        IERC20 usdt = IERC20(usdtAddress);
        uint256 amountWithDecimals = _buyAmount * (10 ** uint256(tokenDecimals));
        
        if (amountWithDecimals > token.balanceOf(address(this))) revert TokenSoldOut();
        
        if (usdt.balanceOf(msg.sender) < totalCost) revert InsufficientUSDT();
        if (usdt.allowance(msg.sender, address(this)) < totalCost) revert InsufficientUSDT();
        
        if (!usdt.transferFrom(msg.sender, owner, totalCost)) revert TransferFailed();
        
        if (!token.transfer(msg.sender, amountWithDecimals)) revert TransferFailed();
        
        totalSoldTokens += amountWithDecimals;
        emit TokensPurchased(msg.sender, amountWithDecimals, totalCost, "USDT");
    }

    function getTokenInfo() external view returns (
        string memory name,
        string memory symbol,
        uint256 balance,
        uint256 totalSupply,
        uint256 ethPrice,
        uint256 usdtPriceValue,
        address tokenAdd,
        address usdtAdd,
        bool active,
        bool usdtActive
    ) {
        if (tokenAddress == address(0)) {
            return ("", "", 0, 0, tokenPrice, usdtPrice, address(0), usdtAddress, presaleActive, usdtEnabled);
        }
        
        IERC20 token = IERC20(tokenAddress);
        return (
            token.name(),
            token.symbol(),
            token.balanceOf(address(this)),
            token.totalSupply(),
            tokenPrice,
            usdtPrice,
            tokenAddress,
            usdtAddress,
            presaleActive,
            usdtEnabled
        );
    }

    function withdrawAllTokens() external onlyOwner nonReentrant {
        if (tokenAddress == address(0)) revert ZeroAddress();
        
        IERC20 token = IERC20(tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        if (balance == 0) revert ZeroAmount();
        
        if (!token.transfer(owner, balance)) revert TransferFailed();
        emit TokensWithdrawn(balance);
    }

    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance == 0) revert ZeroAmount();
        
        (bool success, ) = payable(owner).call{value: balance}("");
        if (!success) revert TransferFailed();
    }

    function withdrawUSDT() external onlyOwner {
        if (usdtAddress == address(0)) revert ZeroAddress();
        
        IERC20 usdt = IERC20(usdtAddress);
        uint256 balance = usdt.balanceOf(address(this));
        if (balance == 0) revert ZeroAmount();
        
        if (!usdt.transfer(owner, balance)) revert TransferFailed();
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    receive() external payable {
        (bool success, ) = payable(owner).call{value: msg.value}("");
        if (!success) revert TransferFailed();
        emit EthReceived(msg.sender, msg.value);
    }

    function getRemainingTokens() external view returns (uint256) {
        if (tokenAddress == address(0)) return 0;
        return IERC20(tokenAddress).balanceOf(address(this));
    }

    function calculateEthCost(uint256 _tokenAmount) external view returns (uint256) {
        return _tokenAmount * tokenPrice;
    }

    function calculateUsdtCost(uint256 _tokenAmount) external view returns (uint256) {
        return _tokenAmount * usdtPrice;
    }
}