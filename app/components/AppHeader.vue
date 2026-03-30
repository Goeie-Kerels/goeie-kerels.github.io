<template>
  <header class="app-header" :class="{ 'is-scrolled': isScrolled }">
    <nav class="container nav-container">
      <NuxtLink 
        :to="localePath('/')" 
        class="logo-brand"
        :class="props.logoClass ?? brand.logoClass ?? 'has-gradient'"
      >
        <slot name="logo">
          {{ brand.logoText }}<span>{{ brand.logoSpan }}</span>
        </slot>
      </NuxtLink>
      
      <div v-if="navLinks.length > 1" class="nav-links glass">
        <NuxtLink 
          v-for="link in navLinks" 
          :key="link.path" 
          :to="localePath(link.path)"
          class="nav-link"
        >
          {{ t(link.name) }}
        </NuxtLink>
      </div>

      <div class="header-actions" :class="{ 'is-empty': !showThemeSlider && !showLocaleSwitcher }">
        <ThemeSlider v-if="showThemeSlider" />
        <div v-if="showLocaleSwitcher" class="locale-switcher glass">
          <NuxtLink 
            v-for="loc in locales" 
            :key="loc.code" 
            :to="switchLocalePath(loc.code)"
            :class="{ active: locale === loc.code }"
          >
            {{ loc.code.toUpperCase() }}
          </NuxtLink>
        </div>
        <button 
          v-if="navLinks.length > 1"
          class="mobile-menu-btn" 
          aria-label="Menu"
          @click="isMenuOpen = !isMenuOpen"
          :class="{ 'is-active': isMenuOpen }"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>

    <!-- Mobile Menu Overlay -->
    <Transition name="menu-reveal">
      <div v-if="isMenuOpen" class="mobile-menu-overlay">
        <div class="menu-reveal-bg"></div>
        <div class="mobile-menu-content container">
          <div class="mobile-nav-links">
            <NuxtLink 
              v-for="(link, index) in navLinks" 
              :key="link.path" 
              :to="localePath(link.path)"
              class="mobile-nav-link"
              :style="{ '--index': index }"
              @click="isMenuOpen = false"
            >
              {{ t(link.name) }}
            </NuxtLink>
          </div>
          
          <div class="mobile-footer">
            <ThemeSlider v-if="showThemeSlider" />
            <div v-if="showLocaleSwitcher" class="mobile-locales">
              <NuxtLink 
                v-for="loc in locales" 
                :key="loc.code" 
                :to="switchLocalePath(loc.code)"
                class="mobile-locale-link"
                :class="{ active: locale === loc.code }"
                @click="isMenuOpen = false"
              >
                {{ loc.name }}
              </NuxtLink>
            </div>
            <button
              v-if="canInstall && !isInstalled"
              class="mobile-install-btn"
              @click="handleInstall"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 16V4M8 12l4 4 4-4"/>
                <path d="M4 20h16"/>
              </svg>
              {{ t('nav.installApp') }}
            </button>
            <!-- iOS Install Modal (teleported to body) -->
            <Teleport to="body">
              <Transition name="ios-modal">
                <div v-if="showIosHint" class="ios-modal-overlay" @click.self="showIosHint = false">
                  <div class="ios-modal">
                    <button class="ios-modal-close" @click="showIosHint = false">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                    <div class="ios-modal-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 16V4M8 12l4 4 4-4"/>
                        <path d="M4 20h16"/>
                      </svg>
                    </div>
                    <h3 class="ios-modal-title">{{ t('nav.installApp') }}</h3>
                    <p class="ios-modal-subtitle">{{ t('nav.iosInstallSubtitle') }}</p>
                    <ol class="ios-modal-steps">
                      <li class="ios-modal-step">
                        <span class="step-num">1</span>
                        <span class="step-text">{{ t('nav.iosStep1') }}</span>
                        <span class="step-icon">
                          <!-- Safari Share icon -->
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M8 12H4a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1h-4"/>
                            <polyline points="12 2 12 15"/>
                            <polyline points="9 5 12 2 15 5"/>
                          </svg>
                        </span>
                      </li>
                      <li class="ios-modal-step">
                        <span class="step-num">2</span>
                        <span class="step-text">{{ t('nav.iosStep2') }}</span>
                        <span class="step-icon">
                          <!-- Plus in square -->
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="3"/>
                            <line x1="12" y1="8" x2="12" y2="16"/>
                            <line x1="8" y1="12" x2="16" y2="12"/>
                          </svg>
                        </span>
                      </li>
                      <li class="ios-modal-step">
                        <span class="step-num">3</span>
                        <span class="step-text">{{ t('nav.iosStep3') }}</span>
                        <span class="step-icon">
                          <!-- Plus in square -->
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="3"/>
                            <line x1="12" y1="8" x2="12" y2="16"/>
                            <line x1="8" y1="12" x2="16" y2="12"/>
                          </svg>
                        </span>
                      </li>
                      <li class="ios-modal-step">
                        <span class="step-num">4</span>
                        <span class="step-text">{{ t('nav.iosStep4') }}</span>
                        <span class="step-icon">
                          <!-- Checkmark -->
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </span>
                      </li>
                    </ol>
                    <div class="ios-modal-arrow">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 22l-8-14h16z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </Transition>
            </Teleport>
            <p class="mobile-copyright">&copy; {{ new Date().getFullYear() }} {{ props.copyright ?? brand.copyright }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
const { t, locales, locale } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const route = useRoute()

const isScrolled = ref(false)
const isMenuOpen = ref(false)
const isDarkTheme = ref(false)

// PWA Install
const installPrompt = ref<any>(null)
const canInstall = ref(false)
const isInstalled = ref(false)
const isIos = ref(false)
const showIosHint = ref(false)

function handleInstall() {
  if (isIos.value) {
    showIosHint.value = true
    return
  }
  if (installPrompt.value) {
    installPrompt.value.prompt()
    installPrompt.value.userChoice.then(() => {
      installPrompt.value = null
      canInstall.value = false
    })
  }
}

// Close menu when route changes
watch(() => route.path, (path) => {
  isMenuOpen.value = false
})

// Check if dark theme is active
const checkDarkTheme = () => {
  isDarkTheme.value = document.documentElement.classList.contains('is-dark')
}

// Watch for DOM changes to detect dark mode toggles from other components
onMounted(() => {
  window.addEventListener('scroll', handleScroll)

  // PWA install prompt
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault()
    installPrompt.value = e
    canInstall.value = true
  })

  window.addEventListener('appinstalled', () => {
    canInstall.value = false
    isInstalled.value = true
    installPrompt.value = null
  })

  // Check if already installed (standalone mode)
  if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true) {
    isInstalled.value = true
  }

  // Detect iOS Safari (no beforeinstallprompt support)
  const ua = navigator.userAgent
  isIos.value = /iphone|ipad|ipod/i.test(ua) && !(window as any).MSStream
  if (isIos.value && !isInstalled.value && route.path === '/') {
    canInstall.value = true
  }
  
  // Use MutationObserver to detect class changes on <html>
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        checkDarkTheme()
      }
    })
  })
  
  observer.observe(document.documentElement, { attributes: true })
  checkDarkTheme()
})

