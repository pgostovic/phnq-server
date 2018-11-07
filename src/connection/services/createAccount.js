import { generate } from 'randomstring';
import validator from 'validator';
import Account from '../../model/account';
import { sendEmail } from '../mail';

export default async ({ email }) => {
  if (!validator.isEmail(email)) {
    throw new Error('Invalid email address.');
  }

  const code = generate(10);
  await new Account({ email, code }).save();

  await sendEmail({
    from: 'info@phnq.org',
    to: email,
    subject: 'Welcome to Phnq',
    text: `Please validate your email address with this code ${code}.`,
  });

  return true;
};
