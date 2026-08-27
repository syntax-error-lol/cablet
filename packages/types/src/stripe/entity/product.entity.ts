import { Exclude } from "class-transformer";
import { Product } from "../../interfaces";

export class StripeProductEntity {
    @Exclude()
    stripeProductId?: string = undefined;

    @Exclude()
    stripePriceId?: string = undefined;

    @Exclude()
    groupId?: number = undefined;

    itemId?: number;
    blookId?: number;
    titleId?: number;
    fontId?: number;
    bannerId?: number;

    tokens: number;
    diamonds: number;
    crystals: number;

    id: number;

    name: string;
    description: string;

    price: number;
    subscriptionPrice?: number;

    imageId: number;

    type: string;

    color1: string;
    color2: string;

    priority: number;

    isSubscription: boolean;

    isQuantityCapped: boolean;

    createdAt: Date;
    updatedAt: Date;

    constructor(partial: Partial<StripeProductEntity>) {
        Object.assign(this, partial);

        this.stripeProductId = undefined;
        this.stripePriceId = undefined;

        this.groupId = undefined;
    }
}
