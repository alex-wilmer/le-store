exports.handler = async function (event, context) {
  const d = JSON.parse(event.body)
  return {
    statusCode: 200,
    body: JSON.stringify(d)
  };
}