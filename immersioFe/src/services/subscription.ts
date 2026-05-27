import { authService, API_BASE } from "./auth";

export interface PaymentReturnResult {
  success: boolean;
  message: string;
  tier?: string | null;
  billingCycle?: string | null;
  amount: number;
}

export const subscriptionService = {
  // Creates a PayOS payment link on the backend and returns the hosted checkout URL (VietQR).
  async createPayment(tier: string, billingCycle: string): Promise<string> {
    const response = await authService.fetchWithAuth(`${API_BASE}/api/subscription/create-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier, billingCycle }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: "Không tạo được yêu cầu thanh toán." }));
      throw new Error(err.detail || err.message || "Không tạo được yêu cầu thanh toán.");
    }

    // fetchWithAuth unwraps the success envelope → { paymentUrl }
    const data = await response.json();
    return data.paymentUrl;
  },

  // Verifies the order status with the backend (which re-checks against PayOS).
  async verifyReturn(orderCode: string): Promise<PaymentReturnResult> {
    const response = await fetch(`${API_BASE}/api/subscription/payos-return?orderCode=${encodeURIComponent(orderCode)}`);
    const body = await response.json().catch(() => null);
    const data = body?.data ?? {};
    return {
      success: !!data.success && response.ok,
      message: data.message || body?.message || (response.ok ? "Thanh toán thành công." : "Thanh toán thất bại."),
      tier: data.tier,
      billingCycle: data.billingCycle,
      amount: data.amount ?? 0,
    };
  },
};
