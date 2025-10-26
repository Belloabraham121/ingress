// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/StakingPools.sol";
import "./MockERC20.sol";

contract StakingPoolsTest is Test {
    StakingPools public stakingPools;
    MockERC20 public token1;
    MockERC20 public token2;
    
    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    address public user3 = address(0x4);
    
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 1e18;
    uint256 public constant APY = 1200; // 12%
    uint256 public constant HIGH_APY = 5000; // 50%
    uint256 public constant MIN_STAKE = 100 * 1e18;
    uint256 public constant MAX_STAKE_PER_USER = 10_000 * 1e18;
    uint256 public constant INITIAL_REWARDS = 50_000 * 1e18;
    
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

    function setUp() public {
        // Deploy tokens
        token1 = new MockERC20("Token 1", "TK1", 18, INITIAL_SUPPLY);
        token2 = new MockERC20("Token 2", "TK2", 6, INITIAL_SUPPLY);
        
        // Deploy staking pools
        vm.prank(owner);
        stakingPools = new StakingPools();
        
        // Distribute tokens
        token1.transfer(owner, 200_000 * 1e18);
        token1.transfer(user1, 50_000 * 1e18);
        token1.transfer(user2, 50_000 * 1e18);
        token1.transfer(user3, 50_000 * 1e18);
        
        token2.transfer(owner, 200_000 * 1e6);
        token2.transfer(user1, 50_000 * 1e6);
        token2.transfer(user2, 50_000 * 1e6);
    }

    // ============ Constructor Tests ============

    function testConstructor() public {
        assertEq(stakingPools.owner(), owner);
        assertEq(stakingPools.nextPoolId(), 1);
        assertEq(stakingPools.getTotalPools(), 0);
    }

    // ============ Pool Creation Tests ============

    function testCreatePool() public {
        vm.startPrank(owner);
        token1.approve(address(stakingPools), INITIAL_REWARDS);
        
        vm.expectEmit(true, true, true, true);
        emit PoolCreated(
            1,
            address(token1),
            "USDT Pool",
            APY,
            INITIAL_REWARDS,
            block.timestamp
        );
        
        uint256 poolId = stakingPools.createPool(
            address(token1),
            "USDT Pool",
            APY,
            INITIAL_REWARDS,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        vm.stopPrank();
        
        assertEq(poolId, 1);
        assertEq(stakingPools.nextPoolId(), 2);
        assertEq(stakingPools.getTotalPools(), 1);
        assertTrue(stakingPools.poolExists(poolId));
        
        // Verify pool data
        (
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
        ) = stakingPools.getPoolInfo(poolId);
        
        assertEq(id, poolId);
        assertEq(token, address(token1));
        assertEq(name, "USDT Pool");
        assertEq(apy, APY);
        assertEq(totalStaked, 0);
        assertEq(rewardsPool, INITIAL_REWARDS);
        assertEq(totalRewardsClaimed, 0);
        assertEq(minStake, MIN_STAKE);
        assertEq(maxStakePerUser, MAX_STAKE_PER_USER);
        assertEq(createdAt, block.timestamp);
        assertTrue(active);
        assertEq(stakerCount, 0);
    }

    function testCreatePoolInvalidToken() public {
        vm.startPrank(owner);
        vm.expectRevert("Invalid token");
        stakingPools.createPool(
            address(0),
            "Invalid Pool",
            APY,
            INITIAL_REWARDS,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        vm.stopPrank();
    }

    function testCreatePoolEmptyName() public {
        vm.startPrank(owner);
        token1.approve(address(stakingPools), INITIAL_REWARDS);
        
        vm.expectRevert("Empty name");
        stakingPools.createPool(
            address(token1),
            "",
            APY,
            INITIAL_REWARDS,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        vm.stopPrank();
    }

    function testCreatePoolInvalidAPY() public {
        vm.startPrank(owner);
        token1.approve(address(stakingPools), INITIAL_REWARDS);
        
        vm.expectRevert("Invalid APY");
        stakingPools.createPool(
            address(token1),
            "Invalid APY Pool",
            0,
            INITIAL_REWARDS,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        vm.stopPrank();
        
        vm.startPrank(owner);
        vm.expectRevert("Invalid APY");
        stakingPools.createPool(
            address(token1),
            "High APY Pool",
            10001, // > 100%
            INITIAL_REWARDS,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        vm.stopPrank();
    }

    function testCreatePoolNoRewardsDeposit() public {
        vm.startPrank(owner);
        vm.expectRevert("No rewards deposit");
        stakingPools.createPool(
            address(token1),
            "No Rewards Pool",
            APY,
            0,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        vm.stopPrank();
    }

    function testCreateMultiplePools() public {
        vm.startPrank(owner);
        token1.approve(address(stakingPools), INITIAL_REWARDS * 2);
        token2.approve(address(stakingPools), INITIAL_REWARDS / 1e12);
        
        uint256 pool1 = stakingPools.createPool(
            address(token1),
            "USDT Pool",
            APY,
            INITIAL_REWARDS,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        
        uint256 pool2 = stakingPools.createPool(
            address(token1),
            "USDT High Yield",
            HIGH_APY,
            INITIAL_REWARDS,
            MIN_STAKE / 2,
            0 // No max limit
        );
        
        uint256 pool3 = stakingPools.createPool(
            address(token2),
            "USDC Pool",
            1500, // 15%
            INITIAL_REWARDS / 1e12,
            MIN_STAKE / 1e12,
            MAX_STAKE_PER_USER / 1e12
        );
        vm.stopPrank();
        
        assertEq(pool1, 1);
        assertEq(pool2, 2);
        assertEq(pool3, 3);
        assertEq(stakingPools.getTotalPools(), 3);
        
        uint256[] memory allPools = stakingPools.getAllPoolIds();
        assertEq(allPools.length, 3);
        assertEq(allPools[0], 1);
        assertEq(allPools[1], 2);
        assertEq(allPools[2], 3);
    }

    function testCreatePoolNotOwner() public {
        vm.startPrank(user1);
        token1.approve(address(stakingPools), INITIAL_REWARDS);
        
        vm.expectRevert();
        stakingPools.createPool(
            address(token1),
            "Unauthorized Pool",
            APY,
            INITIAL_REWARDS,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        vm.stopPrank();
    }

    // ============ Pool Management Tests ============

    function testDepositRewards() public {
        // Create pool
        vm.startPrank(owner);
        token1.approve(address(stakingPools), INITIAL_REWARDS * 2);
        uint256 poolId = stakingPools.createPool(
            address(token1),
            "Test Pool",
            APY,
            INITIAL_REWARDS,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        
        // Deposit additional rewards
        uint256 additionalRewards = 10_000 * 1e18;
        vm.expectEmit(true, true, true, true);
        emit RewardsDeposited(
            poolId,
            additionalRewards,
            INITIAL_REWARDS + additionalRewards,
            block.timestamp
        );
        
        stakingPools.depositRewards(poolId, additionalRewards);
        vm.stopPrank();
        
        // Verify rewards pool increased
        (, , , , , uint256 rewardsPool, , , , , ,) = stakingPools.getPoolInfo(poolId);
        assertEq(rewardsPool, INITIAL_REWARDS + additionalRewards);
    }

    function testDepositRewardsNonExistentPool() public {
        vm.startPrank(owner);
        vm.expectRevert("Pool does not exist");
        stakingPools.depositRewards(999, 1000 * 1e18);
        vm.stopPrank();
    }

    function testUpdatePoolAPY() public {
        // Create pool
        vm.startPrank(owner);
        token1.approve(address(stakingPools), INITIAL_REWARDS);
        uint256 poolId = stakingPools.createPool(
            address(token1),
            "Test Pool",
            APY,
            INITIAL_REWARDS,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        
        // Update APY
        uint256 newAPY = 2000; // 20%
        vm.expectEmit(true, true, true, true);
        emit APYUpdated(poolId, APY, newAPY, block.timestamp);
        
        stakingPools.updatePoolAPY(poolId, newAPY);
        vm.stopPrank();
        
        // Verify APY updated
        (, , , uint256 apy, , , , , , , ,) = stakingPools.getPoolInfo(poolId);
        assertEq(apy, newAPY);
    }

    function testUpdatePoolLimits() public {
        // Create pool
        vm.startPrank(owner);
        token1.approve(address(stakingPools), INITIAL_REWARDS);
        uint256 poolId = stakingPools.createPool(
            address(token1),
            "Test Pool",
            APY,
            INITIAL_REWARDS,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        
        // Update limits
        uint256 newMinStake = 200 * 1e18;
        uint256 newMaxStake = 20_000 * 1e18;
        stakingPools.updatePoolLimits(poolId, newMinStake, newMaxStake);
        vm.stopPrank();
        
        // Verify limits updated
        (, , , , , , , uint256 minStake, uint256 maxStakePerUser, , ,) = stakingPools.getPoolInfo(poolId);
        assertEq(minStake, newMinStake);
        assertEq(maxStakePerUser, newMaxStake);
    }

    function testDeactivatePool() public {
        // Create pool
        vm.startPrank(owner);
        token1.approve(address(stakingPools), INITIAL_REWARDS);
        uint256 poolId = stakingPools.createPool(
            address(token1),
            "Test Pool",
            APY,
            INITIAL_REWARDS,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        
        // Deactivate pool
        vm.expectEmit(true, true, true, true);
        emit PoolDeactivated(poolId, block.timestamp);
        
        stakingPools.deactivatePool(poolId);
        vm.stopPrank();
        
        // Verify pool deactivated
        (, , , , , , , , , , bool active,) = stakingPools.getPoolInfo(poolId);
        assertFalse(active);
    }

    function testActivatePool() public {
        // Create and deactivate pool
        vm.startPrank(owner);
        token1.approve(address(stakingPools), INITIAL_REWARDS);
        uint256 poolId = stakingPools.createPool(
            address(token1),
            "Test Pool",
            APY,
            INITIAL_REWARDS,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        stakingPools.deactivatePool(poolId);
        
        // Activate pool
        vm.expectEmit(true, true, true, true);
        emit PoolActivated(poolId, block.timestamp);
        
        stakingPools.activatePool(poolId);
        vm.stopPrank();
        
        // Verify pool activated
        (, , , , , , , , , , bool active,) = stakingPools.getPoolInfo(poolId);
        assertTrue(active);
    }

    function testPauseUnpause() public {
        vm.startPrank(owner);
        stakingPools.pause();
        assertTrue(stakingPools.paused());
        
        stakingPools.unpause();
        assertFalse(stakingPools.paused());
        vm.stopPrank();
    }

    // ============ Staking Tests ============

    function testStake() public {
        // Create pool
        vm.startPrank(owner);
        token1.approve(address(stakingPools), INITIAL_REWARDS);
        uint256 poolId = stakingPools.createPool(
            address(token1),
            "Test Pool",
            APY,
            INITIAL_REWARDS,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        vm.stopPrank();
        
        // User stakes
        uint256 stakeAmount = 1000 * 1e18;
        vm.startPrank(user1);
        token1.approve(address(stakingPools), stakeAmount);
        
        vm.expectEmit(true, true, true, true);
        emit Staked(poolId, user1, stakeAmount, block.timestamp);
        
        stakingPools.stake(poolId, stakeAmount);
        vm.stopPrank();
        
        // Verify stake
        (uint256 stakedAmount, , , uint256 stakeTime,) = stakingPools.getUserStakeInfo(poolId, user1);
        assertEq(stakedAmount, stakeAmount);
        assertEq(stakeTime, block.timestamp);
        
        // Verify pool stats
        (, , , , uint256 totalStaked, , , , , , , uint256 stakerCount) = stakingPools.getPoolInfo(poolId);
        assertEq(totalStaked, stakeAmount);
        assertEq(stakerCount, 1);
        
        // Verify user is in stakers list
        address[] memory stakers = stakingPools.getPoolStakers(poolId);
        assertEq(stakers.length, 1);
        assertEq(stakers[0], user1);
    }

    function testStakeNonExistentPool() public {
        vm.startPrank(user1);
        token1.approve(address(stakingPools), 1000 * 1e18);
        
        vm.expectRevert("Pool does not exist");
        stakingPools.stake(999, 1000 * 1e18);
        vm.stopPrank();
    }

    function testStakeInactivePool() public {
        // Create and deactivate pool
        vm.startPrank(owner);
        token1.approve(address(stakingPools), INITIAL_REWARDS);
        uint256 poolId = stakingPools.createPool(
            address(token1),
            "Test Pool",
            APY,
            INITIAL_REWARDS,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        stakingPools.deactivatePool(poolId);
        vm.stopPrank();
        
        // Try to stake
        vm.startPrank(user1);
        token1.approve(address(stakingPools), 1000 * 1e18);
        
        vm.expectRevert("Pool not active");
        stakingPools.stake(poolId, 1000 * 1e18);
        vm.stopPrank();
    }

    function testStakeBelowMinimum() public {
        // Create pool
        vm.startPrank(owner);
        token1.approve(address(stakingPools), INITIAL_REWARDS);
        uint256 poolId = stakingPools.createPool(
            address(token1),
            "Test Pool",
            APY,
            INITIAL_REWARDS,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        vm.stopPrank();
        
        // Try to stake below minimum
        vm.startPrank(user1);
        token1.approve(address(stakingPools), MIN_STAKE - 1);
        
        vm.expectRevert("Below minimum stake");
        stakingPools.stake(poolId, MIN_STAKE - 1);
        vm.stopPrank();
    }

    function testStakeExceedsMaximum() public {
        // Create pool
        vm.startPrank(owner);
        token1.approve(address(stakingPools), INITIAL_REWARDS);
        uint256 poolId = stakingPools.createPool(
            address(token1),
            "Test Pool",
            APY,
            INITIAL_REWARDS,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        vm.stopPrank();
        
        // Try to stake above maximum
        vm.startPrank(user1);
        token1.approve(address(stakingPools), MAX_STAKE_PER_USER + 1);
        
        vm.expectRevert("Exceeds max stake");
        stakingPools.stake(poolId, MAX_STAKE_PER_USER + 1);
        vm.stopPrank();
    }

    function testStakeWhenPaused() public {
        // Create pool
        vm.startPrank(owner);
        token1.approve(address(stakingPools), INITIAL_REWARDS);
        uint256 poolId = stakingPools.createPool(
            address(token1),
            "Test Pool",
            APY,
            INITIAL_REWARDS,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        stakingPools.pause();
        vm.stopPrank();
        
        // Try to stake when paused
        vm.startPrank(user1);
        token1.approve(address(stakingPools), 1000 * 1e18);
        
        vm.expectRevert();
        stakingPools.stake(poolId, 1000 * 1e18);
        vm.stopPrank();
    }

    function testMultipleStakes() public {
        // Create pool
        vm.startPrank(owner);
        token1.approve(address(stakingPools), INITIAL_REWARDS);
        uint256 poolId = stakingPools.createPool(
            address(token1),
            "Test Pool",
            APY,
            INITIAL_REWARDS,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        vm.stopPrank();
        
        // First stake
        uint256 firstStake = 1000 * 1e18;
        vm.startPrank(user1);
        token1.approve(address(stakingPools), firstStake);
        stakingPools.stake(poolId, firstStake);
        vm.stopPrank();
        
        // Wait for rewards to accrue
        vm.warp(block.timestamp + 30 days);
        
        // Second stake (should auto-claim rewards)
        uint256 secondStake = 500 * 1e18;
        vm.startPrank(user1);
        token1.approve(address(stakingPools), secondStake);
        stakingPools.stake(poolId, secondStake);
        vm.stopPrank();
        
        // Verify total stake
        (uint256 stakedAmount, , uint256 totalClaimed, ,) = stakingPools.getUserStakeInfo(poolId, user1);
        assertEq(stakedAmount, firstStake + secondStake);
        assertGt(totalClaimed, 0); // Should have claimed rewards
    }

    // ============ Withdrawal Tests ============

    function testWithdraw() public {
        // Create pool and stake
        vm.startPrank(owner);
        token1.approve(address(stakingPools), INITIAL_REWARDS);
        uint256 poolId = stakingPools.createPool(
            address(token1),
            "Test Pool",
            APY,
            INITIAL_REWARDS,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        vm.stopPrank();
        
        uint256 stakeAmount = 1000 * 1e18;
        vm.startPrank(user1);
        token1.approve(address(stakingPools), stakeAmount);
        stakingPools.stake(poolId, stakeAmount);
        
        // Wait for rewards
        vm.warp(block.timestamp + 30 days);
        
        // Withdraw partial amount
        uint256 withdrawAmount = 300 * 1e18;
        uint256 balanceBefore = token1.balanceOf(user1);
        
        vm.expectEmit(true, true, true, true);
        emit Withdrawn(poolId, user1, withdrawAmount, block.timestamp);
        
        stakingPools.withdraw(poolId, withdrawAmount);
        vm.stopPrank();
        
        // Verify withdrawal
        uint256 balanceAfter = token1.balanceOf(user1);
        assertGt(balanceAfter, balanceBefore + withdrawAmount); // Should include rewards
        
        (uint256 stakedAmount, , uint256 totalClaimed, ,) = stakingPools.getUserStakeInfo(poolId, user1);
        assertEq(stakedAmount, stakeAmount - withdrawAmount);
        assertGt(totalClaimed, 0); // Should have claimed rewards
    }

    function testWithdrawInsufficientStake() public {
        // Create pool and stake
        vm.startPrank(owner);
        token1.approve(address(stakingPools), INITIAL_REWARDS);
        uint256 poolId = stakingPools.createPool(
            address(token1),
            "Test Pool",
            APY,
            INITIAL_REWARDS,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        vm.stopPrank();
        
        uint256 stakeAmount = 1000 * 1e18;
        vm.startPrank(user1);
        token1.approve(address(stakingPools), stakeAmount);
        stakingPools.stake(poolId, stakeAmount);
        
        // Try to withdraw more than staked
        vm.expectRevert("Insufficient stake");
        stakingPools.withdraw(poolId, stakeAmount + 1);
        vm.stopPrank();
    }

    function testWithdrawZeroAmount() public {
        // Create pool and stake
        vm.startPrank(owner);
        token1.approve(address(stakingPools), INITIAL_REWARDS);
        uint256 poolId = stakingPools.createPool(
            address(token1),
            "Test Pool",
            APY,
            INITIAL_REWARDS,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        vm.stopPrank();
        
        uint256 stakeAmount = 1000 * 1e18;
        vm.startPrank(user1);
        token1.approve(address(stakingPools), stakeAmount);
        stakingPools.stake(poolId, stakeAmount);
        
        // Try to withdraw zero
        vm.expectRevert("Zero amount");
        stakingPools.withdraw(poolId, 0);
        vm.stopPrank();
    }

    // ============ Rewards Tests ============

    function testClaimRewards() public {
        // Create pool and stake
        vm.startPrank(owner);
        token1.approve(address(stakingPools), INITIAL_REWARDS);
        uint256 poolId = stakingPools.createPool(
            address(token1),
            "Test Pool",
            APY,
            INITIAL_REWARDS,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        vm.stopPrank();
        
        uint256 stakeAmount = 1000 * 1e18;
        vm.startPrank(user1);
        token1.approve(address(stakingPools), stakeAmount);
        stakingPools.stake(poolId, stakeAmount);
        
        // Wait for rewards to accrue
        vm.warp(block.timestamp + 30 days);
        
        // Check pending rewards
        uint256 pendingBefore = stakingPools.calculatePendingRewards(poolId, user1);
        assertGt(pendingBefore, 0);
        
        // Claim rewards
        uint256 balanceBefore = token1.balanceOf(user1);
        stakingPools.claimRewards(poolId);
        uint256 balanceAfter = token1.balanceOf(user1);
        vm.stopPrank();
        
        // Verify rewards claimed
        assertEq(balanceAfter - balanceBefore, pendingBefore);
        
        // Verify pending rewards reset
        uint256 pendingAfter = stakingPools.calculatePendingRewards(poolId, user1);
        assertEq(pendingAfter, 0);
        
        // Verify total claimed updated
        (, , uint256 totalClaimed, ,) = stakingPools.getUserStakeInfo(poolId, user1);
        assertEq(totalClaimed, pendingBefore);
    }

    function testClaimRewardsNoStake() public {
        // Create pool
        vm.startPrank(owner);
        token1.approve(address(stakingPools), INITIAL_REWARDS);
        uint256 poolId = stakingPools.createPool(
            address(token1),
            "Test Pool",
            APY,
            INITIAL_REWARDS,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        vm.stopPrank();
        
        // Try to claim without staking
        vm.startPrank(user1);
        vm.expectRevert("No stake");
        stakingPools.claimRewards(poolId);
        vm.stopPrank();
    }

    function testRewardsCalculation() public {
        // Create pool and stake
        vm.startPrank(owner);
        token1.approve(address(stakingPools), INITIAL_REWARDS);
        uint256 poolId = stakingPools.createPool(
            address(token1),
            "Test Pool",
            APY, // 12%
            INITIAL_REWARDS,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        vm.stopPrank();
        
        uint256 stakeAmount = 1000 * 1e18;
        vm.startPrank(user1);
        token1.approve(address(stakingPools), stakeAmount);
        stakingPools.stake(poolId, stakeAmount);
        vm.stopPrank();
        
        // Check rewards after different time periods
        vm.warp(block.timestamp + 1 days);
        uint256 rewards1Day = stakingPools.calculatePendingRewards(poolId, user1);
        
        vm.warp(block.timestamp + 29 days); // Total 30 days
        uint256 rewards30Days = stakingPools.calculatePendingRewards(poolId, user1);
        
        vm.warp(block.timestamp + 335 days); // Total 365 days
        uint256 rewards365Days = stakingPools.calculatePendingRewards(poolId, user1);
        
        // Verify rewards increase over time
        assertGt(rewards30Days, rewards1Day);
        assertGt(rewards365Days, rewards30Days);
        
        // Calculate expected rewards using contract's formula
        uint256 timeElapsed = 365 days;
        uint256 rate = (APY * timeElapsed * 1e18) / (10000 * 365 days);
        uint256 simpleInterest = (stakeAmount * rate) / 1e18;
        uint256 compoundFactor = (simpleInterest * rate) / (2 * 1e18);
        uint256 expectedYearlyRewards = simpleInterest + compoundFactor;
        
        assertApproxEqRel(rewards365Days, expectedYearlyRewards, 0.01e18); // 1% tolerance
    }

    // ============ Multi-Pool Tests ============

    function testMultiplePoolsStaking() public {
        // Create multiple pools
        vm.startPrank(owner);
        token1.approve(address(stakingPools), INITIAL_REWARDS * 2);
        token2.approve(address(stakingPools), INITIAL_REWARDS / 1e12);
        
        uint256 pool1 = stakingPools.createPool(
            address(token1),
            "USDT Pool",
            APY,
            INITIAL_REWARDS,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        
        uint256 pool2 = stakingPools.createPool(
            address(token1),
            "USDT High Yield",
            HIGH_APY,
            INITIAL_REWARDS,
            MIN_STAKE,
            0 // No max limit
        );
        
        uint256 pool3 = stakingPools.createPool(
            address(token2),
            "USDC Pool",
            1500, // 15%
            INITIAL_REWARDS / 1e12,
            MIN_STAKE / 1e12,
            MAX_STAKE_PER_USER / 1e12
        );
        vm.stopPrank();
        
        // User stakes in multiple pools
        vm.startPrank(user1);
        token1.approve(address(stakingPools), 3000 * 1e18);
        token2.approve(address(stakingPools), 1000 * 1e6);
        
        stakingPools.stake(pool1, 1000 * 1e18);
        stakingPools.stake(pool2, 2000 * 1e18);
        stakingPools.stake(pool3, 1000 * 1e6);
        vm.stopPrank();
        
        // Verify stakes in all pools
        (uint256 stake1, , , ,) = stakingPools.getUserStakeInfo(pool1, user1);
        (uint256 stake2, , , ,) = stakingPools.getUserStakeInfo(pool2, user1);
        (uint256 stake3, , , ,) = stakingPools.getUserStakeInfo(pool3, user1);
        
        assertEq(stake1, 1000 * 1e18);
        assertEq(stake2, 2000 * 1e18);
        assertEq(stake3, 1000 * 1e6);
        
        // Wait and check rewards in all pools
        vm.warp(block.timestamp + 30 days);
        
        uint256 rewards1 = stakingPools.calculatePendingRewards(pool1, user1);
        uint256 rewards2 = stakingPools.calculatePendingRewards(pool2, user1);
        uint256 rewards3 = stakingPools.calculatePendingRewards(pool3, user1);
        
        assertGt(rewards1, 0);
        assertGt(rewards2, 0);
        assertGt(rewards3, 0);
        
        // High yield pool should have higher rewards
        assertGt(rewards2, rewards1);
    }

    function testMultipleUsersInPool() public {
        // Create pool
        vm.startPrank(owner);
        token1.approve(address(stakingPools), INITIAL_REWARDS);
        uint256 poolId = stakingPools.createPool(
            address(token1),
            "Multi-User Pool",
            APY,
            INITIAL_REWARDS,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        vm.stopPrank();
        
        // Multiple users stake
        vm.startPrank(user1);
        token1.approve(address(stakingPools), 1000 * 1e18);
        stakingPools.stake(poolId, 1000 * 1e18);
        vm.stopPrank();
        
        vm.startPrank(user2);
        token1.approve(address(stakingPools), 2000 * 1e18);
        stakingPools.stake(poolId, 2000 * 1e18);
        vm.stopPrank();
        
        vm.startPrank(user3);
        token1.approve(address(stakingPools), 1500 * 1e18);
        stakingPools.stake(poolId, 1500 * 1e18);
        vm.stopPrank();
        
        // Verify pool stats
        (, , , , uint256 totalStaked, , , , , , , uint256 stakerCount) = stakingPools.getPoolInfo(poolId);
        assertEq(totalStaked, 4500 * 1e18);
        assertEq(stakerCount, 3);
        
        // Verify stakers list
        address[] memory stakers = stakingPools.getPoolStakers(poolId);
        assertEq(stakers.length, 3);
        assertEq(stakers[0], user1);
        assertEq(stakers[1], user2);
        assertEq(stakers[2], user3);
        
        // Wait and check individual rewards
        vm.warp(block.timestamp + 30 days);
        
        uint256 rewards1 = stakingPools.calculatePendingRewards(poolId, user1);
        uint256 rewards2 = stakingPools.calculatePendingRewards(poolId, user2);
        uint256 rewards3 = stakingPools.calculatePendingRewards(poolId, user3);
        
        // Rewards should be proportional to stake
        assertGt(rewards2, rewards1); // user2 staked more
        assertGt(rewards3, rewards1); // user3 staked more
        assertGt(rewards2, rewards3); // user2 staked most
    }

    // ============ View Functions Tests ============

    function testGetActivePoolIds() public {
        // Create multiple pools
        vm.startPrank(owner);
        token1.approve(address(stakingPools), INITIAL_REWARDS * 3);
        
        uint256 pool1 = stakingPools.createPool(
            address(token1), "Pool 1", APY, INITIAL_REWARDS, MIN_STAKE, MAX_STAKE_PER_USER
        );
        uint256 pool2 = stakingPools.createPool(
            address(token1), "Pool 2", APY, INITIAL_REWARDS, MIN_STAKE, MAX_STAKE_PER_USER
        );
        uint256 pool3 = stakingPools.createPool(
            address(token1), "Pool 3", APY, INITIAL_REWARDS, MIN_STAKE, MAX_STAKE_PER_USER
        );
        
        // Deactivate one pool
        stakingPools.deactivatePool(pool2);
        vm.stopPrank();
        
        // Check active pools
        uint256[] memory activePools = stakingPools.getActivePoolIds();
        assertEq(activePools.length, 2);
        assertTrue(activePools[0] == pool1 || activePools[1] == pool1);
        assertTrue(activePools[0] == pool3 || activePools[1] == pool3);
        
        // Ensure deactivated pool is not in active list
        for (uint256 i = 0; i < activePools.length; i++) {
            assertTrue(activePools[i] != pool2);
        }
    }

    function testGetPoolHealth() public {
        // Create pool and stake
        vm.startPrank(owner);
        token1.approve(address(stakingPools), INITIAL_REWARDS);
        uint256 poolId = stakingPools.createPool(
            address(token1),
            "Health Test Pool",
            APY,
            INITIAL_REWARDS,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        vm.stopPrank();
        
        vm.startPrank(user1);
        token1.approve(address(stakingPools), 5000 * 1e18);
        stakingPools.stake(poolId, 5000 * 1e18);
        vm.stopPrank();
        
        // Check pool health
        (
            uint256 rewardsBalance,
            uint256 dailyRewards,
            uint256 daysRemaining
        ) = stakingPools.getPoolHealth(poolId);
        
        assertEq(rewardsBalance, INITIAL_REWARDS);
        assertGt(dailyRewards, 0);
        assertGt(daysRemaining, 0);
        
        // Verify calculation makes sense
        uint256 expectedDaysRemaining = rewardsBalance / dailyRewards;
        assertApproxEqAbs(daysRemaining, expectedDaysRemaining, 1);
    }

    function testGetUserSummary() public {
        // Create pool and stake
        vm.startPrank(owner);
        token1.approve(address(stakingPools), INITIAL_REWARDS);
        uint256 poolId = stakingPools.createPool(
            address(token1),
            "Summary Test Pool",
            APY,
            INITIAL_REWARDS,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        vm.stopPrank();
        
        uint256 stakeAmount = 1000 * 1e18;
        vm.startPrank(user1);
        token1.approve(address(stakingPools), stakeAmount);
        stakingPools.stake(poolId, stakeAmount);
        vm.stopPrank();
        
        // Wait for rewards
        vm.warp(block.timestamp + 30 days);
        
        // Get user summary
        (
            uint256 totalStaked,
            uint256 dailyRewards,
            uint256 pendingRewards,
            uint256 totalRewards,
            uint256 totalClaimed
        ) = stakingPools.getUserSummary(poolId, user1);
        
        assertEq(totalStaked, stakeAmount);
        assertGt(dailyRewards, 0);
        assertGt(pendingRewards, 0);
        assertEq(totalRewards, totalClaimed + pendingRewards);
        assertEq(totalClaimed, 0); // No claims yet
    }

    function testGetPoolSummary() public {
        // Create pool
        vm.startPrank(owner);
        token1.approve(address(stakingPools), INITIAL_REWARDS);
        uint256 poolId = stakingPools.createPool(
            address(token1),
            "Pool Summary Test",
            APY,
            INITIAL_REWARDS,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        vm.stopPrank();
        
        // Multiple users stake
        vm.startPrank(user1);
        token1.approve(address(stakingPools), 1000 * 1e18);
        stakingPools.stake(poolId, 1000 * 1e18);
        vm.stopPrank();
        
        vm.startPrank(user2);
        token1.approve(address(stakingPools), 2000 * 1e18);
        stakingPools.stake(poolId, 2000 * 1e18);
        vm.stopPrank();
        
        // Get pool summary
        (
            uint256 totalStaked,
            uint256 totalDailyRewards,
            uint256 totalRewardsClaimed,
            uint256 rewardsRemaining,
            uint256 stakerCount
        ) = stakingPools.getPoolSummary(poolId);
        
        assertEq(totalStaked, 3000 * 1e18);
        assertGt(totalDailyRewards, 0);
        assertEq(totalRewardsClaimed, 0);
        assertEq(rewardsRemaining, INITIAL_REWARDS);
        assertEq(stakerCount, 2);
    }

    function testCalculateDailyAndYearlyRewards() public {
        // Create pool
        vm.startPrank(owner);
        token1.approve(address(stakingPools), INITIAL_REWARDS);
        uint256 poolId = stakingPools.createPool(
            address(token1),
            "Calculation Test Pool",
            APY, // 12%
            INITIAL_REWARDS,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        vm.stopPrank();
        
        uint256 testAmount = 1000 * 1e18;
        
        // Calculate daily rewards
        uint256 dailyRewards = stakingPools.calculateDailyRewards(poolId, testAmount);
        
        // Calculate yearly rewards
        uint256 yearlyRewards = stakingPools.calculateYearlyRewards(poolId, testAmount);
        
        // Verify calculations
        assertGt(dailyRewards, 0);
        assertEq(yearlyRewards, (testAmount * APY) / 10000);
        
        // Daily rewards * 365 should approximately equal yearly rewards
        uint256 dailyToYearly = dailyRewards * 365;
        uint256 tolerance = yearlyRewards / 100; // 1% tolerance for compound interest
        assertApproxEqAbs(dailyToYearly, yearlyRewards, tolerance);
    }

    // ============ Edge Cases and Integration Tests ============

    function testInsufficientRewardsPool() public {
        // Create pool with small rewards
        vm.startPrank(owner);
        token1.approve(address(stakingPools), 1000 * 1e18);
        uint256 poolId = stakingPools.createPool(
            address(token1),
            "Small Rewards Pool",
            HIGH_APY, // High APY with small rewards pool
            1000 * 1e18,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        vm.stopPrank();
        
        // User stakes large amount
        vm.startPrank(user1);
        token1.approve(address(stakingPools), 5000 * 1e18);
        stakingPools.stake(poolId, 5000 * 1e18);
        vm.stopPrank();
        
        // Wait for rewards to exceed pool
        vm.warp(block.timestamp + 365 days);
        
        // Try to claim rewards
        vm.startPrank(user1);
        vm.expectRevert("Insufficient rewards pool");
        stakingPools.claimRewards(poolId);
        vm.stopPrank();
    }

    function testZeroStakeRewards() public {
        // Create pool
        vm.startPrank(owner);
        token1.approve(address(stakingPools), INITIAL_REWARDS);
        uint256 poolId = stakingPools.createPool(
            address(token1),
            "Zero Stake Test",
            APY,
            INITIAL_REWARDS,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        vm.stopPrank();
        
        // Check rewards for user with no stake
        uint256 rewards = stakingPools.calculatePendingRewards(poolId, user1);
        assertEq(rewards, 0);
        
        uint256 dailyRewards = stakingPools.getUserDailyRewards(poolId, user1);
        assertEq(dailyRewards, 0);
        
        uint256 totalRewards = stakingPools.getUserTotalRewards(poolId, user1);
        assertEq(totalRewards, 0);
    }

    function testFullWorkflow() public {
        // 1. Create pool
        vm.startPrank(owner);
        token1.approve(address(stakingPools), INITIAL_REWARDS);
        uint256 poolId = stakingPools.createPool(
            address(token1),
            "Full Workflow Pool",
            APY,
            INITIAL_REWARDS,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        vm.stopPrank();
        
        // 2. User stakes
        uint256 stakeAmount = 2000 * 1e18;
        vm.startPrank(user1);
        token1.approve(address(stakingPools), stakeAmount);
        stakingPools.stake(poolId, stakeAmount);
        vm.stopPrank();
        
        // 3. Wait for rewards
        vm.warp(block.timestamp + 90 days);
        
        // 4. Check accumulated rewards
        uint256 pendingRewards = stakingPools.calculatePendingRewards(poolId, user1);
        assertGt(pendingRewards, 0);
        
        // 5. Claim rewards
        vm.startPrank(user1);
        uint256 balanceBefore = token1.balanceOf(user1);
        stakingPools.claimRewards(poolId);
        uint256 balanceAfter = token1.balanceOf(user1);
        assertEq(balanceAfter - balanceBefore, pendingRewards);
        vm.stopPrank();
        
        // 6. Wait more and withdraw partial
        vm.warp(block.timestamp + 30 days);
        
        vm.startPrank(user1);
        uint256 withdrawAmount = 500 * 1e18;
        stakingPools.withdraw(poolId, withdrawAmount);
        vm.stopPrank();
        
        // 7. Verify final state
        (uint256 finalStake, uint256 finalPending, uint256 totalClaimed, ,) = 
            stakingPools.getUserStakeInfo(poolId, user1);
        
        assertEq(finalStake, stakeAmount - withdrawAmount);
        assertGt(totalClaimed, pendingRewards); // Should include rewards from withdrawal
        assertGe(finalPending, 0); // May have new pending rewards
    }
}