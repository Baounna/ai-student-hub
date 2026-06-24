# Pre-Vercel UI Checklist

Use this checklist before any deployment run.  
Goal: zero UX regressions across EN/FR, desktop/mobile, and conversion surfaces.

## 1) Responsive QA

- [ ] Mobile (360px-430px): header logo, nav tabs, search, and CTA buttons stay usable with no overlap.
- [ ] Tablet (768px-1024px): cards align cleanly and no section appears squeezed or cropped.
- [ ] Desktop (1280px+): sticky header and sticky side panels do not hide content.
- [ ] Auth pages (`/login`, `/register`, `/account`): forms remain centered and readable.
- [ ] News/blog/tools grids: no broken card heights or clipped text.
- [ ] Footer columns stack correctly on small screens.

## 2) Accessibility QA

- [ ] Keyboard-only navigation works on all primary pages.
- [ ] Focus ring is visible on links, buttons, inputs, and toggles.
- [ ] Search shortcut `/` focuses the visible search field only.
- [ ] `Esc` and clear button remove query cleanly in header/blog search.
- [ ] Form labels exist for all fields (search/newsletter/auth).
- [ ] Color contrast passes for text, muted text, and CTA buttons in dark + light themes.

## 3) Conversion QA

- [ ] Homepage has visible CTA hierarchy: lead magnet -> tools -> product.
- [ ] Blog post template includes intro CTA, mid-article partner block, end CTA stack.
- [ ] Tools and resources pages include natural affiliate entry points.
- [ ] Product page has working checkout CTA or graceful fallback when checkout URL is missing.
- [ ] Newsletter success state always provides a clear next action.

## 4) Localization QA (EN/FR)

- [ ] Navbar labels are consistent in both languages.
- [ ] Search placeholders and button labels are localized.
- [ ] Legal pages (`privacy`, `terms`, `affiliate-disclosure`) are localized and readable.
- [ ] No mixed-language fragments in critical UI blocks.
- [ ] Locale switch keeps route context where expected.

## 5) Performance + Stability QA

- [ ] No layout jumps in header, hero, or cards (CLS-safe behavior).
- [ ] No hydration warnings in browser console.
- [ ] Images use `next/image` and maintain stable dimensions.
- [ ] Student tool logos load correctly; broken remote logos gracefully fall back to local icon.
- [ ] Interactions are smooth with reduced-motion fallback respected.
- [ ] No heavy new client dependencies added for simple UI behavior.

## 6) Final Command Gate

Run all commands and confirm green before release:

```bash
npm run lint
npm run build
npm run verify:security
npm run verify:production
npm run verify:affiliates
npm run verify:public-content
npm run verify:agents
```
