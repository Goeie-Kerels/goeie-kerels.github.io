<script setup lang="ts">
const { t } = useI18n()

type ModalPlan = 'company' | 'individual' | 'supporter' | 'supersponsor' | 'general'
const modalOpen = ref(false)
const modalPlan = ref<ModalPlan>('general')
const quizOpen = ref(false)

function openModal(plan: ModalPlan) {
  modalPlan.value = plan
  modalOpen.value = true
}

function openQuiz() {
  quizOpen.value = true
}

function onQuizApply(plan: 'company' | 'individual' | 'supporter') {
  quizOpen.value = false
  openModal(plan)
}
</script>

<template>
  <section class="join-section">
    <div class="container">

      <!-- Intro -->
      <div class="join-intro text-center reveal-on-scroll active">
        <p class="join-lead">{{ t('join.lead') }}</p>
      </div>

      <!-- Pricing cards -->
      <div class="pricing-grid">

        <!-- Company -->
        <div class="pricing-card reveal-on-scroll active">
          <div class="pricing-type company">{{ t('join.company.type') }}</div>
          <div class="pricing-price">
            <span class="price-amount">{{ t('join.company.price') }}</span>
            <span class="price-period">{{ t('join.perYear') }}</span>
          </div>
          <div class="price-tax">{{ t('join.inclTax') }}</div>
          <p class="pricing-desc">{{ t('join.company.desc') }}</p>
          <ul class="pricing-perks">
            <li>
              <span class="perk-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg></span>
              {{ t('join.company.perk1') }}
            </li>
            <li>
              <span class="perk-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></span>
              {{ t('join.company.perk2') }}
            </li>
            <li>
              <span class="perk-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
              {{ t('join.company.perk3') }}
            </li>
            <li class="perk-highlight">
              <span class="perk-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
              {{ t('join.company.perk4') }}
            </li>
          </ul>
          <p class="pricing-note">{{ t('join.company.note') }}</p>
          <button class="pricing-cta company-cta" @click="openModal('company')">
            {{ t('join.company.cta') }}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>

        <!-- Individual (company add-on) -->
        <div class="pricing-card featured reveal-on-scroll active">
          <div class="pricing-badge">{{ t('join.individual.badge') }}</div>
          <div class="pricing-type individual">{{ t('join.individual.type') }}</div>
          <div class="pricing-price">
            <span class="price-amount">{{ t('join.individual.price') }}</span>
            <span class="price-period">{{ t('join.perYear') }}</span>
          </div>
          <div class="price-tax">{{ t('join.inclTax') }}</div>
          <p class="pricing-desc">{{ t('join.individual.desc') }}</p>
          <ul class="pricing-perks">
            <li>
              <span class="perk-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
              {{ t('join.individual.perk1') }}
            </li>
            <li>
              <span class="perk-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg></span>
              {{ t('join.individual.perk2') }}
            </li>
            <li>
              <span class="perk-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>
              {{ t('join.individual.perk3') }}
            </li>
            <li>
              <span class="perk-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
              {{ t('join.individual.perk4') }}
            </li>
            <li class="perk-excluded">
              <span class="perk-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></span>
              {{ t('join.individual.perk5') }}
            </li>
          </ul>
          <button class="pricing-cta individual-cta" @click="openModal('individual')">
            {{ t('join.individual.cta') }}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>

        <!-- Supporter / donation tier -->
        <div class="pricing-card reveal-on-scroll active">
          <div class="pricing-type supporter">{{ t('join.supporter.type') }}</div>
          <div class="pricing-price">
            <span class="price-amount">{{ t('join.supporter.price') }}</span>
            <span class="price-period">{{ t('join.perYear') }}</span>
          </div>
          <div class="price-tax">{{ t('join.inclTax') }}</div>
          <p class="pricing-desc">{{ t('join.supporter.desc') }}</p>
          <ul class="pricing-perks">
            <li>
              <span class="perk-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
              {{ t('join.supporter.perk1') }}
            </li>
            <li>
              <span class="perk-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></span>
              {{ t('join.supporter.perk2') }}
            </li>
          </ul>
          <button class="pricing-cta supporter-cta" @click="openModal('supporter')">
            {{ t('join.supporter.cta') }}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>

      </div>

      <!-- Tier explainer -->
      <div class="tier-explainer reveal-on-scroll active">
        <h2>{{ t('join.tierExplainer.title') }}</h2>
        <p class="tier-explainer-intro">{{ t('join.tierExplainer.intro') }}</p>
        <div class="tier-explainer-grid">
          <div class="tier-explainer-card company-explainer">
            <div class="tier-explainer-label">{{ t('join.company.type') }}</div>
            <h3>{{ t('join.tierExplainer.companyTitle') }}</h3>
            <p>{{ t('join.tierExplainer.companyText') }}</p>
          </div>
          <div class="tier-explainer-card individual-explainer">
            <div class="tier-explainer-label">{{ t('join.individual.type') }}</div>
            <h3>{{ t('join.tierExplainer.personTitle') }}</h3>
            <p>{{ t('join.tierExplainer.personText') }}</p>
          </div>
          <div class="tier-explainer-card supporter-explainer">
            <div class="tier-explainer-label">{{ t('join.supporter.type') }}</div>
            <h3>{{ t('join.tierExplainer.supporterTitle') }}</h3>
            <p>{{ t('join.tierExplainer.supporterText') }}</p>
          </div>
        </div>
      </div>

      <!-- Quiz CTA -->
      <div class="quiz-cta-block text-center reveal-on-scroll active">
        <div class="quiz-cta-inner">
          <svg class="quiz-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.5 9a2.5 2.5 0 0 1 4.95-.44C14.74 9.83 13.5 10.75 12 12"/>
            <circle cx="12" cy="16.5" r=".75" fill="currentColor" stroke="none"/>
          </svg>
          <h2>{{ t('join.quiz.title') }}</h2>
          <p>{{ t('join.quiz.desc') }}</p>
          <button class="quiz-cta-btn" @click="openQuiz">
            {{ t('join.quiz.cta') }}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>

      <!-- Vetting process -->
      <div class="vetting-block reveal-on-scroll active">
        <h2>{{ t('join.vetting.title') }}</h2>
        <p class="vetting-intro">{{ t('join.vetting.intro') }}</p>

        <div class="vetting-steps">
          <div class="vetting-step">
            <div class="step-number">01</div>
            <div class="step-content">
              <h3>{{ t('join.vetting.step1Title') }}</h3>
              <p>{{ t('join.vetting.step1Desc') }}</p>
            </div>
          </div>
          <div class="vetting-step">
            <div class="step-number">02</div>
            <div class="step-content">
              <h3>{{ t('join.vetting.step2Title') }}</h3>
              <p>{{ t('join.vetting.step2Desc') }}</p>
            </div>
          </div>
          <div class="vetting-step">
            <div class="step-number">03</div>
            <div class="step-content">
              <h3>{{ t('join.vetting.step3Title') }}</h3>
              <p>{{ t('join.vetting.step3Desc') }}</p>
            </div>
          </div>
          <div class="vetting-step">
            <div class="step-number">04</div>
            <div class="step-content">
              <h3>{{ t('join.vetting.step4Title') }}</h3>
              <p>{{ t('join.vetting.step4Desc') }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div class="join-cta-block text-center reveal-on-scroll active">
        <h2>{{ t('join.ctaTitle') }}</h2>
        <p>{{ t('join.ctaDesc') }}</p>
        <button class="join-main-cta" @click="openModal('general')">
          {{ t('join.ctaButton') }}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>



      <!-- Supersponsor add-on (subtle, obligation to mention) -->
      <div class="supersponsor-block reveal-on-scroll active">
        <div class="supersponsor-inner">
          <div class="supersponsor-header">
            <span class="supersponsor-label">{{ t('join.supersponsor.type') }}</span>
            <span class="supersponsor-price">{{ t('join.supersponsor.price') }} {{ t('join.perYear') }}</span>
          </div>
          <p class="supersponsor-desc">{{ t('join.supersponsor.desc') }}</p>
          <ul class="supersponsor-perks">
            <li>{{ t('join.supersponsor.perk1') }}</li>
            <li>{{ t('join.supersponsor.perk2') }}</li>
          </ul>
          <p class="supersponsor-note">{{ t('join.supersponsor.note') }}</p>
          <button class="supersponsor-cta" @click="openModal('supersponsor')">
            {{ t('join.supersponsor.cta') }}
          </button>
        </div>
      </div>

    </div>
  </section>

  <ContactModal v-if="modalOpen" :plan="modalPlan" @close="modalOpen = false" />
  <TierQuiz v-if="quizOpen" @close="quizOpen = false" @apply="onQuizApply" />
</template>

<style scoped>
.join-section {
  padding: var(--section-padding) 0;
}

/* ── Intro ── */
.join-intro {
  max-width: 72rem;
  margin: 0 auto 10rem;
}

.join-lead {
  font-size: clamp(1.8rem, 2.5vw, 2.4rem);
  color: var(--text-muted);
  line-height: 1.7;
  max-width: 100%;
}

/* ── Pricing grid ── */
.pricing-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3.2rem;
  margin-bottom: 12rem;
  align-items: stretch;
}

