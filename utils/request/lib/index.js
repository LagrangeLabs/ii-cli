'use strict';

const axios = require('axios');

const BASE_URL = process.env.II_CLI_BASE_URL ? process.env.II_CLI_BASE_URL : 'http://127.0.0.1:7001';

const request = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
});

module.exports = request;
