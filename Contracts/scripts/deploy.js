const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Starting MOTRA ICO Deployment...\n");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

    // ===== STEP 1: Deploy MOTRA Token =====
    console.log("📋 Step 1: Deploying MOTRA Token...");
    const MotraToken = await ethers.getContractFactory("MotraToken");
    const motraToken = await MotraToken.deploy(deployer.address);
    await motraToken.waitForDeployment();
    
    const tokenAddress = await motraToken.getAddress();
    console.log("✅ MOTRA Token deployed to:", tokenAddress);
    
    // Verify token properties
    const tokenName = await motraToken.name();
    const tokenSymbol = await motraToken.symbol();
    const tokenDecimals = await motraToken.decimals();
    const totalSupply = await motraToken.totalSupply();
    
    console.log("   📊 Token Details:");
    console.log("   - Name:", tokenName);
    console.log("   - Symbol:", tokenSymbol);
    console.log("   - Decimals:", tokenDecimals);
    console.log("   - Total Supply:", ethers.formatUnits(totalSupply, tokenDecimals), "MOTRA");
    console.log("   - Raw Supply:", totalSupply.toString(), "base units\n");

    // ===== STEP 2: Deploy ICO Contract =====
    console.log("📋 Step 2: Deploying ICO Contract...");
    const MotraPresale = await ethers.getContractFactory("MotraPresale");
    const presaleContract = await MotraPresale.deploy();
    await presaleContract.waitForDeployment();
    
    const presaleAddress = await presaleContract.getAddress();
    console.log("✅ ICO Contract deployed to:", presaleAddress);
    
    // ===== STEP 3: Configure ICO Contract =====
    console.log("\n📋 Step 3: Configuring ICO Contract...");
    
    // Set token address
    console.log("   🔧 Setting token address...");
    await presaleContract.updateToken(tokenAddress);
    console.log("   ✅ Token address set");
    
    // Calculate prices for $0.01 per token
    // With 2 decimals: 1 MOTRA = 100 base units
    // For $0.01 per MOTRA token:
    
    // ETH Price (assuming ETH = $3000): $0.01 / $3000 = 0.00000333 ETH per token
    const ethPrice = ethers.parseEther("0.00000333"); // Adjust based on current ETH price
    
    // USDT Price: $0.01 = 10000 (with 6 decimals)
    const usdtPrice = 10000; // 0.01 USDT with 6 decimals
    
    console.log("   🔧 Setting token prices...");
    console.log("   - ETH Price per token:", ethers.formatEther(ethPrice), "ETH");
    console.log("   - USDT Price per token: 0.01 USDT");
    await presaleContract.updateTokenPrices(ethPrice, usdtPrice);
    console.log("   ✅ Prices set");
    
    // ===== STEP 4: Transfer Presale Tokens =====
    console.log("\n📋 Step 4: Transferring presale tokens...");
    
    // Transfer 100,000,000 tokens (10% of supply) to ICO contract
    const presaleAmount = ethers.parseUnits("100000000", tokenDecimals); // 100M tokens
    console.log("   🔄 Transferring", ethers.formatUnits(presaleAmount, tokenDecimals), "MOTRA to ICO contract...");
    
    await motraToken.transfer(presaleAddress, presaleAmount);
    console.log("   ✅ Presale tokens transferred");
    
    // Verify transfer
    const contractBalance = await motraToken.balanceOf(presaleAddress);
    console.log("   📊 ICO Contract Balance:", ethers.formatUnits(contractBalance, tokenDecimals), "MOTRA");
    
    // ===== STEP 5: Activate Presale =====
    console.log("\n📋 Step 5: Activating presale...");
    await presaleContract.togglePresale();
    console.log("   ✅ Presale activated");
    
    // ===== DEPLOYMENT SUMMARY =====
    console.log("\n🎉 DEPLOYMENT COMPLETE!");
    console.log("=====================================");
    console.log("📋 Contract Addresses:");
    console.log("   MOTRA Token:", tokenAddress);
    console.log("   ICO Contract:", presaleAddress);
    console.log("\n📊 Configuration:");
    console.log("   Token Name: MOTRA Token");
    console.log("   Token Symbol: MOTRA");
    console.log("   Decimals: 2");
    console.log("   Total Supply: 1,000,000,000.00 MOTRA");
    console.log("   Presale Amount: 100,000,000.00 MOTRA");
    console.log("   Price per Token: $0.01 USD");
    console.log("   ETH Price:", ethers.formatEther(ethPrice), "ETH per token");
    console.log("   USDT Price: 0.01 USDT per token");
    console.log("\n⚠️  NEXT STEPS:");
    console.log("1. Set USDT address: presaleContract.updateUSDTAddress(USDT_ADDRESS)");
    console.log("2. Enable USDT payments: presaleContract.toggleUSDT()");
    console.log("3. Update frontend .env with contract address:", presaleAddress);
    console.log("4. Verify contracts on block explorer");
    console.log("=====================================\n");
    
    // Save addresses to file
    const deploymentInfo = {
        network: network.name,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {
            MotraToken: {
                address: tokenAddress,
                name: tokenName,
                symbol: tokenSymbol,
                decimals: tokenDecimals,
                totalSupply: totalSupply.toString()
            },
            MotraPresale: {
                address: presaleAddress,
                ethPrice: ethPrice.toString(),
                usdtPrice: usdtPrice,
                presaleAmount: presaleAmount.toString()
            }
        }
    };
    
    const fs = require('fs');
    fs.writeFileSync(
        `deployment-${network.name}-${Date.now()}.json`, 
        JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("📄 Deployment info saved to deployment file");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
