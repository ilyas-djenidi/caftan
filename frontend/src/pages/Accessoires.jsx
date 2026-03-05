import CollectionGrid from '../components/shared/CollectionGrid';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export default function Accessoires() {
    return (
        <>
            <Navbar />
            <CollectionGrid
                category="accessoires"
                title="Accessoires de Prestige"
                subtitle="Une sélection délicate de bijoux et d'accessoires pour parfaire votre allure avec éclat et finesse."
            />
            <Footer />
        </>
    );
}
