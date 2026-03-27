<script setup lang="ts">
const { t } = useI18n()

const props = defineProps<{
  plan: 'company' | 'individual' | 'supporter' | 'supersponsor' | 'general'
}>()

const emit = defineEmits<{
  close: []
}>()

const name = ref('')
const email = ref('')
const phone = ref('')
const company = ref('')
const message = ref('')

const planLabel = computed(() => t(`modal.planLabel.${props.plan}`))

const defaultMessage = computed(() =>
  t('modal.defaultMessage', { plan: planLabel.value, name: name.value || '...' })
)

// Pre-fill message when plan changes or name changes
watch([() => props.plan, name], () => {
  message.value = defaultMessage.value
}, { immediate: true })

function handleSubmit() {
  const subject = encodeURIComponent(t(`modal.subject.${props.plan}`))

  const phoneLine = phone.value ? t('modal.phoneLine', { phone: phone.value }) : ''
  const companyLine = company.value ? t('modal.companyLine', { company: company.value }) : ''

  const body = t('modal.emailBody', {
    plan: planLabel.value,
    name: name.value,
    email: email.value,
    phone: phoneLine,
    company: companyLine,
    message: message.value,
  })

  const mailto = `mailto:info@toffekerels.nl?subject=${subject}&body=${encodeURIComponent(body)}`
  window.location.href = mailto
  emit('close')
}

function onOverlayClick(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
    emit('close')
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="modal-overlay" @click="onOverlayClick">
      <div class="modal" role="dialog" aria-modal="true">

        <button class="modal-close" @click="emit('close')" :aria-label="t('modal.close')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>

        <div class="modal-header">
          <div class="modal-plan-badge">{{ planLabel }}</div>
          <h2 class="modal-title">{{ t('modal.title') }}</h2>
          <p class="modal-subtitle">{{ t('modal.subtitle') }}</p>
        </div>

        <form class="modal-form" @submit.prevent="handleSubmit">

          <div class="form-row">
            <div class="form-field">
              <label for="modal-name">{{ t('modal.name') }} <span class="required">*</span></label>
              <input id="modal-name" v-model="name" type="text" :placeholder="t('modal.namePlaceholder')" required />
            </div>
            <div class="form-field">
              <label for="modal-email">{{ t('modal.email') }} <span class="required">*</span></label>
              <input id="modal-email" v-model="email" type="email" :placeholder="t('modal.emailPlaceholder')" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-field">
              <label for="modal-phone">{{ t('modal.phone') }}</label>
              <input id="modal-phone" v-model="phone" type="tel" :placeholder="t('modal.phonePlaceholder')" />
            </div>
            <div class="form-field">
              <label for="modal-company">{{ t('modal.company') }}</label>
              <input id="modal-company" v-model="company" type="text" :placeholder="t('modal.companyPlaceholder')" />
            </div>
          </div>

          <div class="form-field">
            <label for="modal-message">{{ t('modal.message') }}</label>
            <textarea id="modal-message" v-model="message" rows="6" :placeholder="t('modal.messagePlaceholder')"></textarea>
          </div>

          <button type="submit" class="modal-submit">
            {{ t('modal.submit') }}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>

        </form>

      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(6px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  animation: overlay-in 0.2s ease;
}

@keyframes overlay-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.modal {
  position: relative;
  background: #0f172a;
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 2.4rem;
  padding: 4.8rem;
  width: 100%;
  max-width: 64rem;
  max-height: 90vh;
  overflow-y: auto;
  animation: modal-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modal-in {
  from { opacity: 0; transform: translateY(24px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-close {
  position: absolute;
  top: 2rem;
  right: 2rem;
  width: 3.6rem;
  height: 3.6rem;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.modal-close svg {
  width: 1.6rem;
  height: 1.6rem;
}

.modal-header {
  margin-bottom: 3.2rem;
}

.modal-plan-badge {
  display: inline-block;
  font-size: 1.1rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #2563eb;
  background: rgba(37, 99, 235, 0.12);
  border: 1px solid rgba(37, 99, 235, 0.3);
  padding: 0.4rem 1.4rem;
  border-radius: 50px;
  margin-bottom: 1.6rem;
}

.modal-title {
  font-size: clamp(2.4rem, 4vw, 3.2rem);
  font-weight: 900;
  color: #fff;
  letter-spacing: -0.04em;
  text-transform: uppercase;
  margin-bottom: 1rem;
}

.modal-subtitle {
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.6;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.6rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.form-field label {
  font-size: 1.2rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.6);
}

.required {
  color: #2563eb;
}

.form-field input,
.form-field textarea {
  background: rgba(255, 255, 255, 0.05);
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.2rem;
  padding: 1.4rem 1.8rem;
  font-family: inherit;
  font-size: 1.5rem;
  font-weight: 500;
  color: #fff;
  outline: none;
  transition: border-color 0.2s, background 0.2s;
  resize: vertical;
}

.form-field input::placeholder,
.form-field textarea::placeholder {
  color: rgba(255, 255, 255, 0.25);
}

.form-field input:focus,
.form-field textarea:focus {
  border-color: #2563eb;
  background: rgba(37, 99, 235, 0.06);
}

.modal-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.2rem;
  padding: 1.8rem 4rem;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: #fff;
  border: none;
  border-radius: 50px;
  font-family: inherit;
  font-size: 1.5rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 8px 32px rgba(37, 99, 235, 0.3);
  margin-top: 0.8rem;
}

.modal-submit svg {
  width: 1.6rem;
  height: 1.6rem;
  transition: transform 0.2s;
}

.modal-submit:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 48px rgba(37, 99, 235, 0.4);
}

.modal-submit:hover svg {
  transform: translateX(4px);
}

@media (max-width: 600px) {
  .modal {
    padding: 3.2rem 2.4rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
