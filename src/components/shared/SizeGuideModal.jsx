import Modal from '../ui/Modal';

const sizeData = [
    { size: 'XS', poitrine: '80–84', taille: '62–66', hanches: '88–92' },
    { size: 'S', poitrine: '84–88', taille: '66–70', hanches: '92–96' },
    { size: 'M', poitrine: '88–92', taille: '70–74', hanches: '96–100' },
    { size: 'L', poitrine: '92–96', taille: '74–78', hanches: '100–104' },
    { size: 'XL', poitrine: '96–100', taille: '78–82', hanches: '104–108' },
    { size: 'XXL', poitrine: '100–106', taille: '82–88', hanches: '108–114' },
];

const SizeGuideModal = ({ isOpen, onClose }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Guide des Tailles">
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '24px', lineHeight: 1.6 }}>
                Toutes les mesures sont en centimètres (cm). Pour choisir votre taille, mesurez votre poitrine, taille et hanches et comparez avec le tableau ci-dessous.
            </p>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#111111', color: '#ffffff' }}>
                            {['Taille', 'Poitrine', 'Taille', 'Hanches'].map((h) => (
                                <th
                                    key={h}
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'center',
                                        fontWeight: '800',
                                        fontSize: '10px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.15em',
                                    }}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sizeData.map((row, i) => (
                            <tr
                                key={row.size}
                                style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#FAFAF8' }}
                            >
                                <td
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'center',
                                        fontWeight: '800',
                                        color: '#C3AB7E',
                                        fontSize: '13px',
                                        borderBottom: '1px solid #F0EDE8',
                                    }}
                                >
                                    {row.size}
                                </td>
                                {[row.poitrine, row.taille, row.hanches].map((val, j) => (
                                    <td
                                        key={j}
                                        style={{
                                            padding: '12px 16px',
                                            textAlign: 'center',
                                            color: '#374151',
                                            borderBottom: '1px solid #F0EDE8',
                                        }}
                                    >
                                        {val}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '20px', textAlign: 'center' }}>
                En cas de doute, nous vous conseillons de prendre la taille au-dessus.
            </p>
        </Modal>
    );
};

export default SizeGuideModal;
