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

  const formatFiatValue = useCallback(
    (valueInSats: number, exchangeRates?: Record<Currencies, number>) => {
      if (!settings.currency || !exchangeRates) {
        return;
      }

      const fiatValue = (exchangeRates[settings.currency] * valueInSats) / SATS_IN_BTC;

      return {
        value: fiatValue,
        str: ` (${currencyFormatter?.format(fiatValue)})`,
      };
    },
    [currencyFormatter, settings.currency]
  );

  const formatBtcValue = useCallback(
    (valueInSats: number) => {
      const valueInBtc = valueInSats / SATS_IN_BTC;

      return {
        value: settings.valuesInSats ? valueInSats : valueInBtc,
        str: settings.valuesInSats ? `${valueInSats.toLocaleString()} sats` : `${valueInBtc} BTC`,
      };
    },
    [settings.valuesInSats]
  );

  const formatValue = useCallback(
    (valueInSats: number, exchangeRates?: Record<Currencies, number>) =>
      formatBtcValue(valueInSats).str + (formatFiatValue(valueInSats, exchangeRates)?.str || ""),
    [formatFiatValue, formatBtcValue]
  );

  return useMemo(
    () => ({ formatValue, formatBtcValue, formatFiatValue }),
    [formatValue, formatBtcValue, formatFiatValue]
  );
};
