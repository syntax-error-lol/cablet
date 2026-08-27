import { BillingInterval, SubscriptionSwitchType } from "@blacket/types";
import { getSubscriptionIntervalRank } from "./getSubscriptionIntervalRank";

export function getSubscriptionSwitchType(current: {
    priority: number;
    billingInterval: BillingInterval | string;
}, target: {
    priority: number;
    billingInterval: BillingInterval | string;
}): SubscriptionSwitchType {
    const isPlanUpgrade = target.priority > current.priority;
    const isPlanDowngrade = target.priority < current.priority;
    const isIntervalUpgrade = getSubscriptionIntervalRank(target.billingInterval) > getSubscriptionIntervalRank(current.billingInterval);
    const isIntervalDowngrade = getSubscriptionIntervalRank(target.billingInterval) < getSubscriptionIntervalRank(current.billingInterval);

    if (isPlanUpgrade || (!isPlanDowngrade && isIntervalUpgrade)) return SubscriptionSwitchType.UPGRADE;
    if (isPlanDowngrade || (!isPlanUpgrade && isIntervalDowngrade)) return SubscriptionSwitchType.DOWNGRADE;

    return SubscriptionSwitchType.LATERAL;
}
