import { computed, ref, watch } from 'vue'

const STORAGE_KEY = 'fancheer-theme'
export type ThemeMode = 'dark' | 'light'

function readStoredTheme(): ThemeMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

const theme = ref<ThemeMode>(readStoredTheme())

function applyTheme(mode: ThemeMode) {
  document.documentElement.setAttribute('data-theme', mode)
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    /* ignore */
  }
}

applyTheme(theme.value)

watch(theme, applyTheme)

export function useTheme() {
  const themeLabel = computed(() => (theme.value === 'dark' ? '亮色' : '暗色'))
  const themeIcon = computed(() => (theme.value === 'dark' ? '☀' : '🌙'))

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  return { theme, themeLabel, themeIcon, toggleTheme }
}
