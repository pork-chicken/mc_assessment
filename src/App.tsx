// importfunctionalities
import React from 'react';
import logo from './logo.svg';
import './App.css';
import {
  PublicKey,
  Transaction,
  Keypair
} from "@solana/web3.js";
import {useEffect , useState } from "react";
import {getWalletBalance, airDropSol, transferSol} from "./util.js";
import {Buffer} from "buffer";
window.Buffer = Buffer;

// create types
type DisplayEncoding = "utf8" | "hex";

type PhantomEvent = "disconnect" | "connect" | "accountChanged";
type PhantomRequestMethod =
  | "connect"
  | "disconnect"
  | "signTransaction"
  | "signAllTransactions"
  | "signMessage";

interface ConnectOpts {
  onlyIfTrusted: boolean;
}

// create a provider interface (hint: think of this as an object) to store the Phantom Provider
interface PhantomProvider {
  publicKey: PublicKey | null;
  isConnected: boolean | null;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  signMessage: (
    message: Uint8Array | string,
    display?: DisplayEncoding
  ) => Promise<any>;
  connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  on: (event: PhantomEvent, handler: (args: any) => void) => void;
  request: (method: PhantomRequestMethod, params: any) => Promise<unknown>;
}

/**
 * @description gets Phantom provider, if it exists
 */
 const getProvider = (): PhantomProvider | undefined => {
  if ("solana" in window) {
    // @ts-ignore
    const provider = window.solana as any;
    if (provider.isPhantom) return provider as PhantomProvider;
  }
};

function App() {
  // create state variable for the provider
  const [provider, setProvider] = useState<PhantomProvider | undefined>(
    undefined
  );

	// create state variable for the wallet key
  const [wallet, setWallet] = useState<Keypair | undefined>(
    undefined
  );

  const [senderWallet, setSenderWallet] = useState<Keypair | undefined>(
    undefined
  );

  const [message, setMessage] = useState<String | undefined>(
    undefined
  );

  // this is the function that runs whenever the component updates (e.g. render, refresh)
  useEffect(() => {
	  const provider = getProvider();

		// if the phantom provider exists, set this as the provider
	  if (provider) setProvider(provider);
	  else setProvider(undefined);
  }, []);

  /**
   * @description prompts user to connect wallet if it exists.
	 * This function is called when the connect wallet button is clicked
   */
  const connectWallet = async () => {
    // @ts-ignore
    const { solana } = window;

		// checks if phantom wallet exists
    if (solana) {
      try {
				// connects wallet and returns response which includes the wallet public key
        const response = await solana.connect();
        console.log('wallet account ', response.publicKey.toString());
				// update walletKey to be the public key
        const amount = await getWalletBalance(response);
        console.log('amount ', amount);
        setWallet(response);
        setMessage(`Connected to ${response.publicKey.toString()}, amount: ${amount}`);
      } catch (err) {
      // { code: 4001, message: 'User rejected the request.' }
      }
    }
  };
  
  const disconnectWallet = async () => {
    // @ts-ignore
    const { solana } = window;
    if (solana) {
      try {
        const response = await solana.disconnect();
        setWallet(undefined);
        setMessage("Wallet disconnected");
      } catch (err) {
      // { code: 4001, message: 'User rejected the request.' }
      }
    }
  };

  const setupSender = async () => {
    const sender = Keypair.generate();
    await airDropSol(sender, 2);
    const amount = await getWalletBalance(sender);
    console.log('amount ', amount);
    setSenderWallet(sender);
    setMessage(`Set up ${sender.publicKey.toString()}, amount: ${amount}`);
  }

  const transferSolToWallet = async () => {
    const gas = 0.005;
    const prevAmount = await getWalletBalance(wallet);
    await transferSol(senderWallet, wallet, 2 - gas);
    const amount = await getWalletBalance(wallet);
    setMessage(`Sol amount: ${prevAmount} => ${amount}`);
  }

  // HTML code for the app
  return (
    <div className="App">
      <header className="App-header">
        <h2>Connect to Phantom Wallet</h2>
      </header>
      {message && (
        <>
          <p>{message}</p>
          <hr/>
        </>
      )}
      {!senderWallet && (
        <button
          style={{
            fontSize: "16px",
            padding: "15px",
            fontWeight: "bold",
            borderRadius: "5px",
          }}
          onClick={setupSender}
        >
          Create a new Solana account
        </button>
      )}
      {senderWallet && (
        <p>Sender: {senderWallet.publicKey.toString()}</p>
      )}
      {provider && senderWallet && !wallet && (
        <button
          style={{
            fontSize: "16px",
            padding: "15px",
            fontWeight: "bold",
            borderRadius: "5px",
          }}
          onClick={connectWallet}
        >
          Connect Wallet
        </button>
      )}
      {provider && senderWallet && wallet && (
        <>
          <p>Connected: {wallet.publicKey.toString()}</p>
          <button
            style={{
              fontSize: "16px",
              padding: "15px",
              fontWeight: "bold",
              borderRadius: "5px",
            }}
            onClick={transferSolToWallet}
          >
            Transfer to new wallet
          </button>
          <button
            style={{
              fontSize: "16px",
              padding: "15px",
              borderRadius: "5px",
            }}
            onClick={disconnectWallet}
          >
            Disonnect
          </button>
        </>
      )}
      {!provider && (
        <p>
          No provider found. Install{" "}
          <a href="https://phantom.app/">Phantom Browser extension</a>
        </p>
      )}
    </div>
  );
}

export default App;