.pricing-card {
  position: relative;
  background: var(--glass-bg);
  border: 1.5px solid var(--glass-border);
  border-radius: 2.4rem;
  padding: 4rem 3.6rem;
  backdrop-filter: blur(20px);
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
}

.pricing-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.2);
}

.pricing-card.featured {
  border-color: var(--gradient-1);
  box-shadow: 0 0 0 1px var(--gradient-1), 0 20px 60px rgba(37, 99, 235, 0.15);
}

.pricing-badge {
  position: absolute;
  top: -1.6rem;
  left: 50%;
  transform: translateX(-50%);
  background: var(--gradient-1);
  color: #fff;
  font-size: 1.1rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 0.5rem 2rem;
  border-radius: 50px;
  white-space: nowrap;
}

.pricing-type {
  font-size: 1.2rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-bottom: 2rem;
  padding: 0.4rem 1.4rem;
  border-radius: 50px;
  display: inline-block;
}

.pricing-type.company {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.pricing-type.individual {
  background: rgba(37, 99, 235, 0.15);
  color: var(--gradient-1);
}

.pricing-type.supporter {
  background: rgba(124, 58, 237, 0.15);
  color: var(--gradient-2);
}

.pricing-price {
  display: flex;
  align-items: baseline;
  gap: 0.8rem;
  margin-bottom: 2rem;
}

.price-amount {
  font-size: 5.6rem;
  font-weight: 900;
  color: var(--white);
  line-height: 1;
  letter-spacing: -0.04em;
}

.price-period {
  font-size: 1.6rem;
  color: var(--text-muted);
  font-weight: 600;
}

.pricing-desc {
  font-size: 1.5rem;
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 3rem;
  max-width: 100%;
}

.pricing-perks {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
  margin-bottom: 4rem;
  flex: 1;
}

.pricing-perks li {
  display: flex;
  align-items: flex-start;
  gap: 1.2rem;
  font-size: 1.4rem;
  color: var(--text);
  font-weight: 600;
  line-height: 1.4;
}

.perk-icon {
  flex-shrink: 0;
  margin-top: 0.1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  color: var(--gradient-1);
}

.perk-icon svg {
  width: 100%;
  height: 100%;
}

.pricing-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  width: 100%;
  padding: 1.6rem 2.4rem;
  border-radius: 50px;
  font-family: inherit;
  font-size: 1.4rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  text-decoration: none;
  transition: all 0.25s;
  cursor: pointer;
}

