import axios, { AxiosInstance } from "axios";
import { env } from "../config/env";

interface BVNValidationResponse {
  status: boolean;
  message: string;
  data?: {
    first_name: string;
    last_name: string;
    dob: string;
    mobile: string;
    bvn: string;
  };
}

interface DedicatedAccountResponse {
  status: boolean;
  message: string;
  data?: {
    bank: {
      name: string;
      id: number;
      slug: string;
    };
    account_name: string;
    account_number: string;
    assigned: boolean;
    currency: string;
    metadata: any;
    active: boolean;
    id: number;
    created_at: string;
    updated_at: string;
    assignment: {
      integration: number;
      assignee_id: number;
      assignee_type: string;
      expired: boolean;
      account_type: string;
      assigned_at: string;
    };
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      customer_code: string;
      phone: string;
      risk_action: string;
    };
  };
}

interface CreateCustomerResponse {
  status: boolean;
  message: string;
  data?: {
    email: string;
    integration: number;
    domain: string;
    customer_code: string;
    id: number;
    identified: boolean;
    identifications: any;
    createdAt: string;
    updatedAt: string;
  };
}

class PaystackService {
  private api: AxiosInstance;
  private baseURL = "https://api.paystack.co";

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Validate BVN and get customer details
   */
  async validateBVN(
    bvn: string,
    firstName: string,
    lastName: string,
    dateOfBirth?: string
  ): Promise<BVNValidationResponse> {
    try {
      // Note: Paystack BVN match endpoint
      const response = await this.api.get(`/bvn/match`, {
        params: {
          bvn,
          first_name: firstName,
          last_name: lastName,
          ...(dateOfBirth && { account_number: dateOfBirth }),
        },
      });

      return {
        status: true,
        message: "BVN validation successful",
        data: response.data.data,
      };
    } catch (error: any) {
      console.error(
        "BVN validation error:",
        error.response?.data || error.message
      );
      return {
        status: false,
        message: error.response?.data?.message || "BVN validation failed",
      };
    }
  }

  /**
   * Create a customer on Paystack
   */
  async createCustomer(
    email: string,
    firstName: string,
    lastName: string,
    phone: string
  ): Promise<CreateCustomerResponse> {
    try {
      const response = await this.api.post("/customer", {
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
      });

      return {
        status: true,
        message: "Customer created successfully",
        data: response.data.data,
      };
    } catch (error: any) {
      console.error(
        "Create customer error:",
        error.response?.data || error.message
      );

      // If customer already exists, try to fetch them
      if (
        error.response?.status === 400 &&
        error.response?.data?.message?.includes("Customer already exists")
      ) {
        return this.getCustomerByEmail(email);
      }

      return {
        status: false,
        message: error.response?.data?.message || "Failed to create customer",
      };
    }
  }

  /**
   * Get customer by email
   */
  async getCustomerByEmail(email: string): Promise<CreateCustomerResponse> {
    try {
      const response = await this.api.get(`/customer/${email}`);

      return {
        status: true,
        message: "Customer retrieved successfully",
        data: response.data.data,
      };
    } catch (error: any) {
      console.error(
        "Get customer error:",
        error.response?.data || error.message
      );
      return {
        status: false,
        message: error.response?.data?.message || "Failed to get customer",
      };
    }
  }

  /**
   * Create a dedicated virtual account
   * @param customerCode - Paystack customer code
   * @param preferredBank - Use "test-bank" for testing, "wema-bank" or "titan-paystack" for production
   * @param bvn - Bank Verification Number (optional for testing)
   */
  async createDedicatedAccount(
    customerCode: string,
    preferredBank: string = "test-bank", // Use test-bank for testing
    bvn?: string
  ): Promise<DedicatedAccountResponse> {
    try {
      const requestData: any = {
        customer: customerCode,
        preferred_bank: preferredBank,
      };

      // Add BVN if provided (required for some banks)
      if (bvn) {
        requestData.bvn = bvn;
      }

      console.log("🔍 Paystack Request:", {
        customer: customerCode,
        preferred_bank: preferredBank,
        hasBvn: !!bvn,
      });

      const response = await this.api.post("/dedicated_account", requestData);

      return {
        status: true,
        message: "Dedicated account created successfully",
        data: response.data.data,
      };
    } catch (error: any) {
      console.error(
        "Create dedicated account error:",
        error.response?.data || error.message
      );
      return {
        status: false,
        message:
          error.response?.data?.message || "Failed to create dedicated account",
      };
    }
  }

  /**
   * List all dedicated accounts for a customer
   */
  async listDedicatedAccounts(customerCode?: string): Promise<any> {
    try {
      const params = customerCode ? { customer: customerCode } : {};
      const response = await this.api.get("/dedicated_account", { params });

      return {
        status: true,
        message: "Dedicated accounts retrieved successfully",
        data: response.data.data,
      };
    } catch (error: any) {
      console.error(
        "List dedicated accounts error:",
        error.response?.data || error.message
      );
      return {
        status: false,
        message:
          error.response?.data?.message || "Failed to list dedicated accounts",
      };
    }
  }

