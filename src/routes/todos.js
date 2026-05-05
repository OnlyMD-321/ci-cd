const express = require('express');
const store = require('../store');

const router = express.Router();

router.get('/', (_req, res) => {
  res.json(store.list());
});

module.exports = router;
