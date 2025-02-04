export const useSystemSettings = () => {
  const settings = inject(systemSettingsKey)
  if (!settings)
    throw new Error('System settings not provided or used outside of setup')

  return settings
}
