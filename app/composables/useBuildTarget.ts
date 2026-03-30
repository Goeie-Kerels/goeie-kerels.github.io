export const useBuildTarget = () => {
  const config = useRuntimeConfig()
  const target = (config.public.buildTarget as string) || 'default'
  return {
    target,
    isDefault: target === 'default',
    isGoeiekerels: target === 'goeiekerels',
  }
}
