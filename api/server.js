const stripe = require('stripe')(process.env.STRIPE_SECRET);
const express = require('express')
const cors = require('cors')
const app = express()
const port = 5555

app.use(cors())

// app.get('/', async (req, res) => {
//   const paymentIntent = await stripe.paymentIntents.create({
//     amount: 1000,
//     currency: 'cad',
//     payment_method_types: ['card'],
//     receipt_email: 'jenny.rosen@example.com',
//   });

//   res.json(paymentIntent)
// })

app.get('/products', async (req, res) => {
  const products = await stripe.products.list()
  res.json(products)
})

app.get('/prices', async (req, res) => {
  const prices = await stripe.prices.list()
  res.json(prices)
})

app.listen(port, () => {
  console.log(`listening at http://localhost:${port}`)
})
