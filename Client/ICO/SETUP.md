# MOTRA ICO Project - Complete Deployment Guide

This guide will walk you through deploying the MOTRA ICO project from scratch, including smart contract deployment and frontend setup.


## Step 1: Smart Contract Deployment

### 1.1 Deploy MOTRA Token Contract

1. **Open Remix IDE**
   - Go to [remix.ethereum.org](https://remix.ethereum.org)
   - Create a new file called `MotraToken.sol`

2. **Copy Token Contract Code**
    - Create new file `MotraToken.sol` in Remix
    - Copy the complete token contract code (from the provided MotraToken.sol) and paste it to your file.


3. **Compile Contract**
   - Go to Solidity Compiler tab
   - Select compiler version 0.8.19
   - Click "Compile MotraToken.sol"

4. **Deploy to Base Network**
   - Go to Deploy & Run Transactions tab
   - Select "Injected Provider - MetaMask"
   - Make sure MetaMask is connected to Base network
   - Click "Deploy"
   - Confirm transaction in MetaMask
   - **Save the deployed contract address**

### 1.2 Deploy Presale Contract

1. **Create Presale Contract File**
   - Create new file `MotraPresale.sol` in Remix
   - Copy the complete presale contract code (from the provided MotraPresale.sol)

2. **Compile and Deploy**
   - Compile the contract
   - Deploy to Base network
   - **Save the deployed contract address**

### 1.3 Configure Presale Contract

After deploying the presale contract, you need to configure it:

1. **Set Token Address**
   - Use the `updateToken()` function
   - Enter your deployed MOTRA token address

   Before we go to next steps dont get confused by USDT instead of USDC, its same thing

2. **Set USDC Address**
   - Use the `updateUSDTAddress()` function
   - Enter Base USDC address: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

3. **Set Token Prices**
   - Use the `updateTokenPrices()` function
   - Leave ETH price option (we dont need that its old feature) and USDT price (with 6 decimals) (tim asked for 0.01 usdc per token)
   - Example: to set 0.01 USDC orice per token you need to enter 10000 in usdt price (1 USDC price = 1000000 so on...)

4. **Activate Presale**
   - Use the `togglePresale()` function to turn presale on and off
   - Use the `toggleUSDT()` function to enable USDC payments

5. **Transfer Tokens to Presale**
   - From your wallet, transfer MOTRA tokens to the presale contract address
   - This is the supply that will be sold during the ICO

## 🖥️ Step 2: Frontend Setup

### 2.1 Clone and Install Dependencies (NOTE: BAsh means in terminal/cmd)

```bash
# Navigate to the project directory
cd Client/ICO

# Install dependencies
npm install
```

### 2.2 Configure Thirdweb

1. **Get Thirdweb Client ID**
   - Go to [thirdweb.com](https://thirdweb.com)
   - Sign up/Login to your account
   - Go to Settings → API Keys
   - Create a new API key 
   - Copy your Client ID

2. **Update Configuration**
   - Open `src/config/thirdweb.js`
   - Replace the `clientId` with your actual Client ID
   - Update the `contractAddress` with your deployed presale contract address

### 2.3 Update Contract Addresses

1. **Update ICOPurchase.jsx**
   - Open `src/components/ICOPurchase.jsx`
   - Update `MOTRA_TOKEN_ADDRESS` with your deployed token address
   - Update `USDC_ADDRESS` (should be `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` for Base)

### 2.4 Add MOTRA Logo

1. **Add Logo File**
   - Place your MOTRA logo as `vite.png` in the `public/` folder
   - This will be used in the "Add to Wallet" button

## 🚀 Step 3: Run the Application

### 3.1 Start Development Server

```bash
# Start the development server
npm run dev
```

### 3.2 Access the Application

- Open your browser and go to `http://localhost:5173`
- Connect your MetaMask wallet
- Ensure you're on Base network (Chain ID: 8453)

## 🔧 Step 4: Testing the Setup

### 4.1 Test USDC Payment
1. Ensure you have USDC on Base network
2. Enter token amount in the input field
3. Click "Purchase with USDC"
4. Approve USDC spending if prompted
5. Confirm the transaction

### 4.2 Test Fiat Payment
1. Switch to "Card & Stablecoin" tab
2. Enter token amount
3. Use the Buy Widget to purchase USDC with fiat
4. The system should automatically complete the MOTRA purchase

### 4.3 Test Add to Wallet
1. Click "Add Motra to Wallet" button
2. Confirm in MetaMask
3. Check that MOTRA token appears in your wallet

##  Step 5: Production Deployment

### 5.1 Build for Production

```bash
# Build the application
npm run build
```

## 🔍 Troubleshooting

### Common Issues:

1. **"Wrong Network" Error**
   - Ensure MetaMask is connected to Base network
   - Add Base network if not present:
     - Chain ID: 8453
     - RPC URL: https://mainnet.base.org
     - Explorer: https://basescan.org

2. **"Insufficient USDC Balance"**
   - Check if you have enough USDC on Base network
   - Ensure USDC approval is sufficient

3. **Contract Not Found**
   - Verify contract addresses are correct
   - Ensure contracts are deployed on Base network

4. **Thirdweb Connection Issues**
   - Check your Client ID is correct
   - Ensure you have sufficient API credits

### Support:
- Check the browser console for detailed error messages
. Verify all contract addresses match your deployed contracts
- Ensure all dependencies are installed correctly

## 📋 Checklist

- [ ] MOTRA Token contract deployed
- [ ] Presale contract deployed
- [ ] Contract addresses configured
- [ ] Token prices set
- [ ] Presale activated
- [ ] USDT payments enabled
- [ ] Tokens transferred to presale contract
- [ ] Thirdweb Client ID configured
- [ ] Frontend dependencies installed
- [ ] Application running locally
- [ ] USDC payment tested
- [ ] Fiat payment tested
- [ ] Add to wallet tested
- [ ] Production build created
- [ ] Application deployed to hosting

##  Success!

---

**Note:** Keep your private keys and contract addresses secure. Consider using environment variables for sensitive data in production.
