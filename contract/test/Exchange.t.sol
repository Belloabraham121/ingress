// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/Exchange.sol";
import "./MockERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ExchangeTest is Test {
    Exchange public vault;
    MockERC20 public token;

    address public owner = address(0x1);
    address public authorizedWithdrawer = address(0x2);
    address public user1 = address(0x3);
    address public user2 = address(0x4);
    address public recipient = address(0x5);

    uint256 public constant INITIAL_BALANCE = 1000 ether;
    uint256 public constant DEPOSIT_AMOUNT = 100 ether;
    uint256 public constant HBAR_DEPOSIT = 1 ether;

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

    function setUp() public {
        vm.startPrank(owner);
        vault = new Exchange(authorizedWithdrawer);
        token = new MockERC20("Test Token", "TEST", 18, 0);
        vm.stopPrank();

        // Give users some tokens and HBAR
        token.mint(user1, INITIAL_BALANCE);
        token.mint(user2, INITIAL_BALANCE);
        vm.deal(user1, INITIAL_BALANCE);
        vm.deal(user2, INITIAL_BALANCE);
    }

    function testConstructor() public {
        assertEq(vault.owner(), owner);
        assertEq(vault.authorizedWithdrawer(), authorizedWithdrawer);
    }

    function testConstructorWithZeroAddress() public {
        vm.expectRevert(Exchange.InvalidAddress.selector);
        vm.prank(owner);
        new Exchange(address(0));
    }

    function testDepositToken() public {
        vm.startPrank(user1);
        token.approve(address(vault), DEPOSIT_AMOUNT);

        vm.expectEmit(true, true, false, true);
        emit TokenDeposited(user1, address(token), DEPOSIT_AMOUNT);

        vault.depositToken(address(token), DEPOSIT_AMOUNT);
        vm.stopPrank();

        assertEq(
            vault.getUserTokenBalance(user1, address(token)),
            DEPOSIT_AMOUNT
        );
        assertEq(vault.getTotalTokenDeposits(address(token)), DEPOSIT_AMOUNT);
        assertEq(token.balanceOf(address(vault)), DEPOSIT_AMOUNT);
    }

    function testDepositTokenWithZeroAddress() public {
        vm.startPrank(user1);
        vm.expectRevert(Exchange.InvalidToken.selector);
        vault.depositToken(address(0), DEPOSIT_AMOUNT);
        vm.stopPrank();
    }

    function testDepositTokenWithZeroAmount() public {
        vm.startPrank(user1);
        vm.expectRevert(Exchange.InvalidAmount.selector);
        vault.depositToken(address(token), 0);
        vm.stopPrank();
    }

    function testDepositHbar() public {
        vm.startPrank(user1);

        vm.expectEmit(true, false, false, true);
        emit HbarDeposited(user1, HBAR_DEPOSIT);

        vault.depositHbar{value: HBAR_DEPOSIT}();
        vm.stopPrank();

        assertEq(vault.getUserHbarBalance(user1), HBAR_DEPOSIT);
        assertEq(vault.getTotalHbarDeposits(), HBAR_DEPOSIT);
        assertEq(address(vault).balance, HBAR_DEPOSIT);
    }

    function testDepositHbarWithZeroAmount() public {
        vm.startPrank(user1);
        vm.expectRevert(Exchange.InvalidAmount.selector);
        vault.depositHbar{value: 0}();
        vm.stopPrank();
    }

    function testDepositHbarViaReceive() public {
        vm.startPrank(user1);

        vm.expectEmit(true, false, false, true);
        emit HbarDeposited(user1, HBAR_DEPOSIT);

        (bool success, ) = address(vault).call{value: HBAR_DEPOSIT}("");
        assertTrue(success);
        vm.stopPrank();

        assertEq(vault.getUserHbarBalance(user1), HBAR_DEPOSIT);
        assertEq(vault.getTotalHbarDeposits(), HBAR_DEPOSIT);
    }

    function testWithdrawToken() public {
        // First deposit tokens
        vm.startPrank(user1);
        token.approve(address(vault), DEPOSIT_AMOUNT);
        vault.depositToken(address(token), DEPOSIT_AMOUNT);
        vm.stopPrank();

        // Withdraw tokens as authorized withdrawer
        vm.startPrank(authorizedWithdrawer);

        vm.expectEmit(true, true, false, true);
        emit TokenWithdrawn(
            recipient,
            address(token),
            DEPOSIT_AMOUNT,
            authorizedWithdrawer
        );

        vault.withdrawToken(address(token), recipient, DEPOSIT_AMOUNT);
        vm.stopPrank();

        assertEq(token.balanceOf(recipient), DEPOSIT_AMOUNT);
        assertEq(vault.getTotalTokenDeposits(address(token)), 0);
    }

    function testWithdrawTokenUnauthorized() public {
        vm.startPrank(user1);
        token.approve(address(vault), DEPOSIT_AMOUNT);
        vault.depositToken(address(token), DEPOSIT_AMOUNT);

        vm.expectRevert(Exchange.UnauthorizedWithdrawal.selector);
        vault.withdrawToken(address(token), recipient, DEPOSIT_AMOUNT);
        vm.stopPrank();
    }

    function testWithdrawTokenInsufficientBalance() public {
        vm.startPrank(authorizedWithdrawer);
        vm.expectRevert(Exchange.InsufficientBalance.selector);
        vault.withdrawToken(address(token), recipient, DEPOSIT_AMOUNT);
        vm.stopPrank();
    }

    function testWithdrawTokenInvalidInputs() public {
        vm.startPrank(authorizedWithdrawer);

        // Invalid token address
        vm.expectRevert(Exchange.InvalidToken.selector);
        vault.withdrawToken(address(0), recipient, DEPOSIT_AMOUNT);

        // Invalid recipient address
        vm.expectRevert(Exchange.InvalidAddress.selector);
        vault.withdrawToken(address(token), address(0), DEPOSIT_AMOUNT);

        // Invalid amount
        vm.expectRevert(Exchange.InvalidAmount.selector);
        vault.withdrawToken(address(token), recipient, 0);

        vm.stopPrank();
    }

    function testWithdrawHbar() public {
        // First deposit HBAR
        vm.startPrank(user1);
        vault.depositHbar{value: HBAR_DEPOSIT}();
        vm.stopPrank();

        uint256 recipientBalanceBefore = recipient.balance;

        // Withdraw HBAR as authorized withdrawer
        vm.startPrank(authorizedWithdrawer);

        vm.expectEmit(true, false, false, true);
        emit HbarWithdrawn(recipient, HBAR_DEPOSIT, authorizedWithdrawer);

        vault.withdrawHbar(payable(recipient), HBAR_DEPOSIT);
        vm.stopPrank();

        assertEq(recipient.balance, recipientBalanceBefore + HBAR_DEPOSIT);
        assertEq(vault.getTotalHbarDeposits(), 0);
    }

    function testWithdrawHbarUnauthorized() public {
        vm.startPrank(user1);
        vault.depositHbar{value: HBAR_DEPOSIT}();

        vm.expectRevert(Exchange.UnauthorizedWithdrawal.selector);
        vault.withdrawHbar(payable(recipient), HBAR_DEPOSIT);
        vm.stopPrank();
    }

    function testWithdrawHbarInsufficientBalance() public {
        vm.startPrank(authorizedWithdrawer);
        vm.expectRevert(Exchange.InsufficientBalance.selector);
        vault.withdrawHbar(payable(recipient), HBAR_DEPOSIT);
        vm.stopPrank();
    }

    function testWithdrawHbarInvalidInputs() public {
        vm.startPrank(authorizedWithdrawer);

        // Invalid recipient address
        vm.expectRevert(Exchange.InvalidAddress.selector);
        vault.withdrawHbar(payable(address(0)), HBAR_DEPOSIT);

        // Invalid amount
        vm.expectRevert(Exchange.InvalidAmount.selector);
        vault.withdrawHbar(payable(recipient), 0);

        vm.stopPrank();
    }

    function testUpdateAuthorizedWithdrawer() public {
        address newWithdrawer = address(0x6);

        vm.startPrank(owner);

        vm.expectEmit(true, true, false, false);
        emit AuthorizedWithdrawerUpdated(authorizedWithdrawer, newWithdrawer);

        vault.updateAuthorizedWithdrawer(newWithdrawer);
        vm.stopPrank();

        assertEq(vault.authorizedWithdrawer(), newWithdrawer);
    }

    function testUpdateAuthorizedWithdrawerUnauthorized() public {
        vm.startPrank(user1);
        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                user1
            )
        );
        vault.updateAuthorizedWithdrawer(address(0x6));
        vm.stopPrank();
    }

    function testUpdateAuthorizedWithdrawerInvalidAddress() public {
        vm.startPrank(owner);
        vm.expectRevert(Exchange.InvalidAddress.selector);
        vault.updateAuthorizedWithdrawer(address(0));
        vm.stopPrank();
    }

    function testGetBalances() public {
        // Deposit tokens and HBAR
        vm.startPrank(user1);
        token.approve(address(vault), DEPOSIT_AMOUNT);
        vault.depositToken(address(token), DEPOSIT_AMOUNT);
        vault.depositHbar{value: HBAR_DEPOSIT}();
        vm.stopPrank();

        // Test getter functions
        assertEq(
            vault.getUserTokenBalance(user1, address(token)),
            DEPOSIT_AMOUNT
        );
        assertEq(vault.getUserHbarBalance(user1), HBAR_DEPOSIT);
        assertEq(vault.getContractTokenBalance(address(token)), DEPOSIT_AMOUNT);
        assertEq(vault.getContractHbarBalance(), HBAR_DEPOSIT);
        assertEq(vault.getTotalTokenDeposits(address(token)), DEPOSIT_AMOUNT);
        assertEq(vault.getTotalHbarDeposits(), HBAR_DEPOSIT);
    }

    function testEmergencyRecoverToken() public {
        // Deposit tokens
        vm.startPrank(user1);
        token.approve(address(vault), DEPOSIT_AMOUNT);
        vault.depositToken(address(token), DEPOSIT_AMOUNT);
        vm.stopPrank();

        uint256 ownerBalanceBefore = token.balanceOf(owner);

        // Emergency recover as owner
        vm.startPrank(owner);
        vault.emergencyRecoverToken(address(token), DEPOSIT_AMOUNT);
        vm.stopPrank();

        assertEq(token.balanceOf(owner), ownerBalanceBefore + DEPOSIT_AMOUNT);
    }

    function testEmergencyRecoverTokenUnauthorized() public {
        vm.startPrank(user1);
        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                user1
            )
        );
        vault.emergencyRecoverToken(address(token), DEPOSIT_AMOUNT);
        vm.stopPrank();
    }

    function testEmergencyRecoverHbar() public {
        // Deposit HBAR
        vm.startPrank(user1);
        vault.depositHbar{value: HBAR_DEPOSIT}();
        vm.stopPrank();

        uint256 ownerBalanceBefore = owner.balance;

        // Emergency recover as owner
        vm.startPrank(owner);
        vault.emergencyRecoverHbar(HBAR_DEPOSIT);
        vm.stopPrank();

        assertEq(owner.balance, ownerBalanceBefore + HBAR_DEPOSIT);
    }

    function testEmergencyRecoverHbarUnauthorized() public {
        vm.startPrank(user1);
        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                user1
            )
        );
        vault.emergencyRecoverHbar(HBAR_DEPOSIT);
        vm.stopPrank();
    }

    function testEmergencyRecoverHbarInsufficientBalance() public {
        vm.startPrank(owner);
        vm.expectRevert(Exchange.InsufficientBalance.selector);
        vault.emergencyRecoverHbar(HBAR_DEPOSIT);
        vm.stopPrank();
    }

    function testMultipleUsersDeposits() public {
        // User1 deposits
        vm.startPrank(user1);
        token.approve(address(vault), DEPOSIT_AMOUNT);
        vault.depositToken(address(token), DEPOSIT_AMOUNT);
        vault.depositHbar{value: HBAR_DEPOSIT}();
        vm.stopPrank();

        // User2 deposits
        vm.startPrank(user2);
        token.approve(address(vault), DEPOSIT_AMOUNT * 2);
        vault.depositToken(address(token), DEPOSIT_AMOUNT * 2);
        vault.depositHbar{value: HBAR_DEPOSIT * 2}();
        vm.stopPrank();

        // Check individual balances
        assertEq(
            vault.getUserTokenBalance(user1, address(token)),
            DEPOSIT_AMOUNT
        );
        assertEq(
            vault.getUserTokenBalance(user2, address(token)),
            DEPOSIT_AMOUNT * 2
        );
        assertEq(vault.getUserHbarBalance(user1), HBAR_DEPOSIT);
        assertEq(vault.getUserHbarBalance(user2), HBAR_DEPOSIT * 2);

        // Check total balances
        assertEq(
            vault.getTotalTokenDeposits(address(token)),
            DEPOSIT_AMOUNT * 3
        );
        assertEq(vault.getTotalHbarDeposits(), HBAR_DEPOSIT * 3);
    }

    function testTransferToUserByAuthorizedWithdrawer() public {
        // First deposit tokens
        vm.startPrank(user1);
        token.approve(address(vault), DEPOSIT_AMOUNT);
        vault.depositToken(address(token), DEPOSIT_AMOUNT);
        vm.stopPrank();

        uint256 recipientBalanceBefore = token.balanceOf(recipient);

        // Transfer tokens as authorized withdrawer
        vm.startPrank(authorizedWithdrawer);

        vm.expectEmit(true, true, false, true);
        emit TokenWithdrawn(
            recipient,
            address(token),
            DEPOSIT_AMOUNT,
            authorizedWithdrawer
        );

        vault.transferToUser(address(token), recipient, DEPOSIT_AMOUNT);
        vm.stopPrank();

        assertEq(
            token.balanceOf(recipient),
            recipientBalanceBefore + DEPOSIT_AMOUNT
        );
    }

    function testTransferToUserByOwner() public {
        // First deposit tokens
        vm.startPrank(user1);
        token.approve(address(vault), DEPOSIT_AMOUNT);
        vault.depositToken(address(token), DEPOSIT_AMOUNT);
        vm.stopPrank();

        uint256 recipientBalanceBefore = token.balanceOf(recipient);

        // Transfer tokens as owner
        vm.startPrank(owner);

        vm.expectEmit(true, true, false, true);
        emit TokenWithdrawn(recipient, address(token), DEPOSIT_AMOUNT, owner);

        vault.transferToUser(address(token), recipient, DEPOSIT_AMOUNT);
        vm.stopPrank();

        assertEq(
            token.balanceOf(recipient),
            recipientBalanceBefore + DEPOSIT_AMOUNT
        );
    }

    function testTransferToUserUnauthorized() public {
        vm.startPrank(user1);
        token.approve(address(vault), DEPOSIT_AMOUNT);
        vault.depositToken(address(token), DEPOSIT_AMOUNT);

        vm.expectRevert(Exchange.UnauthorizedWithdrawal.selector);
        vault.transferToUser(address(token), recipient, DEPOSIT_AMOUNT);
        vm.stopPrank();
    }

    function testTransferToUserInvalidInputs() public {
        vm.startPrank(authorizedWithdrawer);

        // Invalid token address
        vm.expectRevert(Exchange.InvalidToken.selector);
        vault.transferToUser(address(0), recipient, DEPOSIT_AMOUNT);

        // Invalid recipient address
        vm.expectRevert(Exchange.InvalidAddress.selector);
        vault.transferToUser(address(token), address(0), DEPOSIT_AMOUNT);

        // Invalid amount
        vm.expectRevert(Exchange.InvalidAmount.selector);
        vault.transferToUser(address(token), recipient, 0);

        vm.stopPrank();
    }

    function testTransferToUserInsufficientBalance() public {
        vm.startPrank(authorizedWithdrawer);
        vm.expectRevert(Exchange.InsufficientBalance.selector);
        vault.transferToUser(address(token), recipient, DEPOSIT_AMOUNT);
        vm.stopPrank();
    }

    function testTransferHbarToUserByAuthorizedWithdrawer() public {
        // First deposit HBAR
        vm.startPrank(user1);
        vault.depositHbar{value: HBAR_DEPOSIT}();
        vm.stopPrank();

        uint256 recipientBalanceBefore = recipient.balance;

        // Transfer HBAR as authorized withdrawer
        vm.startPrank(authorizedWithdrawer);

        vm.expectEmit(true, false, false, true);
        emit HbarWithdrawn(recipient, HBAR_DEPOSIT, authorizedWithdrawer);

        vault.transferHbarToUser(payable(recipient), HBAR_DEPOSIT);
        vm.stopPrank();

        assertEq(recipient.balance, recipientBalanceBefore + HBAR_DEPOSIT);
    }

    function testTransferHbarToUserByOwner() public {
        // First deposit HBAR
        vm.startPrank(user1);
        vault.depositHbar{value: HBAR_DEPOSIT}();
        vm.stopPrank();

        uint256 recipientBalanceBefore = recipient.balance;

        // Transfer HBAR as owner
        vm.startPrank(owner);

        vm.expectEmit(true, false, false, true);
        emit HbarWithdrawn(recipient, HBAR_DEPOSIT, owner);

        vault.transferHbarToUser(payable(recipient), HBAR_DEPOSIT);
        vm.stopPrank();

        assertEq(recipient.balance, recipientBalanceBefore + HBAR_DEPOSIT);
    }

    function testTransferHbarToUserUnauthorized() public {
        vm.startPrank(user1);
        vault.depositHbar{value: HBAR_DEPOSIT}();

        vm.expectRevert(Exchange.UnauthorizedWithdrawal.selector);
        vault.transferHbarToUser(payable(recipient), HBAR_DEPOSIT);
        vm.stopPrank();
    }

    function testTransferHbarToUserInvalidInputs() public {
        vm.startPrank(authorizedWithdrawer);

        // Invalid recipient address
        vm.expectRevert(Exchange.InvalidAddress.selector);
        vault.transferHbarToUser(payable(address(0)), HBAR_DEPOSIT);

        // Invalid amount
        vm.expectRevert(Exchange.InvalidAmount.selector);
        vault.transferHbarToUser(payable(recipient), 0);

        vm.stopPrank();
    }

    function testTransferHbarToUserInsufficientBalance() public {
        vm.startPrank(authorizedWithdrawer);
        vm.expectRevert(Exchange.InsufficientBalance.selector);
        vault.transferHbarToUser(payable(recipient), HBAR_DEPOSIT);
        vm.stopPrank();
    }
}
