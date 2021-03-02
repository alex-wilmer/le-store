const stripe = require('stripe')(process.env.STRIPE_SECRET);

exports.handler = async function (event, context) {
  const data = JSON.parse(event.body)

  // Set the default payment method on the customer
  try {
    await stripe.paymentMethods.attach(data.paymentMethodId, {
      customer: data.customerId,
    });
    await stripe.customers.update(data.customerId, {
      invoice_settings: {
        default_payment_method: data.paymentMethodId,
      },
    });
  } catch (error) {

    return {
      statusCode: 402,
      body: JSON.stringify({ result: { error: { message: error.message } } })
    }
  }

  const invoice = await stripe.invoices.retrieve(data.invoiceId, {
    expand: ['payment_intent'],
  });

  return {
    statusCode: 200,
    body: JSON.stringify(invoice)
  }
}

