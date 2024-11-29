import { IDBPDatabase, openDB } from "idb";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { DB_NAME, DB_VERSION } from "../constants";
import { DatabaseSchema } from "../types";

type DatabaseContext = {
  db: IDBPDatabase<DatabaseSchema>;
};

const DatabaseContext = createContext({} as DatabaseContext);

type Props = {
  children: ReactNode;
};

export const DatabaseProvider = ({ children }: Props) => {
  const [db, setDb] = useState<IDBPDatabase<DatabaseSchema>>();

  useEffect(() => {
    openDB<DatabaseSchema>(DB_NAME, DB_VERSION, {
      upgrade: (db) => {
        db.createObjectStore("xpubs", { keyPath: "xpub" });
        db.createObjectStore("settings", { autoIncrement: true });
      },
    }).then((db) => setDb(db));
  }, []);

  const contextValue = useMemo(() => ({ db }), [db]);

  return (
    <DatabaseContext.Provider value={contextValue as DatabaseContext}>
      {db ? children : <>loading..</>}
    </DatabaseContext.Provider>
  );
};

export const useDatabaseContext = () => {
  const context = useContext(DatabaseContext);

  if (!context) {
    throw new Error("Not inside DatabaseContext.");
  }

  return context;
};
