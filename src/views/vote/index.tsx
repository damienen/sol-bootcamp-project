import { FC, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Idl, Program } from "@coral-xyz/anchor";
import idl from "../../idls/voting_program.json";
import { SendAddChoicesTransaction } from "components/SendAddChoicesTransaction";
import { notify } from "utils/notifications";
import { SendChangeStateTransaction } from "components/SendChangeStateTransaction";
import { SendVoteTransaction } from "components/SendVoteTransaction";

export const VoteView: FC = ({}) => {
  const searchParams = useSearchParams();
  const voteId = searchParams.get("voteId");
  const [electionPDA, setElectionPDA] = useState<PublicKey | null>(null);
  const [electionAccount, setElectionAccount] = useState<any>(null);
  const [choicesPDA, setChoicesPDA] = useState<PublicKey | null>(null);
  const [choicesAccount, setChoicesAccount] = useState<any>(null);
  const [didVote, setDidVote] = useState(-1);
  const [sendTxRefreshTrigger, setSendTxRefreshTrigger] = useState(false);
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const programId = new PublicKey(
    "EZfVvEW85B8Rqk3Jmu8ou2JDrb626ynze7bP1un1Nh37"
  );
  const program = new Program(idl as Idl, programId, { connection });

  useEffect(() => {
    async function fetchData() {
      if (voteId) {
        const electionPDAT = new PublicKey(voteId);
        setElectionPDA(electionPDAT);
        const choicesPDA = PublicKey.findProgramAddressSync(
          [Buffer.from("choices"), electionPDAT.toBuffer()],
          program.programId
        )[0];
        setChoicesPDA(choicesPDA);
        try {
          const choicesAccountT = await program.account.choices.fetch(
            choicesPDA
          );
          setChoicesAccount(choicesAccountT);
          console.log(choicesAccount);
        } catch (e) {
          console.log(e);
        }
        const electionAccountT = await program.account.election.fetch(
          electionPDAT
        );
        setElectionAccount(electionAccountT);
        console.log(electionAccountT);
        try {
          const didVotePDA = PublicKey.findProgramAddressSync(
            [
              Buffer.from("voter"),
              anchorWallet?.publicKey.toBuffer(),
              electionPDAT.toBuffer(),
            ],
            program.programId
          )[0];
          const didVoteAccount = await program.account.voter.fetch(didVotePDA);
          setDidVote((didVoteAccount.choiceId as any).toNumber());
        } catch (e) {
          console.log(e);
        }
      }
    }
    fetchData();
  }, [voteId, connection, sendTxRefreshTrigger]);

  function getTextState(electionAccount: any) {
    if (electionAccount.state == 0) {
      return "Not started";
    } else if (electionAccount.state == 1) {
      return "Voting";
    } else if (electionAccount.state == 2) {
      return "Finished";
    }
  }

  return (
    <div className="md:hero mx-auto p-4">
      <div className="md:hero-content flex flex-col">
        <div>Unique vote ID: {voteId}</div>
        <h1 className="text-center text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mt-10 mb-8">
          {anchorWallet &&
          electionAccount &&
          anchorWallet?.publicKey.equals(electionAccount?.creator) ? (
            <div>
              <div>You are the creator of this vote</div>
              {!choicesAccount && (
                <div className="text-xl mt-5">
                  <div>There are no choices defined</div>
                  <SendAddChoicesTransaction
                    voteId={electionPDA}
                    afterTxEvent={() =>
                      setSendTxRefreshTrigger((oldState) => !oldState)
                    }
                    choiceLength={electionAccount.choicesLen}
                  />
                </div>
              )}
            </div>
          ) : (
            <></>
          )}
        </h1>
        {electionAccount && choicesAccount && (
          <div className="text-center text-3xl">
            Vote state: {getTextState(electionAccount)}
            {anchorWallet?.publicKey.equals(electionAccount?.creator) && (
              <SendChangeStateTransaction
                voteId={electionPDA}
                stateToGive={electionAccount.state + 1}
                afterTxEvent={() =>
                  setSendTxRefreshTrigger((oldState) => !oldState)
                }
              />
            )}
          </div>
        )}
        <div className="text-center">
          {choicesAccount ? (
            <div className="text-2xl mt-10">
              The voting options are:
              {choicesAccount.choices.map((choice) => (
                <div
                  className="flex flex-row align-center justify-center text-3xl"
                  key={choice.id}
                >
                  <div className="text-center m-auto">
                    {choice.name}: {choice.votes.toNumber()}
                  </div>
                  {didVote === -1 && (
                    <SendVoteTransaction
                      afterTxEvent={() =>
                        setSendTxRefreshTrigger((oldState) => !oldState)
                      }
                      voteId={electionPDA}
                      voteOptionId={choice.id}
                    />
                  )}
                  {didVote === (choice.id as any).toNumber() && (
                    <div className=" ml-8 text-center m-auto">
                      {"<-- You voted for this"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <></>
          )}
        </div>
      </div>
    </div>
  );
};
