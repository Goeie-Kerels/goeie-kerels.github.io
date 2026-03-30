<script setup lang="ts">
const { t } = useI18n()
const { brand } = useBuildTarget()
const { data: companies } = await useAsyncData(`map-companies-${brand.id}`, () =>
  queryCollection('brand_showcase' as any)
    .where('type', '=', 'company')
    .where('hidden', '<>', true)
    .all()
)

const pinned = computed(() =>
  (companies.value ?? []).filter(c => c.contact?.lat && c.contact?.lng)
)

// ── Tile math ────────────────────────────────────────────────────────────────
function tileToLng(x: number, zoom: number) {
  return (x / Math.pow(2, zoom)) * 360 - 180
}
function tileToLat(y: number, zoom: number) {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, zoom)
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)))
}

function latLngToPixel(lat: number, lng: number, zoom: number, originTileX: number, originTileY: number) {
  const tileSize = 256
  const x = ((lng + 180) / 360) * Math.pow(2, zoom) * tileSize
  const r = (lat * Math.PI) / 180
  const y =
    ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) *
    Math.pow(2, zoom) *
    tileSize
  return {
    x: x - originTileX * tileSize,
    y: y - originTileY * tileSize
  }
}

// ── State ────────────────────────────────────────────────────────────────────
const TILE_SIZE = 256
const mapEl = ref<HTMLElement | null>(null)
const zoom = ref(11)
const offsetX = ref(0)
const offsetY = ref(0)
const activePin = ref<any | null>(null)
const activePinPixel = ref({ x: 0, y: 0 })
const popupFlipped = ref(false)
const popupPageX = ref(0)
const popupPageY = ref(0)
const popupEl = ref<HTMLElement | null>(null)
const mapWidth = ref(800)
const mapHeight = ref(520)
const mapFocused = ref(false)
const wrapperEl = ref<HTMLElement | null>(null)
const searchBarEl = ref<HTMLElement | null>(null)
const mobileMapHeight = ref<number | null>(null)

// ── Postal code search ───────────────────────────────────────────────────────
const postalInput = ref('')
const postalLoading = ref(false)
const postalError = ref('')

async function searchPostal() {
  const q = postalInput.value.trim()
  if (!q) return
  postalLoading.value = true
  postalError.value = ''
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=nl&format=json&limit=1`,
      { headers: { 'Accept-Language': 'nl' } }
    )
    const data = await res.json()
    if (data.length === 0) {
      postalError.value = t('map.postalNotFound')
    } else {
      centerOn(parseFloat(data[0].lat), parseFloat(data[0].lon), 13)
    }
  } catch {
    postalError.value = t('map.geocoderError')
  } finally {
    postalLoading.value = false
  }
}

const originTileX = ref(0)
const originTileY = ref(0)

const tilesX = computed(() => Math.ceil(mapWidth.value / TILE_SIZE) + 2)
const tilesY = computed(() => Math.ceil(mapHeight.value / TILE_SIZE) + 2)

const tiles = computed(() => {
  const list = []
  for (let dy = 0; dy < tilesY.value; dy++) {
    for (let dx = 0; dx < tilesX.value; dx++) {
      const tx = originTileX.value + dx
      const ty = originTileY.value + dy
      const max = Math.pow(2, zoom.value)
      const wrappedTx = ((tx % max) + max) % max
      const sub = ['a', 'b', 'c'][(tx + ty) % 3]
      list.push({
        key: `${zoom.value}-${tx}-${ty}`,
        url: `https://${sub}.tile.openstreetmap.org/${zoom.value}/${wrappedTx}/${ty}.png`,
        left: dx * TILE_SIZE + offsetX.value,
        top: dy * TILE_SIZE + offsetY.value
      })
    }
  }
  return list
})

const markers = computed(() =>
  pinned.value.map(c => {
    const px = latLngToPixel(
      c.contact.lat,
      c.contact.lng,
      zoom.value,
      originTileX.value,
      originTileY.value
    )
    return {
      company: c,
      x: px.x + offsetX.value,
      y: px.y + offsetY.value
    }
  })
)

// ── Clustering ───────────────────────────────────────────────────────────────
const CLUSTER_RADIUS = 40 // pixels

