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
import { FC, useCallback, useState } from "react";
import { notify } from "../utils/notifications";
import idl from "../idls/voting_program.json";
import { Program, Idl, AnchorProvider, setProvider } from "@coral-xyz/anchor";

export const SendAddChoicesTransaction: FC<{
  voteId: PublicKey;
  afterTxEvent: any;
  choiceLength: number;
}> = ({ voteId, afterTxEvent, choiceLength }) => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const programId = new PublicKey(
    "EZfVvEW85B8Rqk3Jmu8ou2JDrb626ynze7bP1un1Nh37"
  );
  const [choicesToAdd, setChoicesToAdd] = useState<string[]>(
    new Array(choiceLength).fill("")
  );
  const onClick = async () => {
    if (!anchorWallet) {
      notify({ type: "error", message: `Wallet not connected!` });
      console.log("error", `Send Transaction: Wallet not connected!`);
      return;
    }

    try {
      const provider = new AnchorProvider(connection, anchorWallet, {});
      setProvider(provider);
      const electionPDA = voteId;
      const program = new Program(idl as Idl, programId);
      const choicesPDA = PublicKey.findProgramAddressSync(
        [Buffer.from("choices"), electionPDA.toBuffer()],
        program.programId
      )[0];
      console.log(choicesToAdd);
      const transaction = await program.methods
        .addChoices(choicesToAdd)
        .accounts({
          signer: anchorWallet.publicKey,
          choices: choicesPDA,
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
    <div className="flex flex-col justify-center">
      <div className="flex flex-col justify-center align-center">
        {choicesToAdd.map((choice, index) => (
          <div key={index} className="m-1">
            <label className="text-white">Choice {index + 1}:</label>
            <input
              className="text-black ml-2"
              type="text"
              defaultValue={choice}
              onChange={(e) => {
                const choiceT = e.target.value;
                const choicesT = [...choicesToAdd];
                choicesT[index] = choiceT;
                setChoicesToAdd([...choicesT]);
              }}
            />
          </div>
        ))}
      </div>
      <div className="relative group items-center">
        <button
          className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
          onClick={onClick}
          disabled={!anchorWallet}
        >
          <div className="hidden group-disabled:block ">
            Wallet not connected
          </div>
          <span className="block group-disabled:hidden">Add choices</span>
        </button>
      </div>
    </div>
  );
};
