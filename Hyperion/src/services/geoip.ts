// ==========================================
// GeoIP Service - IP Geographic Location
// ==========================================

import type { IPLocation } from '../types/connection';

/** GeoIP API response from ip-api.com */
interface IPApiResult {
  status: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  query: string;
}

/** Cache for IP lookups */
const locationCache = new Map<string, IPLocation>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

class GeoIPService {
  private cacheExpiry = new Map<string, number>();

  /**
   * Query IP geographic location
   */
  async lookup(ip: string): Promise<IPLocation | null> {
    // Check cache
    const cached = this.getFromCache(ip);
    if (cached) return cached;

    try {
      // Use ip-api.com (free, no API key needed)
      const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,city,isp,org,as,lat,lon,timezone,query`);
      
      if (!response.ok) {
        return null;
      }

      const data: IPApiResult = await response.json();
      
      if (data.status !== 'success') {
        return null;
      }

      const location: IPLocation = {
        ip: data.query,
        country: data.country,
        country_code: data.countryCode,
        region: data.regionName || data.region,
        city: data.city,
        isp: data.isp,
        org: data.org,
        as: data.as,
        lat: data.lat,
        lon: data.lon,
        timezone: data.timezone,
      };

      // Store in cache
      this.setCache(ip, location);
      
      return location;
    } catch (error) {
      console.error('GeoIP lookup failed:', error);
      return null;
    }
  }

  /**
   * Batch lookup multiple IPs
   */
  async batchLookup(ips: string[]): Promise<Map<string, IPLocation>> {
    const results = new Map<string, IPLocation>();
    
    // Process in batches of 10 to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < ips.length; i += batchSize) {
      const batch = ips.slice(i, i + batchSize);
      const promises = batch.map(ip => this.lookup(ip));
      const batchResults = await Promise.all(promises);
      
      batch.forEach((ip, index) => {
        if (batchResults[index]) {
          results.set(ip, batchResults[index]!);
        }
      });
      
      // Add delay between batches
      if (i + batchSize < ips.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  /**
   * Get country flag emoji
   */
  getCountryFlag(countryCode: string): string {
    if (!countryCode || countryCode.length !== 2) return '🌍';
    
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    
    return String.fromCodePoint(...codePoints);
  }

  /**
   * Format location for display
   */
  formatLocation(location: IPLocation | null): string {
    if (!location) return '未知';
    
    const parts: string[] = [];
    if (location.city) parts.push(location.city);
    if (location.region && location.region !== location.city) parts.push(location.region);
    if (location.country) parts.push(location.country);
    
    return parts.join(', ') || location.isp || '未知';
  }

  private getFromCache(ip: string): IPLocation | null {
    const cached = locationCache.get(ip);
    const expiry = this.cacheExpiry.get(ip);
    
    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }
    
    return null;
  }

  private setCache(ip: string, location: IPLocation): void {
    locationCache.set(ip, location);
    this.cacheExpiry.set(ip, Date.now() + CACHE_TTL);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    locationCache.clear();
    this.cacheExpiry.clear();
  }
}

export const geoipService = new GeoIPService();
