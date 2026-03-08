const fs = require('fs');

const filesToPatch = [
    'src/pages/Home.jsx',
    'src/pages/Packs.jsx',
    'src/pages/Wishlist.jsx',
    'src/pages/Contact.jsx',
    'src/pages/ProductDetail.jsx',
    'src/components/layout/Navbar.jsx'
];

for (const file of filesToPatch) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');

    // 1. Add isAr
    if (!content.includes('const isAr = i18n.language')) {
        content = content.replace(
            /(const \{ [^}]*i18n[^}]* \} = useTranslation\(\);)/,
            "$1\n    const isAr = i18n.language === 'ar';"
        );
    }

    // 2. Fix subtitle fallback in Home
    if (file === 'src/pages/Home.jsx') {
        content = content.replace(
            "{i18n.language === 'ar' ? (heroData.subtitle_ar || heroData.subtitle_fr) : (i18n.language === 'en' ? (heroData.subtitle_en || heroData.subtitle_fr) : heroData.subtitle_fr)}",
            "{i18n.language === 'ar' ? (heroData.subtitle_ar || t('home.hero.tagline')) : (i18n.language === 'en' ? (heroData.subtitle_en || t('home.hero.tagline')) : (heroData.subtitle_fr || t('home.hero.tagline')))}"
        );
        content = content.replace("Défiler</span>", "{t('home.hero.scroll', { defaultValue: 'Défiler' })}</span>");
    }

    // 3. Replace letterSpacing
    content = content.replace(/letterSpacing:\s*'([^']+)'/g, "letterSpacing: isAr ? '0' : '$1'");
    // clean up double applied
    content = content.replace(/isAr \? '0' : isAr \? '0' : '([^']+)'/g, "isAr ? '0' : '$1'");

    // 4. Replace fontFamily
    content = content.replace(/fontFamily:\s*\"'([^']+)',\s*([^']+)\"/g, 'fontFamily: isAr ? "inherit" : "\'$1\', $2"');
    content = content.replace(/fontFamily:\s*'([^']+)'/g, "fontFamily: isAr ? 'inherit' : '$1'");
    content = content.replace(/isAr \? 'inherit' : isAr \? 'inherit' : '([^']+)'/g, "isAr ? 'inherit' : '$1'");

    fs.writeFileSync(file, content, 'utf8');
    console.log(`Patched ${file}`);
}