const clustered = computed(() => {
  // At maximum zoom, never cluster — show all pins individually
  if (zoom.value >= 18) {
    return markers.value.map(m => ({
      type: 'single' as const,
      x: m.x,
      y: m.y,
      count: 1,
      companies: [m.company],
      priority: !!m.company.priority,
      shadowCluster: null
    }))
  }

  // Priority pins are excluded from clustering — they always render individually
  const items = markers.value.filter(m => !m.company.priority).slice()
  const used = new Array(items.length).fill(false)
  const result: Array<{
    type: 'cluster' | 'single'
    x: number
    y: number
    count: number
    companies: any[]
    priority: boolean
    shadowCluster: { count: number; companies: any[]; x: number; y: number } | null
  }> = []

  for (let i = 0; i < items.length; i++) {
    if (used[i]) continue
    const group = [items[i]]
    used[i] = true
    for (let j = i + 1; j < items.length; j++) {
      if (used[j]) continue
      const dx = items[j].x - items[i].x
      const dy = items[j].y - items[i].y
      if (Math.sqrt(dx * dx + dy * dy) < CLUSTER_RADIUS) {
        group.push(items[j])
        used[j] = true
      }
    }
    const cx = group.reduce((s, m) => s + m.x, 0) / group.length
    const cy = group.reduce((s, m) => s + m.y, 0) / group.length
    result.push({
      type: group.length > 1 ? 'cluster' : 'single',
      x: cx,
      y: cy,
      count: group.length,
      companies: group.map(m => m.company),
      priority: false,
      shadowCluster: null
    })
  }

  // Add priority pins on top — never clustered
  // If a priority pin is near other result items, absorb them into a shadowCluster and remove them from the main result
  // Priority pin visual bounding box: pin tip at (m.x, m.y), body extends ~52px up and ~20px wide
  // Cluster bubble visual bounding box: centered at (r.x, r.y), radius ~22px
  // Absorb any result item whose visual area overlaps the priority pin's visual area
  const PRIORITY_PIN_HALF_W = 20
  const PRIORITY_PIN_H = 52
  const CLUSTER_BUBBLE_R = 26 // slightly larger than actual 22px for safety
  for (const m of markers.value.filter(m => m.company.priority)) {
    // Priority pin occupies: x ± 20px, y-52 to y (tip at bottom)
    const pinLeft = m.x - PRIORITY_PIN_HALF_W
    const pinRight = m.x + PRIORITY_PIN_HALF_W
    const pinTop = m.y - PRIORITY_PIN_H
    const pinBottom = m.y

    const nearbyIndices: number[] = []
    result.forEach((r, idx) => {
      // Cluster/pin visual center: clusters centered at (r.x, r.y); single pins tip at (r.x, r.y) body up
      // Use a generous overlap check: is the result item's center within the priority pin's expanded bounding box?
      const expandedLeft = pinLeft - CLUSTER_BUBBLE_R
      const expandedRight = pinRight + CLUSTER_BUBBLE_R
      const expandedTop = pinTop - CLUSTER_BUBBLE_R
      const expandedBottom = pinBottom + CLUSTER_BUBBLE_R
      if (r.x >= expandedLeft && r.x <= expandedRight && r.y >= expandedTop && r.y <= expandedBottom) {
        nearbyIndices.push(idx)
        return
      }
      // Also check individual company pixel positions
      const anyClose = r.companies.some((c: any) => {
        if (!c.contact?.lat || !c.contact?.lng) return false
        const px = latLngToPixel(c.contact.lat, c.contact.lng, zoom.value, originTileX.value, originTileY.value)
        const cpx = px.x + offsetX.value
        const cpy = px.y + offsetY.value
        return cpx >= expandedLeft && cpx <= expandedRight && cpy >= expandedTop && cpy <= expandedBottom
      })
      if (anyClose) nearbyIndices.push(idx)
    })
    const nearby = nearbyIndices.map(i => result[i])
    // Remove absorbed items from result so they don't render independently
    for (let i = nearbyIndices.length - 1; i >= 0; i--) {
      result.splice(nearbyIndices[i], 1)
    }
    const shadowCluster = nearby.length > 0
      ? { count: nearby.reduce((s, r) => s + r.count, 0) + 1, companies: nearby.flatMap(r => r.companies), x: m.x, y: m.y }
      : null
    result.push({
      type: 'single',
      x: m.x,
      y: m.y,
      count: 1,
      companies: [m.company],
      priority: true,
      shadowCluster
    })
  }

  return result
})

// ── Render order: regular → shadow → priority ────────────────────────────────
const renderItems = computed(() => {
  const regular: any[] = []
  const shadows: any[] = []
  const priorities: any[] = []

  for (const item of clustered.value) {
    if (item.priority) {
      if (item.shadowCluster) {
        shadows.push({ ...item, renderType: 'shadow', key: 'shadow-' + item.companies[0].path })
      }
      priorities.push({ ...item, renderType: 'priority', key: 'priority-' + item.companies[0].path })
    } else if (item.type === 'cluster') {
      regular.push({ ...item, renderType: 'cluster', key: 'cluster-' + item.x + '-' + item.y })
    } else {
      regular.push({ ...item, renderType: 'single', key: 'single-' + item.companies[0].path })
    }
  }

  return [...regular, ...shadows, ...priorities]
})

// ── Init: fit bounds ─────────────────────────────────────────────────────────
function centerOn(lat: number, lng: number, z: number) {
  zoom.value = z
  const tileX = ((lng + 180) / 360) * Math.pow(2, z)
  const r = (lat * Math.PI) / 180
  const tileY =
    ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * Math.pow(2, z)

  const centerPixelX = tileX * TILE_SIZE
  const centerPixelY = tileY * TILE_SIZE

  const originPixelX = centerPixelX - mapWidth.value / 2
  const originPixelY = centerPixelY - mapHeight.value / 2

  originTileX.value = Math.floor(originPixelX / TILE_SIZE)
  originTileY.value = Math.floor(originPixelY / TILE_SIZE)
  offsetX.value = -(originPixelX % TILE_SIZE)
  offsetY.value = -(originPixelY % TILE_SIZE)
}

