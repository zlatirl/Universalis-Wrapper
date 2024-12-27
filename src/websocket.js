const WebSocket = require('ws');
const BSON = require('bson');
const readline = require('readline');
const { websocketUrl, dataCenters } = require('../config/settings');

// Initialise BSON encoder/decoder
const { serialize, deserialize } = BSON;

// Function to prompt user for DC selection
const r1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

r1.question('Select a data center (European, NorthAmerican, Oceanian, Japanese): ', (dataCenter) => {
    const servers = dataCenters[dataCenter];

    if (!servers) {
        console.log('Invalid data center selection.');
        r1.close();
        return;
    }

    console.log(`Selected data center: ${dataCenter}`);
    console.log(`Servers:', ${servers.join(', ')}`);

    r1.close();

    //Initialise the WebSocket connection
    const ws = new WebSocket(websocketUrl);

    // Handle connection open event
    ws.on('open', () => {
        console.log('Connected to Universalis WebSocket');

        // Send a subscription message
        const subscriptionMessage = {
            event: 'subscribe',
            channel: 'listings/add',
            worlds: servers, 
        };

        ws.send(serialize(subscriptionMessage));
        console.log(`Subscription request for ${dataCenter} servers sent.`);
    });

    // Handle incoming messages
    ws.on('message', (data) => {
        try {
            // Decode BSON data
            const message = deserialize(data);
            console.log('Recieved data:', message);

            if (message.listings) {
                message.listings.forEach((listing, index) => {
                    console.log(`Listing ${index + 1}:`);
                    console.log(`Item ID: ${message.item}`);
                    console.log(`World ID: ${message.world}`);
                    console.log(`Price per Unit: ${listing.pricePerUnit} gil`);
                    console.log(`Quantity: ${listing.quantity}`);
                    console.log(`Retainer: ${listing.retainerName}`);
                    console.log('----------------------');
                });
            }
        } catch (error) {
            console.error('Error parsing BSON data:', error);
        }
    });

    // Handle connection close event
    ws.on('close', () => {
        console.log('WebSocket connection closed');
    });

    // Handle errors
    ws.on('error', (error) => {
        console.log('WebSocket error:', error);
    });
});