// Prevent scroll when menu is open
watch(isMenuOpen, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
}

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

const props = withDefaults(defineProps<{
  showThemeSlider?: boolean
  showLocaleSwitcher?: boolean
  copyright?: string
  logoClass?: string
}>(), {
  showThemeSlider: true,
  showLocaleSwitcher: true,
})
const { brand } = useBuildTarget()
const showThemeSlider = computed(() => props.showThemeSlider && (brand.showThemeSlider !== false))
const showLocaleSwitcher = computed(() => props.showLocaleSwitcher && (brand.showLocaleSwitcher !== false))
const { data: navPages } = await useAsyncData('nav-links-'+brand.id, () =>
  queryCollection('brand_content' as any)
    .where('nav', 'IS NOT NULL', '')
    .order('order', 'ASC')
    .select('path', 'nav', 'order')
    .all()
)
const navLinks = computed(() =>
  (navPages.value ?? []).map(p => ({
    name: p.nav as string,
    path: p.path.replace('/'+brand.contentDir, '') || '/'
  }))
)
</script>

<style scoped>
.app-header {
  height: 12rem;
  display: flex;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  transition: var(--transition-smooth);
}

.app-header.is-scrolled {
  height: 9rem;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--glass-border);
}

.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.nav-container:has(.header-actions.is-empty) {
  justify-content: center;
  gap: 0;
}

.nav-container:has(.header-actions.is-empty) .logo-brand {
  position: absolute;
  left: 6rem;
}

.nav-container:has(.header-actions.is-empty:not(:has(.mobile-menu-btn))) .header-actions {
  display: none;
}

.nav-links {
  display: flex;
  gap: 1rem;
  padding: 0.8rem;
  border-radius: 100px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.is-scrolled .nav-links {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
}

.nav-link {
  font-size: 1.2rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--white);
  padding: 1.2rem 2.5rem;
  border-radius: 100px;
  transition: var(--transition-fast);
}

.is-scrolled .nav-link {
  color: var(--text);
}

