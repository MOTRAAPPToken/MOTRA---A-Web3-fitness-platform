import { useState, useEffect } from "react";
import { useActiveAccount, useReadContract, useSendTransaction } from "thirdweb/react";
import { getContract, prepareContractCall } from "thirdweb";
import { BuyWidget } from "thirdweb/react";
import { client, chain, contractAddress, contractABI } from "../config/thirdweb";
import { fromWei } from "../utils/web3";
import "./ICOPurchase.css";

const contract = getContract({
  client,
  chain,
  address: contractAddress,
  abi: contractABI,
});

// USDC contract address on Base
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

// USDC ABI for balance and allowance checks
const USDC_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "address", "name": "spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const usdcContract = getContract({
  client,
  chain,
  address: USDC_ADDRESS,
  abi: USDC_ABI,
});

// MOTRA Token contract address and ABI
const MOTRA_TOKEN_ADDRESS = "0xD7e9dcfF5a9998ec5AaAaEfEe94A50F2Cf11CB33";
const MOTRA_TOKEN_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "pure",
    "type": "function"
  }
];

const motraTokenContract = getContract({
  client,
  chain,
  address: MOTRA_TOKEN_ADDRESS,
  abi: MOTRA_TOKEN_ABI,
});

export default function ICOPurchase() {
  const account = useActiveAccount();
  const [tokenAmount, setTokenAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("usdt");
  const [error, setError] = useState(null);
  const [processingFiatPurchase, setProcessingFiatPurchase] = useState(false);
  const [currentChainId, setCurrentChainId] = useState(null);
  const { mutate: sendTransaction } = useSendTransaction();

  const isCorrectChain = currentChainId === chain.id;

  useEffect(() => {
    const getChainId = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          const chainIdInt = parseInt(chainId, 16);
          setCurrentChainId(chainIdInt);
          
          // If not on Base chain, automatically try to switch
          if (chainIdInt !== chain.id) {
            await switchToBaseChain();
          }
        } catch (error) {
          console.error('Error getting chain ID:', error);
        }
      }
    };

    getChainId();

    if (typeof window.ethereum !== 'undefined') {
      const handleChainChanged = async (chainId) => {
        const chainIdInt = parseInt(chainId, 16);
        setCurrentChainId(chainIdInt);
        
        // If user switched to a different chain, automatically switch back to Base
        if (chainIdInt !== chain.id) {
          console.log('User switched to different chain, switching back to Base...');
          await switchToBaseChain();
        }
      };

      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (typeof window.ethereum !== 'undefined') {
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  const switchToBaseChain = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x2105' }], // Base chain ID in hex
        });
              } catch (switchError) {
          if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x2105',
                chainName: 'Base',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18
                },
                rpcUrls: ['https://mainnet.base.org'],
                blockExplorerUrls: ['https://basescan.org']
              }]
            });
          } catch (addError) {
            console.error('Error adding Base chain:', addError);
            setError('Failed to add Base network to your wallet. Please add it manually.');
          }
        } else {
          console.error('Error switching to Base chain:', switchError);
          setError('Failed to switch to Base network. Please switch manually.');
        }
      }
    }
  };

  const { data: tokenInfo } = useReadContract({
    contract,
    method: "getTokenInfo",
    params: [],
  });

  const { data: totalSold } = useReadContract({
    contract,
    method: "totalSoldTokens",
    params: [],
  });

  const { data: usdcBalance } = useReadContract({
    contract: usdcContract,
    method: "balanceOf",
    params: account ? [account.address] : [""],
  });

  const { data: usdcAllowance } = useReadContract({
    contract: usdcContract,
    method: "allowance",
    params: account ? [account.address, contractAddress] : ["", ""],
  });

  const { data: motraTokenBalance } = useReadContract({
    contract: motraTokenContract,
    method: "balanceOf",
    params: account ? [account.address] : [""],
  });

  const requiredUsdcAmount = () => {
    if (!tokenAmount || !tokenInfo || parseFloat(tokenAmount) <= 0) return "0";
    try {
      const readablePrice = parseFloat(fromWei(tokenInfo[5], 6));
      const totalCost = parseFloat(tokenAmount) * readablePrice;
      return totalCost.toFixed(6);
    } catch {
      return "0";
    }
  };

  const needsApproval = () => {
    if (!usdcAllowance || !tokenAmount || !tokenInfo) return true;
    const required = parseFloat(requiredUsdcAmount());
    const allowance = parseFloat(fromWei(usdcAllowance, 6));
    return allowance < required;
  };

  const hasSufficientBalance = () => {
    if (!usdcBalance || !tokenAmount || !tokenInfo) return false;
    const required = parseFloat(requiredUsdcAmount());
    const balance = parseFloat(fromWei(usdcBalance, 6));
    return balance >= required;
  };

  const handleSmartPurchase = async () => {
    if (!account || !tokenAmount || !tokenInfo) return;
    
    setLoading(true);
    try {
      if (needsApproval()) {
        const approveAmount = BigInt("1000000000000"); // 1 million USDC (with 6 decimals)
        
        const approveTransaction = prepareContractCall({
          contract: usdcContract,
          method: "approve",
          params: [contractAddress, approveAmount],
        });

        sendTransaction(approveTransaction, {
          onSuccess: () => {
            setTimeout(() => {
              handlePurchase();
            }, 2000); // Wait 2 seconds for approval to be processed
          },
          onError: (error) => {
            console.error("USDC approval failed:", error);
            setError("USDC approval failed. Please try again.");
            setLoading(false);
          },
        });
      } else {
        handlePurchase();
      }
    } catch (error) {
      console.error("Error preparing transaction:", error);
      setError("Error preparing transaction. Please try again.");
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!account || !tokenAmount || !tokenInfo) return;
    
    try {
      const transaction = prepareContractCall({
        contract,
        method: "buyTokenWithUSDT",
        params: [BigInt(tokenAmount)],
      });

      sendTransaction(transaction, {
        onSuccess: () => {
          setTokenAmount("");
          setError(null);
          setLoading(false);
        },
        onError: (error) => {
          console.error("Purchase failed:", error);
          
          let errorMessage = "Purchase failed. Please try again.";
          
          if (error.message?.includes("InsufficientUSDT")) {
            errorMessage = "Insufficient USDC balance. Please make sure you have enough USDC in your wallet.";
          } else if (error.message?.includes("InsufficientETH")) {
            errorMessage = "Insufficient ETH balance. Please make sure you have enough ETH for gas fees.";
          } else if (error.message?.includes("TokenSoldOut")) {
            errorMessage = "Sorry, the presale has sold out!";
          } else if (error.message?.includes("PresaleNotActive")) {
            errorMessage = "The presale is currently not active. Please try again later.";
          } else if (error.message?.includes("ZeroAmount")) {
            errorMessage = "Please enter a valid token amount.";
          } else if (error.message?.includes("TransferFailed")) {
            errorMessage = "Transaction failed. Please check your USDC approval and try again.";
          }
          
          setError(errorMessage);
          setLoading(false);
        },
      });
    } catch (error) {
      console.error("Error preparing purchase transaction:", error);
      setError("Error preparing purchase transaction. Please try again.");
      setLoading(false);
    }
  };

  const displayUsdcCost = () => {
    if (!tokenAmount || !tokenInfo || parseFloat(tokenAmount) <= 0) return "0";
    try {
      const readablePrice = parseFloat(fromWei(tokenInfo[5], 6));
      const totalCost = parseFloat(tokenAmount) * readablePrice;
      return totalCost.toFixed(2);
    } catch {
      return "0";
    }
  };

  const handleFiatPurchaseSuccess = async () => {
    setProcessingFiatPurchase(true);
    
    setTimeout(async () => {
      try {
        setPaymentMethod("usdt");
        
        setTimeout(async () => {
          try {
            await handleSmartPurchase();
          } catch (error) {
            console.error("Auto MOTRA purchase failed:", error);
            setError("USDC purchased successfully! Please manually complete your MOTRA token purchase.");
          } finally {
            setProcessingFiatPurchase(false);
          }
        }, 3000); // Wait 3 seconds for balance update
        
      } catch (error) {
        console.error("Error in fiat transition:", error);
        setError("USDC purchased successfully! Please switch to USDC Payment to complete your MOTRA token purchase.");
        setProcessingFiatPurchase(false);
      }
    }, 2000); // Wait 2 seconds for USDC purchase to settle
  };

  const addTokenToWallet = async () => {
    if (!account) return;
    
    try {
      if (typeof window.ethereum !== 'undefined' && window.ethereum.request) {
        // First, ensure we're on Base chain before adding the token
        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
        const baseChainId = '0x2105'; // Base chain ID in hex
        
        if (currentChainId !== baseChainId) {
          // Switch to Base chain first
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: baseChainId }],
            });
          } catch (switchError) {
            if (switchError.code === 4902) {
              // Chain doesn't exist, add it
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: baseChainId,
                  chainName: 'Base',
                  nativeCurrency: {
                    name: 'ETH',
                    symbol: 'ETH',
                    decimals: 18
                  },
                  rpcUrls: ['https://mainnet.base.org'],
                  blockExplorerUrls: ['https://basescan.org']
                }]
              });
            } else {
              throw switchError;
            }
          }
        }
        
        // Now add the token to Base chain
        await window.ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: MOTRA_TOKEN_ADDRESS,
              symbol: 'MOTRA',
              decimals: 2,
              image: 'https://raw.githubusercontent.com/your-repo/motra-logo.png'
            }
          }
        });
        
        alert('MOTRA token has been added to your wallet on Base network!');
      } else {
        const tokenInfo = `Token: MOTRA\nAddress: ${MOTRA_TOKEN_ADDRESS}\nDecimals: 2\nNetwork: Base (Chain ID: 8453)`;
        alert(`Please manually add this token to your wallet on Base network:\n\n${tokenInfo}`);
      }
    } catch (error) {
      console.error('Error adding token to wallet:', error);
      const tokenInfo = `Token: MOTRA\nAddress: ${MOTRA_TOKEN_ADDRESS}\nDecimals: 2\nNetwork: Base (Chain ID: 8453)`;
      alert(`Error adding token. Please manually add this token to your wallet on Base network:\n\n${tokenInfo}`);
    }
  };

  if (!account) {
    return (
      <div className="card">
        <h3>Purchase MOTRA Tokens</h3>
        <p className="ico-purchase__connect-message">
          Please connect your wallet to purchase tokens
        </p>
      </div>
    );
  }

  if (!isCorrectChain) {
    return (
      <div className="card">
        <h3>Purchase MOTRA Tokens</h3>
        <div className="ico-purchase__wrong-network">
          <div className="ico-purchase__wrong-network-icon">⚠️</div>
          <h4>Wrong Network</h4>
          <p>Please switch to <strong>Base</strong> network to purchase MOTRA tokens.</p>
                     <p className="ico-purchase__current-network">
             Current Network: <strong>{currentChainId ? `Chain ID: ${currentChainId}` : 'Unknown'}</strong>
           </p>
          <button
            onClick={switchToBaseChain}
            className="ico-purchase__switch-network-button"
          >
            🔄 Switch to Base Network
          </button>
          <p className="ico-purchase__network-help">
            If the switch doesn't work, please manually add Base network to your wallet:
            <br />
            <strong>Chain ID:</strong> 8453 | <strong>RPC URL:</strong> https://mainnet.base.org
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card ico-purchase">
      <h3 className="ico-purchase__title">Purchase MOTRA Tokens</h3>
      
      {tokenInfo && (
        <div className="ico-purchase__token-info">
          <div className="ico-purchase__token-grid">
            <div className="ico-purchase__token-field">
              <p className="ico-purchase__token-label">Token Name</p>
              <p className="ico-purchase__token-value">{tokenInfo[0]}</p>
            </div>
            <div className="ico-purchase__token-field">
              <p className="ico-purchase__token-label">Symbol</p>
              <p className="ico-purchase__token-value">{tokenInfo[1]}</p>
            </div>
            <div className="ico-purchase__token-field">
              <p className="ico-purchase__token-label">Price per Token</p>
              <p className="ico-purchase__token-value">{fromWei(tokenInfo[5], 6)} USDC</p>
            </div>
            <div className="ico-purchase__token-field">
              <p className="ico-purchase__token-label">Available</p>
              <p className="ico-purchase__token-value">{fromWei(tokenInfo[2], 2)} tokens</p>
            </div>
            <div className="ico-purchase__token-field">
              <p className="ico-purchase__token-label">Presale Status</p>
              <p className={`ico-purchase__token-value ${tokenInfo[8] ? 'ico-purchase__token-value--active' : 'ico-purchase__token-value--inactive'}`}>
                {tokenInfo[8] ? "Active" : "Inactive"}
              </p>
            </div>
            <div className="ico-purchase__token-field">
              <p className="ico-purchase__token-label">Your MOTRA Balance</p>
              <p className={`ico-purchase__token-value ${motraTokenBalance && parseFloat(fromWei(motraTokenBalance, 2)) > 0 ? 'ico-purchase__token-value--has-balance' : 'ico-purchase__token-value--no-balance'}`}>
                {motraTokenBalance ? `${fromWei(motraTokenBalance, 2)} MOTRA` : "Loading..."}
              </p>
            </div>
          </div>
                 </div>
       )}

               <div className="ico-purchase__payment-section">
        <label className="ico-purchase__payment-label">
          Payment Method
        </label>
        <div className="ico-purchase__payment-buttons">
          <button
            className={`ico-purchase__payment-button ${paymentMethod === "usdt" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setPaymentMethod("usdt")}
            disabled={!tokenInfo || !tokenInfo[9]}
          >
            💵 USDC Payment
          </button>
          <button
            className={`ico-purchase__payment-button ${paymentMethod === "fiat" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setPaymentMethod("fiat")}
          >
            💳 Card & Stablecoin
          </button>
        </div>
      </div>

      <div className="ico-purchase__amount-section">
        <label className="ico-purchase__amount-label">
          Token Amount
        </label>
        <input
          type="number"
          value={tokenAmount}
          onChange={(e) => setTokenAmount(e.target.value)}
          placeholder="Enter amount of tokens to buy"
          min="1"
        />
      </div>

      {paymentMethod === "usdt" && tokenAmount && parseFloat(tokenAmount) > 0 && (
        <div className="ico-purchase__cost-display">
          <p className="ico-purchase__cost-text">
            Cost: <strong>{displayUsdcCost()} USDC</strong>
          </p>
          <p className="ico-purchase__cost-text">
            Your Balance: <strong className={hasSufficientBalance() ? 'ico-purchase__balance-sufficient' : 'ico-purchase__balance-insufficient'}>
              {usdcBalance ? fromWei(usdcBalance, 6) : "Loading..."} USDC
            </strong>
            {hasSufficientBalance() ? " ✅" : " ❌"}
          </p>
          <p className={`ico-purchase__cost-note ${!hasSufficientBalance() ? 'insufficient' : ''}`}>
            {!hasSufficientBalance() ? "Insufficient USDC balance" : 
             needsApproval() ? "First time purchase requires USDC approval" : "Ready to purchase"}
          </p>
        </div>
      )}

      {paymentMethod === "usdt" && (
        <button
          className="btn-primary ico-purchase__purchase-button"
          onClick={handleSmartPurchase}
          disabled={!tokenAmount || loading || !tokenInfo || !tokenInfo[8] || !tokenInfo[9] || !hasSufficientBalance()}
        >
          {loading ? (needsApproval() ? "Approving..." : "Processing...") : 
           !hasSufficientBalance() ? "Insufficient USDC" :
           needsApproval() ? "Approve & Purchase with USDC" : "Purchase with USDC"}
        </button>
      )}

             <div className="ico-purchase__add-token-bottom">
         <button
           onClick={addTokenToWallet}
           className="ico-purchase__add-token-button-small"
           title="Add MOTRA token to your wallet"
         >
           <img src="/vite.png" alt="MOTRA" className="ico-purchase__motra-logo" />
           Add Motra to Wallet
         </button>
       </div>

          {paymentMethod === "fiat" && tokenAmount && parseFloat(tokenAmount) > 0 && (
          <div className="ico-purchase__fiat-section">
            {processingFiatPurchase ? (
              <div className="ico-purchase__processing-fiat">
                <div className="ico-purchase__processing-spinner">⏳</div>
                <h4>Processing Your Purchase...</h4>
                <p>USDC purchased successfully! Now completing your MOTRA token purchase...</p>
                <div className="ico-purchase__processing-steps">
                  <div className="ico-purchase__processing-step">✅ USDC Purchase Complete</div>
                  <div className="ico-purchase__processing-step">⏳ Switching to USDC Payment</div>
                  <div className="ico-purchase__processing-step">⏳ Purchasing MOTRA Tokens</div>
                </div>
              </div>
            ) : (
              <>
                <div className="ico-purchase__fiat-info">
                  <p className="ico-purchase__fiat-summary">
                    💡 For {tokenAmount} MOTRA tokens, you need approximately <strong>{displayUsdcCost()} USDC</strong> worth of fiat
                  </p>
                  <p className="ico-purchase__fiat-description">
                    Pay with credit cards, bank transfers, or stablecoins
                  </p>
                </div>
                
                <div className="ico-purchase__seamless-purchase">
                  <BuyWidget
                    client={client}
                    title="Buy MOTRA Tokens with Fiat"
                    tokenAddress="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
                    chain={chain}
                    amount={displayUsdcCost()}
                    className="ico-purchase__buy-widget"
                    theme="light"
                    onSuccess={handleFiatPurchaseSuccess}
                  />
                  
                  <p className="ico-purchase__fiat-note">
                    💡 After purchasing USDC, we'll automatically complete your MOTRA token purchase!
                  </p>
                </div>
              </>
            )}
          </div>
        )}

      {totalSold && BigInt(totalSold) > 0n && (
        <div className="ico-purchase__total-sold">
          <p className="ico-purchase__total-sold-text">
            Total Sold: {fromWei(totalSold, 2)} tokens
          </p>
        </div>
      )}

      {error && (
        <div className="ico-purchase__error-overlay">
          <div className="ico-purchase__error-modal">
            <div className="ico-purchase__error-icon">
              <span className="ico-purchase__error-icon-text">⚠️</span>
            </div>
            
            <h3 className="ico-purchase__error-title">
              Purchase Failed
            </h3>
            
            <p className="ico-purchase__error-message">
              {error}
            </p>
            
            <button
              onClick={() => setError(null)}
              className="ico-purchase__error-button"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
