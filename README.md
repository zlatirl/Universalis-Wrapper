# FFXIV Market Analysis Tool

*This project is being developed as a part of my dissertation.*

A real-time market analysis tool for FINAL FANTASY XIV ONLINE that helps players track prices, set notifications, and make informed buying and selling decisions.

## Features

* **Real-time Market Data:** Connects to Universalis API via WebSocket for up-to-date market information
* **Item Search:** Find items by name or browse by categories
* **Notifications:** "Subscribe" to specific items and recieve alerts based on price changes
* **Price Tracking:** Monitor price trends across various servers and data centers
* **Market Prediction:** View forecasted price changes based on historical data analysis
* **Visual Analytics:** View charts and graphs
* **Server Selection:** View market data for your specific server or data center

## Installation

### Project Setup

Clone this repository in the directory of your choice `git clone https://github.com/zlatirl/Universalis-Wrapper.git`

### Install Dependencies

Install all required dependencies `npm install`

### Development Server

Start the development server with `npm run dev`

## Usage

1. **Initial Setup:** Upon first use, you will be prompted to select your server
2. **Find Items:**
    * Use the search bar to find specific items
    * Browse item categories using the `Categories` dropdown
3. **Track Items:** View current listings and historial price data for any item
4. **Set Notifications and Save Items:** "Subscribe" to items by clicking the `save` button to recieve price alerts. This should also keep items in the `Saved Items` section on the home page
5. **Analyse Markets:** Use the built-in analytics tools to identify profitable opportunities
6. **Change Market:** Go to settings to change servers and view prices from other data centers and servers

## Technologies Used

* Vue.js (Frontend framework)
* Chart.js (Data visualisation)
* WebSockets (Real-time data connection)
* Universalis REST API (FFXIV market data)
* Bootstrap (UI components and styling)
* XIVAPI (linking `itemIDs` to names and grabbing item images)

## API Reference

This application uses [Universalis's REST API](https://docs.universalis.app/) for FINAL FANTASY XIV market board data. It establishes WebSocket connections to recieve real-time data/updates to item prices across all game servers.
[XIVAPI](https://v2.xivapi.com/) is also used for grabbing images as well as linking `itemIDs` to names. Universalis Assets API is also used for item icons.

## Acknowledgements

* Thanks to the FFXIV community as well as all my friends for feedback and testing!
* Special thanks to the Universalis Discord as well as XIVAPI Discord for providing the APIs as well as answering any questions I may have had during the development of this project!
