'use strict';

const axios = require('axios');

const defaultHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

const buildUrl = (baseUrl, path) => {
  if (!baseUrl) {
    throw new Error('A baseUrl must be provided when invoking the availability API client!');
  }
  const trimmedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${trimmedBase}${path}`;
};

const getAvailability = async (baseUrl, productId) => {
  const url = buildUrl(baseUrl, `/inventory/${productId}`);
  try {
    const response = await axios.get(url, { headers: defaultHeaders });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    throw error;
  }
};

module.exports = {
  getAvailability,
};
