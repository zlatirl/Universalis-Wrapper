import { BSON } from 'bson';

const websocketUrl = 'wss://universalis.app/api/ws';

let ws;

const initializeWebSocket = async (callback) => {
    const { serialize, deserialize } = BSON;

    return new Promise((resolve, reject) => {
        ws = new WebSocket(websocketUrl);

        // Ensure the WebSocket receives binary data as ArrayBuffer
        ws.binaryType = 'arraybuffer';

        ws.onopen = () => {
            console.log('Connected to Universalis WebSocket');

            const subscriptionMessage = {
                event: 'subscribe',
                channel: 'listings/add',
            };

            ws.send(serialize(subscriptionMessage));
            console.log('Subscription request sent.');
            resolve();
        };

        ws.onmessage = async (event) => {
            try {
                const rawData = event.data;
        
                // Ensure rawData is an ArrayBuffer
                if (!rawData || rawData.byteLength === 0) {
                    console.warn('Received empty data from WebSocket, skipping...');
                    return;
                }
        
                // Convert ArrayBuffer to Uint8Array for BSON deserialization
                const uint8Array = new Uint8Array(rawData);
        
                // Deserialize BSON data
                const message = deserialize(uint8Array);
        
                // Log to confirm WebSocket is still running
                // console.log('WebSocket is running. Received message:', message);
        
                // Call the provided callback with the parsed message
                if (callback) await callback(message);
            } catch (error) {
                console.error('Error parsing BSON data:', error);
            }
        };
        
        ws.onclose = () => {
            console.log('WebSocket connection closed');
        };

        ws.onerror = (error) => {
            console.log('WebSocket error:', error);
            reject(error);
        };
    });
};

const closeWebSocket = async () => {
    if (ws) {
        return new Promise((resolve) => {
            ws.close();
            ws.onclose = resolve;
        });
    }
};

export { initializeWebSocket, closeWebSocket };
