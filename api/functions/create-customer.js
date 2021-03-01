const stripe = require('stripe')(process.env.STRIPE_SECRET);

exports.handler = async function (event, context) {
  const { email } = JSON.parse(event.body)

  const customer = await stripe.customers.create({
    email
  })

  return {
    statusCode: 200,
    body: JSON.stringify(customer)
  }
}