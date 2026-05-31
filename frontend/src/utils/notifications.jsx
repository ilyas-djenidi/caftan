import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { OctagonAlert } from 'lucide-react';

/**
 * Shows a premium, custom-designed toast for stock limit warnings.
 * @param {string} message - Optional message override
 */
export const showStockLimitToast = (message = "Limite de stock atteinte pour cet article.") => {
    toast.custom((t) => (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
                backgroundColor: '#1A1714',
                color: '#FAF8F4',
                padding: '16px 24px',
                borderRadius: '16px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                border: '1px solid #B8963E',
                maxWidth: '400px',
                pointerEvents: 'auto'
            }}
        >
            <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(184, 150, 62, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
            }}>
                <OctagonAlert size={20} color="#B8963E" strokeWidth={2.5} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ 
                    fontFamily: "'Cormorant Garamond', serif", 
                    fontSize: '18px', 
                    fontStyle: 'italic',
                    lineHeight: '1.2',
                    color: '#B8963E'
                }}>
                    Stock Limité
                </span>
                <span style={{ 
                    fontFamily: "'Jost', sans-serif", 
                    fontSize: '13px', 
                    fontWeight: '300',
                    opacity: 0.9,
                    marginTop: '2px'
                }}>
                    {message}
                </span>
            </div>
        </motion.div>
    ), {
        duration: 4000,
        position: 'bottom-center'
    });
};
