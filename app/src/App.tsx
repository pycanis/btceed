import { ErrorBoundary } from "react-error-boundary";
import { Button } from "./components/Button";
import { Graph } from "./containers/Graph/Graph";
import { useDatabaseContext } from "./contexts/DatabaseContext";

export const App = () => {
  const { db } = useDatabaseContext();

  return (
    <div className="w-screen h-screen">
      <ErrorBoundary
        fallback={
          <div className="text-center mt-12">
            <p className="mb-2">Your xpub contains currently unsupported transaction, e.g. coinbase or OP_RETURN.</p>

            <p className="mb-8">Their support is coming soon!</p>

            <Button onClick={() => location.reload()}>Try another</Button>
          </div>
        }
        onError={async () => {
          await db.clear("wallets");
        }}
      >
        <Graph />

        <div id="popover" />
      </ErrorBoundary>
    </div>
  );
};
