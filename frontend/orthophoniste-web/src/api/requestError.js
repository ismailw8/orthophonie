export function requestErrorToUi(error, fallback = 'Impossible de charger les données.') {
  if (error?.code === 'ERR_CANCELED') return null;
  if (['ETIMEDOUT', 'ECONNABORTED'].includes(error?.code)) {
    return { message: 'Le service met trop de temps à répondre. Réessayez dans quelques instants.', retryable: true };
  }
  const status = error?.response?.status;
  if (status === 401) return { message: 'Votre session a expiré. Reconnectez-vous.', retryable: false };
  if (status === 403) return { message: 'Vous ne disposez pas des droits nécessaires.', retryable: false };
  if (status === 429) return { message: 'Trop de demandes. Patientez avant de réessayer.', retryable: false };
  if (status >= 500) return { message: 'Le service est temporairement indisponible. Réessayez dans quelques instants.', retryable: true };
  if (error?.code === 'ERR_NETWORK' || (!status && error?.request)) {
    return { message: 'Connexion au serveur impossible. Vérifiez votre connexion puis réessayez.', retryable: true };
  }
  return { message: fallback, retryable: !status };
}
