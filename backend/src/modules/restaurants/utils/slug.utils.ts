import * as crypto from 'crypto';
import { RestaurantRepository } from '../repositories/index';
import { RestaurantSlugConflictException } from '../exceptions/restaurant.exceptions';
import { RESTAURANT_CONSTANTS } from '../constants/restaurant.contant';
 
/**
 * Converts a restaurant name to a URL-safe slug.
 * "Chez Mama Africa!" → "chez-mama-africa"
 */
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')                        
    .replace(/[\u0300-\u036f]/g, '')          
    .replace(/[^a-z0-9\s-]/g, '')             
    .trim()
    .replace(/\s+/g, '-')                     
    .replace(/-{2,}/g, '-')                   
    .slice(0, 80);                             
}
 
/**
 * Generates a unique slug, appending a short random suffix if the base slug
 * is already taken.  Throws after MAX_RETRIES attempts.
 */
export async function generateUniqueSlug(
  name:       string,
  repo:       RestaurantRepository,
  excludeId?: string,
): Promise<string> {
  const base = toSlug(name);
 
  for (let i = 0; i < RESTAURANT_CONSTANTS.SLUG_MAX_RETRIES; i++) {
    const slug = i === 0 ? base : `${base}-${crypto.randomBytes(3).toString('hex')}`;
 
    const exists = await repo.slugExists(slug);
    if (!exists) return slug;
  }
 
  throw new RestaurantSlugConflictException(base);
}