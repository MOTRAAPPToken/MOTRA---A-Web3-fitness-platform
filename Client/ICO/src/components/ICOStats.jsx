import { useReadContract } from "thirdweb/react";
import { getContract } from "thirdweb";
import { client, chain, contractAddress, contractABI } from "../config/thirdweb";
import { fromWei, formatTokenAmount } from "../utils/web3";
import "./ICOStats.css";

const contract = getContract({
  client,
  chain,
  address: contractAddress,
  abi: contractABI,
});

export default function ICOStats() {
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

  const calculateProgress = () => {
    if (!tokenInfo || !totalSold) return 0;
    const available = BigInt(tokenInfo[2]);
    const sold = BigInt(totalSold);
    const total = available + sold;
    return total > 0 ? Number((sold * 100n) / total) : 0;
  };

  const progress = calculateProgress();

  return (
    <div className="card ico-stats">
      <h2 className="ico-stats__title">MOTRA Token ICO</h2>
      
      {tokenInfo ? (
        <>
          <div className="ico-stats__progress-container">
            <div className="ico-stats__progress-header">
              <span className="ico-stats__progress-label">ICO Progress</span>
              <span className="ico-stats__progress-percentage">
                {progress.toFixed(1)}%
              </span>
            </div>
            <div className="ico-stats__progress-bar">
              <div 
                className="ico-stats__progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="ico-stats__metrics-grid">
            <div className="ico-stats__metric-card ico-stats__metric-card--blue">
              <p className="ico-stats__metric-label">
                TOKEN PRICE
              </p>
              <p className="ico-stats__metric-value">
                {fromWei(tokenInfo[5], 6)} USDC
              </p>
            </div>

            <div className="ico-stats__metric-card ico-stats__metric-card--gray">
              <p className="ico-stats__metric-label">
                TOKENS SOLD
              </p>
              <p className="ico-stats__metric-value ico-stats__metric-value--gray">
                {totalSold ? formatTokenAmount(totalSold, 2) : "0"}
              </p>
            </div>

            <div className="ico-stats__metric-card ico-stats__metric-card--gray">
              <p className="ico-stats__metric-label">
                AVAILABLE
              </p>
              <p className="ico-stats__metric-value ico-stats__metric-value--gray">
                {formatTokenAmount(tokenInfo[2], 2)}
              </p>
            </div>
          </div>

          <div className="ico-stats__token-info">
            <h4 className="ico-stats__token-name">{tokenInfo[0]} ({tokenInfo[1]})</h4>
            <p className="ico-stats__token-description">
              Join the Web3 fitness revolution with MOTRA tokens
            </p>
          </div>
        </>
      ) : (
        <div className="ico-stats__loading">
          <div className="ico-stats__spinner" />
          <p className="ico-stats__loading-text">Loading ICO information...</p>
        </div>
      )}


    </div>
  );
}
