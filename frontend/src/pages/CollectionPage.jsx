import { useParams } from 'react-router-dom';
import CollectionGrid from '../components/shared/CollectionGrid';

const categoryMap = {
    caftans: { title: 'Caftans de Luxe', subtitle: 'Des créations uniques, tissées avec passion et tradition.' },
    accessoires: { title: 'Accessoires de Prestige', subtitle: 'La touche finale qui sublime chaque tenue.' },
};

const CollectionPage = () => {
    const { category } = useParams();
    const info = categoryMap[category] || { title: 'Notre Collection', subtitle: 'Découvrez notre sélection exclusive.' };

    return (
        <CollectionGrid
            category={category}
            title={info.title}
            subtitle={info.subtitle}
        />
    );
};

export default CollectionPage;
