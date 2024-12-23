import "dotenv/config";

import net from "net";
import tls from "tls";
import WebSocket from "ws";

const { ELECTRUM_HOST, ELECTRUM_PORT, ELECTRUM_USE_SSL } = process.env;

const WS_PORT = 80;

const wss = new WebSocket.Server({ port: WS_PORT });

const connectionOptions = { host: ELECTRUM_HOST, port: Number(ELECTRUM_PORT), rejectUnauthorized: false };

wss.on("connection", (ws) => {
  console.log("New WebSocket connection established.");

  const tcpSocket =
    ELECTRUM_USE_SSL === "true"
      ? tls.connect(connectionOptions, () => {
          console.log(`Connected to tcp://${ELECTRUM_HOST}:${ELECTRUM_PORT}`);
        })
      : net.connect(connectionOptions, () => {
          console.log(`Connected to ssl://${ELECTRUM_HOST}:${ELECTRUM_PORT}`);
        });

  ws.on("message", (message) => {
    const stringifiedMessage = message.toString();

    tcpSocket.write(stringifiedMessage + "\n");
  });

  let buffer = "";

  tcpSocket.on("data", (data) => {
    buffer += data.toString();

    if (!buffer.includes("\n")) {
      return;
    }

    const [message, rest] = buffer.replace(/\r\n/g, "\n").split("\n", 2);

    buffer = rest;

    ws.send(message);
  });

  tcpSocket.on("end", () => {
    console.log("TCP server connection ended");

    ws.close();
  });

  tcpSocket.on("error", (err) => {
    console.error("TCP socket error:", err);
  });

  tcpSocket.on("close", () => {
    console.log("TCP server connection closed");

    ws.close();
  });

  ws.on("close", () => {
    console.log("WebSocket connection closed");

    tcpSocket.end();
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err);

    tcpSocket.end();
  });
});

console.log(`WebSocket server running on ws://localhost:${WS_PORT}`);
