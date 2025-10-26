// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/VaultFactory.sol";
import "../src/RewardVault.sol";
import "./MockERC20.sol";

contract VaultFactoryTest is Test {
    VaultFactory public factory;
    MockERC20 public token1;
    MockERC20 public token2;
    
    address public factoryOwner = address(0x1);
    address public feeRecipient = address(0x2);
    address public creator1 = address(0x3);
    address public creator2 = address(0x4);
    address public user1 = address(0x5);
    
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 1e18;
    uint256 public constant FACTORY_FEE = 100; // 1%
    uint256 public constant APY = 1200; // 12%
    uint256 public constant MIN_DEPOSIT = 100 * 1e18;
    uint256 public constant MAX_DEPOSIT_PER_USER = 10_000 * 1e18;
    uint256 public constant INITIAL_REWARDS = 10_000 * 1e18;
    
    event VaultCreated(
        address indexed vaultAddress,
        address indexed asset,
        address indexed creator,
        string name,
        string symbol,
        uint256 apr,
        uint256 initialDeposit,
        uint256 timestamp
    );
    event VaultDeactivated(address indexed vault, uint256 timestamp);
    event FactoryFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeRecipientUpdated(address oldRecipient, address newRecipient);

    function setUp() public {
        // Deploy tokens
        token1 = new MockERC20("Token 1", "TK1", 18, INITIAL_SUPPLY);
        token2 = new MockERC20("Token 2", "TK2", 6, INITIAL_SUPPLY);
        
        // Deploy factory
        vm.prank(factoryOwner);
        factory = new VaultFactory(feeRecipient, FACTORY_FEE);
        
        // Distribute tokens
        token1.transfer(creator1, 100_000 * 1e18);
        token1.transfer(creator2, 100_000 * 1e18);
        token2.transfer(creator1, 100_000 * 1e6);
        token2.transfer(creator2, 100_000 * 1e6);
        token1.transfer(user1, 50_000 * 1e18);
    }

    // ============ Constructor Tests ============

    function testConstructor() public {
        assertEq(factory.factoryOwner(), factoryOwner);
        assertEq(factory.feeRecipient(), feeRecipient);
        assertEq(factory.factoryFee(), FACTORY_FEE);
        assertEq(factory.getTotalVaults(), 0);
    }

    function testConstructorInvalidFeeRecipient() public {
        vm.expectRevert("Invalid fee recipient");
        vm.prank(factoryOwner);
        new VaultFactory(address(0), FACTORY_FEE);
    }

    function testConstructorFeeTooHigh() public {
        vm.expectRevert("Fee too high");
        vm.prank(factoryOwner);
        new VaultFactory(feeRecipient, 1001); // > 10%
    }

    // ============ Vault Creation Tests ============

    function testCreateVault() public {
        vm.startPrank(creator1);
        token1.approve(address(factory), INITIAL_REWARDS);
        
        uint256 expectedFee = (INITIAL_REWARDS * FACTORY_FEE) / 10000;
        uint256 expectedVaultDeposit = INITIAL_REWARDS - expectedFee;
        
        vm.expectEmit(false, true, true, true); // Don't check vault address (unknown)
        emit VaultCreated(
            address(0), // Will be filled by actual vault address
            address(token1),
            creator1,
            "Test Vault",
            "tVAULT",
            APY,
            expectedVaultDeposit,
            block.timestamp
        );
        
        address vaultAddress = factory.createVault(
            address(token1),
            "Test Vault",
            "tVAULT",
            APY,
            INITIAL_REWARDS,
            MIN_DEPOSIT,
            MAX_DEPOSIT_PER_USER
        );
        
        // Rewards are now automatically registered in the vault's rewards pool
        
        vm.stopPrank();
        
        // Verify vault was created
        assertTrue(vaultAddress != address(0));
        assertTrue(factory.isVault(vaultAddress));
        assertEq(factory.getTotalVaults(), 1);
        
        // Verify vault properties
        RewardVault vault = RewardVault(vaultAddress);
        assertEq(address(vault.asset()), address(token1));
        assertEq(vault.owner(), creator1);
        assertEq(vault.factory(), address(factory));
        assertEq(vault.apy(), APY);
        assertEq(vault.rewardsPool(), expectedVaultDeposit);
        
        // Verify fee was collected
        assertEq(token1.balanceOf(feeRecipient), expectedFee);
        
        // Verify factory tracking
        address[] memory allVaults = factory.getAllVaults();
        assertEq(allVaults.length, 1);
        assertEq(allVaults[0], vaultAddress);
        
        address[] memory creatorVaults = factory.getVaultsByCreator(creator1);
        assertEq(creatorVaults.length, 1);
        assertEq(creatorVaults[0], vaultAddress);
        
        address[] memory assetVaults = factory.getVaultsByAsset(address(token1));
        assertEq(assetVaults.length, 1);
        assertEq(assetVaults[0], vaultAddress);
    }

    function testCreateVaultInvalidAsset() public {
        vm.startPrank(creator1);
        vm.expectRevert("Invalid asset");
        factory.createVault(
            address(0),
            "Test Vault",
            "tVAULT",
            APY,
            INITIAL_REWARDS,
            MIN_DEPOSIT,
            MAX_DEPOSIT_PER_USER
        );
        vm.stopPrank();
    }

    function testCreateVaultEmptyName() public {
        vm.startPrank(creator1);
        token1.approve(address(factory), INITIAL_REWARDS);
        
        vm.expectRevert("Empty name");
        factory.createVault(
            address(token1),
            "",
            "tVAULT",
            APY,
            INITIAL_REWARDS,
            MIN_DEPOSIT,
            MAX_DEPOSIT_PER_USER
        );
        vm.stopPrank();
    }

    function testCreateVaultEmptySymbol() public {
        vm.startPrank(creator1);
        token1.approve(address(factory), INITIAL_REWARDS);
        
        vm.expectRevert("Empty symbol");
        factory.createVault(
            address(token1),
            "Test Vault",
            "",
            APY,
            INITIAL_REWARDS,
            MIN_DEPOSIT,
            MAX_DEPOSIT_PER_USER
        );
        vm.stopPrank();
    }

    function testCreateVaultInvalidAPY() public {
        vm.startPrank(creator1);
        token1.approve(address(factory), INITIAL_REWARDS);
        
        vm.expectRevert("Invalid APY");
        factory.createVault(
            address(token1),
            "Test Vault",
            "tVAULT",
            10001, // > 100%
            INITIAL_REWARDS,
            MIN_DEPOSIT,
            MAX_DEPOSIT_PER_USER
        );
        vm.stopPrank();
    }

    function testCreateVaultNoInitialDeposit() public {
        vm.startPrank(creator1);
        vm.expectRevert("No initial deposit");
        factory.createVault(
            address(token1),
            "Test Vault",
            "tVAULT",
            APY,
            0,
            MIN_DEPOSIT,
            MAX_DEPOSIT_PER_USER
        );
        vm.stopPrank();
    }

    function testCreateMultipleVaults() public {
        // Creator1 creates vault for token1
        vm.startPrank(creator1);
        token1.approve(address(factory), INITIAL_REWARDS);
        address vault1 = factory.createVault(
            address(token1),
            "Vault 1",
            "V1",
            APY,
            INITIAL_REWARDS,
            MIN_DEPOSIT,
            MAX_DEPOSIT_PER_USER
        );
        vm.stopPrank();
        
        // Creator2 creates vault for token2
        vm.startPrank(creator2);
        token2.approve(address(factory), INITIAL_REWARDS / 1e12); // Adjust for 6 decimals
        address vault2 = factory.createVault(
            address(token2),
            "Vault 2",
            "V2",
            1500, // 15% APY
            INITIAL_REWARDS / 1e12,
            MIN_DEPOSIT / 1e12,
            MAX_DEPOSIT_PER_USER / 1e12
        );
        vm.stopPrank();
        
        // Creator1 creates another vault for token1
        vm.startPrank(creator1);
        token1.approve(address(factory), INITIAL_REWARDS);
        address vault3 = factory.createVault(
            address(token1),
            "Vault 3",
            "V3",
            800, // 8% APY
            INITIAL_REWARDS,
            MIN_DEPOSIT,
            0 // No max limit
        );
        vm.stopPrank();
        
        // Verify total count
        assertEq(factory.getTotalVaults(), 3);
        
        // Verify creator tracking
        address[] memory creator1Vaults = factory.getVaultsByCreator(creator1);
        assertEq(creator1Vaults.length, 2);
        assertTrue(creator1Vaults[0] == vault1 || creator1Vaults[1] == vault1);
        assertTrue(creator1Vaults[0] == vault3 || creator1Vaults[1] == vault3);
        
        address[] memory creator2Vaults = factory.getVaultsByCreator(creator2);
        assertEq(creator2Vaults.length, 1);
        assertEq(creator2Vaults[0], vault2);
        
        // Verify asset tracking
        address[] memory token1Vaults = factory.getVaultsByAsset(address(token1));
        assertEq(token1Vaults.length, 2);
        
        address[] memory token2Vaults = factory.getVaultsByAsset(address(token2));
        assertEq(token2Vaults.length, 1);
        assertEq(token2Vaults[0], vault2);
    }

    // ============ Admin Functions Tests ============

    function testDeactivateVaultByCreator() public {
        // Create vault
        vm.startPrank(creator1);
        token1.approve(address(factory), INITIAL_REWARDS);
        address vaultAddress = factory.createVault(
            address(token1),
            "Test Vault",
            "tVAULT",
            APY,
            INITIAL_REWARDS,
            MIN_DEPOSIT,
            MAX_DEPOSIT_PER_USER
        );
        
        // Deactivate vault
        vm.expectEmit(true, true, true, true);
        emit VaultDeactivated(vaultAddress, block.timestamp);
        
        factory.deactivateVault(vaultAddress);
        vm.stopPrank();
        
        // Verify deactivation
        VaultFactory.VaultData memory data = factory.getVaultData(vaultAddress);
        assertFalse(data.active);
    }

    function testDeactivateVaultByFactoryOwner() public {
        // Create vault
        vm.startPrank(creator1);
        token1.approve(address(factory), INITIAL_REWARDS);
        address vaultAddress = factory.createVault(
            address(token1),
            "Test Vault",
            "tVAULT",
            APY,
            INITIAL_REWARDS,
            MIN_DEPOSIT,
            MAX_DEPOSIT_PER_USER
        );
        vm.stopPrank();
        
        // Factory owner deactivates vault
        vm.startPrank(factoryOwner);
        factory.deactivateVault(vaultAddress);
        vm.stopPrank();
        
        // Verify deactivation
        VaultFactory.VaultData memory data = factory.getVaultData(vaultAddress);
        assertFalse(data.active);
    }

    function testDeactivateVaultNotAuthorized() public {
        // Create vault
        vm.startPrank(creator1);
        token1.approve(address(factory), INITIAL_REWARDS);
        address vaultAddress = factory.createVault(
            address(token1),
            "Test Vault",
            "tVAULT",
            APY,
            INITIAL_REWARDS,
            MIN_DEPOSIT,
            MAX_DEPOSIT_PER_USER
        );
        vm.stopPrank();
        
        // Unauthorized user tries to deactivate
        vm.startPrank(creator2);
        vm.expectRevert("Not authorized");
        factory.deactivateVault(vaultAddress);
        vm.stopPrank();
    }

    function testDeactivateVaultNotAVault() public {
        vm.startPrank(factoryOwner);
        vm.expectRevert("Not a vault");
        factory.deactivateVault(address(0x123));
        vm.stopPrank();
    }

    function testUpdateFactoryFee() public {
        uint256 newFee = 200; // 2%
        
        vm.startPrank(factoryOwner);
        vm.expectEmit(true, true, true, true);
        emit FactoryFeeUpdated(FACTORY_FEE, newFee);
        
        factory.updateFactoryFee(newFee);
        vm.stopPrank();
        
        assertEq(factory.factoryFee(), newFee);
    }

    function testUpdateFactoryFeeNotOwner() public {
        vm.startPrank(creator1);
        vm.expectRevert("Not factory owner");
        factory.updateFactoryFee(200);
        vm.stopPrank();
    }

    function testUpdateFactoryFeeToHigh() public {
        vm.startPrank(factoryOwner);
        vm.expectRevert("Fee too high");
        factory.updateFactoryFee(1001); // > 10%
        vm.stopPrank();
    }

    function testUpdateFeeRecipient() public {
        address newRecipient = address(0x999);
        
        vm.startPrank(factoryOwner);
        vm.expectEmit(true, true, true, true);
        emit FeeRecipientUpdated(feeRecipient, newRecipient);
        
        factory.updateFeeRecipient(newRecipient);
        vm.stopPrank();
        
        assertEq(factory.feeRecipient(), newRecipient);
    }

    function testUpdateFeeRecipientNotOwner() public {
        vm.startPrank(creator1);
        vm.expectRevert("Not factory owner");
        factory.updateFeeRecipient(address(0x999));
        vm.stopPrank();
    }

    function testUpdateFeeRecipientInvalid() public {
        vm.startPrank(factoryOwner);
        vm.expectRevert("Invalid recipient");
        factory.updateFeeRecipient(address(0));
        vm.stopPrank();
    }

    // ============ View Functions Tests ============

    function testGetActiveVaults() public {
        // Create multiple vaults
        vm.startPrank(creator1);
        token1.approve(address(factory), INITIAL_REWARDS * 3);
        
        address vault1 = factory.createVault(
            address(token1), "Vault 1", "V1", APY, INITIAL_REWARDS, MIN_DEPOSIT, MAX_DEPOSIT_PER_USER
        );
        address vault2 = factory.createVault(
            address(token1), "Vault 2", "V2", APY, INITIAL_REWARDS, MIN_DEPOSIT, MAX_DEPOSIT_PER_USER
        );
        address vault3 = factory.createVault(
            address(token1), "Vault 3", "V3", APY, INITIAL_REWARDS, MIN_DEPOSIT, MAX_DEPOSIT_PER_USER
        );
        
        // Deactivate one vault
        factory.deactivateVault(vault2);
        vm.stopPrank();
        
        // Check active vaults
        address[] memory activeVaults = factory.getActiveVaults();
        assertEq(activeVaults.length, 2);
        assertTrue(activeVaults[0] == vault1 || activeVaults[1] == vault1);
        assertTrue(activeVaults[0] == vault3 || activeVaults[1] == vault3);
        
        // Ensure deactivated vault is not in active list
        for (uint256 i = 0; i < activeVaults.length; i++) {
            assertTrue(activeVaults[i] != vault2);
        }
    }

    function testGetActiveVaultsByAsset() public {
        // Create vaults for different assets
        vm.startPrank(creator1);
        token1.approve(address(factory), INITIAL_REWARDS * 2);
        token2.approve(address(factory), INITIAL_REWARDS / 1e12);
        
        address vault1 = factory.createVault(
            address(token1), "Vault 1", "V1", APY, INITIAL_REWARDS, MIN_DEPOSIT, MAX_DEPOSIT_PER_USER
        );
        address vault2 = factory.createVault(
            address(token1), "Vault 2", "V2", APY, INITIAL_REWARDS, MIN_DEPOSIT, MAX_DEPOSIT_PER_USER
        );
        address vault3 = factory.createVault(
            address(token2), "Vault 3", "V3", APY, INITIAL_REWARDS / 1e12, MIN_DEPOSIT / 1e12, MAX_DEPOSIT_PER_USER / 1e12
        );
        
        // Deactivate one token1 vault
        factory.deactivateVault(vault1);
        vm.stopPrank();
        
        // Check active vaults by asset
        address[] memory activeToken1Vaults = factory.getActiveVaultsByAsset(address(token1));
        assertEq(activeToken1Vaults.length, 1);
        assertEq(activeToken1Vaults[0], vault2);
        
        address[] memory activeToken2Vaults = factory.getActiveVaultsByAsset(address(token2));
        assertEq(activeToken2Vaults.length, 1);
        assertEq(activeToken2Vaults[0], vault3);
    }

    function testGetVaultsPaginated() public {
        // Create multiple vaults
        vm.startPrank(creator1);
        token1.approve(address(factory), INITIAL_REWARDS * 5);
        
        address[] memory vaults = new address[](5);
        for (uint256 i = 0; i < 5; i++) {
            vaults[i] = factory.createVault(
                address(token1),
                string(abi.encodePacked("Vault ", vm.toString(i))),
                string(abi.encodePacked("V", vm.toString(i))),
                APY,
                INITIAL_REWARDS,
                MIN_DEPOSIT,
                MAX_DEPOSIT_PER_USER
            );
        }
        vm.stopPrank();
        
        // Test pagination
        address[] memory page1 = factory.getVaultsPaginated(0, 2);
        assertEq(page1.length, 2);
        assertEq(page1[0], vaults[0]);
        assertEq(page1[1], vaults[1]);
        
        address[] memory page2 = factory.getVaultsPaginated(2, 2);
        assertEq(page2.length, 2);
        assertEq(page2[0], vaults[2]);
        assertEq(page2[1], vaults[3]);
        
        address[] memory page3 = factory.getVaultsPaginated(4, 2);
        assertEq(page3.length, 1); // Only one vault left
        assertEq(page3[0], vaults[4]);
    }

    function testGetVaultDetails() public {
        // Create vault
        vm.startPrank(creator1);
        token1.approve(address(factory), INITIAL_REWARDS);
        address vaultAddress = factory.createVault(
            address(token1),
            "Test Vault",
            "tVAULT",
            APY,
            INITIAL_REWARDS,
            MIN_DEPOSIT,
            MAX_DEPOSIT_PER_USER
        );
        
        // Rewards pool is now automatically set up
        
        vm.stopPrank();
        
        // Get vault details
        (
            address returnedVaultAddress,
            address asset,
            address creator,
            string memory name,
            string memory symbol,
            uint256 apr,
            uint256 initialDeposit,
            uint256 createdAt,
            bool active,
            uint256 totalUserDeposits,
            uint256 rewardsPoolRemaining,
            uint256 totalRewardsClaimed,
            uint256 totalDepositors
        ) = factory.getVaultDetails(vaultAddress);
        
        assertEq(returnedVaultAddress, vaultAddress);
        assertEq(asset, address(token1));
        assertEq(creator, creator1);
        assertEq(name, "Test Vault");
        assertEq(symbol, "tVAULT");
        assertEq(apr, APY);
        assertGt(initialDeposit, 0);
        assertEq(createdAt, block.timestamp);
        assertTrue(active);
        assertEq(totalUserDeposits, 0);
        assertGt(rewardsPoolRemaining, 0);
        assertEq(totalRewardsClaimed, 0);
        assertEq(totalDepositors, 0);
    }

    function testGetVaultBasicInfo() public {
        // Create vault
        vm.startPrank(creator1);
        token1.approve(address(factory), INITIAL_REWARDS);
        address vaultAddress = factory.createVault(
            address(token1),
            "Test Vault",
            "tVAULT",
            APY,
            INITIAL_REWARDS,
            MIN_DEPOSIT,
            MAX_DEPOSIT_PER_USER
        );
        vm.stopPrank();
        
        // Get basic info
        (
            address asset,
            address creator,
            string memory name,
            uint256 apr,
            bool active
        ) = factory.getVaultBasicInfo(vaultAddress);
        
        assertEq(asset, address(token1));
        assertEq(creator, creator1);
        assertEq(name, "Test Vault");
        assertEq(apr, APY);
        assertTrue(active);
    }

    function testGetMultipleVaultDetails() public {
        // Create multiple vaults
        vm.startPrank(creator1);
        token1.approve(address(factory), INITIAL_REWARDS * 2);
        
        address vault1 = factory.createVault(
            address(token1), "Vault 1", "V1", APY, INITIAL_REWARDS, MIN_DEPOSIT, MAX_DEPOSIT_PER_USER
        );
        address vault2 = factory.createVault(
            address(token1), "Vault 2", "V2", 1500, INITIAL_REWARDS, MIN_DEPOSIT, MAX_DEPOSIT_PER_USER
        );
        vm.stopPrank();
        
        // Get multiple vault details
        address[] memory vaultAddresses = new address[](2);
        vaultAddresses[0] = vault1;
        vaultAddresses[1] = vault2;
        
        (
            VaultFactory.VaultData[] memory datas,
            uint256[] memory totalDeposits,
            uint256[] memory rewardPools,
            uint256[] memory depositorCounts
        ) = factory.getMultipleVaultDetails(vaultAddresses);
        
        assertEq(datas.length, 2);
        assertEq(totalDeposits.length, 2);
        assertEq(rewardPools.length, 2);
        assertEq(depositorCounts.length, 2);
        
        assertEq(datas[0].vaultAddress, vault1);
        assertEq(datas[1].vaultAddress, vault2);
        assertEq(datas[0].apr, APY);
        assertEq(datas[1].apr, 1500);
    }

    function testGetFactoryStats() public {
        // Create some vaults
        vm.startPrank(creator1);
        token1.approve(address(factory), INITIAL_REWARDS * 3);
        
        factory.createVault(
            address(token1), "Vault 1", "V1", APY, INITIAL_REWARDS, MIN_DEPOSIT, MAX_DEPOSIT_PER_USER
        );
        address vault2 = factory.createVault(
            address(token1), "Vault 2", "V2", APY, INITIAL_REWARDS, MIN_DEPOSIT, MAX_DEPOSIT_PER_USER
        );
        factory.createVault(
            address(token1), "Vault 3", "V3", APY, INITIAL_REWARDS, MIN_DEPOSIT, MAX_DEPOSIT_PER_USER
        );
        
        // Deactivate one vault
        factory.deactivateVault(vault2);
        vm.stopPrank();
        
        // Get factory stats
        (
            uint256 totalVaultsCreated,
            uint256 activeVaultsCount,
            address factoryOwnerAddress,
            address feeRecipientAddress,
            uint256 currentFactoryFee
        ) = factory.getFactoryStats();
        
        assertEq(totalVaultsCreated, 3);
        assertEq(activeVaultsCount, 2);
        assertEq(factoryOwnerAddress, factoryOwner);
        assertEq(feeRecipientAddress, feeRecipient);
        assertEq(currentFactoryFee, FACTORY_FEE);
    }

    function testGetVaultsByMultipleCreators() public {
        // Create vaults with different creators
        vm.startPrank(creator1);
        token1.approve(address(factory), INITIAL_REWARDS * 2);
        factory.createVault(
            address(token1), "Vault 1", "V1", APY, INITIAL_REWARDS, MIN_DEPOSIT, MAX_DEPOSIT_PER_USER
        );
        factory.createVault(
            address(token1), "Vault 2", "V2", APY, INITIAL_REWARDS, MIN_DEPOSIT, MAX_DEPOSIT_PER_USER
        );
        vm.stopPrank();
        
        vm.startPrank(creator2);
        token1.approve(address(factory), INITIAL_REWARDS);
        factory.createVault(
            address(token1), "Vault 3", "V3", APY, INITIAL_REWARDS, MIN_DEPOSIT, MAX_DEPOSIT_PER_USER
        );
        vm.stopPrank();
        
        // Query multiple creators
        address[] memory creators = new address[](2);
        creators[0] = creator1;
        creators[1] = creator2;
        
        address[][] memory result = factory.getVaultsByMultipleCreators(creators);
        
        assertEq(result.length, 2);
        assertEq(result[0].length, 2); // creator1 has 2 vaults
        assertEq(result[1].length, 1); // creator2 has 1 vault
    }

    function testGetVaultsByMultipleAssets() public {
        // Create vaults for different assets
        vm.startPrank(creator1);
        token1.approve(address(factory), INITIAL_REWARDS * 2);
        token2.approve(address(factory), INITIAL_REWARDS / 1e12);
        
        factory.createVault(
            address(token1), "Vault 1", "V1", APY, INITIAL_REWARDS, MIN_DEPOSIT, MAX_DEPOSIT_PER_USER
        );
        factory.createVault(
            address(token1), "Vault 2", "V2", APY, INITIAL_REWARDS, MIN_DEPOSIT, MAX_DEPOSIT_PER_USER
        );
        factory.createVault(
            address(token2), "Vault 3", "V3", APY, INITIAL_REWARDS / 1e12, MIN_DEPOSIT / 1e12, MAX_DEPOSIT_PER_USER / 1e12
        );
        vm.stopPrank();
        
        // Query multiple assets
        address[] memory assets = new address[](2);
        assets[0] = address(token1);
        assets[1] = address(token2);
        
        address[][] memory result = factory.getVaultsByMultipleAssets(assets);
        
        assertEq(result.length, 2);
        assertEq(result[0].length, 2); // token1 has 2 vaults
        assertEq(result[1].length, 1); // token2 has 1 vault
    }

    // ============ Integration Tests ============

    function testFullWorkflow() public {
        // 1. Create vault
        vm.startPrank(creator1);
        token1.approve(address(factory), INITIAL_REWARDS);
        address vaultAddress = factory.createVault(
            address(token1),
            "Integration Test Vault",
            "ITV",
            APY,
            INITIAL_REWARDS,
            MIN_DEPOSIT,
            MAX_DEPOSIT_PER_USER
        );
        
        // Rewards pool is now automatically set up
        
        vm.stopPrank();
        
        // 2. User deposits into vault
        RewardVault vault = RewardVault(vaultAddress);
        vm.startPrank(user1);
        token1.approve(vaultAddress, 1000 * 1e18);
        vault.deposit(1000 * 1e18);
        vm.stopPrank();
        
        // 3. Wait for rewards to accrue
        vm.warp(block.timestamp + 30 days);
        
        // 4. Check vault stats through factory
        (
            uint256 totalUserDeposits,
            uint256 currentAPY,
            uint256 rewardsPoolRemaining,
            uint256 totalRewardsClaimed,
            uint256 totalDepositors,
            uint256 totalVaultBalance
        ) = factory.getVaultStats(vaultAddress);
        
        assertEq(totalUserDeposits, 1000 * 1e18);
        assertEq(currentAPY, APY);
        assertGt(rewardsPoolRemaining, 0);
        assertEq(totalRewardsClaimed, 0);
        assertEq(totalDepositors, 1);
        assertGt(totalVaultBalance, 1000 * 1e18); // Should include rewards pool
        
        // 5. User claims rewards
        vm.prank(user1);
        vault.claimRewards();
        
        // 6. Check updated stats
        (,, rewardsPoolRemaining, totalRewardsClaimed,,) = factory.getVaultStats(vaultAddress);
        assertGt(totalRewardsClaimed, 0);
    }

    function testZeroFactoryFee() public {
        // Deploy factory with zero fee
        vm.prank(factoryOwner);
        VaultFactory zeroFeeFactory = new VaultFactory(feeRecipient, 0);
        
        // Create vault
        vm.startPrank(creator1);
        token1.approve(address(zeroFeeFactory), INITIAL_REWARDS);
        
        uint256 feeRecipientBalanceBefore = token1.balanceOf(feeRecipient);
        
        zeroFeeFactory.createVault(
            address(token1),
            "Zero Fee Vault",
            "ZFV",
            APY,
            INITIAL_REWARDS,
            MIN_DEPOSIT,
            MAX_DEPOSIT_PER_USER
        );
        vm.stopPrank();
        
        // Fee recipient should receive no tokens
        uint256 feeRecipientBalanceAfter = token1.balanceOf(feeRecipient);
        assertEq(feeRecipientBalanceAfter, feeRecipientBalanceBefore);
    }
}