import * as React from 'react'
import {RenderResult, fireEvent, render, wait} from 'react-testing-library'

import {PasswordResetForm} from '../../../src/login/forms/password-reset'
import {createFetchPromise} from '../../utils'
import {testIds} from '../../../src/utils'

describe('register/forms/register.tsx', () => {
  let fetchMock: jest.Mock

  function renderAndFill(): RenderResult {
    const form = render(<PasswordResetForm />)
    const password = form.getByLabelText(/^Password/) as HTMLInputElement
    const confirmPassword = form.getByLabelText(/Confirm Password/) as HTMLInputElement
    password.value = 'new_password'
    confirmPassword.value = 'new_password'
    return form
  }

  beforeEach(() => {
    fetchMock = jest.fn()
    self.fetch = fetchMock
    // mock the URL, see https://www.ryandoll.com/post/2018/3/29/jest-and-url-mocking
    window.history.pushState({}, '', '/login?reset-password-key=1234key1234')
  })

  it('should render form', () => {
    const form = render(<PasswordResetForm />)
    expect(form.container).toMatchSnapshot()
  })

  it('should check passwords match', async () => {
    const {getByTestId, getByLabelText} = renderAndFill()
    const confirmPassword = getByLabelText(/Confirm Password/) as HTMLInputElement
    confirmPassword.value = 'other'

    fireEvent.submit(getByTestId(testIds.passwordResetForm))
    await wait(() => getByTestId(testIds.messageBar))

    expect(getByTestId(testIds.messageBar).textContent).toMatchSnapshot()
  })

  it('should send password reset request to server', async () => {
    const {getByTestId} = renderAndFill()
    const fetchPromise = createFetchPromise()
    fetchMock.mockImplementation(fetchPromise.fn)

    fireEvent.submit(getByTestId(testIds.passwordResetForm))
    await wait(() => getByTestId(testIds.loadingBar))

    expect(fetchMock).toHaveBeenCalled()
    expect(fetchMock.mock.calls[0]).toMatchSnapshot()
  })

  it('should show an error UI', async () => {
    const {getByTestId, queryByTestId} = renderAndFill()
    const fetchPromise = createFetchPromise({status: 400})
    fetchMock.mockImplementation(fetchPromise.fn)

    fireEvent.submit(getByTestId(testIds.passwordResetForm))
    await wait(() => getByTestId(testIds.loadingBar))

    expect(queryByTestId(testIds.messageBar)).toBeNull()

    fetchPromise.resolve()
    await wait(() => getByTestId(testIds.messageBar))

    expect(queryByTestId(testIds.loadingBar)).toBeNull()
    expect(getByTestId(testIds.messageBar).textContent).toMatchSnapshot()
  })
})
