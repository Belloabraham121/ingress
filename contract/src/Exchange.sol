// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Exchange
 * @dev A contract that allows users to deposit ERC20 tokens and HBAR,
 *      with controlled withdrawal functionality restricted to authorized users
 */
contract Exchange is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // State variables
    mapping(address => mapping(address => uint256)) public userTokenBalances; // user => token => balance
    mapping(address => uint256) public userHbarBalances; // user => HBAR balance
    mapping(address => uint256) public totalTokenDeposits; // token => total deposited
    uint256 public totalHbarDeposits;

    // Access control
    address public authorizedWithdrawer;

    // Events
    event TokenDeposited(
        address indexed user,
        address indexed token,
        uint256 amount
    );
    event HbarDeposited(address indexed user, uint256 amount);
    event TokenWithdrawn(
        address indexed to,
        address indexed token,
        uint256 amount,
        address indexed withdrawer
    );
    event HbarWithdrawn(
        address indexed to,
        uint256 amount,
        address indexed withdrawer
    );
    event AuthorizedWithdrawerUpdated(
        address indexed oldWithdrawer,
        address indexed newWithdrawer
    );

    // Custom errors
    error InvalidAmount();
    error InsufficientBalance();
    error UnauthorizedWithdrawal();
    error TransferFailed();
    error InvalidToken();
    error InvalidAddress();

    /**
     * @dev Constructor sets the contract owner and initial authorized withdrawer
     * @param _authorizedWithdrawer Address that can perform withdrawals
     */
    constructor(address _authorizedWithdrawer) Ownable(msg.sender) {
        if (_authorizedWithdrawer == address(0)) revert InvalidAddress();
        authorizedWithdrawer = _authorizedWithdrawer;
    }

    /**
     * @dev Modifier to restrict access to authorized withdrawer only
     */
    modifier onlyAuthorizedWithdrawer() {
        if (msg.sender != authorizedWithdrawer) revert UnauthorizedWithdrawal();
        _;
    }

    /**
     * @dev Deposit ERC20 tokens into the vault
     * @param token Address of the ERC20 token to deposit
     * @param amount Amount of tokens to deposit
     */
    function depositToken(address token, uint256 amount) external nonReentrant {
        if (token == address(0)) revert InvalidToken();
        if (amount == 0) revert InvalidAmount();

        IERC20 tokenContract = IERC20(token);

        // Transfer tokens from user to contract
        tokenContract.safeTransferFrom(msg.sender, address(this), amount);

        // Update balances
        userTokenBalances[msg.sender][token] += amount;
        totalTokenDeposits[token] += amount;

        emit TokenDeposited(msg.sender, token, amount);
    }

    /**
     * @dev Deposit HBAR into the vault
     */
    function depositHbar() external payable nonReentrant {
        if (msg.value == 0) revert InvalidAmount();

        // Update balances
        userHbarBalances[msg.sender] += msg.value;
        totalHbarDeposits += msg.value;

        emit HbarDeposited(msg.sender, msg.value);
    }

    /**
     * @dev Add token liquidity to the pool (only owner or authorized withdrawer)
     * @param token Address of the ERC20 token to add
     * @param amount Amount of tokens to add as liquidity
     */
    function addTokenLiquidity(
        address token,
        uint256 amount
    ) external nonReentrant {
        if (msg.sender != owner() && msg.sender != authorizedWithdrawer) {
            revert UnauthorizedWithdrawal();
        }
        if (token == address(0)) revert InvalidToken();
        if (amount == 0) revert InvalidAmount();

        IERC20 tokenContract = IERC20(token);

        // Transfer tokens from sender to contract (not tracked per user)
        tokenContract.safeTransferFrom(msg.sender, address(this), amount);

        emit TokenDeposited(address(0), token, amount);
    }

    /**
     * @dev Add HBAR liquidity to the pool (only owner or authorized withdrawer)
     */
    function addHbarLiquidity() external payable nonReentrant {
        if (msg.sender != owner() && msg.sender != authorizedWithdrawer) {
            revert UnauthorizedWithdrawal();
        }
        if (msg.value == 0) revert InvalidAmount();

        emit HbarDeposited(address(0), msg.value);
    }

    /**
     * @dev Withdraw ERC20 tokens to a specific address (only authorized withdrawer)
     * @param token Address of the ERC20 token to withdraw
     * @param to Address to send tokens to
     * @param amount Amount of tokens to withdraw
     */
    function withdrawToken(
        address token,
        address to,
        uint256 amount
    ) external onlyAuthorizedWithdrawer nonReentrant {
        if (token == address(0)) revert InvalidToken();
        if (to == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        IERC20 tokenContract = IERC20(token);
        uint256 contractBalance = tokenContract.balanceOf(address(this));

        if (amount > contractBalance) revert InsufficientBalance();

        // Transfer tokens to specified address
        tokenContract.safeTransfer(to, amount);

        // Update total deposits tracking
        if (amount <= totalTokenDeposits[token]) {
            totalTokenDeposits[token] -= amount;
        } else {
            totalTokenDeposits[token] = 0;
        }

        emit TokenWithdrawn(to, token, amount, msg.sender);
    }

    /**
     * @dev Withdraw HBAR to a specific address (only authorized withdrawer)
     * @param to Address to send HBAR to
     * @param amount Amount of HBAR to withdraw (in wei)
     */
    function withdrawHbar(
        address payable to,
        uint256 amount
    ) external onlyAuthorizedWithdrawer nonReentrant {
        if (to == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (amount > address(this).balance) revert InsufficientBalance();

        // Transfer HBAR to specified address
        (bool success, ) = to.call{value: amount}("");
        if (!success) revert TransferFailed();

        // Update total deposits tracking
        if (amount <= totalHbarDeposits) {
            totalHbarDeposits -= amount;
        } else {
            totalHbarDeposits = 0;
        }

        emit HbarWithdrawn(to, amount, msg.sender);
    }

    /**
     * @notice Transfer tokens directly to a user (can be called by owner or authorized withdrawer)
     * @param token The token address to transfer
     * @param to The recipient address
     * @param amount The amount to transfer
     */
    function transferToUser(
        address token,
        address to,
        uint256 amount
    ) external nonReentrant {
        if (msg.sender != owner() && msg.sender != authorizedWithdrawer) {
            revert UnauthorizedWithdrawal();
        }
        if (token == address(0)) revert InvalidToken();
        if (to == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        IERC20 tokenContract = IERC20(token);
        uint256 contractBalance = tokenContract.balanceOf(address(this));
        if (contractBalance < amount) revert InsufficientBalance();

        bool success = tokenContract.transfer(to, amount);
        if (!success) revert TransferFailed();

        emit TokenWithdrawn(to, token, amount, msg.sender);
    }

    /**
     * @notice Transfer HBAR directly to a user (can be called by owner or authorized withdrawer)
     * @param to The recipient address
     * @param amount The amount to transfer
     */
    function transferHbarToUser(
        address payable to,
        uint256 amount
    ) external nonReentrant {
        if (msg.sender != owner() && msg.sender != authorizedWithdrawer) {
            revert UnauthorizedWithdrawal();
        }
        if (to == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (address(this).balance < amount) revert InsufficientBalance();

        (bool success, ) = to.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit HbarWithdrawn(to, amount, msg.sender);
    }

    /**
     * @notice Update the authorized withdrawer address
     * @param newWithdrawer The new authorized withdrawer address
     */
    function updateAuthorizedWithdrawer(
        address newWithdrawer
    ) external onlyOwner {
        if (newWithdrawer == address(0)) revert InvalidAddress();

        address oldWithdrawer = authorizedWithdrawer;
        authorizedWithdrawer = newWithdrawer;

        emit AuthorizedWithdrawerUpdated(oldWithdrawer, newWithdrawer);
    }

    /**
     * @dev Get user's token balance
     * @param user User address
     * @param token Token address
     * @return User's balance for the specified token
     */
    function getUserTokenBalance(
        address user,
        address token
    ) external view returns (uint256) {
        return userTokenBalances[user][token];
    }

    /**
     * @dev Get user's HBAR balance
     * @param user User address
     * @return User's HBAR balance
     */
    function getUserHbarBalance(address user) external view returns (uint256) {
        return userHbarBalances[user];
    }

    /**
     * @dev Get contract's token balance
     * @param token Token address
     * @return Contract's balance for the specified token
     */
    function getContractTokenBalance(
        address token
    ) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /**
     * @dev Get contract's HBAR balance
     * @return Contract's HBAR balance
     */
    function getContractHbarBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Get total deposits for a specific token
     * @param token Token address
     * @return Total amount deposited for the token
     */
    function getTotalTokenDeposits(
        address token
    ) external view returns (uint256) {
        return totalTokenDeposits[token];
    }

    /**
     * @dev Get total HBAR deposits
     * @return Total HBAR deposited
     */
    function getTotalHbarDeposits() external view returns (uint256) {
        return totalHbarDeposits;
    }

    /**
     * @dev Emergency function to recover stuck tokens (only owner)
     * @param token Token address to recover
     * @param amount Amount to recover
     */
    function emergencyRecoverToken(
        address token,
        uint256 amount
    ) external onlyOwner {
        if (token == address(0)) revert InvalidToken();
        IERC20(token).safeTransfer(owner(), amount);
    }

    /**
     * @dev Emergency function to recover stuck HBAR (only owner)
     * @param amount Amount to recover
     */
    function emergencyRecoverHbar(uint256 amount) external onlyOwner {
        if (amount > address(this).balance) revert InsufficientBalance();
        (bool success, ) = payable(owner()).call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    /**
     * @dev Fallback function to receive HBAR
     */
    receive() external payable {
        userHbarBalances[msg.sender] += msg.value;
        totalHbarDeposits += msg.value;
        emit HbarDeposited(msg.sender, msg.value);
    }
}
