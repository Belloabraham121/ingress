// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// IMPORT THE REWARDVAULT CONTRACT
import "./RewardVault.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VaultFactory
 * @notice Factory contract to deploy and manage multiple RewardVault instances
 * @dev This is the MAIN CONTRACT that creates vaults
 *
 * WORKFLOW:
 * 1. Deploy this factory once
 * 2. Call createVault() to deploy new RewardVault instances
 * 3. Factory tracks all vaults and provides query functions
 * 4. Users interact with individual vaults for deposits/withdrawals
 * 5. Query factory to get vault addresses and details
 */
contract VaultFactory is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ State Variables ============

    /// @notice Factory owner (deployer)
    address public immutable factoryOwner;

    /// @notice Address that receives factory fees
    address public feeRecipient;

    /// @notice Factory fee in basis points (100 = 1%)
    uint256 public factoryFee;

    /// @notice Array of all created vault addresses
    address[] public allVaults;

    /// @notice Mapping of vault address to vault metadata
    mapping(address => VaultData) public vaultData;

    /// @notice Mapping of asset token to its vaults
    mapping(address => address[]) public assetToVaults;

    /// @notice Mapping of creator address to their vaults
    mapping(address => address[]) public creatorToVaults;

    /// @notice Check if address is a valid vault from this factory
    mapping(address => bool) public isVault;

    // ============ Structs ============

    /// @notice Vault metadata stored in factory
    struct VaultData {
        address vaultAddress; // Vault contract address
        address asset; // Asset token address
        address creator; // Who created the vault
        string name; // Vault name
        string symbol; // Vault symbol
        uint256 apr; // APY in basis points
        uint256 initialRewardsDeposit; // Initial rewards deposited
        uint256 createdAt; // Creation timestamp
        uint256 vaultIndex; // Index in allVaults array
        bool active; // Is vault active
    }

    // ============ Events ============

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

    // ============ Modifier ============

    modifier onlyFactoryOwner() {
        require(msg.sender == factoryOwner, "Not factory owner");
        _;
    }

    // ============ Constructor ============

    /**
     * @notice Initialize the vault factory
     * @param _feeRecipient Address to receive factory fees
     * @param _factoryFee Fee in basis points (100 = 1%)
     */
    constructor(address _feeRecipient, uint256 _factoryFee) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        require(_factoryFee <= 1000, "Fee too high"); // Max 10%

        factoryOwner = msg.sender;
        feeRecipient = _feeRecipient;
        factoryFee = _factoryFee;
    }

    // ============ Main Factory Function ============

    /**
     * @notice Create and deploy a new RewardVault
     * @dev This function:
     *      1. Takes your initial rewards deposit
     *      2. Deducts factory fee
     *      3. Deploys new RewardVault contract
     *      4. Transfers remaining rewards to vault
     *      5. Tracks vault in factory
     *
     * @param asset Token address for the vault (e.g., USDC, DAI)
     * @param name Vault share token name (e.g., "High Yield USDC Vault")
     * @param symbol Vault share token symbol (e.g., "hyUSDC")
     * @param apy Annual percentage yield in basis points (1200 = 12.00%)
     * @param initialRewardsDeposit Amount you deposit as rewards pool
     * @param minDeposit Minimum deposit amount for users
     * @param maxDepositPerUser Maximum deposit per user (0 = unlimited)
     * @return vaultAddress Address of the deployed vault
     */
    function createVault(
        address asset,
        string memory name,
        string memory symbol,
        uint256 apy,
        uint256 initialRewardsDeposit,
        uint256 minDeposit,
        uint256 maxDepositPerUser
    ) external nonReentrant returns (address vaultAddress) {
        // Validation
        require(asset != address(0), "Invalid asset");
        require(bytes(name).length > 0, "Empty name");
        require(bytes(symbol).length > 0, "Empty symbol");
        require(apy > 0 && apy <= 10000, "Invalid APY");
        require(initialRewardsDeposit > 0, "No initial deposit");

        // Calculate factory fee
        uint256 feeAmount = (initialRewardsDeposit * factoryFee) / 10000;
        uint256 vaultDeposit = initialRewardsDeposit - feeAmount;

        // Transfer total amount from creator to factory
        IERC20(asset).safeTransferFrom(
            msg.sender,
            address(this),
            initialRewardsDeposit
        );

        // Send fee to fee recipient
        if (feeAmount > 0) {
            IERC20(asset).safeTransfer(feeRecipient, feeAmount);
        }

        // DEPLOY NEW REWARDVAULT CONTRACT
        RewardVault newVault = new RewardVault(
            asset,
            name,
            symbol,
            apy,
            msg.sender, // Creator becomes vault owner
            minDeposit,
            maxDepositPerUser
        );

        vaultAddress = address(newVault);

        // Transfer initial rewards to the newly deployed vault
        IERC20(asset).safeTransfer(vaultAddress, vaultDeposit);

        // Automatically register the initial rewards in the vault's rewards pool
        newVault.initializeRewardsPool(vaultDeposit);

        // Store vault metadata in factory
        uint256 vaultIndex = allVaults.length;

        vaultData[vaultAddress] = VaultData({
            vaultAddress: vaultAddress,
            asset: asset,
            creator: msg.sender,
            name: name,
            symbol: symbol,
            apr: apy,
            initialRewardsDeposit: vaultDeposit,
            createdAt: block.timestamp,
            vaultIndex: vaultIndex,
            active: true
        });

        // Update tracking arrays and mappings
        allVaults.push(vaultAddress);
        assetToVaults[asset].push(vaultAddress);
        creatorToVaults[msg.sender].push(vaultAddress);
        isVault[vaultAddress] = true;

        emit VaultCreated(
            vaultAddress,
            asset,
            msg.sender,
            name,
            symbol,
            apy,
            vaultDeposit,
            block.timestamp
        );

        return vaultAddress;
    }

    // ============ Admin Functions ============

    /**
     * @notice Deactivate a vault (marks as inactive, doesn't destroy)
     * @param vault Vault address to deactivate
     */
    function deactivateVault(address vault) external {
        require(isVault[vault], "Not a vault");
        VaultData storage data = vaultData[vault];
        require(
            data.creator == msg.sender || msg.sender == factoryOwner,
            "Not authorized"
        );
        require(data.active, "Already inactive");

        data.active = false;
        emit VaultDeactivated(vault, block.timestamp);
    }

    /**
     * @notice Update factory fee (only factory owner)
     * @param newFee New fee in basis points
     */
    function updateFactoryFee(uint256 newFee) external onlyFactoryOwner {
        require(newFee <= 1000, "Fee too high"); // Max 10%
        uint256 oldFee = factoryFee;
        factoryFee = newFee;
        emit FactoryFeeUpdated(oldFee, newFee);
    }

    /**
     * @notice Update fee recipient address
     * @param newRecipient New recipient address
     */
    function updateFeeRecipient(
        address newRecipient
    ) external onlyFactoryOwner {
        require(newRecipient != address(0), "Invalid recipient");
        address oldRecipient = feeRecipient;
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(oldRecipient, newRecipient);
    }

    // ============ View Functions - Get Vault Addresses ============

    /**
     * @notice Get total number of vaults created
     * @return Total vault count
     */
    function getTotalVaults() external view returns (uint256) {
        return allVaults.length;
    }

    /**
     * @notice Get all vault addresses
     * @return Array of all vault addresses
     */
    function getAllVaults() external view returns (address[] memory) {
        return allVaults;
    }

    /**
     * @notice Get vaults for a specific asset token
     * @param asset Token address (e.g., USDC)
     * @return Array of vault addresses
     */
    function getVaultsByAsset(
        address asset
    ) external view returns (address[] memory) {
        return assetToVaults[asset];
    }

    /**
     * @notice Get vaults created by a specific address
     * @param creator Creator address
     * @return Array of vault addresses
     */
    function getVaultsByCreator(
        address creator
    ) external view returns (address[] memory) {
        return creatorToVaults[creator];
    }

    /**
     * @notice Get vault at a specific index
     * @param index Index in allVaults array
     * @return Vault address
     */
    function getVaultAtIndex(uint256 index) external view returns (address) {
        require(index < allVaults.length, "Index out of bounds");
        return allVaults[index];
    }

    /**
     * @notice Get all active vaults
     * @return Array of active vault addresses
     */
    function getActiveVaults() external view returns (address[] memory) {
        uint256 activeCount = 0;

        // Count active vaults
        for (uint256 i = 0; i < allVaults.length; i++) {
            if (vaultData[allVaults[i]].active) {
                activeCount++;
            }
        }

        // Build array of active vaults
        address[] memory active = new address[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < allVaults.length; i++) {
            if (vaultData[allVaults[i]].active) {
                active[index] = allVaults[i];
                index++;
            }
        }

        return active;
    }

    /**
     * @notice Get active vaults for a specific asset
     * @param asset Token address
     * @return Array of active vault addresses
     */
    function getActiveVaultsByAsset(
        address asset
    ) external view returns (address[] memory) {
        address[] memory assetVaults = assetToVaults[asset];
        uint256 activeCount = 0;

        // Count active vaults
        for (uint256 i = 0; i < assetVaults.length; i++) {
            if (vaultData[assetVaults[i]].active) {
                activeCount++;
            }
        }

        // Build array
        address[] memory active = new address[](activeCount);
        uint256 index = 0;

        for (uint256 i = 0; i < assetVaults.length; i++) {
            if (vaultData[assetVaults[i]].active) {
                active[index] = assetVaults[i];
                index++;
            }
        }

        return active;
    }

    /**
     * @notice Check if an address is a vault from this factory
     * @param vault Address to check
     * @return True if valid vault
     */
    function checkIsVault(address vault) external view returns (bool) {
        return isVault[vault];
    }

    /**
     * @notice Get paginated list of vaults
     * @param startIndex Starting index
     * @param count Number of vaults to return
     * @return Array of vault addresses
     */
    function getVaultsPaginated(
        uint256 startIndex,
        uint256 count
    ) external view returns (address[] memory) {
        require(startIndex < allVaults.length, "Start index out of bounds");

        uint256 endIndex = startIndex + count;
        if (endIndex > allVaults.length) {
            endIndex = allVaults.length;
        }

        uint256 resultCount = endIndex - startIndex;
        address[] memory result = new address[](resultCount);

        for (uint256 i = 0; i < resultCount; i++) {
            result[i] = allVaults[startIndex + i];
        }

        return result;
    }

    // ============ View Functions - Get Vault Details ============

    /**
     * @notice Get complete vault details from factory
     * @param vault Vault address
     * @return vaultAddress Vault contract address
     * @return asset Asset token address
     * @return creator Vault creator
     * @return name Vault name
     * @return symbol Vault symbol
     * @return apr APY in basis points
     * @return initialDeposit Initial rewards deposited
     * @return createdAt Creation timestamp
     * @return active Is vault active
     * @return totalUserDeposits Current user deposits
     * @return rewardsPoolRemaining Remaining rewards
     * @return totalRewardsClaimed Total claimed rewards
     * @return totalDepositors Number of depositors
     */
    function getVaultDetails(
        address vault
    )
        external
        view
        returns (
            address vaultAddress,
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
        )
    {
        require(isVault[vault], "Not a vault");

        VaultData memory data = vaultData[vault];
        RewardVault v = RewardVault(vault);

        (
            uint256 deposits,
            ,  // currentAPY - not used in this function
            uint256 rewardsPool,
            uint256 claimed,
            uint256 depositors,
            // vaultBalance - not used in this function
        ) = v.getVaultStats();

        return (
            data.vaultAddress,
            data.asset,
            data.creator,
            data.name,
            data.symbol,
            data.apr,
            data.initialRewardsDeposit,
            data.createdAt,
            data.active,
            deposits,
            rewardsPool,
            claimed,
            depositors
        );
    }

    /**
     * @notice Get basic vault info (lighter query)
     * @param vault Vault address
     * @return asset Asset token
     * @return creator Vault creator
     * @return name Vault name
     * @return apr APY rate
     * @return active Is active
     */
    function getVaultBasicInfo(
        address vault
    )
        external
        view
        returns (
            address asset,
            address creator,
            string memory name,
            uint256 apr,
            bool active
        )
    {
        require(isVault[vault], "Not a vault");
        VaultData memory data = vaultData[vault];

        return (data.asset, data.creator, data.name, data.apr, data.active);
    }

    /**
     * @notice Get vault statistics
     * @param vault Vault address
     * @return totalUserDeposits Total deposits
     * @return currentAPY Current APY rate
     * @return rewardsPoolRemaining Remaining rewards
     * @return totalRewardsClaimed Total claimed
     * @return totalDepositors Depositor count
     * @return vaultBalance Contract balance
     */
    function getVaultStats(
        address vault
    )
        external
        view
        returns (
            uint256 totalUserDeposits,
            uint256 currentAPY,
            uint256 rewardsPoolRemaining,
            uint256 totalRewardsClaimed,
            uint256 totalDepositors,
            uint256 vaultBalance
        )
    {
        require(isVault[vault], "Not a vault");

        RewardVault v = RewardVault(vault);
        return v.getVaultStats();
    }

    /**
     * @notice Get vault health metrics
     * @param vault Vault address
     * @return rewardsPoolBalance Rewards remaining
     * @return projectedDailyClaims Daily claim projection
     * @return daysUntilEmpty Days until depleted
     */
    function getVaultHealth(
        address vault
    )
        external
        view
        returns (
            uint256 rewardsPoolBalance,
            uint256 projectedDailyClaims,
            uint256 daysUntilEmpty
        )
    {
        require(isVault[vault], "Not a vault");

        RewardVault v = RewardVault(vault);
        return v.getVaultHealth();
    }

    /**
     * @notice Get details for multiple vaults at once (batch query)
     * @param vaults Array of vault addresses
     * @return datas Array of vault data
     * @return totalDeposits Array of deposit amounts
     * @return rewardPools Array of reward pools
     * @return depositorCounts Array of depositor counts
     */
    function getMultipleVaultDetails(
        address[] calldata vaults
    )
        external
        view
        returns (
            VaultData[] memory datas,
            uint256[] memory totalDeposits,
            uint256[] memory rewardPools,
            uint256[] memory depositorCounts
        )
    {
        uint256 length = vaults.length;
        datas = new VaultData[](length);
        totalDeposits = new uint256[](length);
        rewardPools = new uint256[](length);
        depositorCounts = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            if (isVault[vaults[i]]) {
                datas[i] = vaultData[vaults[i]];

                RewardVault v = RewardVault(vaults[i]);
                (
                    uint256 deposits,
                    ,
                    uint256 rewards,
                    ,
                    uint256 depositors,

                ) = v.getVaultStats();

                totalDeposits[i] = deposits;
                rewardPools[i] = rewards;
                depositorCounts[i] = depositors;
            }
        }

        return (datas, totalDeposits, rewardPools, depositorCounts);
    }

    /**
     * @notice Get factory-level statistics
     * @return totalVaultsCreated Total vaults created
     * @return activeVaultsCount Active vaults
     * @return factoryOwnerAddress Factory owner
     * @return feeRecipientAddress Fee recipient
     * @return currentFactoryFee Current fee
     */
    function getFactoryStats()
        external
        view
        returns (
            uint256 totalVaultsCreated,
            uint256 activeVaultsCount,
            address factoryOwnerAddress,
            address feeRecipientAddress,
            uint256 currentFactoryFee
        )
    {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < allVaults.length; i++) {
            if (vaultData[allVaults[i]].active) {
                activeCount++;
            }
        }

        return (
            allVaults.length,
            activeCount,
            factoryOwner,
            feeRecipient,
            factoryFee
        );
    }

    /**
     * @notice Get vault data stored in factory
     * @param vault Vault address
     * @return VaultData struct
     */
    function getVaultData(
        address vault
    ) external view returns (VaultData memory) {
        require(isVault[vault], "Not a vault");
        return vaultData[vault];
    }

    /**
     * @notice Get vaults by multiple creators at once
     * @param creators Array of creator addresses
     * @return Array of arrays of vault addresses
     */
    function getVaultsByMultipleCreators(
        address[] calldata creators
    ) external view returns (address[][] memory) {
        address[][] memory result = new address[][](creators.length);

        for (uint256 i = 0; i < creators.length; i++) {
            result[i] = creatorToVaults[creators[i]];
        }

        return result;
    }

    /**
     * @notice Get vaults by multiple assets at once
     * @param assets Array of asset addresses
     * @return Array of arrays of vault addresses
     */
    function getVaultsByMultipleAssets(
        address[] calldata assets
    ) external view returns (address[][] memory) {
        address[][] memory result = new address[][](assets.length);

        for (uint256 i = 0; i < assets.length; i++) {
            result[i] = assetToVaults[assets[i]];
        }

        return result;
    }
}
