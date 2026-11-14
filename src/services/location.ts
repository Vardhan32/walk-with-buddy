// ====================================================================
// WALK WITH BUDDY - LOCATION & PRIVACY SERVICE (SECURITY HARDENED)
// ====================================================================

import * as Location from 'expo-location';
import { supabase, isSupabaseConfigured } from './supabase';
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

      const { latitude, longitude } = location.coords;
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return null;
      }

      return { latitude, longitude };
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
   * Updates user location securely on the server with client & server-side rate limiting
   */
  async syncLocationToServer(lat: number, lon: number, areaName?: string): Promise<boolean> {
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      console.warn('Invalid coordinates rejected:', lat, lon);
      return false;
    }

    const now = Date.now();
    if (now - lastUpdateTimestamp < APP_CONFIG.minLocationUpdateIntervalMs) {
      return false;
    }

    if (!isSupabaseConfigured()) {
      lastUpdateTimestamp = now;
      return true;
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
