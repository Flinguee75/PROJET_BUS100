import { GPSLiveData } from '../types';
declare class WebSocketManager {
    private wss;
    private clients;
    initialize(port?: number): void;
    broadcastGPSUpdate(data: GPSLiveData): void;
    close(): void;
    getClientsCount(): number;
}
declare const _default: WebSocketManager;
export default _default;
//# sourceMappingURL=websocket.manager.d.ts.map