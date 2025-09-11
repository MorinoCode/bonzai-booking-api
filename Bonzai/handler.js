

module.exports.hello = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Hello from Bonz.ai booking API 👋',
      },
      null,
      2
    ),
  };
};
