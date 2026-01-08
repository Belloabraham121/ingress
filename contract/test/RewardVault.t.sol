// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/RewardVault.sol";
import "./MockERC20.sol";

contract RewardVaultTest is Test {
    RewardVault public vault;
    MockERC20 public token;
    
    address public owner = address(0x1);
    address public factory = address(0x2);
    address public user1 = address(0x3);
    address public user2 = address(0x4);
    address public user3 = address(0x5);
    
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 1e18;
    uint256 public constant APY = 1200; // 12%
    uint256 public constant MIN_DEPOSIT = 100 * 1e18;
    uint256 public constant MAX_DEPOSIT_PER_USER = 10_000 * 1e18;
    
    event Deposited(address indexed user, uint256 amount, uint256 shares, uint256 timestamp);
    event Withdrawn(address indexed user, uint256 amount, uint256 shares, uint256 timestamp);
    event RewardsClaimed(address indexed user, uint256 amount, uint256 timestamp);
    event RewardsPoolIncreased(uint256 amount, uint256 newTotal, uint256 timestamp);
    event APYUpdated(uint256 oldAPY, uint256 newAPY, uint256 timestamp);
    event LimitsUpdated(uint256 minDeposit, uint256 maxDepositPerUser, uint256 timestamp);

    function setUp() public {
        // Deploy mock token
        token = new MockERC20("Test Token", "TEST", 18, INITIAL_SUPPLY);
        
        // Deploy vault as factory
        vm.prank(factory);
        vault = new RewardVault(
            address(token),
            "Test Vault",
            "tVAULT",
            APY,
            owner,
            MIN_DEPOSIT,
            MAX_DEPOSIT_PER_USER
        );
        
        // Distribute tokens to users
        token.transfer(owner, 100_000 * 1e18);
        token.transfer(user1, 50_000 * 1e18);
        token.transfer(user2, 50_000 * 1e18);
        token.transfer(user3, 50_000 * 1e18);
    }

    // ============ Constructor Tests ============

    function testConstructor() public {
        assertEq(address(vault.asset()), address(token));
        assertEq(vault.factory(), factory);
        assertEq(vault.owner(), owner);
        assertEq(vault.apy(), APY);
        assertEq(vault.minDeposit(), MIN_DEPOSIT);
        assertEq(vault.maxDepositPerUser(), MAX_DEPOSIT_PER_USER);
        assertEq(vault.name(), "Test Vault");
        assertEq(vault.symbol(), "tVAULT");
    }

    function testConstructorInvalidAsset() public {
        vm.expectRevert("Invalid asset");
        vm.prank(factory);
        new RewardVault(
            address(0),
            "Test Vault",
            "tVAULT",
            APY,
            owner,
            MIN_DEPOSIT,
            MAX_DEPOSIT_PER_USER
        );
    }

    function testConstructorInvalidOwner() public {
        vm.expectRevert("Invalid owner");
        vm.prank(factory);
        new RewardVault(
            address(token),
            "Test Vault",
            "tVAULT",
            APY,
            address(0),
            MIN_DEPOSIT,
            MAX_DEPOSIT_PER_USER
        );
    }

    function testConstructorInvalidAPY() public {
        vm.expectRevert("APY must be 0-100%");
        vm.prank(factory);
        new RewardVault(
            address(token),
            "Test Vault",
            "tVAULT",
            10001, // > 100%
            owner,
            MIN_DEPOSIT,
            MAX_DEPOSIT_PER_USER
        );
    }

    // ============ Owner Functions Tests ============

    function testDepositRewardsPool() public {
        uint256 rewardAmount = 10_000 * 1e18;
        
        vm.startPrank(owner);
        token.approve(address(vault), rewardAmount);
        
        vm.expectEmit(true, true, true, true);
        emit RewardsPoolIncreased(rewardAmount, rewardAmount, block.timestamp);
        
        vault.depositRewardsPool(rewardAmount);
        vm.stopPrank();
        
        assertEq(vault.rewardsPool(), rewardAmount);
    }

    function testDepositRewardsPoolNotOwner() public {
        uint256 rewardAmount = 10_000 * 1e18;
        
        vm.startPrank(user1);
        token.approve(address(vault), rewardAmount);
        
        vm.expectRevert("Not owner");
        vault.depositRewardsPool(rewardAmount);
        vm.stopPrank();
    }

    function testDepositRewardsPoolZeroAmount() public {
        vm.startPrank(owner);
        vm.expectRevert("Zero amount");
        vault.depositRewardsPool(0);
        vm.stopPrank();
    }

    function testUpdateAPY() public {
        uint256 newAPY = 1500; // 15%
        
        vm.startPrank(owner);
        vm.expectEmit(true, true, true, true);
        emit APYUpdated(APY, newAPY, block.timestamp);
        
        vault.updateAPY(newAPY);
        vm.stopPrank();
        
        assertEq(vault.apy(), newAPY);
    }

    function testUpdateAPYNotOwner() public {
        vm.startPrank(user1);
        vm.expectRevert("Not owner");
        vault.updateAPY(1500);
        vm.stopPrank();
    }

    function testUpdateAPYInvalid() public {
        vm.startPrank(owner);
        vm.expectRevert("APY must be 0-100%");
        vault.updateAPY(10001);
        vm.stopPrank();
    }

    function testUpdateLimits() public {
        uint256 newMinDeposit = 200 * 1e18;
        uint256 newMaxDeposit = 20_000 * 1e18;
        
        vm.startPrank(owner);
        vm.expectEmit(true, true, true, true);
        emit LimitsUpdated(newMinDeposit, newMaxDeposit, block.timestamp);
        
        vault.updateLimits(newMinDeposit, newMaxDeposit);
        vm.stopPrank();
        
        assertEq(vault.minDeposit(), newMinDeposit);
        assertEq(vault.maxDepositPerUser(), newMaxDeposit);
    }

    function testPauseUnpause() public {
        vm.startPrank(owner);
        vault.pause();
        assertTrue(vault.paused());
        
        vault.unpause();
        assertFalse(vault.paused());
        vm.stopPrank();
    }

    // ============ User Deposit Tests ============

    function testDeposit() public {
        uint256 depositAmount = 1000 * 1e18;
        
        // Owner deposits rewards first
        vm.startPrank(owner);
        token.approve(address(vault), 10_000 * 1e18);
        vault.depositRewardsPool(10_000 * 1e18);
        vm.stopPrank();
        
        // User deposits
        vm.startPrank(user1);
        token.approve(address(vault), depositAmount);
        
        vm.expectEmit(true, true, true, true);
        emit Deposited(user1, depositAmount, depositAmount, block.timestamp);
        
        vault.deposit(depositAmount);
        vm.stopPrank();
        
        // Check user info
        (uint256 userDeposit, uint256 shares, , , uint256 depositTime, ) = vault.getUserInfo(user1);
        assertEq(userDeposit, depositAmount);
        assertEq(shares, depositAmount);
        assertEq(depositTime, block.timestamp);
        assertEq(vault.balanceOf(user1), depositAmount);
        assertEq(vault.totalUserDeposits(), depositAmount);
    }

    function testDepositBelowMinimum() public {
        uint256 depositAmount = 50 * 1e18; // Below minimum
        
        vm.startPrank(user1);
        token.approve(address(vault), depositAmount);
        
        vm.expectRevert("Below minimum deposit");
        vault.deposit(depositAmount);
        vm.stopPrank();
    }

    function testDepositExceedsMaximum() public {
        uint256 depositAmount = 15_000 * 1e18; // Above maximum
        
        vm.startPrank(user1);
        token.approve(address(vault), depositAmount);
        
        vm.expectRevert("Exceeds max deposit");
        vault.deposit(depositAmount);
        vm.stopPrank();
    }

    function testDepositWhenPaused() public {
        uint256 depositAmount = 1000 * 1e18;
        
        vm.prank(owner);
        vault.pause();
        
        vm.startPrank(user1);
        token.approve(address(vault), depositAmount);
        
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        vault.deposit(depositAmount);
        vm.stopPrank();
    }

    function testMultipleDeposits() public {
        uint256 firstDeposit = 1000 * 1e18;
        uint256 secondDeposit = 500 * 1e18;
        
        // Owner deposits rewards
        vm.startPrank(owner);
        token.approve(address(vault), 10_000 * 1e18);
        vault.depositRewardsPool(10_000 * 1e18);
        vm.stopPrank();
        
        // First deposit
        vm.startPrank(user1);
        token.approve(address(vault), firstDeposit + secondDeposit);
        vault.deposit(firstDeposit);
        
        // Wait some time for rewards to accrue
        vm.warp(block.timestamp + 1 days);
        
        // Second deposit (should auto-claim rewards)
        vault.deposit(secondDeposit);
        vm.stopPrank();
        
        (uint256 userDeposit, uint256 shares, , uint256 totalClaimed, , ) = vault.getUserInfo(user1);
        assertEq(userDeposit, firstDeposit + secondDeposit);
        assertGt(totalClaimed, 0); // Should have claimed some rewards
    }

    // ============ Withdrawal Tests ============

    function testWithdraw() public {
        uint256 depositAmount = 1000 * 1e18;
        uint256 withdrawAmount = 500 * 1e18;
        
        // Setup: deposit first
        vm.startPrank(owner);
        token.approve(address(vault), 10_000 * 1e18);
        vault.depositRewardsPool(10_000 * 1e18);
        vm.stopPrank();
        
        vm.startPrank(user1);
        token.approve(address(vault), depositAmount);
        vault.deposit(depositAmount);
        
        // Wait for some rewards
        vm.warp(block.timestamp + 30 days);
        
        uint256 balanceBefore = token.balanceOf(user1);
        uint256 pendingRewards = vault.calculatePendingRewards(user1);
        
        vm.expectEmit(true, true, true, true);
        emit Withdrawn(user1, withdrawAmount, withdrawAmount, block.timestamp);
        
        vault.withdraw(withdrawAmount);
        vm.stopPrank();
        
        uint256 balanceAfter = token.balanceOf(user1);
        // Should receive withdrawal amount + pending rewards
        assertEq(balanceAfter - balanceBefore, withdrawAmount + pendingRewards);
        
        (uint256 userDeposit, uint256 shares, , , , ) = vault.getUserInfo(user1);
        assertEq(userDeposit, depositAmount - withdrawAmount);
        assertEq(shares, depositAmount - withdrawAmount);
    }

    function testWithdrawInsufficientBalance() public {
        uint256 depositAmount = 1000 * 1e18;
        uint256 withdrawAmount = 1500 * 1e18; // More than deposited
        
        // Setup: deposit first
        vm.startPrank(owner);
        token.approve(address(vault), 10_000 * 1e18);
        vault.depositRewardsPool(10_000 * 1e18);
        vm.stopPrank();
        
        vm.startPrank(user1);
        token.approve(address(vault), depositAmount);
        vault.deposit(depositAmount);
        
        vm.expectRevert("Insufficient balance");
        vault.withdraw(withdrawAmount);
        vm.stopPrank();
    }

    function testWithdrawZeroAmount() public {
        vm.startPrank(user1);
        vm.expectRevert("Zero amount");
        vault.withdraw(0);
        vm.stopPrank();
    }

    // ============ Rewards Tests ============

    function testCalculatePendingRewards() public {
        uint256 depositAmount = 1000 * 1e18;
        
        // Setup
        vm.startPrank(owner);
        token.approve(address(vault), 10_000 * 1e18);
        vault.depositRewardsPool(10_000 * 1e18);
        vm.stopPrank();
        
        vm.startPrank(user1);
        token.approve(address(vault), depositAmount);
        vault.deposit(depositAmount);
        vm.stopPrank();
        
        // Fast forward 1 year
        vm.warp(block.timestamp + 365 days);
        
        // Calculate expected rewards using contract's formula
        uint256 timeElapsed = 365 days;
        uint256 rate = (1200 * timeElapsed * 1e18) / (10000 * 365 days); // APY * time / (BASIS_POINTS * SECONDS_PER_YEAR)
        uint256 simpleInterest = (depositAmount * rate) / 1e18;
        uint256 compoundFactor = (simpleInterest * rate) / (2 * 1e18);
        uint256 expectedRewards = simpleInterest + compoundFactor;
        
        uint256 actualRewards = vault.calculatePendingRewards(user1);
        
        assertEq(actualRewards, expectedRewards);
    }

    function testClaimRewards() public {
        uint256 depositAmount = 1000 * 1e18;
        
        // Setup
        vm.startPrank(owner);
        token.approve(address(vault), 10_000 * 1e18);
        vault.depositRewardsPool(10_000 * 1e18);
        vm.stopPrank();
        
        vm.startPrank(user1);
        token.approve(address(vault), depositAmount);
        vault.deposit(depositAmount);
        
        // Wait for rewards to accrue
        vm.warp(block.timestamp + 30 days);
        
        uint256 pendingBefore = vault.calculatePendingRewards(user1);
        uint256 balanceBefore = token.balanceOf(user1);
        
        vm.expectEmit(true, true, true, true);
        emit RewardsClaimed(user1, pendingBefore, block.timestamp);
        
        vault.claimRewards();
        vm.stopPrank();
        
        uint256 balanceAfter = token.balanceOf(user1);
        assertEq(balanceAfter - balanceBefore, pendingBefore);
        
        // Pending rewards should be 0 after claim
        assertEq(vault.calculatePendingRewards(user1), 0);
    }

    function testClaimRewardsNoDeposit() public {
        vm.startPrank(user1);
        vm.expectRevert("No deposit");
        vault.claimRewards();
        vm.stopPrank();
    }

    function testClaimRewardsInsufficientPool() public {
        uint256 depositAmount = 1000 * 1e18;
        
        // Setup with small rewards pool
        vm.startPrank(owner);
        token.approve(address(vault), 100 * 1e18);
        vault.depositRewardsPool(100 * 1e18);
        vm.stopPrank();
        
        vm.startPrank(user1);
        token.approve(address(vault), depositAmount);
        vault.deposit(depositAmount);
        
        // Wait for rewards to exceed pool
        vm.warp(block.timestamp + 365 days);
        
        vm.expectRevert("Insufficient rewards pool");
        vault.claimRewards();
        vm.stopPrank();
    }

    // ============ View Functions Tests ============

    function testGetUserTotalValue() public {
        uint256 depositAmount = 1000 * 1e18;
        
        // Setup
        vm.startPrank(owner);
        token.approve(address(vault), 10_000 * 1e18);
        vault.depositRewardsPool(10_000 * 1e18);
        vm.stopPrank();
        
        vm.startPrank(user1);
        token.approve(address(vault), depositAmount);
        vault.deposit(depositAmount);
        vm.stopPrank();
        
        // Check total value increases over time
        uint256 initialValue = vault.getUserTotalValue(user1);
        assertEq(initialValue, depositAmount);
        
        vm.warp(block.timestamp + 30 days);
        uint256 laterValue = vault.getUserTotalValue(user1);
        assertGt(laterValue, initialValue);
    }

    function testGetUserProfit() public {
        uint256 depositAmount = 1000 * 1e18;
        
        // Setup
        vm.startPrank(owner);
        token.approve(address(vault), 10_000 * 1e18);
        vault.depositRewardsPool(10_000 * 1e18);
        vm.stopPrank();
        
        vm.startPrank(user1);
        token.approve(address(vault), depositAmount);
        vault.deposit(depositAmount);
        vm.stopPrank();
        
        // Initially no profit
        assertEq(vault.getUserProfit(user1), 0);
        
        // After time, should have profit
        vm.warp(block.timestamp + 30 days);
        assertGt(vault.getUserProfit(user1), 0);
    }

    function testGetVaultStats() public {
        uint256 depositAmount = 1000 * 1e18;
        uint256 rewardsAmount = 10_000 * 1e18;
        
        // Setup
        vm.startPrank(owner);
        token.approve(address(vault), rewardsAmount);
        vault.depositRewardsPool(rewardsAmount);
        vm.stopPrank();
        
        vm.startPrank(user1);
        token.approve(address(vault), depositAmount);
        vault.deposit(depositAmount);
        vm.stopPrank();
        
        (
            uint256 totalDeposits,
            uint256 currentAPY,
            uint256 remainingRewards,
            uint256 totalClaimed,
            uint256 totalDepositors,
            uint256 vaultBalance
        ) = vault.getVaultStats();
        
        assertEq(totalDeposits, depositAmount);
        assertEq(currentAPY, APY);
        assertEq(remainingRewards, rewardsAmount);
        assertEq(totalClaimed, 0);
        assertEq(totalDepositors, 1);
        assertEq(vaultBalance, depositAmount + rewardsAmount);
    }

    function testCalculateDailyRewards() public {
        uint256 amount = 1000 * 1e18;
        uint256 dailyRewards = vault.calculateDailyRewards(amount);
        
        // Should be approximately amount * APY / 365
        uint256 expectedDaily = (amount * APY) / (vault.BASIS_POINTS() * 365);
        
        // Allow for some variance due to compound calculation
        assertApproxEqRel(dailyRewards, expectedDaily, 0.01e18); // 1% tolerance
    }

    function testCalculateYearlyRewards() public {
        uint256 amount = 1000 * 1e18;
        uint256 yearlyRewards = vault.calculateYearlyRewards(amount);
        
        uint256 expected = (amount * APY) / vault.BASIS_POINTS();
        assertEq(yearlyRewards, expected);
    }

    function testGetVaultHealth() public {
        uint256 depositAmount = 1000 * 1e18;
        uint256 rewardsAmount = 10_000 * 1e18;
        
        // Setup
        vm.startPrank(owner);
        token.approve(address(vault), rewardsAmount);
        vault.depositRewardsPool(rewardsAmount);
        vm.stopPrank();
        
        vm.startPrank(user1);
        token.approve(address(vault), depositAmount);
        vault.deposit(depositAmount);
        vm.stopPrank();
        
        (
            uint256 poolBalance,
            uint256 projectedDailyClaims,
            uint256 daysUntilEmpty
        ) = vault.getVaultHealth();
        
        assertEq(poolBalance, rewardsAmount);
        assertGt(projectedDailyClaims, 0);
        assertGt(daysUntilEmpty, 0);
    }

    // ============ Edge Cases and Integration Tests ============

    function testMultipleUsersDepositsAndWithdrawals() public {
        uint256 rewardsAmount = 50_000 * 1e18;
        
        // Owner deposits large rewards pool
        vm.startPrank(owner);
        token.approve(address(vault), rewardsAmount);
        vault.depositRewardsPool(rewardsAmount);
        vm.stopPrank();
        
        // Multiple users deposit
        vm.startPrank(user1);
        token.approve(address(vault), 5000 * 1e18);
        vault.deposit(2000 * 1e18);
        vm.stopPrank();
        
        vm.startPrank(user2);
        token.approve(address(vault), 3000 * 1e18);
        vault.deposit(3000 * 1e18);
        vm.stopPrank();
        
        vm.startPrank(user3);
        token.approve(address(vault), 1000 * 1e18);
        vault.deposit(1000 * 1e18);
        vm.stopPrank();
        
        // Wait for rewards to accrue
        vm.warp(block.timestamp + 30 days);
        
        // Users claim rewards
        vm.prank(user1);
        vault.claimRewards();
        
        vm.prank(user2);
        vault.claimRewards();
        
        // User1 makes additional deposit
        vm.startPrank(user1);
        vault.deposit(1000 * 1e18);
        vm.stopPrank();
        
        // Get user3's pending rewards before withdrawal
        uint256 user3PendingRewards = vault.calculatePendingRewards(user3);
        uint256 user3BalanceBefore = token.balanceOf(user3);
        
        // User3 withdraws partially (this will also claim rewards)
        vm.startPrank(user3);
        vault.withdraw(500 * 1e18);
        vm.stopPrank();
        
        uint256 user3BalanceAfter = token.balanceOf(user3);
        
        // User3 should receive withdrawal amount + rewards
        assertEq(user3BalanceAfter - user3BalanceBefore, 500 * 1e18 + user3PendingRewards);
        
        // Check final state
        assertEq(vault.totalUserDeposits(), 6500 * 1e18); // user1: 3000, user2: 3000, user3: 500
        
        address[] memory depositors = vault.getAllDepositors();
        assertEq(depositors.length, 3);
    }

    function testRewardsAccuracyOverTime() public {
        uint256 depositAmount = 1000 * 1e18;
        
        // Setup
        vm.startPrank(owner);
        token.approve(address(vault), 50_000 * 1e18);
        vault.depositRewardsPool(50_000 * 1e18);
        vm.stopPrank();
        
        uint256 depositTime = block.timestamp;
        vm.startPrank(user1);
        token.approve(address(vault), depositAmount);
        vault.deposit(depositAmount);
        vm.stopPrank();
        
        // Test rewards for exactly 1 year
        vm.warp(depositTime + 365 days);
        uint256 rewards = vault.calculatePendingRewards(user1);
        
        // Calculate expected rewards using contract's exact formula
        uint256 timeElapsed = 365 days;
        uint256 SECONDS_PER_YEAR = 365 days;
        uint256 BASIS_POINTS = 10000;
        
        uint256 rate = (1200 * timeElapsed * 1e18) / (BASIS_POINTS * SECONDS_PER_YEAR);
        uint256 simpleInterest = (depositAmount * rate) / 1e18;
        uint256 compoundFactor = (simpleInterest * rate) / (2 * 1e18);
        uint256 expectedYearly = simpleInterest + compoundFactor;
        
        assertEq(rewards, expectedYearly); // Should match exactly
    }

    function testGetVaultInfo() public {
        (
            address assetAddress,
            address ownerAddress,
            address factoryAddress,
            uint256 apyValue,
            uint256 totalDeposits,
            uint256 rewardsRemaining
        ) = vault.getVaultInfo();
        
        assertEq(assetAddress, address(token));
        assertEq(ownerAddress, owner);
        assertEq(factoryAddress, factory);
        assertEq(apyValue, APY);
        assertEq(totalDeposits, 0); // No deposits yet
        assertEq(rewardsRemaining, 0); // No rewards deposited yet
    }
}