.pricing-cta svg {
  width: 1.6rem;
  height: 1.6rem;
  transition: transform 0.2s;
  flex-shrink: 0;
}

.pricing-cta:hover svg {
  transform: translateX(4px);
}

.company-cta {
  background: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
  border: 2px solid rgba(245, 158, 11, 0.4);
}

.company-cta:hover {
  background: #f59e0b;
  color: #000;
  border-color: #f59e0b;
}

.individual-cta {
  background: var(--gradient-1);
  color: #fff;
  border: 2px solid var(--gradient-1);
}

.individual-cta:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

.supporter-cta {
  background: rgba(124, 58, 237, 0.12);
  color: var(--gradient-2);
  border: 2px solid rgba(124, 58, 237, 0.4);
}

.supporter-cta:hover {
  background: var(--gradient-2);
  color: #fff;
  border-color: var(--gradient-2);
}

/* ── Pricing note ── */
.pricing-note {
  font-size: 1.3rem;
  color: var(--text-muted);
  line-height: 1.6;
  margin-top: 1.6rem;
  padding: 1.2rem 1.6rem;
  background: rgba(37, 99, 235, 0.06);
  border-left: 3px solid var(--gradient-1);
  border-radius: 0 0.8rem 0.8rem 0;
}

.perk-highlight {
  font-weight: 700;
  color: var(--white);
}

