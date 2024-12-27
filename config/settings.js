module.exports = {
    websocketUrl: 'wss://universalis.app/api/ws',
    // FFXIV Server(s) to fetch information from
    dataCenters: {

        European: [
            // Chaos DC
            '80', // Cerberus
            '83', // Louisoix
            '71',  // Moogle
            '39', // Omega 
            '401', // Phantom 
            '97', // Ragnarok 
            '400', // Sagittarius 
            '85', // Spriggan

            // Light DC
            '402', // Alpha 
            '36', // Lich 
            '66', // Odin 
            '56', // Phoenix 
            '403', // Raiden 
            '67', // Shiva 
            '33', // Twintania 
            '42' // Zodiark
        ],

        NorthAmerican: [
            // Aether DC
            '75', // Adamantoise 
            '79', // Cactuar
            '54', // Faerie 
            '63', // Gilgamesh 
            '40', // Jenova 
            '65', // Midgardsormr 
            '99', // Sargatanas
            '57', // Siren

            // Crystal DC
            '91', // Balmung
            '34', // Brynhildr
            '74', // Coeurl
            '62', // Diabolos
            '81', // Goblin
            '75', // Malboro
            '37', // Mateus
            '41', // Zalera
            
            // Dynamis DC - Need to find IDs for these servers
            'Cuchulainn', // Cuchulainn
            'Golem', // Golem
            'Halicarnassus', // Halicarnassus
            'Kraken', // Kraken
            'Maduin', // Maduin
            'Marilith', // Marilith
            'Rafflesia', // Rafflesia
            'Seraph', // Seraph
            
            // Primal DC
            '78', // Behemoth
            '93', // Excalibur
            '53', // Exodus
            '35', // Famfrit
            '95', // Hyperion
            '55', // Lamia
            '64', // Leviathan
            '77' // Ultros
        ],

        Oceanian: [
            // Materia DC
            '22', // Bismarck 
            '21', // Ravana
            '86', // Sephirot
            '87', // Sophia
            '88' // Zurvan
        ],

        Japanese: [
            // Elemental DC
            'Aegis', // Aegis
            'Atomos', // Atomos
            'Carbuncle', // Carbuncle
            'Garuda', // Garuda
            'Gungnir', // Gungnir
            'Kujata', // Kujata
            'Tonberry', // Tonberry
            'Typhon', // Typhon

            // Gaia DC
            'Alexander', // Alexander
            'Bahamut', // Bahamut
            'Durandal', // Durandal
            'Fenrir', // Fenrir
            'Ifrit', // Ifrit
            'Ridill', // Ridill
            'Tiamat', // Tiamat
            'Ultima', // Ultima

            // Mana DC
            'Anima', // Anima
            'Asura', // Asura
            'Chocobo', // Chocobo
            'Hades', // Hades
            'Ixion', // Ixion
            'Masamune', // Masamune
            'Pandaemonium', // Pandaemonium
            'Titan', // Titan

            // Meteor DC
            'Belias', // Belias
            'Mandragora', // Mandragora
            'Ramuh', // Ramuh
            'Shinryu', // Shinryu
            'Unicorn', // Unicorn
            'Valefor', // Valefor
            'Yojimbo', // Yojimbo
            'Zeromus' // Zeromus
        ],
    },
    itemIDs: [40035],
};