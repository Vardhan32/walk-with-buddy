// ====================================================================
// WALK WITH BUDDY - LOCATION & PRIVACY SERVICE
// ====================================================================

import * as Location from 'expo-location';
import { supabase } from './supabase';
import { APP_CONFIG } from '../constants/config';

let lastUpdateTimestamp = 0;

export const locationService = {
  /**
   * Requests foreground location permission with user explanation
   */
  async requestPermission(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  },

  /**
   * Checks current permission status
   */
  async checkPermission(): Promise<boolean> {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  },

  /**
   * Retrieves approximate device coordinates
   */
  async getCoordinates(): Promise<{ latitude: number; longitude: number } | null> {
    const hasPermission = await this.checkPermission();
    if (!hasPermission) return null;

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // Approximate / coarse accuracy for privacy
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (e) {
      console.warn('Failed to obtain device coordinates:', e);
      return null;
    }
  },

  /**
   * Reverse geocodes coordinates to a safe approximate neighbourhood name
   * (e.g., 'Hitec City, Hyderabad' instead of exact coordinates)
   */
  async getApproximateAreaName(lat: number, lon: number): Promise<string> {
    try {
      const places = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      if (places && places.length > 0) {
        const place = places[0];
        const district = place.district || place.subregion || place.name || 'Hyderabad';
        const city = place.city || 'Hyderabad';
        return `${district}, ${city}`;
      }
    } catch (e) {
      console.warn('Reverse geocoding failed:', e);
    }
    return 'Hitec City, Hyderabad';
  },

  /**
   * Updates user location securely on the server with rate limiting
   */
  async syncLocationToServer(lat: number, lon: number, areaName?: string): Promise<boolean> {
    const now = Date.now();
    if (now - lastUpdateTimestamp < APP_CONFIG.minLocationUpdateIntervalMs) {
      // Skip frequent updates to conserve battery & network
      return false;
    }

    try {
      const resolvedArea = areaName || (await this.getApproximateAreaName(lat, lon));
      const { error } = await supabase.rpc('update_approx_location', {
        lat,
        lon,
        area_name: resolvedArea,
      });

      if (error) throw error;
      lastUpdateTimestamp = now;
      return true;
    } catch (e) {
      console.warn('Failed to sync location to server:', e);
      return false;
    }
  },
};
