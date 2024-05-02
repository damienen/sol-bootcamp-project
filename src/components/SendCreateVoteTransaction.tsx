import {
  useConnection,
  useAnchorWallet,
  useWallet,
} from "@solana/wallet-adapter-react";
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
import { useRouter } from "next/navigation";

export const SendCreateVoteTransaction: FC = () => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const wallet = useWallet();
  const programId = new PublicKey(
    "EZfVvEW85B8Rqk3Jmu8ou2JDrb626ynze7bP1un1Nh37"
  );
  const [choiceLength, setChoiceLength] = useState(4);
  const router = useRouter();

  const onClick = async () => {
    if (!anchorWallet) {
      notify({ type: "error", message: `Wallet not connected!` });
      console.log("error", `Send Transaction: Wallet not connected!`);
      return;
    }

    try {
      const provider = new AnchorProvider(connection, anchorWallet, {});
      setProvider(provider);
      const electionPDA = Keypair.generate();
      const program = new Program(idl as Idl, programId);
      const transaction = await program.methods
        .createElection(choiceLength)
        .accounts({
          signer: anchorWallet.publicKey,
          election: electionPDA.publicKey,
        })
        .signers([electionPDA])
        .rpc();
      router.push(`/vote?voteId=${electionPDA.publicKey.toString()}`);
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
      <div>
        <label>How many choices will the vote have?</label>
        <input
          className="text-black text-center ml-3"
          type="number"
          style={{ width: "3rem" }}
          defaultValue={choiceLength}
          min={1}
          onChange={(e) => {
            setChoiceLength(Number(e.target.value));
          }}
        ></input>
      </div>
      <div className="relative group items-center">
        <button
          className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
          onClick={onClick}
          disabled={!wallet}
        >
          <div className="hidden group-disabled:block ">
            Wallet not connected
          </div>
          <span className="block group-disabled:hidden">Create new vote</span>
        </button>
      </div>
    </div>
  );
};
