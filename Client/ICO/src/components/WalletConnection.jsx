import { ConnectButton } from "thirdweb/react";
import { client, walletConfig, chain } from "../config/thirdweb";
import "./WalletConnection.css";

export default function WalletConnection() {
  return (
    <div className="wallet-connection">
      <ConnectButton
        client={client}
        chain={chain}
        connectModal={{ size: "compact" }}
        theme="light"
        wallets={walletConfig.wallets}
        connectButton={{
          label: "Connect Wallet",
        }}
        detailsButton={{
          className: "details-button",
        }}
      />
    </div>
  );
}
