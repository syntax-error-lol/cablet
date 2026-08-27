export function calculateFinalPrice(
    productPrice: number,
    quantity: number,
    discount: number | null | undefined,
    isPriceUsingCrystals: boolean
) {
    const PRICE = Math.round((productPrice * Number(quantity)) * (isPriceUsingCrystals ? 1 : 100));

    const FINAL_PRICE_STRING = !discount
        ? PRICE
        : (PRICE * (1 - discount / 100)).toFixed(isPriceUsingCrystals ? 0 : 2);

    return isPriceUsingCrystals
        ? Math.floor(Number(FINAL_PRICE_STRING))
        : Number(FINAL_PRICE_STRING) / 100;
}
