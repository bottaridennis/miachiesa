import { doc } from 'firebase/firestore';
import { db } from './firebase';
import { useDocData } from './useCol';
import { DEFAULT_SITE_CONFIG } from './defaults';
import type { SiteConfig } from '../types';

export const siteConfigRef = () => doc(db, 'site_config', 'main');

export function useSiteConfig() {
  const { data, loading } = useDocData<SiteConfig & { id: string }>(siteConfigRef());
  return { config: { ...DEFAULT_SITE_CONFIG, ...(data ?? {}) } as SiteConfig, loading };
}
