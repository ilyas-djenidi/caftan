import CollectionGrid from '../components/shared/CollectionGrid';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export default function Caftans() {
    return (
        <>
            <Navbar />
            <CollectionGrid
                category="caftans"
                title="Caftans de Luxe"
                subtitle="Une fusion exquise de tradition ancestrale et de raffinement contemporain. Chaque caftan est une pièce d'art unique."
            />
            <Footer />
        </>
    );
}