.perk-excluded {
  opacity: 0.5;
}

.perk-excluded .perk-icon {
  color: var(--text-muted);
}

/* ── Tier explainer ── */
.tier-explainer {
  margin-bottom: 8rem;
}

.tier-explainer h2 {
  margin-bottom: 1.6rem;
}

.tier-explainer-intro {
  font-size: 1.8rem;
  color: var(--text-muted);
  margin-bottom: 4rem;
}

.tier-explainer-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2.4rem;
}

.tier-explainer-card {
  background: var(--glass-bg);
  border: 1.5px solid var(--glass-border);
  border-radius: 2rem;
  padding: 3.2rem;
  backdrop-filter: blur(20px);
}

.tier-explainer-label {
  font-size: 1.1rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 1.2rem;
}

.company-explainer .tier-explainer-label { color: #f59e0b; }
.individual-explainer .tier-explainer-label { color: var(--gradient-1); }
.supporter-explainer .tier-explainer-label { color: var(--gradient-2); }

.tier-explainer-card h3 {
  font-size: 2rem;
  color: var(--white);
  margin-bottom: 1.2rem;
  text-transform: uppercase;
  letter-spacing: -0.03em;
}

.tier-explainer-card p {
  font-size: 1.5rem;
  color: var(--text-muted);
  line-height: 1.7;
}

/* ── Quiz CTA ── */
.quiz-cta-block {
  margin-bottom: 12rem;
}

.quiz-cta-inner {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 6rem 8rem;
  background: var(--glass-bg);
  border: 1.5px solid var(--glass-border);
  border-radius: 3.2rem;
  backdrop-filter: blur(20px);
  max-width: 64rem;
  width: 100%;
}

.quiz-icon {
  width: 5.6rem;
  height: 5.6rem;
  color: var(--gradient-1);
  opacity: 0.8;
}

.quiz-cta-inner h2 {
  margin-bottom: 0;
}

.quiz-cta-inner p {
  font-size: 1.7rem;
  color: var(--text-muted);
  margin: 0;
}

.quiz-cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 1rem;
  padding: 1.6rem 4rem;
  background: rgba(37, 99, 235, 0.12);
  color: var(--gradient-1);
  border: 2px solid rgba(37, 99, 235, 0.4);
  border-radius: 50px;
  font-family: inherit;
  font-size: 1.4rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: all 0.25s;
}

.quiz-cta-btn svg {
  width: 1.6rem;
  height: 1.6rem;
  transition: transform 0.2s;
}

.quiz-cta-btn:hover {
  background: var(--gradient-1);
  color: #fff;
  border-color: var(--gradient-1);
}

.quiz-cta-btn:hover svg {
  transform: translateX(4px);
}

/* ── Vetting block ── */
.vetting-block {
  margin-bottom: 12rem;
}

.vetting-block h2 {
  margin-bottom: 2rem;
}

.vetting-intro {
  font-size: 1.8rem;
  color: var(--text-muted);
  max-width: 60rem;
  margin-bottom: 6rem;
}

