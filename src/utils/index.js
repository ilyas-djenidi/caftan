// src/utils/index.js

export const CATEGORIES = [
    { key: 'caftans', label: 'Caftans', labelAr: 'قفاطين' },
    { key: 'accessoires', label: 'Accessoires', labelAr: 'إكسسوارات' },
    { key: 'sacs', label: 'Les Sacs', labelAr: 'الحقائب' },
]

export const ALGERIA_CITIES = {
    'Adrar': ['Adrar', 'Tamest', 'Charouine', 'Reggane', 'In Zghmir', 'Tit', 'Tsabit', 'Timimoun', 'Ouled Saïd', 'Zaouiet Kounta', 'Aoulef', 'Akabli', 'Titra', 'Fenoughil', 'Tali'],
    'Chlef': ['Chlef', 'Ténès', 'Boukadir', 'Ouled Farès', 'Oued Fodda', 'Béni Haoua', 'Abou El Hassan', 'Al Karimia', 'Taougrit', 'Béchar', 'Ouled Ben Abdelkader', 'Harchoun', 'Zéboudja'],
    'Laghouat': ['Laghouat', 'Ksar El Hirane', 'Béni M\'Rara', 'Sidi Makhlouf', 'Hassi Delaa', 'Hassi R\'Mel', 'Aïn Mahdi', 'Tadjmout', 'El Kheneg', 'Gueltat Sidi Saâd', 'Aflou', 'Beidha'],
    'Oum El Bouaghi': ['Oum El Bouaghi', 'Aïn Beïda', 'Aïn M\'lila', 'Aïn Fakroun', 'Aïn Kercha', 'Hanchir Toumghani', 'Fkirina', 'Souk Naamane', 'Dhalaä', 'Bouchegouf'],
    'Batna': ['Batna', 'Arris', 'Barika', 'Merouana', 'Timgad', 'Ain Touta', 'N\'Gaous', 'Tazoult', 'Chemora', 'Djerma', 'Oued El Ma', 'Fesdis', 'El Madher'],
    'Béjaïa': ['Béjaïa', 'Amizour', 'Aokas', 'Barbacha', 'Akbou', 'Ouzellaguen', 'Sidi-Aïch', 'El Kseur', 'Chemini', 'Darguina', 'Kherrata', 'Tichy', 'Melbou'],
    'Biskra': ['Biskra', 'Sidi Okba', 'Tolga', 'Ouled Djellal', 'Zouiret El Kheira', 'El Kantara', 'Loutaya', 'El Ghrous', 'Djemorah', 'Branis', 'Foughala'],
    'Béchar': ['Béchar', 'Kenadsa', 'Béni Abbès', 'Taghit', 'Abadla', 'Igli', 'Tabelbala', 'Lahmar', 'Mougheul', 'Beni Ounif', 'Boukaïs'],
    'Blida': ['Blida', 'Boufarik', 'Oued Alleug', 'Ouled Yaïch', 'Chréa', 'El Affroun', 'Meftah', 'Chebli', 'Hammâm Melouane', 'Beni Mered', 'Bougara', 'Larbaâ'],
    'Bouira': ['Bouira', 'Lakhdaria', 'Sour El Ghozlane', 'Aïn Bessem', 'Bechloul', 'M\'Chedallah', 'Kadiria', 'Aomar', 'Djebahia', 'Haizer', 'Taghzout'],
    'Tamanrasset': ['Tamanrasset', 'In Salah', 'In Amguel', 'Idles', 'Tazrouk', 'In Ghar', 'Abalessa', 'Foggaret Ezzaouia'],
    'Tébessa': ['Tébessa', 'Bir el-Ater', 'Cheria', 'Ouenza', 'El Ogla', 'El Kouif', 'Morsott', 'Negrine', 'El Houidjbet', 'Safsaf El Ouesra', 'Hammamet'],
    'Tlemcen': ['Tlemcen', 'Mansoura', 'Maghnia', 'Ghazaouet', 'Remchi', 'Sebdou', 'Ouled Mimoun', 'Béni Saf', 'Bensekrane', 'Hennaya', 'Nedroma', 'Beni Snous'],
    'Tiaret': ['Tiaret', 'Sougueur', 'Frenda', 'Kasr Chellala', 'Mahdia', 'Dahmouni', ' السوقر', 'Meghila', 'Tousnina', 'Medroussa', 'Ain Deheb', 'Rahouia'],
    'Tizi Ouzou': ['Tizi Ouzou', 'Azazga', 'Tigzirt', 'Draâ Ben Khedda', 'Larbaâ Nath Irathen', 'Azeffoun', 'Béni Douala', 'Draâ El Mizan', 'Ouadhias', 'Ouacif', 'Béni Yenni', 'Mekla'],
    'Alger': ['Alger Centre', 'Sidi M\'Hamed', 'El Biar', 'Bab El Oued', 'Bologhine', 'Casbah', 'Oued Koriche', 'Bir Mourad Raïs', 'Hydra', 'Birmandreis', 'El Madania', 'Ben Aknoun', 'Beni Messous', 'Bouzareah', 'Bab Ezzouar', 'Bordj El Kiffan', 'Dar El Beïda', 'El Harrach', 'Baraki', 'Kouba', 'Hussein Dey', 'Zeralda', 'Staoueli', 'Ain Benian', 'Cheraga', 'Reghaïa', 'Rouïba', 'Dely Ibrahim'],
    'Djelfa': ['Djelfa', 'Messaad', 'Ain El Ibel', 'Hassi Bahbah', 'Charef', 'Birine', 'Sidi Ladjel', 'Had-Sahary', 'El Idrissia', 'Dar Chioukh', 'Zaccar'],
    'Jijel': ['Jijel', 'Taher', 'El Milia', 'Chekfa', 'Djimla', 'El Ancer', 'Sidi Abdelaziz', 'Kaous', 'Ghebala', 'Settara', 'Bouraoui Belhadef'],
    'Sétif': ['Sétif', 'El Eulma', 'Bougaa', 'Ain Arnat', 'Ain Oulmene', 'Ain Azel', 'Guenzet', 'Beni Aziz', 'Babor', 'Hammam Guergour', 'Salah Bey'],
    'Saïda': ['Saïda', 'Aïn El Hadjar', 'Youb', 'Hassasna', 'Ouled Brahim', 'Sidi Amar', 'Moulay Larbi', 'Sidi Boubekeur', 'Ouled Khaled'],
    'Skikda': ['Skikda', 'El Harrouch', 'Azzaba', 'Collo', 'Tamalous', 'Ouled Attia', 'Ben Azzouz', 'Zighoud Youcef', 'Hamadi Krouma', 'Filfila'],
    'Sidi Bel Abbès': ['Sidi Bel Abbès', 'Tessala', 'Sidi Lahcene', 'Sidi Hamadouche', 'Mostefa Ben Brahim', 'Telagh', 'Moulay Slissen', 'Sfisef', 'Ben Badis'],
    'Annaba': ['Annaba', 'El Bouni', 'El Hadjar', 'Berrahal', 'Seraïdi', 'Chetaïbi', 'Oued El Aneb', 'Treat', 'Eulma', 'Ain Berda'],
    'Guelma': ['Guelma', 'Bouchegouf', 'Héliopolis', 'Oued Zenati', 'Guelaat Bou Sbaâ', 'Hammâm Debagh', 'Roknia', 'Ain Sandel', 'Nechmaya'],
    'Constantine': ['Constantine', 'El Khroub', 'Hamma Bouziane', 'Didouche Mourad', 'Zighoud Youcef', 'Ain Abid', 'Ibn Ziad', 'Messaoud Boudjeriou'],
    'Médéa': ['Médéa', 'Berrouaghia', 'Ksar El Boukhari', 'Beni Slimane', 'Tablat', 'Ouzera', 'El Omaria', 'Seghouane', 'Chahbounia', 'Aziz'],
    'Mostaganem': ['Mostaganem', 'Hassi Mameche', 'Ain Nouïssy', 'Mesra', 'Bouguirat', 'Sidi Lakhdar', 'Achaacha', 'Sidi Ali', 'Kheïreddine', 'Sayada'],
    'M\'Sila': ['M\'Sila', 'Bou Saâda', 'Boussaada', 'Maâdid', 'Hammam Dhalaa', 'Sidi Aïssa', 'Aïn El Hadjel', 'Beni Ilmane', 'Ouled Derradj'],
    'Mascara': ['Mascara', 'Sig', 'Mohammadia', 'Tighennif', 'Ghriss', 'Oued Taria', 'Bou Hanifia', 'Aïn Fekan', 'El Bordj', 'Zahana'],
    'Ouargla': ['Ouargla', 'Hassi Messaoud', 'Rouissat', 'Ain Beida', 'N\'Goussa', 'Sidi Khouiled', 'Hassi Ben Abdellah', 'El Borma'],
    'Oran': ['Oran', 'Es Sénia', 'Bir El Djir', 'Arzew', 'Gdyel', 'Oued Tlelat', 'Boutlélis', 'Aïn El Turk', 'Bethioua', 'Misserghin', 'El Kerma'],
    'El Bayadh': ['El Bayadh', 'Rogassa', 'Brezina', 'Boualem', 'El Abiodh Sidi Cheikh', 'Bouktoub', 'Chellala', 'Arbaouat', 'Ghassoul'],
    'Illizi': ['Illizi', 'Djanet', 'In Amenas', 'Bordj El Houasse'],
    'Bordj Bou Arréridj': ['Bordj Bou Arréridj', 'Ras El Oued', 'Bordj Ghedir', 'Bir Kasdali', 'Mansoura', 'El M\'hir', 'Bordj Zemoura', 'Medjana'],
    'Boumerdès': ['Boumerdès', 'Boudouaou', 'Dellys', 'Afir', 'Naciria', 'Isser', 'Thenia', 'Khemis El Khechna', 'Zemmouri', 'Corso', 'Baghlia'],
    'El Tarf': ['El Tarf', 'El Kala', 'Dréan', 'Bouhadjar', 'Ben Mehidi', 'Besbes', 'Chihani', 'Zerbizer', 'Souarekh', 'Chefia'],
    'Tindouf': ['Tindouf', 'Oum El Assel'],
    'Tissemsilt': ['Tissemsilt', 'Theniet El Had', 'Lardjem', 'Ammari', 'Khemisti', 'Bordj El Emir Abdelkader', 'Lazharia', 'Boucaid'],
    'El Oued': ['El Oued', 'Guémar', 'Bayadha', 'Debila', 'Réguiba', 'Hassi Khalifa', 'Magrane', 'Taleb Larbi', 'Mih Ouansa', 'Ourmas'],
    'Khenchela': ['Khenchela', 'Kais', 'El Hamma', 'Bouhmama', 'Ensigha', 'Babor', 'Chélia', 'Remila', 'Baghaï', 'Taouzient'],
    'Souk Ahras': ['Souk Ahras', 'M\'daourouch', 'Seddrata', 'Haddada', 'Taoura', 'Ouled Driss', 'Hanancha', 'Merahna', 'Khemissa'],
    'Tipaza': ['Tipaza', 'Cherchell', 'Kolea', 'Hadres', 'Bou Ismaïl', 'Ahmer El Aïn', 'Attatba', 'Damous', 'Gouraya', 'Fouka', 'Sidi Rached'],
    'Mila': ['Mila', 'Chelghoum Laïd', 'Teleghma', 'Ferdjioua', 'Grarem Gouga', 'Oued Athmania', 'Rouached', 'Tadjenanet', 'Telerghma'],
    'Aïn Defla': ['Aïn Defla', 'Miliana', 'Khemis Miliana', 'Hammam Righa', 'Djendel', 'Boumedfaâ', 'Djelida', 'El Attaf', 'El Abadia'],
    'Naâma': ['Naâma', 'Mecheria', 'Aïn Séfra', 'Moghrar', 'Asla', 'Tiout', 'Sfissifa', 'Kasr El Hirane'],
    'Aïn Témouchent': ['Aïn Témouchent', 'Béni Saf', 'Hammam Bouhadjar', 'El Amria', 'El Malah', 'Sidi Ben Adda', 'Oulhaça Gheraba'],
    'Ghardaïa': ['Ghardaïa', 'Metlili', 'El Guerrara', 'Bounoura', 'Zelfana', 'Dhayet Bendhahoua', 'Berriane', 'Mansoura'],
    'Relizane': ['Relizane', 'Oued Rhiou', 'Ammi Moussa', 'Zemmora', 'Matmar', 'Mazouna', 'Sidi M\'Hamed Benaouda', 'Djidiouia'],
    'Timimoun': ['Timimoun', 'Aougrout', 'Deldoul', 'Ksar Kaddour', 'Ouled Saïd', 'Ouled Aïssa'],
    'Bordj Badji Mokhtar': ['Bordj Badji Mokhtar', 'Timiaouine'],
    'Ouled Djellal': ['Ouled Djellal', 'Sidi Khaled', 'Ras El Miaad', 'Besbes', 'Doucen', 'Chaïba'],
    'Béni Abbès': ['Béni Abbès', 'Kerzaz', 'Ouled Khoudir', 'El Ouata', 'Tamtert', 'Igli', 'Tabelbala'],
    'In Salah': ['In Salah', 'Foggaret Ezzaouia', 'In Ghar'],
    'In Guezzam': ['In Guezzam', 'Tin Zaouatine'],
    'Touggourt': ['Touggourt', 'Nezla', 'Tebesbest', 'Zaouia El Abidia', 'Temacine', 'El Hadjira', 'Ben Aceur'],
    'Djanet': ['Djanet', 'Bordj El Houasse'],
    'El M\'Ghair': ['El M\'Ghair', 'Oum Touyour', 'Sidi Khelil', 'Still'],
    'El Meniaa': ['El Meniaa', 'Hassi Gara']
};

