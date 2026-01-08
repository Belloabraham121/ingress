// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StakingPools
 * @notice Multi-token staking contract with separate pools for different tokens
 * @dev Owner creates pools with reward deposits, users stake and earn APY rewards
 *
 * HOW IT WORKS:
 * 1. Owner creates pool (e.g., USDT pool at 15% APY)
 * 2. Owner deposits large reward amount into pool
 * 3. Users stake their tokens into pool
 * 4. Users earn rewards based on APY (compound interest)
 * 5. Rewards are distributed from owner's initial deposit
 * 6. Users can claim rewards and withdraw anytime
 *
 * FEATURES:
 * - Multiple pools (USDT, USDC, etc.)
 * - Each pool has independent APY
 * - Real-time reward calculation (updates every second)
 * - Compound interest (APY)
 * - Owner controls pool creation and APY
 * - Emergency pause functionality
 */
contract StakingPools is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ Constants ============

    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    uint256 public constant MAX_APY = 10000; // 100%

    // ============ State Variables ============

    /// @notice Counter for pool IDs
    uint256 public nextPoolId;

    /// @notice Mapping of pool ID to pool data
    mapping(uint256 => Pool) public pools;

    /// @notice Mapping of pool ID => user address => user stake info
    mapping(uint256 => mapping(address => UserStake)) public userStakes;

    /// @notice Mapping of pool ID to array of stakers
    mapping(uint256 => address[]) public poolStakers;

    /// @notice Mapping to check if user has staked in pool
    mapping(uint256 => mapping(address => bool)) public hasStaked;

    /// @notice Array of all pool IDs
    uint256[] public allPoolIds;

    // ============ Structs ============

    /// @notice Pool information
    struct Pool {
        uint256 poolId; // Unique pool identifier
        address token; // Token address (USDT, USDC, etc.)
        string name; // Pool name (e.g., "USDT Staking Pool")
        uint256 apy; // Annual Percentage Yield in basis points
        uint256 totalStaked; // Total tokens staked by users
        uint256 rewardsPool; // Owner's rewards deposit
        uint256 totalRewardsClaimed; // Total rewards claimed
        uint256 minStake; // Minimum stake amount
        uint256 maxStakePerUser; // Max stake per user (0 = unlimited)
        uint256 createdAt; // Pool creation timestamp
        bool active; // Is pool active
    }

    /// @notice User stake information
    struct UserStake {
        uint256 amount; // Amount staked
        uint256 stakeTime; // When user staked
        uint256 lastClaimTime; // Last reward claim time
        uint256 totalClaimed; // Total rewards claimed
    }

    // ============ Events ============

    event PoolCreated(
        uint256 indexed poolId,
        address indexed token,
        string name,
        uint256 apy,
        uint256 rewardsDeposit,
        uint256 timestamp
    );

    event Staked(
        uint256 indexed poolId,
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );

    event Withdrawn(
        uint256 indexed poolId,
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );

    event RewardsClaimed(
        uint256 indexed poolId,
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );

    event RewardsDeposited(
        uint256 indexed poolId,
        uint256 amount,
        uint256 newTotal,
        uint256 timestamp
    );

    event APYUpdated(
        uint256 indexed poolId,
        uint256 oldAPY,
        uint256 newAPY,
        uint256 timestamp
    );

    event PoolDeactivated(uint256 indexed poolId, uint256 timestamp);
    event PoolActivated(uint256 indexed poolId, uint256 timestamp);

    // ============ Constructor ============

    constructor() Ownable(msg.sender) {
        nextPoolId = 1;
    }

    // ============ Owner Functions - Pool Management ============

    /**
     * @notice Create a new staking pool
     * @param token Token address (USDT, USDC, etc.)
     * @param name Pool name
     * @param apy APY in basis points (1500 = 15%)
     * @param initialRewardsDeposit Initial rewards to deposit
     * @param minStake Minimum stake amount
     * @param maxStakePerUser Max stake per user (0 = unlimited)
     * @return poolId The created pool ID
     */
    function createPool(
        address token,
        string memory name,
        uint256 apy,
        uint256 initialRewardsDeposit,
        uint256 minStake,
        uint256 maxStakePerUser
    ) external onlyOwner nonReentrant returns (uint256 poolId) {
        require(token != address(0), "Invalid token");
        require(bytes(name).length > 0, "Empty name");
        require(apy > 0 && apy <= MAX_APY, "Invalid APY");
        require(initialRewardsDeposit > 0, "No rewards deposit");

        poolId = nextPoolId++;

        // Transfer rewards from owner
        IERC20(token).safeTransferFrom(
            msg.sender,
            address(this),
            initialRewardsDeposit
        );

        // Create pool
        pools[poolId] = Pool({
            poolId: poolId,
            token: token,
            name: name,
            apy: apy,
            totalStaked: 0,
            rewardsPool: initialRewardsDeposit,
            totalRewardsClaimed: 0,
            minStake: minStake,
            maxStakePerUser: maxStakePerUser,
            createdAt: block.timestamp,
            active: true
        });

        allPoolIds.push(poolId);

        emit PoolCreated(
            poolId,
            token,
            name,
            apy,
            initialRewardsDeposit,
            block.timestamp
        );

        return poolId;
    }

    /**
     * @notice Deposit additional rewards into a pool
     * @param poolId Pool ID
     * @param amount Amount to deposit
     */
    function depositRewards(
        uint256 poolId,
        uint256 amount
    ) external onlyOwner nonReentrant {
        Pool storage pool = pools[poolId];
        require(pool.poolId != 0, "Pool does not exist");
        require(amount > 0, "Zero amount");

        IERC20(pool.token).safeTransferFrom(msg.sender, address(this), amount);
        pool.rewardsPool += amount;

        emit RewardsDeposited(
            poolId,
            amount,
            pool.rewardsPool,
            block.timestamp
        );
    }

    /**
     * @notice Update pool APY
     * @param poolId Pool ID
     * @param newAPY New APY in basis points
     */
    function updatePoolAPY(uint256 poolId, uint256 newAPY) external onlyOwner {
        Pool storage pool = pools[poolId];
        require(pool.poolId != 0, "Pool does not exist");
        require(newAPY > 0 && newAPY <= MAX_APY, "Invalid APY");

        uint256 oldAPY = pool.apy;
        pool.apy = newAPY;

        emit APYUpdated(poolId, oldAPY, newAPY, block.timestamp);
    }

    /**
     * @notice Update pool stake limits
     * @param poolId Pool ID
     * @param minStake New minimum stake
     * @param maxStakePerUser New max stake per user
     */
    function updatePoolLimits(
        uint256 poolId,
        uint256 minStake,
        uint256 maxStakePerUser
    ) external onlyOwner {
        Pool storage pool = pools[poolId];
        require(pool.poolId != 0, "Pool does not exist");

        pool.minStake = minStake;
        pool.maxStakePerUser = maxStakePerUser;
    }

    /**
     * @notice Deactivate a pool
     * @param poolId Pool ID
     */
    function deactivatePool(uint256 poolId) external onlyOwner {
        Pool storage pool = pools[poolId];
        require(pool.poolId != 0, "Pool does not exist");
        require(pool.active, "Already inactive");

        pool.active = false;
        emit PoolDeactivated(poolId, block.timestamp);
    }

    /**
     * @notice Activate a pool
     * @param poolId Pool ID
     */
    function activatePool(uint256 poolId) external onlyOwner {
        Pool storage pool = pools[poolId];
        require(pool.poolId != 0, "Pool does not exist");
        require(!pool.active, "Already active");

        pool.active = true;
        emit PoolActivated(poolId, block.timestamp);
    }

    /**
     * @notice Pause all staking operations (emergency)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause staking operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ User Functions - Staking ============

    /**
     * @notice Stake tokens into a pool
     * @dev If user already has stake, auto-claims rewards before adding more
     * @param poolId Pool ID
     * @param amount Amount to stake
     */
    function stake(
        uint256 poolId,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        Pool storage pool = pools[poolId];
        require(pool.poolId != 0, "Pool does not exist");
        require(pool.active, "Pool not active");
        require(amount >= pool.minStake, "Below minimum stake");
        require(amount > 0, "Zero amount");

        UserStake storage userStake = userStakes[poolId][msg.sender];

        // Check max stake limit
        if (pool.maxStakePerUser > 0) {
            require(
                userStake.amount + amount <= pool.maxStakePerUser,
                "Exceeds max stake"
            );
        }

        // If user already has stake, AUTO-CLAIM rewards first
        if (userStake.amount > 0) {
            _claimRewards(poolId, msg.sender);
        } else {
            // First time staking - initialize
            userStake.stakeTime = block.timestamp;
            userStake.lastClaimTime = block.timestamp;
            poolStakers[poolId].push(msg.sender);
            hasStaked[poolId][msg.sender] = true;
        }

        // Transfer tokens from user
        IERC20(pool.token).safeTransferFrom(msg.sender, address(this), amount);

        // Update state
        userStake.amount += amount;
        pool.totalStaked += amount;

        emit Staked(poolId, msg.sender, amount, block.timestamp);
    }

    /**
     * @notice Withdraw staked tokens from pool
     * @param poolId Pool ID
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 poolId, uint256 amount) external nonReentrant {
        Pool storage pool = pools[poolId];
        require(pool.poolId != 0, "Pool does not exist");

        UserStake storage userStake = userStakes[poolId][msg.sender];
        require(userStake.amount >= amount, "Insufficient stake");
        require(amount > 0, "Zero amount");

        // Claim rewards first
        _claimRewards(poolId, msg.sender);

        // Update state
        userStake.amount -= amount;
        pool.totalStaked -= amount;

        // Transfer tokens back to user
        IERC20(pool.token).safeTransfer(msg.sender, amount);

        emit Withdrawn(poolId, msg.sender, amount, block.timestamp);
    }

    /**
     * @notice Claim accumulated rewards
     * @param poolId Pool ID
     */
    function claimRewards(uint256 poolId) external nonReentrant {
        _claimRewards(poolId, msg.sender);
    }

    /**
     * @notice Internal function to process reward claims
     * @param poolId Pool ID
     * @param user User address
     */
    function _claimRewards(uint256 poolId, address user) internal {
        Pool storage pool = pools[poolId];
        UserStake storage userStake = userStakes[poolId][user];

        require(userStake.amount > 0, "No stake");

        uint256 pending = calculatePendingRewards(poolId, user);

        if (pending > 0) {
            require(pool.rewardsPool >= pending, "Insufficient rewards pool");

            // Update state
            userStake.lastClaimTime = block.timestamp;
            userStake.totalClaimed += pending;
            pool.totalRewardsClaimed += pending;
            pool.rewardsPool -= pending;

            // Transfer rewards
            IERC20(pool.token).safeTransfer(user, pending);

            emit RewardsClaimed(poolId, user, pending, block.timestamp);
        }
    }

    // ============ View Functions - Rewards Calculation ============

    /**
     * @notice Calculate pending rewards for a user (REAL-TIME, INCREASES EVERY SECOND!)
     * @dev This function returns LIVE rewards that increase every second automatically
     *      No need to call any update function - just call this to see current rewards
     *      Uses compound interest: A = P × (1 + r)^t
     * @param poolId Pool ID
     * @param user User address
     * @return Current pending rewards (increases every second!)
     */
    function calculatePendingRewards(
        uint256 poolId,
        address user
    ) public view returns (uint256) {
        Pool memory pool = pools[poolId];
        UserStake memory userStake = userStakes[poolId][user];

        if (userStake.amount == 0) {
            return 0;
        }

        // Time elapsed since last claim (IN SECONDS)
        // This increases by 1 every second, so rewards increase every second!
        uint256 timeElapsed = block.timestamp - userStake.lastClaimTime;

        // Compound interest calculation
        // Every second that passes, this value increases!
        // rate = (apy × timeElapsed) / (BASIS_POINTS × SECONDS_PER_YEAR)
        uint256 rate = (pool.apy * timeElapsed * 1e18) /
            (BASIS_POINTS * SECONDS_PER_YEAR);

        // Calculate: principal × rate / 1e18
        uint256 simpleInterest = (userStake.amount * rate) / 1e18;

        // Add compound factor for accuracy
        uint256 compoundFactor = (simpleInterest * rate) / (2 * 1e18);

        uint256 rewards = simpleInterest + compoundFactor;

        // THIS VALUE AUTOMATICALLY INCREASES EVERY SECOND!
        return rewards;
    }

    /**
     * @notice Get user's total value in pool (stake + pending rewards)
     * @param poolId Pool ID
     * @param user User address
     * @return Total value
     */
    function getUserTotalValue(
        uint256 poolId,
        address user
    ) external view returns (uint256) {
        UserStake memory userStake = userStakes[poolId][user];
        uint256 pending = calculatePendingRewards(poolId, user);
        return userStake.amount + pending;
    }

    /**
     * @notice Get user's total profit
     * @param poolId Pool ID
     * @param user User address
     * @return Total profit (claimed + pending)
     */
    function getUserProfit(
        uint256 poolId,
        address user
    ) external view returns (uint256) {
        UserStake memory userStake = userStakes[poolId][user];
        uint256 pending = calculatePendingRewards(poolId, user);
        return userStake.totalClaimed + pending;
    }

    // ============ View Functions - Pool Information ============

    /**
     * @notice Get complete pool information
     * @param poolId Pool ID
     * @return id Pool ID
     * @return token Pool token address
     * @return name Pool name
     * @return apy Annual percentage yield
     * @return totalStaked Total staked amount
     * @return rewardsPool Rewards pool balance
     * @return totalRewardsClaimed Total rewards claimed
     * @return minStake Minimum stake amount
     * @return maxStakePerUser Maximum stake per user
     * @return createdAt Creation timestamp
     * @return active Pool active status
     * @return stakerCount Number of stakers
     */
    function getPoolInfo(
        uint256 poolId
    )
        external
        view
        returns (
            uint256 id,
            address token,
            string memory name,
            uint256 apy,
            uint256 totalStaked,
            uint256 rewardsPool,
            uint256 totalRewardsClaimed,
            uint256 minStake,
            uint256 maxStakePerUser,
            uint256 createdAt,
            bool active,
            uint256 stakerCount
        )
    {
        Pool memory pool = pools[poolId];
        require(pool.poolId != 0, "Pool does not exist");

        return (
            pool.poolId,
            pool.token,
            pool.name,
            pool.apy,
            pool.totalStaked,
            pool.rewardsPool,
            pool.totalRewardsClaimed,
            pool.minStake,
            pool.maxStakePerUser,
            pool.createdAt,
            pool.active,
            poolStakers[poolId].length
        );
    }

    /**
     * @notice Get user's stake information in a pool
     * @param poolId Pool ID
     * @param user User address
     * @return stakedAmount Amount staked by user
     * @return pendingRewards Pending rewards to claim
     * @return totalClaimed Total rewards claimed
     * @return stakeTime Timestamp when stake was made
     * @return totalValue Total value including rewards
     */
    function getUserStakeInfo(
        uint256 poolId,
        address user
    )
        external
        view
        returns (
            uint256 stakedAmount,
            uint256 pendingRewards,
            uint256 totalClaimed,
            uint256 stakeTime,
            uint256 totalValue
        )
    {
        UserStake memory userStake = userStakes[poolId][user];
        uint256 pending = calculatePendingRewards(poolId, user);

        return (
            userStake.amount,
            pending,
            userStake.totalClaimed,
            userStake.stakeTime,
            userStake.amount + pending
        );
    }

    /**
     * @notice Get all pool IDs
     * @return Array of pool IDs
     */
    function getAllPoolIds() external view returns (uint256[] memory) {
        return allPoolIds;
    }

    /**
     * @notice Get all active pool IDs
     * @return Array of active pool IDs
     */
    function getActivePoolIds() external view returns (uint256[] memory) {
        uint256 activeCount = 0;

        // Count active pools
        for (uint256 i = 0; i < allPoolIds.length; i++) {
            if (pools[allPoolIds[i]].active) {
                activeCount++;
            }
        }

        // Build array
        uint256[] memory activePools = new uint256[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < allPoolIds.length; i++) {
            if (pools[allPoolIds[i]].active) {
                activePools[index] = allPoolIds[i];
                index++;
            }
        }

        return activePools;
    }

    /**
     * @notice Get pool health metrics
     * @param poolId Pool ID
     * @return rewardsBalance Remaining rewards
     * @return dailyRewards Projected daily rewards payout
     * @return daysRemaining Days until rewards depleted
     */
    function getPoolHealth(
        uint256 poolId
    )
        external
        view
        returns (
            uint256 rewardsBalance,
            uint256 dailyRewards,
            uint256 daysRemaining
        )
    {
        Pool memory pool = pools[poolId];
        require(pool.poolId != 0, "Pool does not exist");

        rewardsBalance = pool.rewardsPool;

        // Calculate daily rewards for all stakers
        if (pool.totalStaked > 0) {
            uint256 rate = (pool.apy * 1 days * 1e18) /
                (BASIS_POINTS * SECONDS_PER_YEAR);
            uint256 simpleInterest = (pool.totalStaked * rate) / 1e18;
            uint256 compoundFactor = (simpleInterest * rate) / (2 * 1e18);
            dailyRewards = simpleInterest + compoundFactor;

            if (dailyRewards > 0) {
                daysRemaining = rewardsBalance / dailyRewards;
            } else {
                daysRemaining = type(uint256).max;
            }
        } else {
            dailyRewards = 0;
            daysRemaining = type(uint256).max;
        }

        return (rewardsBalance, dailyRewards, daysRemaining);
    }

    // ============ NEW FUNCTIONS - DAILY/TOTAL REWARDS & STAKES ============

    /**
     * @notice Get user's daily rewards (what they earn per day)
     * @param poolId Pool ID
     * @param user User address
     * @return Daily rewards amount
     */
    function getUserDailyRewards(
        uint256 poolId,
        address user
    ) external view returns (uint256) {
        Pool memory pool = pools[poolId];
        UserStake memory userStake = userStakes[poolId][user];

        if (userStake.amount == 0) {
            return 0;
        }

        // Calculate what user earns in 1 day
        uint256 rate = (pool.apy * 1 days * 1e18) /
            (BASIS_POINTS * SECONDS_PER_YEAR);
        uint256 simpleInterest = (userStake.amount * rate) / 1e18;
        uint256 compoundFactor = (simpleInterest * rate) / (2 * 1e18);

        return simpleInterest + compoundFactor;
    }

    /**
     * @notice Get user's total rewards (claimed + pending)
     * @param poolId Pool ID
     * @param user User address
     * @return Total rewards earned
     */
    function getUserTotalRewards(
        uint256 poolId,
        address user
    ) external view returns (uint256) {
        UserStake memory userStake = userStakes[poolId][user];
        uint256 pending = calculatePendingRewards(poolId, user);

        // Total = already claimed + currently pending
        return userStake.totalClaimed + pending;
    }

    /**
     * @notice Get user's total staked amount
     * @param poolId Pool ID
     * @param user User address
     * @return Staked amount
     */
    function getUserTotalStaked(
        uint256 poolId,
        address user
    ) external view returns (uint256) {
        return userStakes[poolId][user].amount;
    }

    /**
     * @notice Get complete user summary for a pool
     * @param poolId Pool ID
     * @param user User address
     * @return totalStaked Total amount staked
     * @return dailyRewards Daily rewards earned
     * @return pendingRewards Current pending rewards (INCREASES EVERY SECOND!)
     * @return totalRewards Total rewards (claimed + pending)
     * @return totalClaimed Total already claimed
     */
    function getUserSummary(
        uint256 poolId,
        address user
    )
        external
        view
        returns (
            uint256 totalStaked,
            uint256 dailyRewards,
            uint256 pendingRewards,
            uint256 totalRewards,
            uint256 totalClaimed
        )
    {
        Pool memory pool = pools[poolId];
        UserStake memory userStake = userStakes[poolId][user];

        totalStaked = userStake.amount;
        totalClaimed = userStake.totalClaimed;

        if (totalStaked > 0) {
            // Calculate daily rewards
            uint256 rate = (pool.apy * 1 days * 1e18) /
                (BASIS_POINTS * SECONDS_PER_YEAR);
            uint256 simpleInterest = (totalStaked * rate) / 1e18;
            uint256 compoundFactor = (simpleInterest * rate) / (2 * 1e18);
            dailyRewards = simpleInterest + compoundFactor;

            // Calculate pending (LIVE, INCREASES EVERY SECOND!)
            pendingRewards = calculatePendingRewards(poolId, user);

            // Total rewards
            totalRewards = totalClaimed + pendingRewards;
        } else {
            dailyRewards = 0;
            pendingRewards = 0;
            totalRewards = totalClaimed;
        }

        return (
            totalStaked,
            dailyRewards,
            pendingRewards,
            totalRewards,
            totalClaimed
        );
    }

    /**
     * @notice Get pool summary (total stats for entire pool)
     * @param poolId Pool ID
     * @return totalStaked Total staked in pool
     * @return totalDailyRewards Total daily rewards for all users
     * @return totalRewardsClaimed Total claimed by all users
     * @return rewardsRemaining Rewards pool remaining
     * @return stakerCount Number of stakers
     */
    function getPoolSummary(
        uint256 poolId
    )
        external
        view
        returns (
            uint256 totalStaked,
            uint256 totalDailyRewards,
            uint256 totalRewardsClaimed,
            uint256 rewardsRemaining,
            uint256 stakerCount
        )
    {
        Pool memory pool = pools[poolId];
        require(pool.poolId != 0, "Pool does not exist");

        totalStaked = pool.totalStaked;
        totalRewardsClaimed = pool.totalRewardsClaimed;
        rewardsRemaining = pool.rewardsPool;
        stakerCount = poolStakers[poolId].length;

        // Calculate total daily rewards for entire pool
        if (totalStaked > 0) {
            uint256 rate = (pool.apy * 1 days * 1e18) /
                (BASIS_POINTS * SECONDS_PER_YEAR);
            uint256 simpleInterest = (totalStaked * rate) / 1e18;
            uint256 compoundFactor = (simpleInterest * rate) / (2 * 1e18);
            totalDailyRewards = simpleInterest + compoundFactor;
        } else {
            totalDailyRewards = 0;
        }

        return (
            totalStaked,
            totalDailyRewards,
            totalRewardsClaimed,
            rewardsRemaining,
            stakerCount
        );
    }

    /**
     * @notice Get all stakers in a pool
     * @param poolId Pool ID
     * @return Array of staker addresses
     */
    function getPoolStakers(
        uint256 poolId
    ) external view returns (address[] memory) {
        return poolStakers[poolId];
    }

    /**
     * @notice Calculate estimated daily rewards for an amount
     * @param poolId Pool ID
     * @param amount Stake amount
     * @return Daily rewards
     */
    function calculateDailyRewards(
        uint256 poolId,
        uint256 amount
    ) external view returns (uint256) {
        Pool memory pool = pools[poolId];
        require(pool.poolId != 0, "Pool does not exist");

        uint256 rate = (pool.apy * 1 days * 1e18) /
            (BASIS_POINTS * SECONDS_PER_YEAR);
        uint256 simpleInterest = (amount * rate) / 1e18;
        uint256 compoundFactor = (simpleInterest * rate) / (2 * 1e18);

        return simpleInterest + compoundFactor;
    }

    /**
     * @notice Calculate estimated yearly rewards for an amount
     * @param poolId Pool ID
     * @param amount Stake amount
     * @return Yearly rewards
     */
    function calculateYearlyRewards(
        uint256 poolId,
        uint256 amount
    ) external view returns (uint256) {
        Pool memory pool = pools[poolId];
        require(pool.poolId != 0, "Pool does not exist");

        return (amount * pool.apy) / BASIS_POINTS;
    }

    /**
     * @notice Get total number of pools
     * @return Pool count
     */
    function getTotalPools() external view returns (uint256) {
        return allPoolIds.length;
    }

    /**
     * @notice Check if pool exists
     * @param poolId Pool ID
     * @return True if exists
     */
    function poolExists(uint256 poolId) external view returns (bool) {
        return pools[poolId].poolId != 0;
    }
}
