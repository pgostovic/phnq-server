import { sendgrid } from 'phnq-lib';

sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

export const sendEmail = ({ from, to, subject, text }) => sendgrid.sendEmail({ from, to, subject, text });
