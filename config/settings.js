module.exports = {
    websocketUrl: 'wss://universalis.app/api/ws',
    // FFXIV Server(s) to fetch information from
    dataCenters: {

        European: [
            // Chaos DC
            80, // Cerberus
            83, // Louisoix
            71,  // Moogle
            39, // Omega 
            401, // Phantom 
            97, // Ragnarok 
            400, // Sagittarius 
            85, // Spriggan

            // Light DC
            402, // Alpha 
            36, // Lich 
            66, // Odin 
            56, // Phoenix 
            403, // Raiden 
            67, // Shiva 
            33, // Twintania 
            42 // Zodiark
        ],

        NorthAmerican: [
            // Aether DC
            75, // Adamantoise 
            79, // Cactuar
            54, // Faerie 
            63, // Gilgamesh 
            40, // Jenova 
            65, // Midgardsormr 
            99, // Sargatanas
            57, // Siren

            // Crystal DC
            91, // Balmung
            34, // Brynhildr
            74, // Coeurl
            62, // Diabolos
            81, // Goblin
            75, // Malboro
            37, // Mateus
            41, // Zalera
            
            // Dynamis DC
            408, // Cuchulainn
            411, // Golem
            406, // Halicarnassus
            409, // Kraken
            407, // Maduin
            404, // Marilith
            410, // Rafflesia
            405, // Seraph
            
            // Primal DC
            78, // Behemoth
            93, // Excalibur
            53, // Exodus
            35, // Famfrit
            95, // Hyperion
            55, // Lamia
            64, // Leviathan
            77 // Ultros
        ],

        Oceanian: [
            // Materia DC
            22, // Bismarck 
            21, // Ravana
            86, // Sephirot
            87, // Sophia
            88 // Zurvan
        ],

        Japanese: [
            // Elemental DC
            90, // Aegis
            68, // Atomos
            45, // Carbuncle
            58, // Garuda
            94, // Gungnir
            49, // Kujata
            72, // Tonberry
            50, // Typhon

            // Gaia DC
            43, // Alexander
            69, // Bahamut
            92, // Durandal
            46, // Fenrir
            59, // Ifrit
            98, // Ridill
            76, // Tiamat
            51, // Ultima

            // Mana DC
            44, // Anima
            23, // Asura
            70, // Chocobo
            47, // Hades
            48, // Ixion
            96, // Masamune
            28, // Pandaemonium
            61, // Titan

            // Meteor DC
            24, // Belias
            82, // Mandragora
            60, // Ramuh
            29, // Shinryu
            30, // Unicorn
            52, // Valefor
            31, // Yojimbo
            32 // Zeromus
        ],
    },
    itemIDs: [40035],
};