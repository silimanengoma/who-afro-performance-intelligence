/* Contrôle qualité de bout en bout du parcours principal (mode démo).
 * Usage : npm run build && node scripts/e2e-check.mjs
 * Nécessite : npm i -D playwright (Chromium via PLAYWRIGHT_BROWSERS_PATH). */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const PORT = 4173
const BASE = `http://localhost:${PORT}`
let failures = 0
const ok = (label) => console.log(`  ✓ ${label}`)
const ko = (label, err) => { failures++; console.error(`  ✗ ${label}${err ? ` — ${err}` : ''}`) }
async function step(label, fn) {
  try { await fn(); ok(label) } catch (e) { ko(label, e.message?.split('\n')[0]) }
}

// vite preview sert le build de production
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  cwd: new URL('..', import.meta.url).pathname, stdio: 'pipe',
})
await new Promise((resolve, reject) => {
  const to = setTimeout(() => reject(new Error('preview timeout')), 20000)
  server.stdout.on('data', (d) => { if (String(d).includes('localhost')) { clearTimeout(to); resolve() } })
  server.on('exit', () => reject(new Error('preview exited')))
})

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium',
})
const page = await (await browser.newContext()).newPage()
page.on('dialog', (d) => d.accept())

const login = async (email) => {
  await page.goto(`${BASE}/connexion`)
  await page.fill('#email', email)
  await page.fill('#password', 'soleil2026')
  await page.click('button[type=submit]')
  await page.waitForURL(/espace-pro|admin/)
}
const logout = () => page.evaluate(() => localStorage.removeItem('soleil-portal-session'))

console.log('— Expérience publique —')
await step('Accueil : marque affichée', async () => {
  await page.goto(BASE)
  if (!(await page.textContent('h1')).includes('SOLEIL CRÉATION')) throw new Error('titre absent')
})
await step('Lookbook : narration présente', async () => {
  await page.goto(`${BASE}/lookbook`)
  await page.waitForSelector('text=Wholesale Lookbook')
})
await step('Aucun prix professionnel sur les pages publiques', async () => {
  for (const path of ['/', '/lookbook', '/capsules', '/signatures']) {
    await page.goto(BASE + path)
    const body = await page.textContent('body')
    if (/prix professionnel|wholesale price|XAF|FCFA/i.test(body)) throw new Error(`fuite sur ${path}`)
  }
})
await step('Bascule FR → EN persistante', async () => {
  await page.goto(BASE)
  await page.click('button:has-text("EN")')
  await page.waitForSelector('text=Contemporary African elegance')
  await page.reload()
  await page.waitForSelector('text=Contemporary African elegance')
  await page.click('button:has-text("FR")')
})
await step("Demande d'accès : validation puis envoi", async () => {
  await page.goto(`${BASE}/acces-professionnel`)
  await page.click('button[type=submit]') // vide → erreurs
  await page.waitForSelector('[role=alert]')
  await page.fill('#legalName', 'Boutique Test E2E')
  await page.fill('#shopType', 'Concept store')
  await page.fill('#contactName', 'Testeuse E2E')
  await page.fill('#email', 'e2e@test.example')
  await page.fill('#city', 'Abidjan')
  await page.fill('#country', "Côte d'Ivoire")
  await page.click('button[type=submit]')
  await page.waitForSelector('text=transmise')
})
await step('Espace pro inaccessible sans connexion', async () => {
  await page.goto(`${BASE}/espace-pro/showroom`)
  await page.waitForURL(/connexion/)
})

console.log('— Parcours acheteur —')
await step('Connexion acheteur démo', () => login('boutique@demo.example'))
await step('Showroom : ajout à la sélection', async () => {
  await page.goto(`${BASE}/espace-pro/showroom`)
  await page.click('article >> nth=0 >> text=Ajouter à ma sélection')
  await page.waitForSelector('article >> nth=0 >> text=Dans ma sélection')
})
await step('Ma sélection : quantité + persistance après rafraîchissement', async () => {
  await page.goto(`${BASE}/espace-pro/selection`)
  await page.fill('input[id^=qty-]', '4')
  await page.waitForTimeout(300)
  await page.reload()
  const v = await page.inputValue('input[id^=qty-]')
  if (v !== '4') throw new Error(`quantité=${v}`)
})
await step('Line Sheet : synthèse et export présents', async () => {
  await page.goto(`${BASE}/espace-pro/line-sheet`)
  await page.waitForSelector('text=Synthèse commerciale')
  await page.waitForSelector('text=Exporter CSV')
})
await step('Demande de devis depuis la sélection', async () => {
  await page.goto(`${BASE}/espace-pro/devis/nouveau`)
  await page.click('button[type=submit]')
  await page.waitForURL(/espace-pro\/devis\//)
  await page.waitForSelector('text=DEV-0001')
})

console.log('— Parcours administrateur —')
await step('Connexion admin ventes', async () => { await logout(); await login('ventes@soleilcreation.example') })
await step("Demande d'accès visible et approuvable", async () => {
  await page.goto(`${BASE}/admin/demandes-acces`)
  await page.waitForSelector('text=Boutique Test E2E')
  await page.click('text=Approuver')
  await page.waitForSelector('text=Historique')
})
await step('Chiffrage et envoi du devis', async () => {
  await page.goto(`${BASE}/admin/devis`)
  await page.click('text=DEV-0001')
  await page.fill('td input[type=number]', '50000')
  await page.click('text=Enregistrer et envoyer à la boutique')
  await page.waitForSelector('text=Envoyé')
})

console.log('— Boucle finale acheteur —')
await step('Acceptation du devis → commande créée', async () => {
  await logout(); await login('boutique@demo.example')
  await page.goto(`${BASE}/espace-pro/devis`)
  await page.click('text=DEV-0001')
  await page.click('text=Accepter le devis')
  await page.waitForSelector('text=CMD-0001')
})
await step('Commande visible dans Mes commandes', async () => {
  await page.goto(`${BASE}/espace-pro/commandes`)
  await page.waitForSelector('text=CMD-0001')
})

await browser.close()
server.kill()
console.log(failures === 0 ? '\nQA E2E : tous les contrôles passent.' : `\nQA E2E : ${failures} échec(s).`)
process.exit(failures === 0 ? 0 : 1)
