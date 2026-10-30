/**
 * True only on the client after mount while the browser reports no network.
 * Gated on mount so server and hydration renders always agree ("online").
 *
 * Use it for UI state (banners, disabled controls). Data access decides by
 * whether a request actually fails, since `navigator.onLine` can be wrong.
 */
export const useOffline = () => {
  const isMounted = useMounted()
  const isOnline = useOnline()
  return computed(() => isMounted.value && !isOnline.value)
}