.vetting-steps {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4rem;
}

.vetting-step {
  display: flex;
  gap: 3rem;
  align-items: flex-start;
}

.step-number {
  font-size: 5rem;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.05em;
  background: linear-gradient(135deg, var(--gradient-1), var(--gradient-2));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  flex-shrink: 0;
  width: 6rem;
}

.step-content h3 {
  font-size: 2.4rem;
  color: var(--white);
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: -0.03em;
}

.step-content p {
  font-size: 1.5rem;
  color: var(--text-muted);
  line-height: 1.6;
  max-width: 100%;
}

/* ── Supersponsor block ── */
.supersponsor-block {
  margin-bottom: 8rem;
}

.supersponsor-inner {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 1.6rem;
  padding: 3.2rem;
  backdrop-filter: blur(20px);
  max-width: 72rem;
}

.supersponsor-header {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 1.2rem;
  flex-wrap: wrap;
}

.supersponsor-label {
  font-size: 1.1rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
}

.supersponsor-price {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-muted);
}

.supersponsor-desc {
  font-size: 1.4rem;
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 1.6rem;
}

.supersponsor-perks {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1.6rem;
}

.supersponsor-perks li {
  font-size: 1.3rem;
  color: var(--text-muted);
  padding-left: 1.4rem;
  position: relative;
}

.supersponsor-perks li::before {
  content: '–';
  position: absolute;
  left: 0;
}

.supersponsor-note {
  font-size: 1.2rem;
  color: var(--text-muted);
  opacity: 0.7;
  line-height: 1.5;
  margin-bottom: 2rem;
}

.supersponsor-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem 2.4rem;
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--glass-border);
  border-radius: 50px;
  font-family: inherit;
  font-size: 1.3rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.supersponsor-cta:hover {
  color: var(--text);
  border-color: var(--text-muted);
}

/* ── price tax label ── */
.price-tax {
  font-size: 1.2rem;
  color: var(--text-muted);
  margin-top: -1.4rem;
  margin-bottom: 2rem;
}

/* ── Final CTA ── */
.join-cta-block {
  padding: 8rem 4rem;
  background: var(--glass-bg);
  border: 1.5px solid var(--glass-border);
  border-radius: 3.2rem;
  backdrop-filter: blur(20px);
}

.join-cta-block h2 {
  margin-bottom: 2rem;
}

.join-cta-block p {
  font-size: 1.8rem;
  color: var(--text-muted);
  margin: 0 auto 4rem;
}

.join-main-cta {
  display: inline-flex;
  align-items: center;
  gap: 1.2rem;
  padding: 2rem 5rem;
  background: linear-gradient(135deg, var(--gradient-1), var(--gradient-2));
  color: #fff;
  border-radius: 50px;
  font-family: inherit;
  font-size: 1.6rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 8px 32px rgba(37, 99, 235, 0.3);
}

.join-main-cta svg {
  width: 1.8rem;
  height: 1.8rem;
  transition: transform 0.2s;
}

.join-main-cta:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 48px rgba(37, 99, 235, 0.4);
}

.join-main-cta:hover svg {
  transform: translateX(4px);
}

/* ── Responsive ── */
@media (max-width: 1024px) {
  .pricing-grid {
    grid-template-columns: 1fr;
    max-width: 52rem;
    margin-left: auto;
    margin-right: auto;
  }

  .tier-explainer-grid {
    grid-template-columns: 1fr;
  }

  .vetting-steps {
    grid-template-columns: 1fr;
    gap: 3.2rem;
  }
}

@media (max-width: 768px) {
  .join-intro {
    margin-bottom: 6rem;
  }

  .pricing-grid {
    max-width: 100%;
    gap: 2.4rem;
  }

  .pricing-card {
    padding: 3.2rem 2.8rem;
  }

  .price-amount {
    font-size: 4.8rem;
  }

  .quiz-cta-inner {
    padding: 4rem 2.4rem;
  }

  .join-cta-block {
    padding: 5rem 2.4rem;
  }
}
</style>
