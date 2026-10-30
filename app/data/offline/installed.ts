const installedDisplayModes = ['standalone', 'fullscreen', 'minimal-ui', 'window-controls-overlay']

/**
 * True when the page runs as the installed app rather than in a browser tab.
 * Offline storage (service worker, device recipes, photo sync) exists only
 * there. Always false during server rendering.
 */
export const isInstalledPwa = () =>
  import.meta.client && (
    installedDisplayModes.some((mode) => matchMedia(`(display-mode: ${mode})`).matches)
    // iOS Safari reports home screen apps here instead of through display-mode
    || (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
