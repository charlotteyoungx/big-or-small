// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title BigOrSmall - single player high-low dice with FHE commit
/// @notice Player starts game -> contract stores encrypted dice (1-6). Player places bet and choice. On reveal, relayer decrypts and contract settles.
contract BigOrSmall is SepoliaConfig {
    enum Choice { None, Small, Big } // 1..3 small, 4..6 big

    struct Round {
        address player;
        uint256 stake; // in wei
        Choice choice;
        // Encrypted dice value 1..6 provided at start by frontend using FHE public key
        euint8 encDice;
        bool settled;
        uint8 result;
    }

    uint256 public constant MIN_BET = 1e15; // 0.001 ether
    uint256 public constant MAX_BET = 1e16; // 0.01 ether

    mapping(bytes32 => Round) public rounds; // roundId => Round

    event GameStarted(bytes32 indexed roundId, address indexed player);
    event BetPlaced(bytes32 indexed roundId, address indexed player, Choice choice, uint256 stake);
    event Revealed(bytes32 indexed roundId, uint8 dice, bool win, uint256 payout);

    /// @notice Start a round by submitting an encrypted dice value (1..6)
    /// @dev roundId can be any unique value chosen by player (e.g., keccak of user+nonce)
    function startGame(bytes32 roundId, externalEuint8 encDiceExt, bytes calldata proof) external {
        require(rounds[roundId].player == address(0), "round exists");
        euint8 enc = FHE.fromExternal(encDiceExt, proof);
        // store encrypted dice
        rounds[roundId] = Round({
            player: msg.sender,
            stake: 0,
            choice: Choice.None,
            encDice: enc,
            settled: false,
            result: 0
        });
        // allow contract to later reveal
        FHE.allowThis(enc);
        emit GameStarted(roundId, msg.sender);
    }

    /// @notice Place bet and choose 1=Small, 2=Big
    function placeBet(bytes32 roundId, uint8 choice) external payable {
        Round storage r = rounds[roundId];
        require(r.player == msg.sender, "not player");
        require(r.choice == Choice.None, "bet placed");
        require(msg.value >= MIN_BET && msg.value <= MAX_BET, "invalid stake");
        require(choice == uint8(Choice.Small) || choice == uint8(Choice.Big), "bad choice");
        r.stake = msg.value;
        r.choice = Choice(choice);
        emit BetPlaced(roundId, msg.sender, r.choice, r.stake);
    }

    /// @notice Reveal result by decrypting the stored dice value using FHE VM.
    /// @dev The contract decrypts the ciphertext on-chain thanks to the ACL permission granted during start.
    function reveal(bytes32 roundId) external {
        Round storage r = rounds[roundId];
        require(r.player != address(0), "no round");
        require(!r.settled, "settled");
        require(r.choice == Choice.Small || r.choice == Choice.Big, "no bet");
        uint32 decrypted = FHE.decrypt(r.encDice);
        uint8 dice = uint8(decrypted);
        require(dice >= 1 && dice <= 6, "bad dice");

        bool isBig = dice >= 4;
        bool playerChoseBig = (r.choice == Choice.Big);
        bool win = (isBig == playerChoseBig);

        uint256 stake = r.stake;
        r.stake = 0;
        r.settled = true;
        r.result = dice;

        uint256 payout = 0;
        if (win) {
            payout = stake * 2;
            require(address(this).balance >= payout, "insufficient bank");
            (bool ok, ) = r.player.call{value: payout}("");
            require(ok, "pay failed");
        }
        emit Revealed(roundId, dice, win, payout);
    }

    /// @notice Retrieve public information about a round without exposing ciphertext internals.
    function getRoundInfo(bytes32 roundId)
        external
        view
        returns (address player, uint256 stake, Choice choice, bool settled, uint8 result)
    {
        Round storage r = rounds[roundId];
        return (r.player, r.stake, r.choice, r.settled, r.result);
    }

    /// @notice Ownerless bank: anyone can fund the contract to enable payouts
    receive() external payable {}
}
