import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getExchangeRates } from "../api/mempoolSpaceApi";
import { GET_DB_EXCHANGE_RATES } from "../constants";
import { useDatabaseContext } from "../contexts/DatabaseContext";
import { useGraphContext } from "../contexts/GraphContext/GraphContext";
import { useSettingsContext } from "../contexts/SettingsContext";
import { Currencies } from "../types";

export const useExchangeRates = (tsInSeconds: number, enabled = true, useCache = true) => {
  const { db } = useDatabaseContext();
  const { settings } = useSettingsContext();
  const queryClient = useQueryClient();
  const [rates, setRates] = useState<Record<Currencies, number>>();

  const { exchangeRates } = useGraphContext();

  useEffect(() => {
    if (exchangeRates[tsInSeconds] || rates || !enabled || !settings.currency) {
      return;
    }

    getExchangeRates(tsInSeconds).then(async (rates) => {
      if (!rates) {
        return;
      }

      setRates(rates);

      if (!useCache) {
        return;
      }

      await db.put("exchangeRates", {
        tsInSeconds: tsInSeconds,
        rates,
      });

      await queryClient.invalidateQueries({ queryKey: [GET_DB_EXCHANGE_RATES] });
    });
  }, [exchangeRates, rates, tsInSeconds, db, queryClient, enabled, settings.currency, useCache]);

  return rates || exchangeRates[tsInSeconds];
};
