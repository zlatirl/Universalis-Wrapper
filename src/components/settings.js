// FFXIV Server(s) to fetch information from
export const dataCenters = {
    Europe: [
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

    "North-America": [
        // Aether DC
        73, // Adamantoise
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

    Oceania: [
        // Materia DC
        22, // Bismarck 
        21, // Ravana
        86, // Sephirot
        87, // Sophia
        88 // Zurvan
    ],

    Japan: [
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

    China: [
        // 陆行鸟 DC
        1167, 
        1081, 
        1042, 
        1044, 
        1060, 
        1173, 
        1174, 
        1175,

        // 莫古力 DC
        1172, 
        1076, 
        1171, 
        1170, 
        1113, 
        1121, 
        1166, 
        1176,

        // 猫小胖 DC
        1043, 
        1169, 
        1106, 
        1045, 
        1177, 
        1178, 
        1179,

        // 豆豆柴 DC
        1192, 
        1183, 
        1180, 
        1186, 
        1201, 
        1068, 
        1064, 
        1187,
    ],

    // Korean: [
    //     한국 DC
    //     2075, 
    //     2076, 
    //     2077, 
    //     2078, 
    //     2080,
    // ] Unsupported for now
};

// World ID to World Name Mapping
export const worlds = {
    // European Worlds
    80: "Cerberus",
    83: "Louisoix",
    71: "Moogle",
    39: "Omega",
    401: "Phantom",
    97: "Ragnarok",
    400: "Sagittarius",
    85: "Spriggan",
    402: "Alpha",
    36: "Lich",
    66: "Odin",
    56: "Phoenix",
    403: "Raiden",
    67: "Shiva",
    33: "Twintania",
    42: "Zodiark",

    // American Worlds
    73: "Adamantoise",
    79: "Cactuar",
    54: "Faerie",
    63: "Gilgamesh",
    40: "Jenova",
    65: "Midgardsormr",
    99: "Sargatanas",
    57: "Siren",
    91: "Balmung",
    34: "Brynhildr",
    74: "Coeurl",
    62: "Diabolos",
    81: "Goblin",
    75: "Malboro",
    37: "Mateus",
    41: "Zalera",
    408: "Cuchulainn",
    411: "Golem",
    406: "Halicarnassus",
    409: "Kraken",
    407: "Maduin",
    404: "Marilith",
    410: "Rafflesia",
    405: "Seraph",
    78: "Behemoth",
    93: "Excalibur",
    53: "Exodus",
    35: "Famfrit",
    95: "Hyperion",
    55: "Lamia",
    64: "Leviathan",
    77: "Ultros",

    // Oceanic Worlds
    22: "Bismarck",
    21: "Ravana",
    86: "Sephirot",
    87: "Sophia",
    88: "Zurvan",

    // Japanese Worlds
    90: "Aegis",
    68: "Atomos",
    45: "Carbuncle",
    58: "Garuda",
    94: "Gungnir",
    49: "Kujata",
    72: "Tonberry",
    50: "Typhon",
    43: "Alexander",
    69: "Bahamut",
    92: "Durandal",
    46: "Fenrir",
    59: "Ifrit",
    98: "Ridill",
    76: "Tiamat",
    51: "Ultima",
    44: "Anima",
    23: "Asura",
    70: "Chocobo",
    47: "Hades",
    48: "Ixion",
    96: "Masamune",
    28: "Pandaemonium",
    61: "Titan",
    24: "Belias",
    82: "Mandragora",
    60: "Ramuh",
    29: "Shinryu",
    30: "Unicorn",
    52: "Valefor",
    31: "Yojimbo",
    32: "Zeromus",

    // Chinese Worlds
    1167: "红玉海",
    1081: "神意之地",
    1042: "拉诺西亚",
    1044: "幻影群岛",
    1060: "萌芽池",
    1173: "宇宙和音",
    1174: "沃仙曦染",
    1175: "晨曦王座",
    1172: "白银乡",
    1076: "白金幻象",
    1171: "神拳痕",
    1170: "潮风亭",
    1113: "旅人栈桥",
    1121: "拂晓之间",
    1166: "龙巢神殿",
    1176: "梦羽宝境",
    1043: "紫水栈桥",
    1169: "延夏",
    1106: "静语庄园",
    1045: "摩杜纳",
    1177: "海猫茶屋",
    1178: "柔风海湾",
    1179: "琥珀原",
    1192: "水晶塔",
    1183: "银泪湖",
    1180: "太阳海岸",
    1186: "伊修加德",
    1201: "红茶川",
    1068: "黄金谷",
    1064: "月牙湾",
    1187: "雪松原",

    // Korean Worlds
    // 2075: "카벙클",
    // 2076: "초코보",
    // 2077: "모그리",
    // 2078: "톤베리",
    // 2080: "펜리르", Unsupported for now
}; 

export const itemIDs = {
    44162: "Grade 2 Gemdraught of Strength", // Grade 2 Gemdraught of Strength
};
