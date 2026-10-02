import { expect, test } from '@nuxt/test-utils/playwright'

test('registers an account, changes its password, and logs in again', async ({ page, goto }) => {
  const username = `recipe-user-${Date.now()}`
  const email = `${username}@example.test`
  const password = 'initial-password-123'
  const updatedPassword = 'updated-password-456'

  await goto('/register', { waitUntil: 'hydration' })
  await page.getByLabel('Username').fill(username)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page).toHaveURL(/\/$/)

  await page.getByRole('button', { name: username }).click()
  await page.getByRole('menuitem', { name: 'My profile' }).click()
  await expect(page.getByText(email)).toBeVisible()
  await page.getByRole('button', { name: 'Change password' }).click()
  await page.getByLabel('Old password').fill(password)
  await page.getByLabel('New password', { exact: true }).fill(updatedPassword)
  await page.getByLabel('Repeat new password').fill(updatedPassword)
  await page.getByRole('button', { name: 'Update password' }).click()
  await expect(page.getByText('Password updated.')).toBeVisible()

  await page.getByRole('button', { name: username }).click()
  await page.getByRole('menuitem', { name: 'Logout' }).click()
  await expect(page).toHaveURL(/\/login$/)

  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(updatedPassword)
  await page.locator('form').getByRole('button', { name: 'Log in' }).click()
  await expect(page).toHaveURL(/\/$/)
})
