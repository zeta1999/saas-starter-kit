import 'pptr-testing-library/extend'
import {ElementHandle} from 'puppeteer'
import {IState} from '../../lib/typedefs'
import {Mailslurp} from '../../lib/mailslurp'
import conf from '../../../shared/lib/conf'
import {testIds} from '../../../frontend/src/utils'

module.exports = (state: IState) => {
  let $document: ElementHandle

  const mailslurp = new Mailslurp(conf.mailslurp.apiKey)

  // tslint:disable-next-line
  async function typeInByLabel(label, text) {
    const $el = await $document.getByLabelText(label)
    await $el.type(text)
  }

  describe('create account', () => {
    beforeEach(async () => {
      $document = await state.page.getDocument()
    })

    it('should prep a fake inbox', async () => {
      state.userMailbox = await mailslurp.createInbox()
    })

    it('should navigate to login page', async () => {
      await state.page.goto(`${state.rootURL}/login`)
      await state.page.waitFor('#app-root')
    })

    it('should switch to create account tab', async () => {
      await state.page.waitFor(state.waitFor)
      const $createAccountTab = await $document.getByTestId(testIds.createAccountTab)
      await $createAccountTab.click()
      await state.page.waitFor(`[data-testid=${testIds.registerForm}`)
    })

    it('should fill in form', async () => {
      await state.page.waitFor(state.waitFor)
      await typeInByLabel(/First Name/, 'John')
      await typeInByLabel(/Last Name/, 'User')
      await typeInByLabel(/Email/, state.userMailbox.address)
      await typeInByLabel(/^Password/, 'test_password')
      await typeInByLabel(/Confirm Password/, 'test_password')
      await state.page.waitFor(state.waitFor)
      const $submit = await $document.getByTestId(testIds.createAccountSubmit)
      $submit.click()
      await state.page.waitForNavigation()
    })

    it('should have created account', async () => {
      await state.page.waitFor(state.waitFor)

      const text = await state.page.evaluate(() => document.querySelector('h1').textContent)
      expect(text).toContain('Hello, John')
      state.user = {password: 'test_password'}
    })

    it.skip('should send welcome email', async () => {
      expect(state.user).toBeDefined()
      const messages = await mailslurp.readMail(state.userMailbox, 1)

      expect(messages).toHaveLength(1)
      expect(messages[0].subject).toContain('Welcome')
      expect(messages[0].body).toContain('Hello John User,')
      state.emailVerificationLink = messages[0].body.match(/>http[^\s<]+/)[0].slice(1)
    })

    it.skip('should visit verification link', async () => {
      expect(state.emailVerificationLink).toBeDefined()
      await state.page.goto(state.emailVerificationLink)

      const pageURL = await state.page.evaluate(() => window.location.href)
      expect(pageURL).toContain('verification=success')
    })
  })
}