export const WILAYAS = Object.keys(ALGERIA_CITIES).sort();

export const GUEPEX_TARIFFS = {
    "Adrar": { home: 1650, desk: 1550 },
    "Chlef": { home: 700, desk: 600 },
    "Laghouat": { home: 850, desk: 700 },
    "Oum El Bouaghi": { home: 700, desk: 600 },
    "Batna": { home: 550, desk: 450 },
    "Béjaïa": { home: 700, desk: 600 },
    "Biskra": { home: 700, desk: 600 },
    "Béchar": { home: 1650, desk: 1550 },
    "Blida": { home: 700, desk: 600 },
    "Bouira": { home: 550, desk: 450 },
    "Tamanrasset": { home: 1650, desk: 1550 },
    "Tébessa": { home: 850, desk: 700 },
    "Tlemcen": { home: 700, desk: 600 },
    "Tiaret": { home: 700, desk: 600 },
    "Tizi Ouzou": { home: 700, desk: 600 },
    "Alger": { home: 550, desk: 450 },
    "Djelfa": { home: 700, desk: 600 },
    "Jijel": { home: 700, desk: 600 },
    "Sétif": { home: 550, desk: 450 },
    "Saïda": { home: 700, desk: 600 },
    "Skikda": { home: 700, desk: 600 },
    "Sidi Bel Abbès": { home: 700, desk: 600 },
    "Annaba": { home: 700, desk: 600 },
    "Guelma": { home: 700, desk: 600 },
    "Constantine": { home: 700, desk: 600 },
    "Médéa": { home: 550, desk: 450 },
    "Mostaganem": { home: 700, desk: 600 },
    "M'Sila": { home: 500, desk: 400 },
    "Mascara": { home: 700, desk: 600 },
    "Ouargla": { home: 850, desk: 700 },
    "Oran": { home: 700, desk: 600 },
    "El Bayadh": { home: 1650, desk: 1550 },
    "Illizi": { home: 1650, desk: 1550 },
    "Bordj Bou Arréridj": { home: 550, desk: 450 },
    "Boumerdès": { home: 700, desk: 600 },
    "El Tarf": { home: 700, desk: 600 },
    "Tindouf": { home: 1650, desk: 1550 },
    "Tissemsilt": { home: 700, desk: 600 },
    "El Oued": { home: 850, desk: 700 },
    "Khenchela": { home: 700, desk: 600 },
    "Souk Ahras": { home: 700, desk: 600 },
    "Tipaza": { home: 700, desk: 600 },
    "Mila": { home: 700, desk: 600 },
    "Aïn Defla": { home: 700, desk: 600 },
    "Naâma": { home: 1650, desk: 1550 },
    "Aïn Témouchent": { home: 700, desk: 600 },
    "Ghardaïa": { home: 850, desk: 700 },
    "Relizane": { home: 700, desk: 600 },
    "Timimoun": { home: 1650, desk: 1550 },
    "Bordj Badji Mokhtar": { home: 1650, desk: 1550 },
    "Ouled Djellal": { home: 850, desk: 700 },
    "Béni Abbès": { home: 1650, desk: 1550 },
    "In Salah": { home: 1650, desk: 1550 },
    "In Guezzam": { home: 1650, desk: 1550 },
    "Touggourt": { home: 850, desk: 700 },
    "Djanet": { home: 1650, desk: 1550 },
    "El M'Ghair": { home: 850, desk: 700 },
    "El Meniaa": { home: 850, desk: 700 }
};

