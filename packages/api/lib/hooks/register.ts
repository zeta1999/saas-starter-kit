import {template} from 'lodash'
import * as Sparkpost from 'sparkpost'
import conf from '../../../shared/lib/conf'

// tslint:disable-next-line
const debug = require('debug')('the-product:hooks')

const WELCOME_TEMPLATE = template(
  [
    'Hello <%= name %>,\n',
    `You're receiving this message because you registered an account for ${conf.displayName}.`,
    'Please follow the link below to verify your email address.',
    '\n<%= link %>\n',
    'If you did not register an account with us, you can ignore this email.',
    '\nThanks,',
    `The ${conf.displayName} Team`,
  ].join('\n'),
)

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const sparkpost = new Sparkpost(conf.sparkpost.apiKey)
  const emailToVerify = conf.sparkpost.sendToSink ? `${email}.sink.sparkpostmail.com` : email
  // TODO: make this a real verify link
  const verifyLink = `http://${conf.domain}/`

  debug('sending welcome email to', emailToVerify, 'from', conf.sparkpost.fromAddress)

  await sparkpost.transmissions.send({
    options: {
      transactional: true,
    },
    content: {
      from: conf.sparkpost.fromAddress,
      subject: `Welcome to ${conf.displayName}! - Verify your email`,
      html: WELCOME_TEMPLATE({name, link: `<a href="${verifyLink}">${verifyLink}</a>`})
        .split('\n')
        .join('<br>'),
      text: WELCOME_TEMPLATE({name, link: verifyLink}),
    },
    recipients: [
      {
        address: {email: emailToVerify, name},
        tags: ['welcome', 'email-verification'],
      },
    ],
  })
}