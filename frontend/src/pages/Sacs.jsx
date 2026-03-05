import CollectionGrid from '../components/shared/CollectionGrid';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export default function Sacs() {
    return (
        <>
            <Navbar />
            <CollectionGrid
                category="sacs"
                title="Maroquinerie Fine"
                subtitle="Des sacs d'exception conçus pour sublimer vos tenues les plus élégantes. Le détail qui fait la différence."
            />
            <Footer />
        </>
    );
}
