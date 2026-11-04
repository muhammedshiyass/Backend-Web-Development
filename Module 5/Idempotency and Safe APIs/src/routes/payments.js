'use strict';
// routes/payments.js
//
// POST /payments uses Idempotency-Key to ensure retries do not create duplicate charges.

const router = require('express').Router();
const { charges, idempotency, nextChargeId } = require('../store');

router.post('/', (req, res) => {
  const key = req.headers['idempotency-key'];
  if (!key) {
    return res.status(400).json({
      error: {
        code: 'IDEMPOTENCY_KEY_REQUIRED',
        message: 'Idempotency-Key header is required'
      }
    });
  }

  const cached = idempotency.get(key);
  if (cached) {
    return res.status(cached.status).json(cached.body);
  }

  const amount = req.body && req.body.amount;
  const charge = { id: nextChargeId(), amount, status: 'charged' };
  charges.push(charge);
  const body = { id: charge.id, amount: charge.amount, status: charge.status };
  const status = 201;
  idempotency.set(key, { status, body });

  return res.status(status).json(body);
});

module.exports = router;