// Comprehensive normalization for wilaya matching
const normWilaya = (s) => (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[''\-_\s]+/g, '');

// Pre-compute normalized mapping
const NORMALIZED_TARIFFS = Object.keys(GUEPEX_TARIFFS).reduce((acc, key) => {
    acc[normWilaya(key)] = GUEPEX_TARIFFS[key];
    return acc;
}, {});

export const getDeliveryFee = (wilaya, type = 'home') => {
    if (!wilaya) return 0;
    const key = normWilaya(wilaya);
    const tariff = NORMALIZED_TARIFFS[key];
    if (!tariff) return 0;
    
    // Support both 'center'/'desk' and 'home' nomenclature
    const typeKey = (type === 'bureau' || type === 'center' || type === 'desk') ? 'desk' : 'home';
    return tariff[typeKey] || 0;
};

export const ORDER_STATUSES = {
    pending: { label: 'EN ATTENTE', color: '#FEF9EE', text: '#C3AB7E' },
    confirmed: { label: 'CONFIRMÉE', color: '#EFF6FF', text: '#2563eb' },
    shipped: { label: 'EXPÉDIÉE', color: '#F5F3FF', text: '#7c3aed' },
    delivered: { label: 'LIVRÉE', color: '#F0FDF4', text: '#16a34a' },
    cancelled: { label: 'ANNULÉE', color: '#FEF2F2', text: '#dc2626' },
}

export const PAYMENT_METHODS = [
    { value: 'COD', label: 'Paiement à la livraison' },
    { value: 'CIB', label: 'Carte CIB' },
    { value: 'DAHABIA', label: 'Carte Dahabia' },
]

export const formatPrice = (amount) => {
    if (!amount && amount !== 0) return '—'
    return new Intl.NumberFormat('fr-DZ', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount) + ' DA'
}

export const getImageUrl = (path) => {
    if (!path) return '/placeholder.jpg';
    if (path.startsWith('http')) return path;

    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    return `${baseUrl}${cleanPath}`;
}

export const generateOrderNumber = () => {
    const rand5 = Math.floor(10000 + Math.random() * 90000)
    const rand3 = Math.floor(100 + Math.random() * 900)
    return `#PKR-${rand5}-${rand3}`
}

export const buildWhatsAppUrl = (phone, message) => {
    const cleanPhone = phone.replace(/\s+/g, '').replace('+', '')
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}
