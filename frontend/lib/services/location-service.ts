import { api } from '../api';

export const locationService = {
  getCities: (): Promise<string[]> =>
    api.get('/api/v1/locations/cities'),

  getRegions: (): Promise<string[]> =>
    api.get('/api/v1/locations/regions'),
};
