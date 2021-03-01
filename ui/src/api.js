export let api = process.env.REACT_APP_API || 'http://localhost:5555'
export let get = endpoint => fetch(api + endpoint).then(r => r.json())
export let post = (endpoint, body) => fetch(api + endpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(body)
}).then(r => r.json())