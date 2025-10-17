import { useCallback, useEffect, useMemo, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Contract, formatEther, parseEther } from 'ethers';
import { sepolia } from 'viem/chains';
import type { Hex } from 'viem';
import { useAccount, usePublicClient } from 'wagmi';

import { Header } from './Header';
// ensure ConnectButton is treated as used by TS build
void ConnectButton;
import { bigOrSmallAbi } from '../abi/bigOrSmall';
import { useEthersSigner } from '../hooks/useEthersSigner';
import '../styles/GameApp.css';

const CONTRACT_ADDRESS: string = "0xd9AFC0F7bcC9fbBD3d228198Deda810c339CEcC5";

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

  const [roundId, setRoundId] = useState<string>('');
  const [betEth, setBetEth] = useState<string>('0.001');
  const [choice, setChoice] = useState<1 | 2>(1);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [roundInfo, setRoundInfo] = useState<RoundSummary | null>(null);
  const [action, setAction] = useState<RoundStatus>('idle');
  const [minBet, setMinBet] = useState<bigint | null>(null);
  const [maxBet, setMaxBet] = useState<bigint | null>(null);

  const hasContract = Boolean(CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000');

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
        abi: bigOrSmallAbi as unknown as any,
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
    publicClient.readContract({ address: CONTRACT_ADDRESS as Hex, abi: bigOrSmallAbi as unknown as any, functionName: 'MIN_BET', args: [] })
      .then((value) => setMinBet(value as bigint))
      .catch((error) => console.error('Failed to read MIN_BET', error));
    publicClient.readContract({ address: CONTRACT_ADDRESS as Hex, abi: bigOrSmallAbi as unknown as any, functionName: 'MAX_BET', args: [] })
      .then((value) => setMaxBet(value as bigint))
      .catch((error) => console.error('Failed to read MAX_BET', error));
  }, [publicClient, hasContract]);

  useEffect(() => {
    if (!publicClient || !hasContract) {
      return;
    }
    const unwatch = publicClient.watchContractEvent({
      address: CONTRACT_ADDRESS as Hex,
      abi: bigOrSmallAbi as unknown as any,
      eventName: 'Revealed',
      onLogs: (logs) => {
        (logs as any[]).forEach((log: any) => {
          const args = log?.args;
          if (!args) return;
          const logRoundId = args.roundId as string;
          if (currentRoundId && logRoundId.toLowerCase() === currentRoundId.toLowerCase()) {
            const dice = Number(args.dice);
            const win = Boolean(args.win);
            const payout = args.payout ? formatEther(args.payout as bigint) : undefined;
            setStatusMessage(`Round ${logRoundId} revealed: dice ${dice} ${win ? 'win' : 'lose'}${payout ? ` | payout ${payout} ETH` : ''}`);
            loadRoundInfo(logRoundId as Hex);
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

  const ensureSigner = useCallback(async () => {
    if (!isConnected || !address) {
      setStatusMessage('Connect wallet to play.');
      throw new Error('wallet not connected');
    }
    if (!hasContract || !signer) {
      setStatusMessage('Contract or signer unavailable.');
      throw new Error('missing contract');
    }
    const resolvedSigner = await signer;
    return new Contract(CONTRACT_ADDRESS as string, bigOrSmallAbi, resolvedSigner);
  }, [isConnected, address, signer, hasContract]);

  const startGame = useCallback(async () => {
    if (!hasContract) {
      setStatusMessage('Missing contract address');
      return;
    }
    try {
      setAction('starting');
      setStatusMessage('Rolling dice on-chain...');
      const targetId = createRoundId();
      setRoundId(targetId);
      const gameContract = await ensureSigner();
      const tx = await gameContract.startGame(targetId);
      await tx.wait();
      setStatusMessage('Game started. Place your bet!');
      loadRoundInfo(targetId);
    } catch (error) {
      console.error('Failed to start game', error);
      setStatusMessage((error as Error).message || 'Failed to start game');
    } finally {
      setAction('idle');
    }
  }, [hasContract, ensureSigner, loadRoundInfo]);

  const placeBet = useCallback(async () => {
    if (!hasContract) {
      setStatusMessage('Missing contract address');
      return;
    }
    if (!currentRoundId) {
      setStatusMessage('Start a game first.');
      return;
    }
    try {
      const gameContract = await ensureSigner();
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
      setStatusMessage('Missing contract address');
      return;
    }
    if (!currentRoundId) {
      setStatusMessage('Start a game first.');
      return;
    }
    try {
      const gameContract = await ensureSigner();
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

  return (
    <div className="game-app">
      <Header />
      <main className="main-content">
        <div className="game-container">
          {/* Hero Section */}
          {/* How to Play Card */}
          <div className="game-card how-to-play">
            <div className="card-header">
              <div className="card-icon">📖</div>
              <h2 className="card-title">How to Play</h2>
            </div>
            <ol className="instruction-list">
              <li>Connect your wallet on Sepolia and ensure the bank has ETH</li>
              <li>Press "Start Game" to roll a chain-generated dice and register the round</li>
              <li>Choose stake and bet on Small (1-3) or Big (4-6), then place the bet</li>
              <li>Hit "Reveal Round" to trigger the decryption oracle and settle rewards</li>
            </ol>
            <div className="card-tip">💡 Copy the round ID to check results later</div>
          </div>

          {/* Start Game Card */}
          <div className="game-card start-game-card">
            <div className="card-header">
              <div className="card-icon">🎮</div>
              <h2 className="card-title">Start New Game</h2>
            </div>
            <div className="card-content">
              <div className="round-id-section">
                <label className="input-label">Round ID</label>
                <div className="round-id-display">
                  {currentRoundId ? (
                    <code className="round-id-code">{currentRoundId}</code>
                  ) : (
                    <span className="round-id-placeholder">Generated automatically when you start</span>
                  )}
                </div>
              </div>
              <button
                className={`btn btn-primary ${action === 'starting' ? 'btn-loading' : ''}`}
                onClick={startGame}
                disabled={disableActions || !hasContract}
              >
                {action === 'starting' ? (
                  <>
                    <span className="spinner"></span>
                    Starting...
                  </>
                ) : (
                  <>
                    <span>🎲</span>
                    Start Game
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Place Bet Card */}
          <div className="game-card bet-card">
            <div className="card-header">
              <div className="card-icon">💰</div>
              <h2 className="card-title">Place Your Bet</h2>
            </div>
            <div className="card-content">
              <div className="input-group">
                <label className="input-label">
                  Bet Amount (ETH)
                  <span className="input-hint">
                    Min: {minBet ? formatEther(minBet) : '0.001'} - Max: {maxBet ? formatEther(maxBet) : '0.01'}
                  </span>
                </label>
                <input
                  className="input-field"
                  type="text"
                  value={betEth}
                  onChange={(event) => setBetEth(event.target.value)}
                  placeholder="0.001"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Your Prediction</label>
                <div className="choice-buttons">
                  <button
                    className={`choice-btn ${choice === 1 ? 'choice-btn-active' : ''}`}
                    onClick={() => setChoice(1)}
                    type="button"
                  >
                    <div className="choice-icon">🔽</div>
                    <div className="choice-label">Small</div>
                    <div className="choice-range">1-3</div>
                  </button>
                  <button
                    className={`choice-btn ${choice === 2 ? 'choice-btn-active' : ''}`}
                    onClick={() => setChoice(2)}
                    type="button"
                  >
                    <div className="choice-icon">🔼</div>
                    <div className="choice-label">Big</div>
                    <div className="choice-range">4-6</div>
                  </button>
                </div>
              </div>

              <button
                className={`btn btn-success ${action === 'betting' ? 'btn-loading' : ''}`}
                onClick={placeBet}
                disabled={disableActions || !hasContract}
              >
                {action === 'betting' ? (
                  <>
                    <span className="spinner"></span>
                    Placing Bet...
                  </>
                ) : (
                  <>
                    <span>💸</span>
                    Place Bet
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Reveal Card */}
          <div className="game-card reveal-card">
            <div className="card-header">
              <div className="card-icon">🔓</div>
              <h2 className="card-title">Reveal Result</h2>
            </div>
            <div className="card-content">
              <p className="reveal-description">
                Ready to see the outcome? Click below to decrypt and settle your bet.
              </p>
              <button
                className={`btn btn-reveal ${action === 'revealing' ? 'btn-loading' : ''}`}
                onClick={revealRound}
                disabled={disableActions || !hasContract}
              >
                {action === 'revealing' ? (
                  <>
                    <span className="spinner"></span>
                    Revealing...
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    Reveal Round
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Round Summary Card */}
          <div className="game-card summary-card">
            <div className="card-header">
              <div className="card-icon">📊</div>
              <h2 className="card-title">Round Summary</h2>
            </div>
            <div className="card-content">
              {roundInfo ? (
                <div className="summary-grid">
                  <div className="summary-item">
                    <div className="summary-label">Player</div>
                    <div className="summary-value summary-address">
                      {roundInfo.player.slice(0, 6)}...{roundInfo.player.slice(-4)}
                    </div>
                  </div>
                  <div className="summary-item">
                    <div className="summary-label">Stake</div>
                    <div className="summary-value">{formatEther(roundInfo.stake)} ETH</div>
                  </div>
                  <div className="summary-item">
                    <div className="summary-label">Choice</div>
                    <div className="summary-value">
                      {roundInfo.choice === 1 ? '🔽 Small (1-3)' : roundInfo.choice === 2 ? '🔼 Big (4-6)' : 'None'}
                    </div>
                  </div>
                  <div className="summary-item">
                    <div className="summary-label">Status</div>
                    <div className={`summary-badge ${roundInfo.settled ? 'badge-settled' : 'badge-pending'}`}>
                      {roundInfo.settled ? 'Settled' : 'Pending'}
                    </div>
                  </div>
                  {roundInfo.settled && (
                    <div className="summary-item summary-result">
                      <div className="summary-label">Result</div>
                      <div className="summary-value result-dice">🎲 {roundInfo.result}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="summary-empty">No round data available</div>
              )}
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className="status-message">
              <span className="status-icon">ℹ️</span>
              {statusMessage}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
