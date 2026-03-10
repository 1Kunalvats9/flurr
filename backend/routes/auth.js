const bcrypt = require('bcryptjs');
const express = require('express');
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../utils/supabase');

const authRouter = express.Router();

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function signToken({ userId, email }) {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('Missing JWT_SECRET in environment');
  }

  return jwt.sign({ sub: userId, email }, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

authRouter.post('/signup', async (req, res) => {
  const rawEmail = typeof req.body?.email === 'string' ? req.body.email : '';
  const rawPassword = typeof req.body?.password === 'string' ? req.body.password : '';
  const email = rawEmail.trim().toLowerCase();
  const password = rawPassword.trim();

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  const { data: existingUser, error: lookupError } = await supabaseAdmin
    .from('auth_users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (lookupError) {
    return res.status(500).json({ error: lookupError.message });
  }

  if (existingUser) {
    return res.status(409).json({ error: 'An account already exists for this email.' });
  }

  const password_hash = await bcrypt.hash(password, 12);

  const { data: createdUser, error: insertError } = await supabaseAdmin
    .from('auth_users')
    .insert({
      email,
      password_hash,
    })
    .select('id, email')
    .single();

  if (insertError) {
    return res.status(500).json({ error: insertError.message });
  }

  const { error: profileError } = await supabaseAdmin.from('profiles').upsert(
    {
      clerk_id: createdUser.id,
      email,
      onboarding_complete: false,
    },
    {
      onConflict: 'clerk_id',
    }
  );

  if (profileError) {
    return res.status(500).json({ error: profileError.message });
  }

  const token = signToken({ userId: createdUser.id, email: createdUser.email });

  return res.status(201).json({
    token,
    user: createdUser,
  });
});

authRouter.post('/login', async (req, res) => {
  const rawEmail = typeof req.body?.email === 'string' ? req.body.email : '';
  const rawPassword = typeof req.body?.password === 'string' ? req.body.password : '';
  const email = rawEmail.trim().toLowerCase();
  const password = rawPassword.trim();

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  const { data: existingUser, error: lookupError } = await supabaseAdmin
    .from('auth_users')
    .select('id, email, password_hash')
    .eq('email', email)
    .maybeSingle();

  if (lookupError) {
    return res.status(500).json({ error: lookupError.message });
  }

  if (!existingUser) {
    return res.status(404).json({ error: 'No account found for this email.' });
  }

  const isPasswordValid = await bcrypt.compare(password, existingUser.password_hash);

  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid password.' });
  }

  const token = signToken({ userId: existingUser.id, email: existingUser.email });

  return res.json({
    token,
    user: {
      id: existingUser.id,
      email: existingUser.email,
    },
  });
});

module.exports = { authRouter };
