import {IState} from './typedefs'
import {app, sqlExtension} from '../lib/app'

describe('lib/app.ts', () => {
  const state: IState = {app, sqlExtension}

  require('./integration/setup.test')(state)
  require('./integration/teardown.test')(state)
})