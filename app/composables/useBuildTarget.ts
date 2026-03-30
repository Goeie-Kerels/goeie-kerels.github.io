export const useBuildTarget = () => {
  const config = useRuntimeConfig()
  const target = (config.public.buildTarget as string) || 'default'
  const brand = config.public.brand as Record<string, any>

  return {
    target,
    brand,
    isDefault: target === 'default',
  }
}
