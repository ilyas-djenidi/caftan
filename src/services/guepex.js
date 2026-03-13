import { supabase } from '../lib/supabase';

const PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/guepex-proxy`;

const guepexFetch = async (endpoint, options = {}) => {
  try {
    const proxyUrl = `${PROXY_URL}?endpoint=${encodeURIComponent(endpoint)}`;
    
    // Get current session JWT
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

    const fetchOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
      },
    };

    if (options.body) {
      fetchOptions.body = options.body;
    }

    const res = await fetch(proxyUrl, fetchOptions);

    if (!res.ok) {
      const text = await res.text();
      console.error('[Guepex] HTTP Error:', res.status, text);
      return { error: `HTTP ${res.status}: ${text}` };
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/pdf')) {
      return await res.blob();
    }

    return await res.json();
  } catch (err) {
    console.error('[Guepex] Fetch error:', err);
    return { error: err.message };
  }
};


export const getWilayas = () =>
  guepexFetch('/wilayas/?page_size=58');

export const getCommunes = (wilayaId) =>
  guepexFetch(`/communes/?wilaya_id=${wilayaId}&page_size=1000`);

export const getCenters = (wilayaId) =>
  guepexFetch(`/centers/?wilaya_id=${wilayaId}`);

export const getFees = (fromWilayaId, toWilayaId) =>
  guepexFetch(`/fees/?from_wilaya_id=${fromWilayaId}&to_wilaya_id=${toWilayaId}`);

export const getAllParcels = async (page = 1) => {
  const data = await guepexFetch(`/parcels/?page=${page}&page_size=50`);
  console.log('[Guepex] getAllParcels raw response:', data);
  return data;
};


export const getParcel = (tracking) =>
  guepexFetch(`/parcels/${tracking}/`);

export const getParcelHistory = (tracking) =>
  guepexFetch(`/histories/${tracking}/`);

export const getPrintLabel = (tracking) =>
  guepexFetch(`/parcels/print/?tracking=${tracking}`);

export const createParcel = (data) =>
  guepexFetch('/parcels/', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const cancelParcel = (tracking) =>
  guepexFetch(`/parcels/${tracking}/`, { method: 'DELETE' });

export const updateParcel = (tracking, data) =>
  guepexFetch(`/parcels/${tracking}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

/* ─── Status color map ────────────────────────────────────────────── */
const STATUS_COLORS = {
  'En préparation':       '#9CA3AF',
  'Pas encore expédié':   '#9CA3AF',
  'A vérifier':           '#9CA3AF',
  'Pas encore ramassé':   '#9CA3AF',

  'Ramassé':              '#3B82F6',
  'Expédié':              '#3B82F6',
  'Centre':               '#3B82F6',
  'Transfert':            '#3B82F6',
  'En passation':         '#3B82F6',
  'Prêt à expédier':      '#3B82F6',

  'Vers Wilaya':          '#6366F1',
  'En transit':           '#6366F1',
  'Reçu à Wilaya':        '#6366F1',
  'En localisation':      '#6366F1',

  'Prêt pour livreur':    '#B8963E',
  'Sorti en livraison':   '#B8963E',
  'En attente du client': '#B8963E',

  'Livré':                '#10B981',

  'Tentative échouée':    '#F59E0B',
  'En alerte':            '#F59E0B',
  'Bloqué':               '#F59E0B',
  'En attente':           '#F59E0B',

  'Annulé':               '#EF4444',
  'Echèc livraison':      '#EF4444',
  'Retour vers centre':   '#EF4444',
  'Retourné au centre':   '#EF4444',
  'Retour transfert':     '#EF4444',
  'Retour groupé':        '#EF4444',
  'Retour à retirer':     '#EF4444',
  'Retour vers vendeur':  '#EF4444',
  'Retourné au vendeur':  '#EF4444',
  'Echange échoué':       '#EF4444',
};


export const getStatusColor = (status) =>
  STATUS_COLORS[status] ?? '#9CA3AF';

