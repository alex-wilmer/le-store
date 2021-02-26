import { useState, useEffect } from 'react'

let api = 'http://localhost:5555'
let get = endpoint => fetch(api + endpoint).then(r => r.json())

function App() {
  let [products, setProducts] = useState([])
  let [prices, setPrices] = useState([])

  useEffect(() => {
    Promise.all([get('/products'), get('/prices')])
      .then(([products, prices]) => {
        setProducts(products.data)
        setPrices(prices.data)
      })
  }, [])

  console.log({ prices })

  return (
    <div className="App">
      <h1>Le Store</h1>

      <div>
        <h2>Products:</h2>
        {products.map(product =>
          <div key={product.id}>
            <h3>{product.name}: <em>{product.description}</em></h3>

            {prices.map(price => (
              <div key={price.id}>
                <input name="price" value={price.id} type="radio" /> {price.unit_amount} cents per {price.recurring.interval}
              </div>
            ))}
          </div>
        )}
      </div>

      <br />
      <br />

      <div>
        pay with credit
      </div>

      <div>
        pay now button
      </div>
    </div>
  );
}

export default App;
