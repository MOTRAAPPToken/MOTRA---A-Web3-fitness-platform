// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.27;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title MOTRA Token
 * @dev Fixed supply ERC20 token with 2 decimals 
 * Total Supply: 1,000,000,000 MOTRA 
 * Decimals: 2 asked by tim
 */
contract MotraToken is ERC20, ERC20Permit {
    
    constructor(address recipient) ERC20("MOTRA Token", "MOTRA") ERC20Permit("MOTRA Token") {
        // Mint 1 billion tokens with 2 decimals = 100,000,000,000 base units
        _mint(recipient, 1000000000 * 10 ** decimals());
    }

    /**
     * @dev Returns 2 decimals for MOTRA token
     * This means 100 base units = 1.00 MOTRA
     */
    function decimals() public pure override returns (uint8) {
        return 2;
    }
}


//0xD7e9dcfF5a9998ec5AaAaEfEe94A50F2Cf11CB33 Base