import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  TransactionSignature,
  VersionedTransaction,
} from "@solana/web3.js";
import { FC, useCallback } from "react";
import { notify } from "../utils/notifications";
import idl from "../idls/voting_program.json";
import { Program, Idl, AnchorProvider, setProvider } from "@coral-xyz/anchor";

export const SendChangeStateTransaction: FC<{
  voteId: PublicKey;
  stateToGive: number;
  afterTxEvent: any;
}> = ({ voteId, afterTxEvent, stateToGive }) => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const programId = new PublicKey(
    "EZfVvEW85B8Rqk3Jmu8ou2JDrb626ynze7bP1un1Nh37"
  );

  const onClick = async () => {
    if (!anchorWallet) {
      notify({ type: "error", message: `Wallet not connected!` });
      console.log("error", `Send Transaction: Wallet not connected!`);
      return;
    }

    try {
      let choices = ["Vanilla", "Strawberry", "Chocolate", "Caramel"];
      const provider = new AnchorProvider(connection, anchorWallet, {});
      setProvider(provider);
      const electionPDA = voteId;
      const program = new Program(idl as Idl, programId);
      const choicesPDA = PublicKey.findProgramAddressSync(
        [Buffer.from("choices"), electionPDA.toBuffer()],
        program.programId
      )[0];
      const transaction = await program.methods
        .updateElectionState(stateToGive)
        .accounts({
          signer: anchorWallet.publicKey,
          election: electionPDA,
        })
        .rpc();
      afterTxEvent();
      notify({
        type: "success",
        message: "Transaction successful!",
        txid: transaction,
      });
    } catch (error: any) {
      notify({
        type: "error",
        message: `Transaction failed!`,
        description: error?.message,
        txid: "",
      });
      console.log("error", `Transaction failed! ${error?.message}`, "");
      return;
    }
  };

  return (
    <div className="flex flex-row justify-center">
      <div className="relative group items-center">
        <div
          className="m-1 absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 
                rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"
        ></div>
        <button
          className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
          onClick={onClick}
          disabled={!anchorWallet || stateToGive == 3}
        >
          <div className="hidden group-disabled:block ">
            Wallet not connected
          </div>
          <span className="block group-disabled:hidden">
            {stateToGive == 1 && "Start Vote"}
            {stateToGive == 2 && "End Vote"}
          </span>
        </button>
      </div>
    </div>
  );
};