.nav-link:hover,
.nav-link.router-link-active {
  background: var(--white);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  color: var(--gradient-1);
}

.is-scrolled .nav-link:hover,
.is-scrolled .nav-link.router-link-active {
  background: var(--primary);
  color: var(--white);
}

html.is-dark .is-scrolled .nav-link:hover,
html.is-dark .is-scrolled .nav-link.router-link-active {
  background: var(--white);
  color: #0f172a; /* Use original primary color for dark contrast if needed */
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 3rem;
}

@media (max-width: 1200px) {
  .header-actions :deep(.theme-slider-container) {
    display: none;
  }
}

.locale-switcher {
  display: flex;
  gap: 1rem;
  padding: 0.8rem 1.5rem;
  border-radius: 100px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.is-scrolled .locale-switcher {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
}

.locale-switcher a {
  font-size: 1.1rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.6);
}

.is-scrolled .locale-switcher a {
  color: var(--text);
}

.locale-switcher a.active {
  color: var(--white);
}

.is-scrolled .locale-switcher a.active {
  color: var(--primary);
}

.mobile-menu-btn {
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  width: 5.4rem;
  height: 5.4rem;
  background: var(--white);
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.05);
  cursor: pointer;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 2000;
  transition: var(--transition-smooth);
}

html.is-dark .mobile-menu-btn {
  background: #1e293b;
  border-color: rgba(255, 255, 255, 0.1);
}

.is-scrolled .mobile-menu-btn {
  background: var(--primary);
}
html.is-dark .is-scrolled .mobile-menu-btn {
  background: #1e293b;
}
html.is-dark .is-scrolled .mobile-menu-btn span {
  background-color: var(--white);
}

.mobile-menu-btn span {
  display: block;
  width: 2.2rem;
  height: 2px;
  background-color: var(--primary);
  border-radius: 10px;
  transition: var(--transition-smooth);
}

.is-scrolled .mobile-menu-btn span {
  background-color: var(--white);
}

/* Morph to X animation */
.mobile-menu-btn.is-active span:nth-child(1) {
  transform: translateY(0.7rem) rotate(45deg);
}

.mobile-menu-btn.is-active span:nth-child(2) {
  opacity: 0;
  transform: translateX(-1rem);
}

.mobile-menu-btn.is-active span:nth-child(3) {
  transform: translateY(-0.7rem) rotate(-45deg);
}

.mobile-menu-btn.is-active {
  background: var(--gradient-1) !important;
}

.mobile-menu-btn.is-active span {
  background-color: var(--white) !important;
}

/* Mobile Menu Overlay Styles */
.mobile-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100dvh;
  z-index: 1500;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.menu-reveal-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--bg);
  z-index: -1;
}

html:not(.is-dark) .menu-reveal-bg {
  background: var(--white);
}

.menu-reveal-bg::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(circle at 0% 0%, var(--gradient-1) 0%, transparent 50%),
    radial-gradient(circle at 100% 0%, var(--gradient-2) 0%, transparent 50%),
    radial-gradient(circle at 100% 100%, var(--gradient-3) 0%, transparent 50%),
    radial-gradient(circle at 0% 100%, #10b981 0%, transparent 50%);
  opacity: 0.15;
  filter: blur(100px);
  animation: gradient-shift 10s ease infinite alternate;
}

@keyframes gradient-shift {
  0% { transform: scale(1) translate(0, 0); }
  100% { transform: scale(1.2) translate(5%, 5%); }
}

.mobile-menu-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-top: 15rem;
  padding-bottom: 5rem;
}

.mobile-nav-links {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  flex: 1;
}

.mobile-nav-link {
  font-size: 5rem;
  font-weight: 900;
  text-transform: uppercase;
  color: var(--primary);
  line-height: 1;
  letter-spacing: -0.05em;
  transition: var(--transition-smooth);
}

html.is-dark .mobile-nav-link {
  color: var(--white);
}

.mobile-nav-link:hover,
.mobile-nav-link.router-link-active {
  color: var(--gradient-1);
  transform: translateX(2rem);
}

.mobile-footer {
  margin-top: auto;
  border-top: 1px solid rgba(128, 128, 128, 0.2);
  padding-top: 4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.mobile-locales {
  display: flex;
  gap: 3rem;
  margin-bottom: 3rem;
  justify-content: center;
}

.mobile-locale-link {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.mobile-locale-link.active {
  color: var(--gradient-1);
}

.mobile-install-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.2rem;
  padding: 1.4rem 2.4rem;
  margin-bottom: 3rem;
  background: rgba(37, 99, 235, 0.1);
  color: var(--gradient-1);
  border: 2px solid rgba(37, 99, 235, 0.3);
  border-radius: 50px;
  font-family: inherit;
  font-size: 1.4rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: all 0.25s;
}

.mobile-install-btn svg {
  width: 1.8rem;
  height: 1.8rem;
  flex-shrink: 0;
}

.mobile-install-btn:hover {
  background: var(--gradient-1);
  color: #fff;
  border-color: var(--gradient-1);
}

/* iOS Install Modal */
.ios-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0 1.6rem 2rem;
}