function initMap() {
  if (!mapEl.value) return
  mapWidth.value = mapEl.value.clientWidth
  mapHeight.value = mapEl.value.clientHeight

  if (pinned.value.length === 0) {
    centerOn(52.3, 5.3, 7)
    return
  }
  if (pinned.value.length === 1) {
    centerOn(pinned.value[0].contact.lat, pinned.value[0].contact.lng, 13)
    return
  }

  const lats = pinned.value.map(c => c.contact.lat)
  const lngs = pinned.value.map(c => c.contact.lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)

  let z = 14
  while (z > 1) {
    const px1 = latLngToPixel(maxLat, minLng, z, 0, 0)
    const px2 = latLngToPixel(minLat, maxLng, z, 0, 0)
    if (
      Math.abs(px2.x - px1.x) < mapWidth.value * 0.75 &&
      Math.abs(px2.y - px1.y) < mapHeight.value * 0.75
    ) break
    z--
  }

  centerOn((minLat + maxLat) / 2, (minLng + maxLng) / 2, z)
}

// ── Drag ─────────────────────────────────────────────────────────────────────
let dragging = false
let dragStartX = 0
let dragStartY = 0
let dragOriginOffsetX = 0
let dragOriginOffsetY = 0
let dragOriginTileX = 0
let dragOriginTileY = 0
let didDrag = false

function onMapClick() {
  // Close popup when clicking map background (not a pin)
  activePin.value = null
}

function engageMap() {
  if (mapFocused.value) return
  mapFocused.value = true
  if (window.innerWidth <= 768 && wrapperEl.value) {
    const searchBarHeight = searchBarEl.value ? searchBarEl.value.offsetHeight + 12 : 60
    mobileMapHeight.value = window.innerHeight - searchBarHeight - 96
    nextTick(() => {
      const headerEl = document.querySelector('.app-header') as HTMLElement | null
      const headerHeight = headerEl ? headerEl.offsetHeight : 0
      const top = wrapperEl.value!.getBoundingClientRect().top + window.scrollY - headerHeight
      window.scrollTo({ top, behavior: 'smooth' })
    })
  }
}

function disengageMap() {
  mapFocused.value = false
  activePin.value = null
}

function onPointerDown(e: PointerEvent) {
  if (!mapFocused.value) return
  dragging = true
  didDrag = false
  dragStartX = e.clientX
  dragStartY = e.clientY
  dragOriginOffsetX = offsetX.value
  dragOriginOffsetY = offsetY.value
  dragOriginTileX = originTileX.value
  dragOriginTileY = originTileY.value
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
}

// ── Pinch-to-zoom ────────────────────────────────────────────────────────────
let lastPinchDist = 0
let pinching = false

function pinchDist(e: TouchEvent) {
  const dx = e.touches[0].clientX - e.touches[1].clientX
  const dy = e.touches[0].clientY - e.touches[1].clientY
  return Math.sqrt(dx * dx + dy * dy)
}

function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 2) {
    pinching = true
    dragging = false
    lastPinchDist = pinchDist(e)
  }
}

function onTouchMove(e: TouchEvent) {
  if (e.touches.length === 2 && pinching) {
    e.preventDefault()
    const dist = pinchDist(e)
    const ratio = dist / lastPinchDist
    if (ratio > 1.15) {
      lastPinchDist = dist
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2
      const rect = mapEl.value!.getBoundingClientRect()
      zoomAroundPoint(midX - rect.left, midY - rect.top, 1)
    } else if (ratio < 0.87) {
      lastPinchDist = dist
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2
      const rect = mapEl.value!.getBoundingClientRect()
      zoomAroundPoint(midX - rect.left, midY - rect.top, -1)
    }
    return
  }
  if (dragging) e.preventDefault()
}

function onTouchEnd(e: TouchEvent) {
  if (e.touches.length < 2) pinching = false
}

function zoomAroundPoint(mouseX: number, mouseY: number, step: number) {
  const pixelX = mouseX - offsetX.value + originTileX.value * TILE_SIZE
  const pixelY = mouseY - offsetY.value + originTileY.value * TILE_SIZE
  const oldZoom = zoom.value
  const newZoom = Math.max(3, Math.min(18, zoom.value + step))
  if (newZoom === oldZoom) return
  const scale = Math.pow(2, newZoom - oldZoom)
  const newPixelX = pixelX * scale
  const newPixelY = pixelY * scale
  const newOriginPixelX = newPixelX - mouseX
  const newOriginPixelY = newPixelY - mouseY
  zoom.value = newZoom
  originTileX.value = Math.floor(newOriginPixelX / TILE_SIZE)
  originTileY.value = Math.floor(newOriginPixelY / TILE_SIZE)
  offsetX.value = -(newOriginPixelX % TILE_SIZE)
  offsetY.value = -(newOriginPixelY % TILE_SIZE)
  activePin.value = null
}

function onPointerMove(e: PointerEvent) {
  if (!dragging) return
  const dx = e.clientX - dragStartX
  const dy = e.clientY - dragStartY
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag = true

  let newOffX = dragOriginOffsetX + dx
  let newOffY = dragOriginOffsetY + dy
  let newOriginX = dragOriginTileX
  let newOriginY = dragOriginTileY

  while (newOffX > 0) { newOffX -= TILE_SIZE; newOriginX-- }
  while (newOffX < -TILE_SIZE) { newOffX += TILE_SIZE; newOriginX++ }
  while (newOffY > 0) { newOffY -= TILE_SIZE; newOriginY-- }
  while (newOffY < -TILE_SIZE) { newOffY += TILE_SIZE; newOriginY++ }

  offsetX.value = newOffX
  offsetY.value = newOffY
  originTileX.value = newOriginX
  originTileY.value = newOriginY
}

