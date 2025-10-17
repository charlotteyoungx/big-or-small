import { useCallback, useEffect, useMemo, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Contract, formatEther, parseEther } from 'ethers';
import { sepolia } from 'viem/chains';
import type { Hex } from 'viem';
import { useAccount, usePublicClient } from 'wagmi';

import { Header } from './Header';
import { bigOrSmallAbi } from '../abi/bigOrSmall';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { useZamaInstance } from '../hooks/useZamaInstance';
import '../styles/GameApp.css';

const CONTRACT_ADDRESS = "0xbBe2C97d6bE10743b827898B4a119f6E94A4354a";

type RoundSummary = {
  player: Hex;
  stake: bigint;
  choice: number;
  settled: boolean;
  result: number;
};

type RoundStatus = 'idle' | 'starting' | 'betting' | 'revealing';

function createRoundId(): Hex {
  const bytes = new Uint8Array(32);
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj) {
    throw new Error('Secure random generator unavailable');
  }
  cryptoObj.getRandomValues(bytes);
  return (`0x${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`) as Hex;
}

function isBytes32(value: string): value is Hex {
  return /^0x[0-9a-fA-F]{64}$/.test(value);
}

export function GameApp() {
  const { address, isConnected } = useAccount();
  const signer = useEthersSigner({ chainId: sepolia.id });
  const publicClient = usePublicClient({ chainId: sepolia.id });
  const { instance: zama, isLoading: isZamaLoading, error: zamaError } = useZamaInstance();

  const [roundId, setRoundId] = useState<string>('');
  const [betEth, setBetEth] = useState<string>('0.001');
  const [choice, setChoice] = useState<1 | 2>(1);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [roundInfo, setRoundInfo] = useState<RoundSummary | null>(null);
  const [action, setAction] = useState<RoundStatus>('idle');
  const [minBet, setMinBet] = useState<bigint | null>(null);
  const [maxBet, setMaxBet] = useState<bigint | null>(null);

  const hasContract = Boolean(CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000');

  const contract = useMemo(() => {
    if (!hasContract || !signer) {
      return null;
    }
    return new Contract(CONTRACT_ADDRESS as string, bigOrSmallAbi, signer);
  }, [signer, hasContract]);

  const currentRoundId = useMemo(() => {
    if (roundId && isBytes32(roundId)) {
      return roundId as Hex;
    }
    return '';
  }, [roundId]);

  const loadRoundInfo = useCallback(async (id?: Hex) => {
    if (!publicClient || !hasContract) {
      return;
    }
    const targetId = id ?? (currentRoundId as Hex | undefined);
    if (!targetId || !isBytes32(targetId)) {
      return;
    }
    try {
      const response = await publicClient.readContract({
        address: CONTRACT_ADDRESS as Hex,
        abi: bigOrSmallAbi,
        functionName: 'getRoundInfo',
        args: [targetId],
      });
      const [player, stake, fetchedChoice, settled, result] = response as [Hex, bigint, bigint, boolean, bigint];
      setRoundInfo({
        player,
        stake,
        choice: Number(fetchedChoice),
        settled,
        result: Number(result),
      });
    } catch (error) {
      console.error('Failed to read round info', error);
    }
  }, [publicClient, hasContract, currentRoundId]);

  useEffect(() => {
    if (!publicClient || !hasContract) {
      return;
    }
    publicClient.readContract({ address: CONTRACT_ADDRESS as Hex, abi: bigOrSmallAbi, functionName: 'MIN_BET' })
      .then((value) => setMinBet(value as bigint))
      .catch((error) => console.error('Failed to read MIN_BET', error));
    publicClient.readContract({ address: CONTRACT_ADDRESS as Hex, abi: bigOrSmallAbi, functionName: 'MAX_BET' })
      .then((value) => setMaxBet(value as bigint))
      .catch((error) => console.error('Failed to read MAX_BET', error));
  }, [publicClient, hasContract]);

  useEffect(() => {
    if (!publicClient || !hasContract) {
      return;
    }
    const unwatch = publicClient.watchContractEvent({
      address: CONTRACT_ADDRESS as Hex,
      abi: bigOrSmallAbi,
      eventName: 'Revealed',
      onLogs: (logs) => {
        logs.forEach((log) => {
          const { args } = log;
          if (!args) {
            return;
          }
          const logRoundId = args.roundId as Hex;
          if (currentRoundId && logRoundId.toLowerCase() === currentRoundId.toLowerCase()) {
            const dice = Number(args.dice);
            const win = Boolean(args.win);
            const payout = args.payout ? formatEther(args.payout as bigint) : undefined;
            setStatusMessage(`Round ${logRoundId} revealed: dice ${dice} ${win ? 'win' : 'lose'}${payout ? ` | payout ${payout} ETH` : ''}`);
            loadRoundInfo(logRoundId);
          }
        });
      },
    });
    return () => {
      unwatch?.();
    };
  }, [publicClient, hasContract, currentRoundId, loadRoundInfo]);

  useEffect(() => {
    if (currentRoundId) {
      loadRoundInfo(currentRoundId);
    } else {
      setRoundInfo(null);
    }
  }, [currentRoundId, loadRoundInfo]);

  const ensureSigner = useCallback(() => {
    if (!isConnected || !address) {
      setStatusMessage('Connect wallet to play.');
      throw new Error('wallet not connected');
    }
    if (!contract) {
      setStatusMessage('Contract or signer unavailable.');
      throw new Error('missing contract');
    }
    return contract;
  }, [contract, isConnected, address]);

  const startGame = useCallback(async () => {
    if (!hasContract) {
      setStatusMessage('Missing VITE_BOS_ADDRESS');
      return;
    }
    if (isZamaLoading) {
      setStatusMessage('Preparing encryption...');
      return;
    }
    if (!zama) {
      setStatusMessage(zamaError ?? 'Encryption unavailable');
      return;
    }
    try {
      setAction('starting');
      setStatusMessage('Encrypting dice...');
      const targetId = createRoundId();
      setRoundId(targetId);
      const dice = Math.floor(Math.random() * 6) + 1;
      const userAddress = address as Hex;
      const buffer = zama.createEncryptedInput(CONTRACT_ADDRESS, userAddress);
      buffer.add8(BigInt(dice));
      const encrypted = await buffer.encrypt();
      const gameContract = ensureSigner();
      const tx = await gameContract.startGame(targetId, encrypted.handles[0], encrypted.inputProof);
      await tx.wait();
      setStatusMessage('Game started. Place your bet!');
      loadRoundInfo(targetId);
    } catch (error) {
      console.error('Failed to start game', error);
      setStatusMessage((error as Error).message || 'Failed to start game');
    } finally {
      setAction('idle');
    }
  }, [hasContract, isZamaLoading, zama, zamaError, ensureSigner, address, loadRoundInfo]);

  const placeBet = useCallback(async () => {
    if (!hasContract) {
      setStatusMessage('Missing VITE_BOS_ADDRESS');
      return;
    }
    if (!currentRoundId) {
      setStatusMessage('Start a game first.');
      return;
    }
    try {
      const gameContract = ensureSigner();
      const value = parseEther(betEth);
      if (minBet && value < minBet) {
        setStatusMessage(`Bet must be at least ${formatEther(minBet)} ETH.`);
        return;
      }
      if (maxBet && value > maxBet) {
        setStatusMessage(`Bet must be at most ${formatEther(maxBet)} ETH.`);
        return;
      }
      setAction('betting');
      setStatusMessage('Submitting bet...');
      const tx = await gameContract.placeBet(currentRoundId, choice, { value });
      await tx.wait();
      setStatusMessage('Bet placed. Reveal when ready.');
      loadRoundInfo(currentRoundId);
    } catch (error) {
      console.error('Failed to place bet', error);
      setStatusMessage((error as Error).message || 'Failed to place bet');
    } finally {
      setAction('idle');
    }
  }, [hasContract, currentRoundId, ensureSigner, betEth, choice, minBet, maxBet, loadRoundInfo]);

  const revealRound = useCallback(async () => {
    if (!hasContract) {
      setStatusMessage('Missing VITE_BOS_ADDRESS');
      return;
    }
    if (!currentRoundId) {
      setStatusMessage('Start a game first.');
      return;
    }
    try {
      const gameContract = ensureSigner();
      setAction('revealing');
      setStatusMessage('Revealing round...');
      const tx = await gameContract.reveal(currentRoundId);
      await tx.wait();
      setStatusMessage('Reveal transaction sent. Awaiting event...');
      loadRoundInfo(currentRoundId);
    } catch (error) {
      console.error('Failed to reveal round', error);
      setStatusMessage((error as Error).message || 'Failed to reveal round');
    } finally {
      setAction('idle');
    }
  }, [hasContract, currentRoundId, ensureSigner, loadRoundInfo]);

  const disableActions = action !== 'idle';
  const roundSummary = roundInfo
    ? `Player: ${roundInfo.player} | Stake: ${formatEther(roundInfo.stake)} ETH | Choice: ${roundInfo.choice} | ` +
      `Settled: ${roundInfo.settled ? 'Yes' : 'No'}${roundInfo.settled ? ` | Result: ${roundInfo.result}` : ''}`
    : 'Round info unavailable';

  return (
    <div className="game-app">
      <Header />
      <main className="main-content">
        <div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
            <ConnectButton />
            <div>Contract: {hasContract ? CONTRACT_ADDRESS : 'Set VITE_BOS_ADDRESS'}</div>
          </div>

          <div style={{ background: 'white', padding: 16, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontWeight: 600 }}>Round Id:</div>
            <div style={{ wordBreak: 'break-all', color: '#374151' }}>
              {currentRoundId || 'Generated when you start a game'}
            </div>
            <button onClick={startGame} disabled={disableActions || !hasContract}>
              {action === 'starting' ? 'Starting...' : 'Start Game'}
            </button>
            {zamaError ? <div style={{ marginTop: 8, color: '#b91c1c' }}>{zamaError}</div> : null}
          </div>

          <div style={{ height: 12 }} />

          <div style={{ background: 'white', padding: 16, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ marginBottom: 8 }}>
              <label>Bet (ETH {minBet ? formatEther(minBet) : '0.001'} - {maxBet ? formatEther(maxBet) : '0.01'}): </label>
              <input value={betEth} onChange={(event) => setBetEth(event.target.value)} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>Choice: </label>
              <select value={choice} onChange={(event) => setChoice(parseInt(event.target.value, 10) as 1 | 2)}>
                <option value={1}>Small (1-3)</option>
                <option value={2}>Big (4-6)</option>
              </select>
            </div>
            <button onClick={placeBet} disabled={disableActions || !hasContract}>
              {action === 'betting' ? 'Betting...' : 'Place Bet'}
            </button>
          </div>

          <div style={{ height: 12 }} />

          <div style={{ background: 'white', padding: 16, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>Reveal:</div>
            <button onClick={revealRound} disabled={disableActions || !hasContract}>
              {action === 'revealing' ? 'Revealing...' : 'Reveal Round'}
            </button>
          </div>

          <div style={{ marginTop: 16, color: '#111827', background: 'white', padding: 16, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ marginBottom: 8, fontWeight: 600 }}>Round Summary</div>
            <div>{roundSummary}</div>
          </div>

          <div style={{ marginTop: 16, color: '#1f2937' }}>{statusMessage}</div>
        </div>
      </main>
    </div>
  );
}
