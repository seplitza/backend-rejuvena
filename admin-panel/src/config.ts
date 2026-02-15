/**
 * Configuration file for Admin Panel
 * Contains API URL and authentication headers helpers
 */

import { getAuthToken } from './utils/auth';

// API URL - uses same origin (admin panel is served from same server)
export const API_URL = window.location.origin;

/**
 * Get authentication headers for API requests
 * @returns Headers object with Authorization token
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

/**
 * Get authentication headers for multipart/form-data requests
 * @returns Headers object with Authorization token (without Content-Type)
 */
export function getAuthHeadersMultipart(): Record<string, string> {
  const token = getAuthToken();
  
  return {
    'Authorization': `Bearer ${token}`
  };
}
