export type SplitMode = 'EQUAL' | 'PERCENTAGE' | 'CUSTOM';

export interface SplitParticipant {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  sharePercentage?: number;
  assignedAmount?: number;
  paid: boolean;
  paidAt?: string;
  paymentMethod?: 'credit_card' | 'apple_pay' | 'google_pay' | 'crypto' | 'sepa';
}

export interface SplitCalculationResult {
  totalAmount: number;
  participants: Array<SplitParticipant & { calculatedAmount: number }>;
  isBalanced: boolean;
  difference: number;
  totalPaid: number;
  remainingAmount: number;
  percentPaid: number;
}

/**
 * Calculates individual participant payment shares and verifies balance
 */
export function calculateSplitShares(
  totalAmount: number,
  participants: SplitParticipant[],
  mode: SplitMode
): SplitCalculationResult {
  const count = participants.length;
  if (count === 0) {
    return {
      totalAmount,
      participants: [],
      isBalanced: totalAmount === 0,
      difference: totalAmount,
      totalPaid: 0,
      remainingAmount: totalAmount,
      percentPaid: 0,
    };
  }

  let calculatedList: Array<SplitParticipant & { calculatedAmount: number }> = [];

  if (mode === 'EQUAL') {
    const rawShare = totalAmount / count;
    const roundedShare = Number(rawShare.toFixed(2));
    let accumulated = 0;

    calculatedList = participants.map((p, idx) => {
      // Last participant absorbs any 1-cent rounding difference
      let amount = roundedShare;
      if (idx === count - 1) {
        amount = Number((totalAmount - accumulated).toFixed(2));
      } else {
        accumulated += amount;
      }
      return { ...p, calculatedAmount: amount };
    });
  } else if (mode === 'PERCENTAGE') {
    let accumulated = 0;
    calculatedList = participants.map((p, idx) => {
      const pct = p.sharePercentage ?? (100 / count);
      let amount = Number(((totalAmount * pct) / 100).toFixed(2));
      if (idx === count - 1) {
        amount = Number((totalAmount - accumulated).toFixed(2));
      } else {
        accumulated += amount;
      }
      return { ...p, calculatedAmount: amount };
    });
  } else {
    // CUSTOM
    calculatedList = participants.map((p) => {
      const amount = Number((p.assignedAmount ?? 0).toFixed(2));
      return { ...p, calculatedAmount: amount };
    });
  }

  const sumCalculated = calculatedList.reduce((acc, p) => acc + p.calculatedAmount, 0);
  const diff = Number((totalAmount - sumCalculated).toFixed(2));
  const isBalanced = Math.abs(diff) < 0.01;

  const totalPaid = calculatedList
    .filter((p) => p.paid)
    .reduce((acc, p) => acc + p.calculatedAmount, 0);
  const remainingAmount = Math.max(0, Number((totalAmount - totalPaid).toFixed(2)));
  const percentPaid = totalAmount > 0 ? Math.min(100, Math.round((totalPaid / totalAmount) * 100)) : 100;

  return {
    totalAmount,
    participants: calculatedList,
    isBalanced,
    difference: diff,
    totalPaid: Number(totalPaid.toFixed(2)),
    remainingAmount,
    percentPaid,
  };
}