.ios-modal {
  position: relative;
  background: var(--surface, #1a1a2e);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 2.4rem 2.4rem 1.6rem 1.6rem;
  padding: 3.2rem 2.4rem 4rem;
  width: 100%;
  max-width: 42rem;
  text-align: center;
}

.ios-modal-close {
  position: absolute;
  top: 1.6rem;
  right: 1.6rem;
  background: rgba(255,255,255,0.08);
  border: none;
  border-radius: 50%;
  width: 3.2rem;
  height: 3.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-muted);
  transition: background 0.2s;
}

.ios-modal-close:hover {
  background: rgba(255,255,255,0.15);
}

.ios-modal-close svg {
  width: 1.6rem;
  height: 1.6rem;
}

.ios-modal-icon {
  width: 6rem;
  height: 6rem;
  background: linear-gradient(135deg, var(--gradient-1), var(--gradient-2));
  border-radius: 1.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.6rem;
}

.ios-modal-icon svg {
  width: 3rem;
  height: 3rem;
  stroke: #fff;
  stroke-width: 2;
}

.ios-modal-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 0.6rem;
}

.ios-modal-subtitle {
  font-size: 1.3rem;
  color: var(--text-muted);
  font-weight: 500;
  margin: 0 0 2.4rem;
  line-height: 1.5;
}

.ios-modal-steps {
  list-style: none;
  padding: 0;
  margin: 0 0 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.ios-modal-step {
  display: flex;
  align-items: center;
  gap: 1.4rem;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 1.2rem;
  padding: 1.2rem 1.6rem;
  text-align: left;
}

.step-num {
  width: 2.8rem;
  height: 2.8rem;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--gradient-1), var(--gradient-2));
  color: #fff;
  font-size: 1.3rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-text {
  flex: 1;
  font-size: 1.35rem;
  font-weight: 600;
  color: var(--text);
  line-height: 1.4;
}

.step-icon {
  width: 3.2rem;
  height: 3.2rem;
  background: rgba(255,255,255,0.06);
  border-radius: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--gradient-1);
}

.step-icon svg {
  width: 1.8rem;
  height: 1.8rem;
}

.ios-modal-arrow {
  color: var(--surface, #1a1a2e);
  position: absolute;
  bottom: -1.8rem;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0;
  line-height: 0;
}

.ios-modal-arrow svg {
  width: 3.6rem;
  height: 1.8rem;
}

/* Modal transition */
.ios-modal-enter-active,
.ios-modal-leave-active {
  transition: opacity 0.3s ease;
}

.ios-modal-enter-active .ios-modal,
.ios-modal-leave-active .ios-modal {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.ios-modal-enter-from,
.ios-modal-leave-to {
  opacity: 0;
}

.ios-modal-enter-from .ios-modal {
  transform: translateY(100%);
}

.ios-modal-leave-to .ios-modal {
  transform: translateY(100%);
}

.mobile-copyright {
  font-size: 1.2rem;
  color: #999;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Animations */
.menu-reveal-enter-active,
.menu-reveal-leave-active {
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.menu-reveal-enter-active .menu-reveal-bg,
.menu-reveal-leave-active .menu-reveal-bg {
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.menu-reveal-enter-from {
  opacity: 0;
}

.menu-reveal-enter-from .menu-reveal-bg {
  transform: scale(0.5);
  border-radius: 100%;
  opacity: 0;
}

.menu-reveal-enter-to .menu-reveal-bg {
  transform: scale(1);
  border-radius: 0;
  opacity: 1;
}

.menu-reveal-leave-to {
  opacity: 0;
}

.menu-reveal-leave-to .menu-reveal-bg {
  transform: scale(1.5);
  opacity: 0;
}

.menu-reveal-enter-active .mobile-nav-link {
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: calc(0.2s + var(--index) * 0.1s);
}

.menu-reveal-enter-from .mobile-nav-link {
  opacity: 0;
  transform: translateY(40px) skewY(5deg);
}

@media (max-width: 1024px) {
  .nav-links, .locale-switcher {
    display: none;
  }
  
  .mobile-menu-btn {
    display: flex;
  }
}
</style>
