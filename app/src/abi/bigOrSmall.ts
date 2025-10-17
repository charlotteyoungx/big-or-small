import type { InterfaceAbi } from 'ethers';

export const bigOrSmallAbi: InterfaceAbi = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "roundId", type: "bytes32" },
      { indexed: true, internalType: "address", name: "player", type: "address" },
    ],
    name: "GameStarted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "roundId", type: "bytes32" },
      { indexed: true, internalType: "address", name: "player", type: "address" },
      { indexed: false, internalType: "uint8", name: "choice", type: "uint8" },
      { indexed: false, internalType: "uint256", name: "stake", type: "uint256" },
    ],
    name: "BetPlaced",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "roundId", type: "bytes32" },
      { indexed: false, internalType: "uint8", name: "dice", type: "uint8" },
      { indexed: false, internalType: "bool", name: "win", type: "bool" },
      { indexed: false, internalType: "uint256", name: "payout", type: "uint256" },
    ],
    name: "Revealed",
    type: "event",
  },
  {
    inputs: [],
    name: "MAX_BET",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MIN_BET",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "roundId", type: "bytes32" }],
    name: "getRoundInfo",
    outputs: [
      { internalType: "address", name: "player", type: "address" },
      { internalType: "uint256", name: "stake", type: "uint256" },
      { internalType: "uint8", name: "choice", type: "uint8" },
      { internalType: "bool", name: "settled", type: "bool" },
      { internalType: "uint8", name: "result", type: "uint8" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    name: "rounds",
    outputs: [
      { internalType: "address", name: "player", type: "address" },
      { internalType: "uint256", name: "stake", type: "uint256" },
      { internalType: "uint8", name: "choice", type: "uint8" },
      { internalType: "bytes", name: "encDice", type: "bytes" },
      { internalType: "bool", name: "settled", type: "bool" },
      { internalType: "uint8", name: "result", type: "uint8" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "roundId", type: "bytes32" },
      { internalType: "bytes", name: "encDiceExt", type: "bytes" },
      { internalType: "bytes", name: "proof", type: "bytes" },
    ],
    name: "startGame",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "roundId", type: "bytes32" },
      { internalType: "uint8", name: "choice", type: "uint8" },
    ],
    name: "placeBet",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "roundId", type: "bytes32" }],
    name: "reveal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
