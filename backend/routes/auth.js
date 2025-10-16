const express = require('express');
const { User } = require('../models');
const { 
  generateToken, 
  authMiddleware, 
  userValidation 
} = require('../middleware');

const router = express.Router();

router.post('/register', userValidation.register, async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      phone, 
      address, 
      userType,
      paymentInfo,
      preferences 
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User already exists with this email address' 
      });
    }

    const user = new User({
      name,
      email,
      password,
      phone,
      address,
      userType: userType || 'resident',
      paymentInfo: paymentInfo || {},
      preferences: preferences || {}
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      user: user.toJSON(),
      token,
      expiresIn: process.env.JWT_EXPIRE || '7d'
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        error: `${field} already exists` 
      });
    }

    res.status(500).json({ 
      error: 'Registration failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.post('/login', userValidation.login, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    if (user.accountStatus === 'suspended') {
      return res.status(403).json({ 
        error: 'Account suspended. Please contact administrator.' 
      });
    }

    if (user.accountStatus === 'pending') {
      return res.status(403).json({ 
        error: 'Account pending approval. Please wait for activation.' 
      });
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      user: user.toJSON(),
      token,
      expiresIn: process.env.JWT_EXPIRE || '7d'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.post('/logout', authMiddleware, async (req, res) => {
  try {
    res.json({ 
      message: 'Logout successful' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Logout failed' 
    });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('wasteBins')
      .select('-password');

    res.json({
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user information' 
    });
  }
});

router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ 
        error: 'Token is required' 
      });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid token' 
      });
    }

    res.json({
      valid: true,
      user: user.toJSON()
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        valid: false 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        valid: false 
      });
    }

    console.error('Token verification error:', error);
    res.status(500).json({ 
      error: 'Token verification failed',
      valid: false 
    });
  }
});

router.post('/refresh-token', authMiddleware, async (req, res) => {
  try {
    const token = generateToken(req.user._id);

    res.json({
      message: 'Token refreshed successfully',
      token,
      expiresIn: process.env.JWT_EXPIRE || '7d'
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ 
      error: 'Token refresh failed' 
    });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: 'Email is required' 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found with this email address' 
      });
    }

    res.json({
      message: 'Password reset instructions sent to your email'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      error: 'Failed to process forgot password request' 
    });
  }
});

router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Current password and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'New password must be at least 6 characters long' 
      });
    }

    const user = await User.findById(req.user._id);
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ 
        error: 'Current password is incorrect' 
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      error: 'Failed to change password' 
    });
  }
});

module.exports = router;