function onPointerUp() {
  dragging = false
}

// ── Zoom ─────────────────────────────────────────────────────────────────────
function onWheel(e: WheelEvent) {
  if (!mapFocused.value) return
  e.preventDefault()
  const rect = mapEl.value!.getBoundingClientRect()
  zoomAroundPoint(e.clientX - rect.left, e.clientY - rect.top, e.deltaY < 0 ? 1 : -1)
}

function zoomAtCenter(step: number) {
  const cx = mapWidth.value / 2
  const cy = mapHeight.value / 2
  const pixelX = cx - offsetX.value + originTileX.value * TILE_SIZE
  const pixelY = cy - offsetY.value + originTileY.value * TILE_SIZE
  const oldZoom = zoom.value
  const newZoom = Math.max(3, Math.min(18, zoom.value + step))
  if (newZoom === oldZoom) return
  const scale = Math.pow(2, newZoom - oldZoom)
  const newPixelX = pixelX * scale
  const newPixelY = pixelY * scale
  const newOriginPixelX = newPixelX - cx
  const newOriginPixelY = newPixelY - cy
  zoom.value = newZoom
  originTileX.value = Math.floor(newOriginPixelX / TILE_SIZE)
  originTileY.value = Math.floor(newOriginPixelY / TILE_SIZE)
  offsetX.value = -(newOriginPixelX % TILE_SIZE)
  offsetY.value = -(newOriginPixelY % TILE_SIZE)
  activePin.value = null
}
function zoomIn() { zoomAtCenter(1) }
function zoomOut() { zoomAtCenter(-1) }

// ── Pin click ────────────────────────────────────────────────────────────────
function updatePopupPosition(marker: any) {
  if (!mapEl.value) return
  const rect = mapEl.value.getBoundingClientRect()
  const popupWidth = popupEl.value?.offsetWidth ?? 300
  const halfPopup = popupWidth / 2
  const margin = 8
  const rawX = rect.left + window.scrollX + marker.x
  const minX = rect.left + window.scrollX + halfPopup + margin
  const maxX = rect.left + window.scrollX + rect.width - halfPopup - margin
  popupPageX.value = Math.min(Math.max(rawX, minX), maxX)
  popupPageY.value = rect.top + window.scrollY + marker.y
}

function onPinClick(marker: any) {
  if (didDrag) return
  if (activePin.value?.path === marker.company.path) {
    activePin.value = null
    return
  }
  activePin.value = marker.company
  activePinPixel.value = { x: marker.x, y: marker.y }
  // Open popup in whichever direction has more space
  popupFlipped.value = marker.y < (mapHeight.value / 2)
  nextTick(() => nextTick(() => updatePopupPosition(marker)))
}

function onClusterClick(cluster: any) {
  if (didDrag) return
  // Zoom in centred on the cluster
  const lats = cluster.companies.map((c: any) => c.contact.lat)
  const lngs = cluster.companies.map((c: any) => c.contact.lng)
  const midLat = (Math.min(...lats) + Math.max(...lats)) / 2
  const midLng = (Math.min(...lngs) + Math.max(...lngs)) / 2
  centerOn(midLat, midLng, Math.min(18, zoom.value + 3))
  activePin.value = null
}

function initials(title: string) {
  return title.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
}

// ── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => {
  nextTick(() => {
    initMap()
    if (mapEl.value) {
      mapEl.value.addEventListener('touchstart', onTouchStart, { passive: true })
      mapEl.value.addEventListener('touchmove', onTouchMove, { passive: false })
      mapEl.value.addEventListener('touchend', onTouchEnd, { passive: true })
    }
    if (window.innerWidth <= 768 && wrapperEl.value && searchBarEl.value) {
      mobileMapHeight.value = window.innerHeight - searchBarEl.value.offsetHeight - 12 - 96
    }
  })
  const onResize = () => {
    if (mapEl.value) {
      mapWidth.value = mapEl.value.clientWidth
      mapHeight.value = mapEl.value.clientHeight
    }
    if (window.innerWidth <= 768 && wrapperEl.value && searchBarEl.value) {
      mobileMapHeight.value = window.innerHeight - searchBarEl.value.offsetHeight - 12 - 96
    } else {
      mobileMapHeight.value = null
    }
  }
  const onDocClick = (e: MouseEvent) => {
    const target = e.target as Node
    if (mapEl.value && !mapEl.value.contains(target) && !popupEl.value?.contains(target)) {
      mapFocused.value = false
      activePin.value = null
    }
  }
  window.addEventListener('resize', onResize)
  document.addEventListener('click', onDocClick)
  onUnmounted(() => {
    window.removeEventListener('resize', onResize)
    document.removeEventListener('click', onDocClick)
    if (mapEl.value) {
      mapEl.value.removeEventListener('touchstart', onTouchStart)
      mapEl.value.removeEventListener('touchmove', onTouchMove)
      mapEl.value.removeEventListener('touchend', onTouchEnd)
    }
  })
})
</script>

