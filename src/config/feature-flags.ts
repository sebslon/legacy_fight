interface Feature {
  isActive: () => boolean;
}

export const FeatureFlags = {
  newDriverReport: {
    isActive: () => process.env.NEW_DRIVER_REPORT === 'true',
  },

  driverReportCreationReconciliation: {
    isActive: () =>
      process.env.DRIVER_REPORT_CREATION_RECONCILIATION === 'true',
  },
} as { [key: string]: Feature };
