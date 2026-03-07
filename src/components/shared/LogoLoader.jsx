import { motion } from 'framer-motion';

export default function LogoLoader() {
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            zIndex: 9999
        }}>
            <motion.div
                initial={{ opacity: 0.5, scale: 0.9 }}
                animate={{
                    opacity: [0.5, 1, 0.5],
                    scale: [0.9, 1, 0.9]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}
            >
                <img
                    src="/logo.png"
                    alt="Maison du Caftans"
                    style={{ height: '100px', width: 'auto' }}
                />
                <div style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontStyle: 'italic',
                    fontSize: '18px',
                    color: '#1A1714',
                    letterSpacing: '0.1em'
                }}>
                    Maison du Caftans
                </div>
            </motion.div>
        </div>
    );
}
