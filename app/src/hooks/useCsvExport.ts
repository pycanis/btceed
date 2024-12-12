import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { getExchangeRates } from "../api/mempoolSpaceApi";
import { GET_DB_EXCHANGE_RATES } from "../constants";
import { useDatabaseContext } from "../contexts/DatabaseContext";
import { useGraphContext } from "../contexts/GraphContext/GraphContext";
import { useSettingsContext } from "../contexts/SettingsContext";
import { useFormatValue } from "./useFormatValue";

export const useCsvExport = () => {
  const { settings } = useSettingsContext();
  const { formatBtcValue, formatFiatValue } = useFormatValue();
  const { db } = useDatabaseContext();
  const queryClient = useQueryClient();

  const {
    addressEntriesAndTransactions: {
      transactions,
      isSpendingTransaction,
      calculateTransactionSpentInSats,
      calculateTransactionReceivedInSats,
      calculateTransactionFeeInSats,
    },
    exchangeRates,
    labels,
    setIsCsvExportLoading,
  } = useGraphContext();

  const getExchangeRate = useCallback(
    async (tsInSeconds: number) => {
      const shouldLoadExchangeRateFromApi = settings.currency && !exchangeRates[tsInSeconds];

      if (shouldLoadExchangeRateFromApi) {
        setIsCsvExportLoading(true);
      }

      const exchangeRate = shouldLoadExchangeRateFromApi
        ? await getExchangeRates(tsInSeconds)
        : exchangeRates[tsInSeconds];

      if (!exchangeRates[tsInSeconds] && exchangeRate) {
        await db.put("exchangeRates", {
          tsInSeconds: tsInSeconds,
          rates: exchangeRate,
        });
      }

      return exchangeRate;
    },
    [exchangeRates, settings.currency, db, setIsCsvExportLoading]
  );

  const getCsvData = useCallback(async () => {
    const headers = [
      "Transaction ID",
      "Labels",
      "Date",
      `Value (${settings.valuesInSats ? "sats" : "BTC"})`,
      ...(settings.currency ? [`Fiat value (${settings.currency})`] : []),
      `Fee (${settings.valuesInSats ? "sats" : "BTC"})`,
      ...(settings.currency ? [`Fiat fee (${settings.currency})`] : []),
      `Wallet(s) balance (${settings.valuesInSats ? "sats" : "BTC"})`,
    ];

    const rows: (string | number)[][] = [];

    let balance = 0;

    for (const transaction of Object.values(transactions).sort((a, b) => a.time - b.time)) {
      const isSpending = isSpendingTransaction(transaction);

      const foundLabels = transaction.vout
        .map((vout) => labels[vout.scriptPubKey.address] ?? "")
        .filter(Boolean)
        .join(",");

      const valueInSats = isSpending
        ? calculateTransactionSpentInSats(transaction)
        : calculateTransactionReceivedInSats(transaction);

      const fee = isSpending && calculateTransactionFeeInSats(transaction);

      const btcValue = (isSpending ? "-" : "") + formatBtcValue(valueInSats).value;

      const exchangeRate = await getExchangeRate(transaction.time);

      const fiatValue = formatFiatValue(valueInSats, exchangeRate)?.value.toFixed(0) || "";

      const feeBtcValue = fee ? "-" + formatBtcValue(fee).value : "";

      const feeFiatValue = (fee && formatFiatValue(fee, exchangeRate)?.value.toFixed(2)) || "";

      balance = balance + (isSpending ? -valueInSats - (fee || 0) : valueInSats);

      const row = [
        transaction.txid,
        foundLabels,
        new Date(transaction.time * 1000).toLocaleString(),
        btcValue,
        ...(settings.currency ? [fiatValue] : []),
        feeBtcValue,
        ...(settings.currency ? [feeFiatValue] : []),
        formatBtcValue(balance).value,
      ];

      rows.push(row);
    }

    if (settings.currency) {
      await queryClient.invalidateQueries({ queryKey: [GET_DB_EXCHANGE_RATES] });
    }

    return [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\n");
  }, [
    transactions,
    settings.currency,
    settings.valuesInSats,
    labels,
    queryClient,
    isSpendingTransaction,
    calculateTransactionFeeInSats,
    calculateTransactionReceivedInSats,
    calculateTransactionSpentInSats,
    formatBtcValue,
    formatFiatValue,
    getExchangeRate,
  ]);

  const downloadCsv = useCallback(async () => {
    const data = await getCsvData();

    const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");

    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "data.csv");
    link.style.visibility = "hidden";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    setIsCsvExportLoading(false);
  }, [getCsvData, setIsCsvExportLoading]);

  return useMemo(() => ({ downloadCsv }), [downloadCsv]);
};
