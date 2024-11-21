type EventName = "close" | "error" | "message" | "open";

class ElectrumService {
  private socket!: WebSocket;
  private wasConnected = false;
  private reconnectAttempts = 0;
  private eventHandlers = new Map<EventName, (data?: unknown) => void>();

  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 1000;

  constructor(private readonly url: string) {
    this.connect();
  }

  private connect() {
    this.socket = new WebSocket(this.url);

    this.setupSocketListeners();
  }

  private handleOpen = () => {
    console.log("Connected to Electrum server");

    if (!this.wasConnected) {
      this.wasConnected = true;

      this.eventHandlers.get("open")?.();
    }

    this.reconnectAttempts = 0;
  };

  private handleMessage = (event: MessageEvent) => {
    this.eventHandlers.get("message")?.(JSON.parse(event.data));
  };

  private handleClose = () => {
    console.log("Connection closed");

    this.clearSocketListeners();

    this.handleReconnect();
  };

  private handleError = (error: Event) => {
    console.error("WebSocket error:", error);
  };

  private setupSocketListeners() {
    this.socket.addEventListener("open", this.handleOpen);
    this.socket.addEventListener("message", this.handleMessage);
    this.socket.addEventListener("close", this.handleClose);
    this.socket.addEventListener("error", this.handleError);
  }

  private clearSocketListeners() {
    this.socket.removeEventListener("open", this.handleOpen);
    this.socket.removeEventListener("message", this.handleMessage);
    this.socket.removeEventListener("close", this.handleClose);
    this.socket.removeEventListener("error", this.handleError);
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;

      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);

      setTimeout(() => this.connect(), this.RECONNECT_DELAY * this.reconnectAttempts);
    } else {
      console.error("Max reconnection attempts reached");
    }
  }

  private isConnected(): boolean {
    return this.socket.readyState === WebSocket.OPEN;
  }

  public on(eventName: EventName, callback: (data?: unknown) => void) {
    this.eventHandlers.set(eventName, callback);
  }

  public sendMessage(data: unknown) {
    if (!this.isConnected()) {
      console.error("Socket not connected, couldn't send message.");

      return;
    }

    this.socket.send(JSON.stringify(data));
  }
}

export const electrumService = new ElectrumService("ws://192.168.4.11:50003");
