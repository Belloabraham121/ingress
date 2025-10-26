// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title RewardVault
 * @notice Individual vault with real-time APY rewards that accrue every second
 * @dev This contract is deployed by VaultFactory
 *
 * KEY FEATURES:
 * - Real-time reward calculation (updates every second)
 * - APY-based rewards (compound interest)
 * - User deposit/withdrawal management
 * - Owner controls for APY and limits
 * - Pausable for emergencies
 *
 * APY CALCULATION:
 * - APY = Annual Percentage Yield (compound interest)
 * - Rewards compound continuously based on time elapsed
 * - Formula approximates: Principal × (1 + rate)^time - Principal
 * - More accurate than simple APR for long-term deposits
 */
contract RewardVault is ERC20, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ Immutable State ============

    /// @notice The underlying asset token users deposit
    IERC20 public immutable asset;

    /// @notice Factory contract that deployed this vault
    address public immutable factory;

    /// @notice Vault owner (the creator who deployed via factory)
    address public immutable owner;

    // ============ Mutable State ============

    /// @notice Annual Percentage Yield in basis points (1200 = 12.00%)
    uint256 public apy;

    /// @notice Total rewards pool deposited by owner
    uint256 public rewardsPool;

    /// @notice Total rewards claimed by all users
    uint256 public totalRewardsClaimed;

    /// @notice Minimum deposit amount
    uint256 public minDeposit;

    /// @notice Maximum deposit per user (0 = unlimited)
    uint256 public maxDepositPerUser;

    /// @notice Total assets deposited by users (excluding rewards pool)
    uint256 public totalUserDeposits;

    /// @notice Basis points denominator (100% = 10000)
    uint256 public constant BASIS_POINTS = 10000;

    /// @notice Seconds in a year for APR calculation
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    // ============ Structs ============

    /// @notice User deposit information
    struct UserInfo {
        uint256 depositAmount; // Total amount deposited
        uint256 depositTime; // Timestamp of first deposit
        uint256 lastClaimTime; // Last time rewards were claimed
        uint256 totalClaimed; // Total rewards claimed
        uint256 shares; // Vault shares owned
    }

    /// @notice Mapping of user address to their deposit info
    mapping(address => UserInfo) public userInfo;

    /// @notice Array of all depositors
    address[] public depositors;

    // ============ Events ============

    event Deposited(
        address indexed user,
        uint256 amount,
        uint256 shares,
        uint256 timestamp
    );
    event Withdrawn(
        address indexed user,
        uint256 amount,
        uint256 shares,
        uint256 timestamp
    );
    event RewardsClaimed(
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );
    event RewardsPoolIncreased(
        uint256 amount,
        uint256 newTotal,
        uint256 timestamp
    );
    event APYUpdated(uint256 oldAPY, uint256 newAPY, uint256 timestamp);
    event LimitsUpdated(
        uint256 minDeposit,
        uint256 maxDepositPerUser,
        uint256 timestamp
    );

    // ============ Modifiers ============

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ============ Constructor ============

    /**
     * @notice Initialize the reward vault
     * @dev Called by VaultFactory during deployment
     * @param _asset Address of the ERC20 token to accept
     * @param _name Name of the vault share token
     * @param _symbol Symbol of the vault share token
     * @param _apy Annual percentage yield in basis points
     * @param _owner Address of the vault owner
     * @param _minDeposit Minimum deposit amount
     * @param _maxDepositPerUser Maximum deposit per user (0 = unlimited)
     */
    constructor(
        address _asset,
        string memory _name,
        string memory _symbol,
        uint256 _apy,
        address _owner,
        uint256 _minDeposit,
        uint256 _maxDepositPerUser
    ) ERC20(_name, _symbol) {
        require(_asset != address(0), "Invalid asset");
        require(_owner != address(0), "Invalid owner");
        require(_apy > 0 && _apy <= 10000, "APY must be 0-100%");

        asset = IERC20(_asset);
        factory = msg.sender; // Factory is the deployer
        owner = _owner;
        apy = _apy;
        minDeposit = _minDeposit;
        maxDepositPerUser = _maxDepositPerUser;
    }

    // ============ Owner Functions ============

    /**
     * @notice Owner deposits additional rewards into the pool
     * @param amount Amount of tokens to add to rewards pool
     */
    function depositRewardsPool(
        uint256 amount
    ) external onlyOwner nonReentrant {
        require(amount > 0, "Zero amount");

        asset.safeTransferFrom(msg.sender, address(this), amount);
        rewardsPool += amount;

        emit RewardsPoolIncreased(amount, rewardsPool, block.timestamp);
    }

    /**
     * @notice Update the APY for future rewards
     * @param newAPY New APY in basis points (1200 = 12%)
     */
    function updateAPY(uint256 newAPY) external onlyOwner {
        require(newAPY > 0 && newAPY <= 10000, "APY must be 0-100%");

        uint256 oldAPY = apy;
        apy = newAPY;

        emit APYUpdated(oldAPY, newAPY, block.timestamp);
    }

    /**
     * @notice Update deposit limits
     * @param _minDeposit New minimum deposit
     * @param _maxDepositPerUser New max deposit per user
     */
    function updateLimits(
        uint256 _minDeposit,
        uint256 _maxDepositPerUser
    ) external onlyOwner {
        minDeposit = _minDeposit;
        maxDepositPerUser = _maxDepositPerUser;

        emit LimitsUpdated(_minDeposit, _maxDepositPerUser, block.timestamp);
    }

    /**
     * @notice Pause all vault operations (emergency only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause vault operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ User Functions ============

    /**
     * @notice Deposit assets into vault and start earning rewards
     * @param amount Amount of tokens to deposit
     */
    function deposit(uint256 amount) external nonReentrant whenNotPaused {
        require(amount >= minDeposit, "Below minimum deposit");
        require(amount > 0, "Zero amount");

        UserInfo storage user = userInfo[msg.sender];

        // Check maximum deposit limit
        if (maxDepositPerUser > 0) {
            require(
                user.depositAmount + amount <= maxDepositPerUser,
                "Exceeds max deposit"
            );
        }

        // Initialize user if first deposit
        if (user.depositAmount == 0) {
            depositors.push(msg.sender);
            user.depositTime = block.timestamp;
            user.lastClaimTime = block.timestamp;
        } else {
            // Claim existing rewards before adding more deposit
            _claimRewards(msg.sender);
        }

        // Transfer tokens from user
        asset.safeTransferFrom(msg.sender, address(this), amount);

        // Mint shares (1:1 ratio for simplicity)
        uint256 shares = amount;

        // Update user state
        user.depositAmount += amount;
        user.shares += shares;
        totalUserDeposits += amount;

        // Mint vault shares to user
        _mint(msg.sender, shares);

        emit Deposited(msg.sender, amount, shares, block.timestamp);
    }

    /**
     * @notice Withdraw deposited assets from vault
     * @param amount Amount of tokens to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant {
        UserInfo storage user = userInfo[msg.sender];
        require(amount > 0, "Zero amount");
        require(user.depositAmount >= amount, "Insufficient balance");

        // Claim all pending rewards first
        _claimRewards(msg.sender);

        // Calculate proportional shares to burn
        uint256 sharesToBurn = (user.shares * amount) / user.depositAmount;

        // Update user state
        user.depositAmount -= amount;
        user.shares -= sharesToBurn;
        totalUserDeposits -= amount;

        // Burn vault shares
        _burn(msg.sender, sharesToBurn);

        // Transfer assets back to user
        asset.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount, sharesToBurn, block.timestamp);
    }

    /**
     * @notice Claim all accumulated rewards
     */
    function claimRewards() external nonReentrant {
        _claimRewards(msg.sender);
    }

    /**
     * @notice Internal function to process reward claims
     * @param userAddress Address of user claiming rewards
     */
    function _claimRewards(address userAddress) internal {
        UserInfo storage user = userInfo[userAddress];
        require(user.depositAmount > 0, "No deposit");

        uint256 pending = calculatePendingRewards(userAddress);

        if (pending > 0) {
            require(rewardsPool >= pending, "Insufficient rewards pool");

            // Update claim tracking
            user.lastClaimTime = block.timestamp;
            user.totalClaimed += pending;
            totalRewardsClaimed += pending;
            rewardsPool -= pending;

            // Transfer rewards to user
            asset.safeTransfer(userAddress, pending);

            emit RewardsClaimed(userAddress, pending, block.timestamp);
        }
    }

    // ============ View Functions - Real-Time Rewards ============

    /**
     * @notice Calculate pending rewards for a user (UPDATES EVERY SECOND)
     * @dev Uses compound interest formula: P × ((1 + r)^t - 1)
     *      Where: P = principal, r = rate per second, t = seconds elapsed
     * @param userAddress Address to check rewards for
     * @return Pending reward amount
     */
    function calculatePendingRewards(
        address userAddress
    ) public view returns (uint256) {
        UserInfo memory user = userInfo[userAddress];

        if (user.depositAmount == 0) {
            return 0;
        }

        // Calculate time elapsed since last claim
        uint256 timeElapsed = block.timestamp - user.lastClaimTime;

        // For compound interest: FinalAmount = Principal × (1 + rate)^time
        // Rewards = FinalAmount - Principal

        // Convert APY to rate per second
        // rate = (1 + APY/10000)^(1/SECONDS_PER_YEAR) - 1
        // For small rates, approximate: rate ≈ APY / (10000 × SECONDS_PER_YEAR)

        // Using compound interest approximation for continuous compounding
        // A = P × e^(rt) where r = ln(1 + APY/10000)
        // For practical solidity: A ≈ P × (1 + (APY × t)/(10000 × SECONDS_PER_YEAR) + ((APY × t)^2)/(2 × (10000 × SECONDS_PER_YEAR)^2))

        // Simple compound calculation (good approximation for short periods)
        uint256 rate = (apy * timeElapsed * 1e18) /
            (BASIS_POINTS * SECONDS_PER_YEAR);

        // Calculate: principal × rate / 1e18
        // For better accuracy with compounding effect on short intervals
        uint256 simpleInterest = (user.depositAmount * rate) / 1e18;

        // Add small compound factor for accuracy
        uint256 compoundFactor = (simpleInterest * rate) / (2 * 1e18);

        uint256 rewards = simpleInterest + compoundFactor;

        return rewards;
    }

    /**
     * @notice Get user's total value (deposit + pending rewards)
     * @param userAddress User address
     * @return Total value in asset tokens
     */
    function getUserTotalValue(
        address userAddress
    ) external view returns (uint256) {
        UserInfo memory user = userInfo[userAddress];
        uint256 pending = calculatePendingRewards(userAddress);
        return user.depositAmount + pending;
    }

    /**
     * @notice Get user's total profit earned
     * @param userAddress User address
     * @return Total profit (claimed + pending)
     */
    function getUserProfit(
        address userAddress
    ) external view returns (uint256) {
        UserInfo memory user = userInfo[userAddress];
        uint256 pending = calculatePendingRewards(userAddress);
        return user.totalClaimed + pending;
    }

    /**
     * @notice Get complete user information
     * @param userAddress User address
     * @return depositAmount Total deposited
     * @return shares Vault shares owned
     * @return pendingRewards Current pending rewards
     * @return totalClaimed Total rewards already claimed
     * @return depositTime Time of first deposit
     * @return currentValue Total current value
     */
    function getUserInfo(
        address userAddress
    )
        external
        view
        returns (
            uint256 depositAmount,
            uint256 shares,
            uint256 pendingRewards,
            uint256 totalClaimed,
            uint256 depositTime,
            uint256 currentValue
        )
    {
        UserInfo memory user = userInfo[userAddress];
        uint256 pending = calculatePendingRewards(userAddress);

        return (
            user.depositAmount,
            user.shares,
            pending,
            user.totalClaimed,
            user.depositTime,
            user.depositAmount + pending
        );
    }

    // ============ View Functions - Vault Statistics ============

    /**
     * @notice Get comprehensive vault statistics
     * @return totalDeposits Total user deposits
     * @return currentAPY Current APY rate
     * @return remainingRewards Rewards pool remaining
     * @return totalClaimed Total rewards claimed
     * @return totalDepositors Number of depositors
     * @return vaultBalance Total balance in vault
     */
    function getVaultStats()
        external
        view
        returns (
            uint256 totalDeposits,
            uint256 currentAPY,
            uint256 remainingRewards,
            uint256 totalClaimed,
            uint256 totalDepositors,
            uint256 vaultBalance
        )
    {
        return (
            totalUserDeposits,
            apy,
            rewardsPool,
            totalRewardsClaimed,
            depositors.length,
            asset.balanceOf(address(this))
        );
    }

    /**
     * @notice Calculate estimated daily rewards for a given amount
     * @param amount Deposit amount
     * @return Daily rewards (with compounding)
     */
    function calculateDailyRewards(
        uint256 amount
    ) external view returns (uint256) {
        // Daily compounded: amount × ((1 + apy/10000)^(1/365) - 1)
        // Approximation: amount × apy × 1 day / (BASIS_POINTS × SECONDS_PER_YEAR)
        uint256 rate = (apy * 1 days * 1e18) /
            (BASIS_POINTS * SECONDS_PER_YEAR);
        uint256 simpleInterest = (amount * rate) / 1e18;
        uint256 compoundFactor = (simpleInterest * rate) / (2 * 1e18);
        return simpleInterest + compoundFactor;
    }

    /**
     * @notice Calculate estimated yearly rewards for a given amount
     * @param amount Deposit amount
     * @return Yearly rewards (APY = compounded)
     */
    function calculateYearlyRewards(
        uint256 amount
    ) external view returns (uint256) {
        return (amount * apy) / BASIS_POINTS;
    }

    /**
     * @notice Get all depositor addresses
     * @return Array of depositor addresses
     */
    function getAllDepositors() external view returns (address[] memory) {
        return depositors;
    }

    /**
     * @notice Get vault health metrics
     * @return poolBalance Current rewards pool balance
     * @return projectedDailyClaims Estimated daily reward claims
     * @return daysUntilEmpty Days until rewards pool is empty
     */
    function getVaultHealth()
        external
        view
        returns (
            uint256 poolBalance,
            uint256 projectedDailyClaims,
            uint256 daysUntilEmpty
        )
    {
        poolBalance = rewardsPool;

        // Calculate projected daily claims for all users (with compounding)
        uint256 rate = (apy * 1 days * 1e18) /
            (BASIS_POINTS * SECONDS_PER_YEAR);
        uint256 simpleInterest = (totalUserDeposits * rate) / 1e18;
        uint256 compoundFactor = (simpleInterest * rate) / (2 * 1e18);
        projectedDailyClaims = simpleInterest + compoundFactor;

        // Calculate days until pool is depleted
        if (projectedDailyClaims > 0) {
            daysUntilEmpty = poolBalance / projectedDailyClaims;
        } else {
            daysUntilEmpty = type(uint256).max;
        }

        return (poolBalance, projectedDailyClaims, daysUntilEmpty);
    }

    /**
     * @notice Get basic vault info (for factory queries)
     * @return assetAddress Asset token address
     * @return ownerAddress Vault owner
     * @return factoryAddress Factory that deployed this
     * @return apyValue Current APY
     * @return totalDeposits Total user deposits
     * @return rewardsRemaining Rewards pool remaining
     */
    function getVaultInfo()
        external
        view
        returns (
            address assetAddress,
            address ownerAddress,
            address factoryAddress,
            uint256 apyValue,
            uint256 totalDeposits,
            uint256 rewardsRemaining
        )
    {
        return (
            address(asset),
            owner,
            factory,
            apy,
            totalUserDeposits,
            rewardsPool
        );
    }
}
