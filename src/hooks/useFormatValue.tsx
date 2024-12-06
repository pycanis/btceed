import { useCallback, useMemo } from "react";
import { SATS_IN_BTC } from "../constants";
import { useSettingsContext } from "../contexts/SettingsContext";

export const useFormatValue = () => {
  const { settings } = useSettingsContext();

  const formatValue = useCallback(
    (valueInSats: number) =>
      settings.valuesInSats ? `${valueInSats.toLocaleString()} sats` : `${valueInSats / SATS_IN_BTC} BTC`,
    [settings.valuesInSats]
  );

  return useMemo(() => ({ formatValue }), [formatValue]);
};
