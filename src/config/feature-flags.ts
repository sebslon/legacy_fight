interface Feature {
  isActive: () => boolean;
}

export const FeatureFlags = {
  newDriverReport: {
    isActive: () => process.env.NEW_DRIVER_REPORT === 'true',
  },
} as { [key: string]: Feature };
