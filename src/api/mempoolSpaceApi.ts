type ExchangeRates = {
  USDAUD: number;
  USDCAD: number;
  USDCHF: number;
  USDEUR: number;
  USDGBP: number;
  USDJPY: number;
};
type Prices = { USD: number; time: number }[];

export const getExchangeRates = async (tsInSeconds: number) => {
  const url = `https://mempool.space/api/v1/historical-price?currency=USD&timestamp=${tsInSeconds}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return;
    }

    const data: { exchangeRates: ExchangeRates; prices: Prices } | undefined = await response.json();

    if (!data) {
      return;
    }

    const { prices, exchangeRates } = data;

    const usdPrice = prices[0].USD;

    return {
      AUD: Math.round(exchangeRates.USDAUD * usdPrice),
      CAD: Math.round(exchangeRates.USDCAD * usdPrice),
      CHF: Math.round(exchangeRates.USDCHF * usdPrice),
      EUR: Math.round(exchangeRates.USDEUR * usdPrice),
      GBP: Math.round(exchangeRates.USDGBP * usdPrice),
      JPY: Math.round(exchangeRates.USDJPY * usdPrice),
      USD: usdPrice,
    };
  } catch (err) {
    console.error(err);
  }
};
