// Import Solana web3 functinalities
const {
  Connection,
  PublicKey,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} = require("@solana/web3.js");

const getWalletBalance = async (wallet) => {
  try {
    // Connect to the Devnet
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    // Make a wallet (keypair) from privateKey and get its balance
    const walletBalance = await connection.getBalance(
      new PublicKey(wallet.publicKey)
    );
    const balance = parseInt(walletBalance) / LAMPORTS_PER_SOL;
    console.log(
      `[BALANCE] wallet: ${wallet.publicKey.toString()}, balance: ${balance}`
    );
    return balance;
  } catch (err) {
    console.log(err);
    return 0;
  }
};

const airDropSol = async (wallet, amount) => {
  try {
    console.log(
      `[AIRDROP], wallet: ${wallet.publicKey.toString()}, amount: ${amount}`
    );
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const fromAirDropSignature = await connection.requestAirdrop(
      new PublicKey(wallet.publicKey),
      amount * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(fromAirDropSignature);
    console.log("DONE");
  } catch (err) {
    console.log(err);
  }
};

const getTransferFee = async (from, to, amount) => {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  let blockhash = (await connection.getLatestBlockhash("finalized")).blockhash;
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: to.publicKey,
      lamports: amount * LAMPORTS_PER_SOL,
    })
  );
  transaction.feePayer = from.publicKey;
  transaction.recentBlockhash = blockhash;
  const response = await connection.getFeeForMessage(
    transaction.compileMessage(),
    "confirmed"
  );
  const fee = response.value / LAMPORTS_PER_SOL;
  return fee;
};

const transferSol = async (from, to, amount) => {
  console.log(
    `[SEND] from: ${from.publicKey.toString()}, to: ${to.publicKey.toString()}, amount: ${amount}`
  );
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  var transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: to.publicKey,
      lamports: amount * LAMPORTS_PER_SOL,
    })
  );
  var signature = await sendAndConfirmTransaction(connection, transaction, [
    from,
  ]);
  const url = "https://solscan.io/tx/" + signature + "?cluster=devnet";
  console.log("DONE, check the solscan", url);
  return signature;
};

export { getWalletBalance, airDropSol, transferSol, getTransferFee };