<template>
  <ClientOnly>
    <div ref="wrapperEl" class="biz-map-wrapper">
      <!-- Postal code search -->
      <div ref="searchBarEl" class="map-search-bar">
        <div class="map-search-input-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            v-model="postalInput"
            type="text"
            :placeholder="t('map.searchPlaceholder')"
            class="map-search-input"
            @keydown.enter="searchPostal"
          />
          <button class="map-search-btn" :disabled="postalLoading" @click="searchPostal">
            <span v-if="postalLoading" class="map-search-spinner" />
            <span v-else>{{ t('map.searchButton') }}</span>
          </button>
        </div>
        <p v-if="postalError" class="map-search-error">{{ postalError }}</p>
      </div>

      <div
        ref="mapEl"
        class="biz-map"
        :class="{ focused: mapFocused }"
        :style="mobileMapHeight ? { height: mobileMapHeight + 'px' } : {}"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @wheel="onWheel"
        @click="onMapClick"
      >
        <!-- Scroll-to-interact overlay -->
        <Transition name="overlay">
          <div v-if="!mapFocused" class="map-overlay" @click.stop="engageMap">
            <div class="map-overlay-hint">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
              {{ $t('map.clickToInteract') }}
            </div>
          </div>
        </Transition>
        <!-- Tiles -->
        <img
          v-for="tile in tiles"
          :key="tile.key"
          :src="tile.url"
          :style="{ left: tile.left + 'px', top: tile.top + 'px' }"
          class="map-tile"
          draggable="false"
          alt=""
        />

        <!-- Markers / Clusters: rendered in paint order — regular first, shadow bubbles second, priority pins last -->
        <template v-for="item in renderItems" :key="item.key">
          <!-- Regular cluster bubble -->
          <button
            v-if="item.renderType === 'cluster'"
            class="map-cluster"
            :style="{ left: item.x + 'px', top: item.y + 'px' }"
            :title="item.count + ' bedrijven'"
            @click.stop="onClusterClick(item)"
          >
            <span class="cluster-count">{{ item.count }}</span>
          </button>

          <!-- Regular single pin -->
          <button
            v-else-if="item.renderType === 'single'"
            class="map-pin"
            :class="{ active: activePin?.path === item.companies[0].path }"
            :style="{ left: item.x + 'px', top: item.y + 'px' }"
            :title="item.companies[0].title"
            @click.stop="onPinClick({ company: item.companies[0], x: item.x, y: item.y })"
          >
            <svg viewBox="0 0 32 44" xmlns="http://www.w3.org/2000/svg" class="pin-svg">
              <path d="M16 0C7.163 0 0 7.163 0 16c0 10.5 16 28 16 28S32 26.5 32 16C32 7.163 24.837 0 16 0z"/>
              <circle cx="16" cy="16" r="7" fill="white" opacity="0.95"/>
            </svg>
            <span class="pin-label">{{ item.companies[0].title }}</span>
          </button>

          <!-- Shadow cluster bubble behind a priority pin -->
          <button
            v-else-if="item.renderType === 'shadow'"
            class="map-cluster map-cluster--priority-shadow"
            :style="{ left: (item.x + 14) + 'px', top: (item.y + 14) + 'px' }"
            :title="item.shadowCluster.count + ' bedrijven'"
            @click.stop="onClusterClick(item.shadowCluster)"
          >
            <span class="cluster-count">{{ item.shadowCluster.count }}</span>
          </button>

          <!-- Priority pin — always last in DOM so it paints on top -->
          <button
            v-else-if="item.renderType === 'priority'"
            class="map-pin map-pin--priority"
            :class="{ active: activePin?.path === item.companies[0].path }"
            :style="{ left: item.x + 'px', top: item.y + 'px' }"
            :title="item.companies[0].title"
            @click.stop="onPinClick({ company: item.companies[0], x: item.x, y: item.y })"
          >
            <svg viewBox="0 0 40 52" xmlns="http://www.w3.org/2000/svg" class="pin-svg pin-svg--priority">
              <defs>
                <linearGradient id="priority-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#7c3aed"/>
                  <stop offset="100%" stop-color="#ec4899"/>
                </linearGradient>
              </defs>
              <path d="M20 0 L40 20 L20 52 L0 20 Z" fill="url(#priority-grad)"/>
              <circle cx="20" cy="20" r="8" fill="white" opacity="0.92"/>
              <path d="M20 13 L21.8 18.2 L27 18.2 L22.6 21.4 L24.4 26.6 L20 23.4 L15.6 26.6 L17.4 21.4 L13 18.2 L18.2 18.2 Z" fill="url(#priority-grad)"/>
            </svg>
            <span class="pin-label pin-label--priority">{{ item.companies[0].title }}</span>
          </button>
        </template>

        <!-- Popup -->
        <Teleport to="body">
          <Transition :name="popupFlipped ? 'popup-flip' : 'popup'">
            <div
              v-if="activePin"
              ref="popupEl"
              class="map-popup map-popup--teleported"
              :class="{ 'map-popup--flipped': popupFlipped }"
              :style="{
                left: popupPageX + 'px',
                top: (popupFlipped ? popupPageY + 16 : popupPageY - 16) + 'px'
              }"
              @click.stop="() => {}"
            >
            <button class="popup-close" @click="activePin = null" :aria-label="t('map.closePopup')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>

            <div class="popup-header">
              <img v-if="activePin.image" :src="activePin.image" :alt="activePin.title" class="popup-logo" />
              <div v-else class="popup-avatar">{{ initials(activePin.title) }}</div>
              <div class="popup-header-info">
                <strong class="popup-name">{{ activePin.title }}</strong>
                <span v-if="activePin.priority" class="popup-priority-badge">Supersponsor</span>
                <div v-if="activePin.tags?.length" class="popup-tags">
                  <span v-for="tag in activePin.tags.slice(0, 3)" :key="tag">#{{ tag }}</span>
                </div>
              </div>
            </div>

            <div v-if="activePin.description" class="popup-desc">{{ activePin.description }}</div>

            <div class="popup-contact">
              <div v-if="activePin.contact?.address" class="popup-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                <span>{{ activePin.contact.address }}</span>
              </div>
              <div v-if="activePin.contact?.phone" class="popup-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                <a :href="'tel:' + activePin.contact.phone">{{ activePin.contact.phone }}</a>
              </div>
              <div v-if="activePin.contact?.email" class="popup-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <a :href="'mailto:' + activePin.contact.email">{{ activePin.contact.email }}</a>
              </div>
              <div v-if="activePin.contact?.website" class="popup-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                <a :href="activePin.contact.website" target="_blank" rel="noopener">{{ activePin.contact.website.replace(/^https?:\/\//, '') }}</a>
              </div>
            </div>

            <div class="popup-footer">
              <a :href="activePin.path" class="popup-profile-link">
                <span class="tk-badge">TK</span>
                {{ t('map.viewProfile') }}
              </a>
            </div>
            </div>
          </Transition>
        </Teleport>

        <!-- Disengage button (mobile only) -->
        <Transition name="overlay">
          <button v-if="mapFocused" class="map-disengage-btn" @click.stop="disengageMap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            {{ $t('map.closeMap') }}
          </button>
        </Transition>

        <!-- Zoom controls -->
        <div class="map-controls">
          <button @click="zoomIn" :title="t('map.zoomIn')" :aria-label="t('map.zoomIn')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <button @click="zoomOut" :title="t('map.zoomOut')" :aria-label="t('map.zoomOut')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>

        <!-- Attribution -->
        <div class="map-attribution">
          © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors
        </div>
      </div>

      <div v-if="pinned.length === 0" class="map-empty">
        {{ $t('map.noBusinesses') }}
      </div>
    </div>
  </ClientOnly>
