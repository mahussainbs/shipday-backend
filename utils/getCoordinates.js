const axios = require('axios');

const LOCATIONIQ_API_KEY = process.env.LOCATIONIQ_API_KEY;

const getCoordinates = async (address) => {
  try {
    const res = await axios.get('https://us1.locationiq.com/v1/search', {
      params: {
        key: LOCATIONIQ_API_KEY,
        q: address,
        format: 'json',
      },
    });

    const loc = res.data[0];
    return {
      lat: parseFloat(loc.lat),
      lon: parseFloat(loc.lon),
    };
  } catch (err) {
    console.error('LocationIQ Error:', err.message);
    return null;
  }
};

module.exports = getCoordinates;
