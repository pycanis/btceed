import { useCallback, useMemo } from "react";
import { SATS_IN_BTC } from "../constants";
import { useSettingsContext } from "../contexts/SettingsContext";
import { Currencies } from "../types";

export const useFormatValue = () => {
  const { settings } = useSettingsContext();

  const currencyFormatter = useMemo(
    () =>
      settings.currency &&
      new Intl.NumberFormat(navigator.language, { style: "currency", currency: settings.currency }),
    [settings.currency]
  );

  const formatValue = useCallback(
    (valueInSats: number, exchangeRates?: Record<Currencies, number>) => {
      const valueInBtc = valueInSats / SATS_IN_BTC;

      const fiatInfo =
        settings.currency && exchangeRates
          ? ` (${currencyFormatter?.format(exchangeRates[settings.currency] * valueInBtc)})`
          : "";

      return settings.valuesInSats ? `${valueInSats.toLocaleString()} sats${fiatInfo}` : `${valueInBtc} BTC${fiatInfo}`;
    },
    [settings.valuesInSats, currencyFormatter, settings.currency]
  );

  return useMemo(() => ({ formatValue }), [formatValue]);
};
