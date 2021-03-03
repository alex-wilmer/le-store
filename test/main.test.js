const { chromium } = require('playwright')
const faker = require('faker')

// https://github.com/playwright-community/jest-playwright#known-issues
jest.setTimeout(35 * 1000)

const testCards = {
  noAuth: '4242424242424242',
  auth: '4000002760003184'
}

let browser, page
const randomEmail = faker.internet.email()

async function fillForm({
  page,
  number,
  expiry = '12 / 21',
  cvc = '123'
}) {
  const elementHandleNumber = await page.$('[data-test=number] iframe')
  const frameNumber = await elementHandleNumber.contentFrame()
  await frameNumber.fill(
    '[data-elements-stable-field-name="cardNumber"]',
    number
  )

  const elementHandleExpiry = await page.$('[data-test=expiry] iframe')
  const frameExpiry = await elementHandleExpiry.contentFrame()
  await frameExpiry.fill(
    '[data-elements-stable-field-name="cardExpiry"]',
    expiry
  )

  const elementHandleCvc = await page.$('[data-test=cvc] iframe')
  const frameCvc = await elementHandleCvc.contentFrame()
  await frameCvc.fill(
    '[data-elements-stable-field-name="cardCvc"]',
    cvc
  )
}

beforeAll(async () => {
  browser = await chromium.launch()
  page = await browser.newPage()
  await page.goto('http://localhost:3000')
})

test('should display the product', async () => {
  const content = await page.textContent('[data-test=product-name]:first-child')
  expect(content).toBe('Basic')
})

test('should create a stripe subscription', async () => {
  await page.fill('#email-input', randomEmail)
  await fillForm({ page, number: testCards.noAuth })
  await page.click('#submit')
  expect(await page.textContent('#success')).toBe('Success!')
})

afterAll(async () => {
  await browser.close()
})