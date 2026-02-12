/**
 * Real-time API Cost Tracker
 * 
 * Monitors Claude API usage and costs with:
 * - Per-model token usage tracking
 * - Real-time cost calculation based on Anthropic pricing
 * - Daily budget alerts
 * - Auto-throttling when approaching limits
 */

// Anthropic API pricing (as of Feb 2026)
const MODEL_PRICING = {
  'claude-sonnet-4': {
    inputPerMToken: 15.0,   // $15 per 1M input tokens
    outputPerMToken: 75.0,  // $75 per 1M output tokens
  },
  'claude-3-5-haiku': {
    inputPerMToken: 0.8,    // $0.80 per 1M input tokens
    outputPerMToken: 4.0,   // $4.00 per 1M output tokens
  },
} as const;

interface UsageEntry {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  timestamp: number;
  endpoint: string;
  userId: string;
}

interface DailyCosts {
  date: string;
  totalCost: number;
  totalCalls: number;
  byModel: Record<string, { calls: number; cost: number; inputTokens: number; outputTokens: number }>;
}

export class CostTracker {
  private usageLog: UsageEntry[] = [];
  private dailyBudget: number;
  private alertThreshold: number;
  private hasAlertedToday = false;
  private lastResetDate = new Date().toDateString();

  constructor(dailyBudgetUSD: number = 50, alertThresholdPercent: number = 80) {
    this.dailyBudget = dailyBudgetUSD;
    this.alertThreshold = alertThresholdPercent;

    // Reset daily tracking at midnight
    setInterval(() => {
      const today = new Date().toDateString();
      if (today !== this.lastResetDate) {
        this.lastResetDate = today;
        this.hasAlertedToday = false;
        // Keep last 7 days of logs
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        this.usageLog = this.usageLog.filter(entry => entry.timestamp > sevenDaysAgo);
      }
    }, 60 * 1000); // Check every minute
  }

  /**
   * Record API usage and calculate cost
   */
  record(
    model: string,
    inputTokens: number,
    outputTokens: number,
    endpoint: string,
    userId: string
  ): number {
    const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING];
    if (!pricing) {
      console.warn(`[CostTracker] Unknown model: ${model}`);
      return 0;
    }

    const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMToken;
    const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMToken;
    const totalCost = inputCost + outputCost;

    this.usageLog.push({
      model,
      inputTokens,
      outputTokens,
      cost: totalCost,
      timestamp: Date.now(),
      endpoint,
      userId,
    });

    // Check if we should alert
    const todayCost = this.getTodayCosts().totalCost;
    const budgetPercent = (todayCost / this.dailyBudget) * 100;

    if (budgetPercent >= this.alertThreshold && !this.hasAlertedToday) {
      this.hasAlertedToday = true;
      console.error(
        `🚨 [CostTracker] ALERT: ${budgetPercent.toFixed(1)}% of daily budget consumed ($${todayCost.toFixed(2)}/$${this.dailyBudget})`
      );
    }

    return totalCost;
  }

  /**
   * Get today's costs
   */
  getTodayCosts(): DailyCosts {
    const today = new Date().toDateString();
    const todayEntries = this.usageLog.filter(
      entry => new Date(entry.timestamp).toDateString() === today
    );

    const byModel: Record<string, { calls: number; cost: number; inputTokens: number; outputTokens: number }> = {};
    let totalCost = 0;

    for (const entry of todayEntries) {
      if (!byModel[entry.model]) {
        byModel[entry.model] = { calls: 0, cost: 0, inputTokens: 0, outputTokens: 0 };
      }
      byModel[entry.model].calls += 1;
      byModel[entry.model].cost += entry.cost;
      byModel[entry.model].inputTokens += entry.inputTokens;
      byModel[entry.model].outputTokens += entry.outputTokens;
      totalCost += entry.cost;
    }

    return {
      date: today,
      totalCost,
      totalCalls: todayEntries.length,
      byModel,
    };
  }

  /**
   * Get cost summary with budget status
   */
  getSummary() {
    const today = this.getTodayCosts();
    const budgetPercent = (today.totalCost / this.dailyBudget) * 100;
    const remaining = Math.max(0, this.dailyBudget - today.totalCost);

    return {
      today,
      dailyBudget: this.dailyBudget,
      budgetPercent: Math.round(budgetPercent * 10) / 10,
      remaining: Math.round(remaining * 100) / 100,
      shouldThrottle: budgetPercent >= this.alertThreshold,
      status: budgetPercent >= 100 ? 'exceeded' : budgetPercent >= this.alertThreshold ? 'warning' : 'normal',
    };
  }

  /**
   * Get last 7 days of cost history
   */
  getHistory(): DailyCosts[] {
    const days: Record<string, DailyCosts> = {};

    for (const entry of this.usageLog) {
      const date = new Date(entry.timestamp).toDateString();
      
      if (!days[date]) {
        days[date] = {
          date,
          totalCost: 0,
          totalCalls: 0,
          byModel: {},
        };
      }

      if (!days[date].byModel[entry.model]) {
        days[date].byModel[entry.model] = { calls: 0, cost: 0, inputTokens: 0, outputTokens: 0 };
      }

      days[date].byModel[entry.model].calls += 1;
      days[date].byModel[entry.model].cost += entry.cost;
      days[date].byModel[entry.model].inputTokens += entry.inputTokens;
      days[date].byModel[entry.model].outputTokens += entry.outputTokens;
      days[date].totalCost += entry.cost;
      days[date].totalCalls += 1;
    }

    return Object.values(days).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  /**
   * Set daily budget
   */
  setDailyBudget(budgetUSD: number) {
    this.dailyBudget = budgetUSD;
    this.hasAlertedToday = false; // Reset alert so it can fire again if needed
  }
}

// Singleton instance
export const costTracker = new CostTracker(50); // $50/day default budget
