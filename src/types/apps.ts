export type AppKey = 'tracer' | 'golfGps';

type SharedCampaign = 'web-compare';

export type TracerCampaign = 'web-tracer-hub' | 'web-tracer-home' | 'web-tracer-discgolf' | 'web-tracer-howto' | SharedCampaign;

export type GolfGpsCampaign = 'web-gps-hub' | 'web-gps-home' | 'web-gps-scorecard' | 'web-gps-handicap' | SharedCampaign;

export type Campaign = TracerCampaign | GolfGpsCampaign;

export type StoreTarget =
  | { app: 'tracer'; campaign: TracerCampaign }
  | { app: 'golfGps'; campaign: GolfGpsCampaign };

export interface AppListing {
  name: string;
  appStoreId: string;
}