</template>

<style scoped>
.biz-map-wrapper {
  width: 100%;
  padding-top: var(--section-padding);
}

/* ── Postal search bar ── */
.map-search-bar {
  margin-bottom: 1.2rem;
  margin-left: 5%;
  width: 90%;
}

.map-search-input-wrap {
  display: flex;
  align-items: center;
  gap: 0;
  background: var(--bg-alt, #131823);
  border: 1px solid var(--glass-border);
  border-radius: 1rem;
  padding: 0 0.4rem 0 1.2rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.2);
  transition: border-color 0.2s;
}

.map-search-input-wrap:focus-within {
  border-color: var(--accent);
}

.map-search-input-wrap > svg {
  width: 1.6rem;
  height: 1.6rem;
  color: var(--text-muted);
  flex-shrink: 0;
}

.map-search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--text);
  font-size: 1.4rem;
  padding: 1rem 0.8rem;
  font-family: inherit;
}

@media (max-width: 768px) {
  .biz-map-wrapper {
    padding-top: var(--section-padding-mobile);
  }

  .map-search-input {
    font-size: 16px;
  }
}

.map-search-input::placeholder {
  color: var(--text-muted);
}

.map-search-btn {
  background: var(--accent);
  color: var(--black, #000);
  border: none;
  border-radius: 0.7rem;
  padding: 0.5rem 1.4rem;
  font-size: 1.3rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 4.8rem;
  height: 3.2rem;
}

.map-search-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.map-search-spinner {
  width: 1.4rem;
  height: 1.4rem;
  border: 2px solid rgba(0,0,0,0.3);
  border-top-color: #000;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.map-search-error {
  margin: 0.6rem 0 0;
  font-size: 1.2rem;
  color: #e05;
  padding-left: 0.4rem;
}

/* ── Scroll overlay ── */
.map-overlay {
  position: absolute;
  inset: 0;
  z-index: 30;
  background: rgba(10, 14, 20, 0.45);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: inherit;
  cursor: pointer;
}

.map-overlay-hint {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  background: rgba(13, 17, 23, 0.85);
  border: 1px solid var(--glass-border);
  border-radius: 2rem;
  padding: 1rem 2rem;
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--text);
  pointer-events: none;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
}

.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.25s ease;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

/* ── Disengage button ── */
.map-disengage-btn {
  position: absolute;
  bottom: 1.2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 25;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: rgba(13, 17, 23, 0.9);
  border: 1px solid var(--glass-border);
  border-radius: 2rem;
  padding: 0.7rem 1.6rem;
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--text);
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  backdrop-filter: blur(4px);
  transition: background 0.15s, transform 0.15s;
  white-space: nowrap;
}

.map-disengage-btn:hover {
  background: rgba(30, 38, 50, 0.95);
  transform: translateX(-50%) scale(1.04);
}

