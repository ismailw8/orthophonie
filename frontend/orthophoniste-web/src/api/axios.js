import keycloak from '../auth/keycloak';
import { createApiClient } from './createApiClient.js';

export default createApiClient(keycloak);
