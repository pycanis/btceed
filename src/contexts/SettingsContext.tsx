import { useQuery } from "@tanstack/react-query";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo } from "react";
import {
  DEFAULT_NODE_COLORS_DARK_MODE,
  DEFAULT_NODE_COLORS_LIGHT_MODE,
  DEFAULT_SETTINGS,
  GET_DB_SETTINGS,
} from "../constants";
import { ColorScheme, SettingsStoreValue } from "../types";
import { useDatabaseContext } from "./DatabaseContext";

type SettingsContext = {
  settings: SettingsStoreValue;
};

const SettingsContext = createContext({} as SettingsContext);

type Props = {
  children: ReactNode;
};

export const SettingsProvider = ({ children }: Props) => {
  const { db } = useDatabaseContext();

  const { data: settingsData, isLoading } = useQuery({
    queryKey: [GET_DB_SETTINGS],
    queryFn: () => db!.getAll("settings"),
  });

  const settings = useMemo(
    () =>
      settingsData?.[0] || {
        ...DEFAULT_SETTINGS,
        nodeColors: document.documentElement.classList.contains("dark")
          ? DEFAULT_NODE_COLORS_DARK_MODE
          : DEFAULT_NODE_COLORS_LIGHT_MODE,
      },
    [settingsData]
  );

  const handleColorSchemeChange = useCallback((isDark: boolean, colorScheme: ColorScheme) => {
    document.documentElement.classList.toggle("dark", colorScheme === "dark" || (colorScheme === "system" && isDark));
  }, []);

  useEffect(() => {
    const colorSchemeMedia = window.matchMedia("(prefers-color-scheme: dark)");

    handleColorSchemeChange(colorSchemeMedia.matches, settings.colorScheme);

    colorSchemeMedia.addEventListener("change", (e) => handleColorSchemeChange(e.matches, settings.colorScheme));

    return () =>
      colorSchemeMedia.removeEventListener("change", (e) => handleColorSchemeChange(e.matches, settings.colorScheme));
  }, [settings.colorScheme, handleColorSchemeChange]);

  const contextValue = useMemo(() => ({ settings }), [settings]);

  return (
    <SettingsContext.Provider value={contextValue}>
      {!db || isLoading ? <>loading..</> : children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error("Not inside SettingsContext.");
  }

  return context;
};