/* ── Map container ── */
.biz-map {
  position: relative;
  margin-left: 5%;
  width: 90%;
  height: 580px;
  overflow: hidden;
  border-radius: 2rem;
  background: #1a2332;
  cursor: grab;
  user-select: none;
  touch-action: manipulation;
  border: 1px solid var(--glass-border);
  box-shadow: 0 8px 48px rgba(0, 0, 0, 0.5);
}

.biz-map:active {
  cursor: grabbing;
}

/* ── Tiles ── */
.map-tile {
  position: absolute;
  width: 256px;
  height: 256px;
  pointer-events: none;
  image-rendering: auto;
}

/* ── Cluster bubbles ── */
.map-cluster {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--accent);
  border: 3px solid rgba(255, 255, 255, 0.85);
  box-shadow: 0 3px 14px rgba(0, 0, 0, 0.5);
  cursor: pointer;
  z-index: 12;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: transform 0.15s ease, background 0.15s ease;
}

.map-cluster:hover {
  transform: translate(-50%, -50%) scale(1.15);
  background: var(--accent-light);
}

.map-cluster--priority-shadow {
  z-index: 11 !important;
  opacity: 0.85;
  background: var(--accent);
  pointer-events: all;
}

.cluster-count {
  font-size: 1.4rem;
  font-weight: 800;
  color: #000;
  line-height: 1;
  pointer-events: none;
}

/* ── Priority pin ── */
.map-pin--priority {
  z-index: 29 !important;
}

.pin-svg--priority {
  width: 40px;
  height: 52px;
  filter: drop-shadow(0 4px 10px rgba(108, 63, 197, 0.7));
  transition: transform 0.2s ease;
  transform-origin: bottom center;
}

.map-pin--priority:hover .pin-svg--priority,
.map-pin--priority.active .pin-svg--priority {
  transform: scale(1.25);
}

.pin-label--priority {
  background: linear-gradient(135deg, rgba(108, 63, 197, 0.95), rgba(59, 91, 219, 0.95)) !important;
  border-color: rgba(108, 63, 197, 0.5) !important;
  color: #fff !important;
}

.popup-priority-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #6c3fc5, #3b5bdb);
  border-radius: 2rem;
  padding: 0.2rem 0.7rem;
  margin-bottom: 0.4rem;
  letter-spacing: 0.02em;
}

/* ── Markers ── */
.map-pin {
  position: absolute;
  transform: translate(-50%, -100%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pin-svg {
  width: 34px;
  height: 46px;
  fill: var(--accent);
  filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.55));
  transition: fill 0.2s ease, transform 0.2s ease;
  transform-origin: bottom center;
}

.map-pin:hover .pin-svg,
.map-pin.active .pin-svg {
  fill: var(--accent-light);
  transform: scale(1.25);
}

.pin-label {
  position: absolute;
  bottom: -2.6rem;
  white-space: nowrap;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
  background: rgba(13, 17, 23, 0.9);
  padding: 0.25rem 0.7rem;
  border-radius: 0.5rem;
  border: 1px solid var(--glass-border);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease;
  backdrop-filter: blur(8px);
}

.map-pin:hover .pin-label,
.map-pin.active .pin-label {
  opacity: 1;
}

/* ── Popup ── */
.map-popup {
  position: absolute;
  transform: translate(-50%, -100%);
  z-index: 100;
  background: var(--bg-alt);
  border: 1px solid var(--glass-border);
  border-radius: 1.6rem;
  padding: 2rem;
  width: 30rem;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(16px);
}

.popup-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--glass-border);
  border-radius: 50%;
  width: 2.8rem;
  height: 2.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-muted);
  transition: background 0.15s, color 0.15s;
  padding: 0;
}
.popup-close svg { width: 1.4rem; height: 1.4rem; }
.popup-close:hover { background: rgba(255, 255, 255, 0.12); color: var(--text); }

.popup-header {
  display: flex;
  align-items: center;
  gap: 1.4rem;
  margin-bottom: 1.2rem;
}

.popup-logo {
  width: 5.2rem;
  height: 5.2rem;
  border-radius: 1rem;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid var(--glass-border);
}

.popup-avatar {
  width: 5.2rem;
  height: 5.2rem;
  border-radius: 1rem;
  background: linear-gradient(135deg, var(--accent-dark), var(--accent));
  color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.8rem;
  flex-shrink: 0;
  letter-spacing: -0.02em;
}

.popup-header-info {
  flex: 1;
  min-width: 0;
}

.popup-name {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text);
  display: block;
  line-height: 1.2;
  margin-bottom: 0.4rem;
}

.popup-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.popup-tags span {
  font-size: 1rem;
  color: var(--accent);
  font-weight: 600;
  opacity: 0.85;
}

.popup-desc {
  font-size: 1.25rem;
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: 1.2rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.popup-contact {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1.4rem;
}

.popup-row {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  font-size: 1.25rem;
  color: var(--text-muted);
}

.popup-row svg {
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  color: var(--accent);
}

.popup-row a {
  color: var(--text);
  text-decoration: none;
  transition: color 0.15s;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.popup-row a:hover { color: var(--accent); }

.popup-footer {
  padding-top: 1.2rem;
  border-top: 1px solid var(--glass-border);
}

.popup-profile-link {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--accent);
  text-decoration: none;
  transition: color 0.15s, gap 0.15s;
}
.popup-profile-link:hover {
  color: var(--accent-light);
  gap: 1.1rem;
}

.tk-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 50%;
  background: var(--accent);
  color: #000;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  flex-shrink: 0;
}

