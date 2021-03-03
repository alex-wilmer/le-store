const nodemailer = require('nodemailer');
const mg = require('nodemailer-mailgun-transport');

const transporter = nodemailer.createTransport(
  mg({
    auth: {
      api_key: process.env.MAILGUN_API_KEY,
      domain: process.env.MAILGUN_DOMAIN,
    },
  }),
);

exports.handler = async function (event) {

  //  const destiny = 'mirek.wilmer@gmail.com';

  try {
    const info = await transporter.sendMail({
      from: process.env.MAILGUN_SENDER,
      to: 'mirek.wilmer@gmail.com',
      subject: 'alert !',
      text: event.body,
    });
  } catch (err) {

  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      api_key: process.env.MAILGUN_API_KEY,
      domain: process.env.MAILGUN_DOMAIN,
    })
  }
};