  /**
   * Verify transaction
   */
  async verifyTransaction(reference: string): Promise<any> {
    try {
      const response = await this.api.get(`/transaction/verify/${reference}`);

      return {
        status: true,
        message: "Transaction verified successfully",
        data: response.data.data,
      };
    } catch (error: any) {
      console.error(
        "Verify transaction error:",
        error.response?.data || error.message
      );
      return {
        status: false,
        message:
          error.response?.data?.message || "Failed to verify transaction",
      };
    }
  }

  /**
   * Get available banks
   */
  async getBanks(): Promise<any> {
    try {
      const response = await this.api.get("/bank?currency=NGN");

      return {
        status: true,
        message: "Banks retrieved successfully",
        data: response.data.data,
      };
    } catch (error: any) {
      console.error("Get banks error:", error.response?.data || error.message);
      return {
        status: false,
        message: error.response?.data?.message || "Failed to get banks",
      };
    }
  }

  /**
   * Get available dedicated account providers (banks that support virtual accounts)
   */
  async getDedicatedAccountProviders(): Promise<any> {
    try {
      const response = await this.api.get(
        "/dedicated_account/available_providers"
      );

      console.log("Available dedicated account providers:", response.data.data);
      return {
        status: true,
        message: "Providers retrieved successfully",
        data: response.data.data,
      };
    } catch (error: any) {
      console.error(
        "Get providers error:",
        error.response?.data || error.message
      );
      return {
        status: false,
        message: error.response?.data?.message || "Failed to get providers",
      };
    }
  }

  /**
   * Initialize transaction (for card payments)
   */
  async initializeTransaction(
    email: string,
    amount: number,
    currency: string = "NGN",
    metadata?: any
  ): Promise<any> {
    try {
      const response = await this.api.post("/transaction/initialize", {
        email,
        amount, // Amount in kobo
        currency,
        metadata,
        callback_url: `${
          process.env.FRONTEND_URL || "http://localhost:3001"
        }/dashboard?payment=success`,
      });

      return {
        status: true,
        message: "Transaction initialized successfully",
        data: response.data.data,
      };
    } catch (error: any) {
      console.error(
        "Initialize transaction error:",
        error.response?.data || error.message
      );
      return {
        status: false,
        message:
          error.response?.data?.message || "Failed to initialize transaction",
      };
    }
  }

  /**
   * List transactions for a customer
   */
  async listTransactions(
    customerEmail?: string,
    page: number = 1,
    perPage: number = 20
  ): Promise<any> {
    try {
      const params: any = {
        page,
        perPage,
      };

      if (customerEmail) {
        params.customer = customerEmail;
      }

      const response = await this.api.get("/transaction", { params });

      return {
        status: true,
        message: "Transactions retrieved successfully",
        data: response.data.data,
      };
    } catch (error: any) {
      console.error(
        "List transactions error:",
        error.response?.data || error.message
      );
      return {
        status: false,
        message: error.response?.data?.message || "Failed to list transactions",
      };
    }
  }

  /**
   * Create a transfer recipient
   */
  async createTransferRecipient(
    name: string,
    accountNumber: string,
    bankCode: string
  ): Promise<any> {
    try {
      const response = await this.api.post("/transferrecipient", {
        type: "nuban",
        name,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: "NGN",
      });

      return {
        status: true,
        message: "Transfer recipient created successfully",
        data: response.data.data,
      };
    } catch (error: any) {
      console.error(
        "Create transfer recipient error:",
        error.response?.data || error.message
      );
      return {
        status: false,
        message:
          error.response?.data?.message ||
          "Failed to create transfer recipient",
      };
    }
  }

  /**
   * Initiate a transfer (send money to bank account)
   */
  async initiateTransfer(
    recipientCode: string,
    amount: number,
    reason: string = "Token withdrawal"
  ): Promise<any> {
    try {
      const response = await this.api.post("/transfer", {
        source: "balance",
        reason,
        amount, // Amount in kobo
        recipient: recipientCode,
      });

      return {
        status: true,
        message: "Transfer initiated successfully",
        data: response.data.data,
      };
    } catch (error: any) {
      console.error(
        "Initiate transfer error:",
        error.response?.data || error.message
      );
      return {
        status: false,
        message: error.response?.data?.message || "Failed to initiate transfer",
      };
    }
  }

  /**
   * Verify a transfer
   */
  async verifyTransfer(transferCode: string): Promise<any> {
    try {
      const response = await this.api.get(`/transfer/verify/${transferCode}`);

      return {
        status: true,
        message: "Transfer verified successfully",
        data: response.data.data,
      };
    } catch (error: any) {
      console.error(
        "Verify transfer error:",
        error.response?.data || error.message
      );
      return {
        status: false,
        message: error.response?.data?.message || "Failed to verify transfer",
      };
    }
  }

  /**
   * Get PayStack balance
   */
  async getBalance(): Promise<any> {
    try {
      const response = await this.api.get("/balance");

      return {
        status: true,
        message: "Balance retrieved successfully",
        data: response.data.data,
      };
    } catch (error: any) {
      console.error(
        "Get balance error:",
        error.response?.data || error.message
      );
      return {
        status: false,
        message: error.response?.data?.message || "Failed to get balance",
      };
    }
  }
}

export const paystackService = new PaystackService();