/* ── Controls ── */
.map-controls {
  position: absolute;
  top: 1.6rem;
  right: 1.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 15;
}

.map-controls button {
  width: 4rem;
  height: 4rem;
  background: var(--bg-alt);
  border: 1px solid var(--glass-border);
  border-radius: 1rem;
  color: var(--text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
}

.map-controls button svg {
  width: 1.6rem;
  height: 1.6rem;
}

.map-controls button:hover {
  background: var(--accent);
  color: #000;
  border-color: var(--accent);
}

/* ── Attribution ── */
.map-attribution {
  position: absolute;
  bottom: 0.8rem;
  right: 1rem;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.45);
  z-index: 15;
  pointer-events: none;
  backdrop-filter: blur(4px);
}

.map-attribution a {
  color: rgba(255, 255, 255, 0.65);
  pointer-events: all;
  text-decoration: none;
}
.map-attribution a:hover { color: var(--accent); }

/* ── Empty state ── */
.map-empty {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-muted);
  font-size: 1.4rem;
}

.map-empty code {
  background: rgba(255, 255, 255, 0.08);
  padding: 0.2rem 0.5rem;
  border-radius: 0.4rem;
  font-size: 1.2rem;
  color: var(--accent);
}

/* ── Popup transition ── */
.popup-enter-active,
.popup-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.popup-enter-from,
.popup-leave-to {
  opacity: 0;
  transform: translate(-50%, -88%);
}

.map-popup--flipped {
  transform: translate(-50%, 0);
}

.popup-flip-enter-active,
.popup-flip-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.popup-flip-enter-from,
.popup-flip-leave-to {
  opacity: 0;
  transform: translate(-50%, 12%);
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .biz-map { height: 520px; border-radius: 1.4rem; width: 100%; margin-left: 0; }
  .map-search-bar { width: 100%; margin-left: 0; }
  .map-popup { width: 30rem; padding: 1.6rem; }
}

@media (max-width: 480px) {
  .biz-map { height: 460px; }
  .map-popup { width: 26rem; padding: 1.4rem; }
  .popup-name { font-size: 1.4rem; }
}
</style>

<style>
/* ── Teleported popup (rendered at body level, outside scoped styles) ── */
.map-popup--teleported {
  position: absolute;
  transform: translate(-50%, -100%);
  z-index: 9999;
  background: var(--bg-alt);
  border: 1px solid var(--glass-border);
  border-radius: 1.6rem;
  padding: 2rem;
  width: 30rem;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(16px);
  pointer-events: all;
}

.map-popup--teleported.map-popup--flipped {
  transform: translate(-50%, 0);
}

.map-popup--teleported .popup-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--glass-border);
  border-radius: 50%;
  width: 2.8rem;
  height: 2.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-muted);
  transition: background 0.15s, color 0.15s;
  padding: 0;
}
.map-popup--teleported .popup-close svg { width: 1.4rem; height: 1.4rem; }
.map-popup--teleported .popup-close:hover { background: rgba(255, 255, 255, 0.12); color: var(--text); }

.map-popup--teleported .popup-header {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  margin-bottom: 1.2rem;
  padding-right: 2.4rem;
}

.map-popup--teleported .popup-logo {
  width: 4.8rem;
  height: 4.8rem;
  border-radius: 1rem;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid var(--glass-border);
}

.map-popup--teleported .popup-avatar {
  width: 4.8rem;
  height: 4.8rem;
  border-radius: 1rem;
  background: var(--accent);
  color: #000;
  font-weight: 800;
  font-size: 1.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.map-popup--teleported .popup-name {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text);
  display: block;
  margin-bottom: 0.4rem;
}

.map-popup--teleported .popup-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.map-popup--teleported .popup-tags span {
  font-size: 1rem;
  color: var(--accent);
  font-weight: 600;
}

.map-popup--teleported .popup-desc {
  font-size: 1.2rem;
  color: var(--text-muted);
  margin-bottom: 1.2rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.map-popup--teleported .popup-contact {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1.4rem;
}

.map-popup--teleported .popup-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 1.2rem;
  color: var(--text-muted);
}

.map-popup--teleported .popup-row svg {
  width: 1.4rem;
  height: 1.4rem;
  flex-shrink: 0;
  color: var(--accent);
}

.map-popup--teleported .popup-row a {
  color: var(--text);
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.map-popup--teleported .popup-row a:hover { color: var(--accent); }

.map-popup--teleported .popup-footer {
  border-top: 1px solid var(--glass-border);
  padding-top: 1.2rem;
}

.map-popup--teleported .popup-profile-link {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--accent);
  text-decoration: none;
  transition: color 0.15s;
}
.map-popup--teleported .popup-profile-link:hover { color: var(--accent-light); }

.map-popup--teleported .tk-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 50%;
  background: var(--accent);
  color: #000;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .map-popup--teleported { width: 30rem; padding: 1.6rem; }
}

@media (max-width: 480px) {
  .map-popup--teleported { width: 26rem; padding: 1.4rem; }
  .map-popup--teleported .popup-name { font-size: 1.4rem; }
}
</style>
