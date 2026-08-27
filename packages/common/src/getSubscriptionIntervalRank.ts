import { BillingInterval, BillingIntervalEnum } from "@blacket/types";

export function getSubscriptionIntervalRank(interval?: BillingInterval | string | null): number {
    switch (interval) {
        case BillingIntervalEnum.LIFETIME:
            return 3;
        case BillingIntervalEnum.YEARLY:
            return 2;
        case BillingIntervalEnum.MONTHLY:
            return 1;
        default:
            // should never happen, but just incase
            return 0;
    }
}
