const express = require('express');
const { User } = require('../models');
const { 
  authMiddleware, 
  authorize, 
  userValidation,
  paramValidation,
  queryValidation,
  handleValidationErrors
} = require('../middleware');

const router = express.Router();

router.get('/', 
  authMiddleware, 
  authorize('admin', 'collector'),
  queryValidation.pagination,
  handleValidationErrors,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const sort = req.query.sort || '-createdAt';

      const filter = {};
      if (req.query.userType) {
        filter.userType = req.query.userType;
      }
      if (req.query.accountStatus) {
        filter.accountStatus = req.query.accountStatus;
      }
      if (req.query.search) {
        filter.$or = [
          { name: { $regex: req.query.search, $options: 'i' } },
          { email: { $regex: req.query.search, $options: 'i' } },
          { phone: { $regex: req.query.search, $options: 'i' } }
        ];
      }

      const users = await User.find(filter)
        .populate('wasteBins')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select('-password');

      const total = await User.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      res.json({
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers: total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });

    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch users' 
      });
    }
  }
);

router.get('/:id', 
  authMiddleware,
  paramValidation.mongoId,
  handleValidationErrors,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id)
        .populate('wasteBins')
        .select('-password');

      if (!user) {
        return res.status(404).json({ 
          error: 'User not found' 
        });
      }

      if (req.user.userType !== 'admin' && 
          req.user.userType !== 'collector' && 
          req.user._id.toString() !== user._id.toString()) {
        return res.status(403).json({ 
          error: 'Access denied' 
        });
      }

      res.json({ user });

    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch user' 
      });
    }
  }
);

router.put('/:id', 
  authMiddleware,
  paramValidation.mongoId,
  userValidation.updateProfile,
  async (req, res) => {
    try {
      const userId = req.params.id;

      if (req.user.userType !== 'admin' && 
          req.user._id.toString() !== userId) {
        return res.status(403).json({ 
          error: 'Access denied' 
        });
      }

      const updateData = { ...req.body };
      delete updateData.password;
      delete updateData.email;
      delete updateData.userType;

      if (req.user.userType !== 'admin') {
        delete updateData.accountStatus;
      }

      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ 
          error: 'User not found' 
        });
      }

      res.json({
        message: 'Profile updated successfully',
        user
      });

    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ 
        error: 'Failed to update profile' 
      });
    }
  }
);

router.patch('/:id/status', 
  authMiddleware,
  authorize('admin'),
  paramValidation.mongoId,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { accountStatus } = req.body;

      if (!['active', 'suspended', 'pending'].includes(accountStatus)) {
        return res.status(400).json({ 
          error: 'Invalid account status' 
        });
      }

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { accountStatus },
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ 
          error: 'User not found' 
        });
      }

      res.json({
        message: 'Account status updated successfully',
        user
      });

    } catch (error) {
      console.error('Update account status error:', error);
      res.status(500).json({ 
        error: 'Failed to update account status' 
      });
    }
  }
);

router.delete('/:id', 
  authMiddleware,
  authorize('admin'),
  paramValidation.mongoId,
  handleValidationErrors,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ 
          error: 'User not found' 
        });
      }

      if (user.wasteBins && user.wasteBins.length > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete user with active waste bins' 
        });
      }

      await User.findByIdAndDelete(req.params.id);

      res.json({
        message: 'User deleted successfully'
      });

    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ 
        error: 'Failed to delete user' 
      });
    }
  }
);

router.get('/:id/waste-bins', 
  authMiddleware,
  paramValidation.mongoId,
  handleValidationErrors,
  async (req, res) => {
    try {
      const userId = req.params.id;

      if (req.user.userType !== 'admin' && 
          req.user.userType !== 'collector' && 
          req.user._id.toString() !== userId) {
        return res.status(403).json({ 
          error: 'Access denied' 
        });
      }

      const user = await User.findById(userId)
        .populate({
          path: 'wasteBins',
          populate: {
            path: 'lastCollection.collectedBy',
            select: 'name'
          }
        })
        .select('wasteBins');

      if (!user) {
        return res.status(404).json({ 
          error: 'User not found' 
        });
      }

      res.json({
        wasteBins: user.wasteBins
      });

    } catch (error) {
      console.error('Get user waste bins error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch waste bins' 
      });
    }
  }
);

router.get('/:id/collections', 
  authMiddleware,
  paramValidation.mongoId,
  queryValidation.pagination,
  handleValidationErrors,
  async (req, res) => {
    try {
      const userId = req.params.id;

      if (req.user.userType !== 'admin' && 
          req.user.userType !== 'collector' && 
          req.user._id.toString() !== userId) {
        return res.status(403).json({ 
          error: 'Access denied' 
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const user = await User.findById(userId).populate('wasteBins');
      if (!user) {
        return res.status(404).json({ 
          error: 'User not found' 
        });
      }

      const wasteBinIds = user.wasteBins.map(bin => bin._id);

      const { Collection } = require('../models');
      const collections = await Collection.find({ 
        wasteBin: { $in: wasteBinIds } 
      })
        .populate('wasteBin', 'binId binType')
        .populate('collector', 'name')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit);

      const total = await Collection.countDocuments({ 
        wasteBin: { $in: wasteBinIds } 
      });

      res.json({
        collections,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalCollections: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      });

    } catch (error) {
      console.error('Get user collections error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch collections' 
      });
    }
  }
);

router.get('/:id/payments', 
  authMiddleware,
  paramValidation.mongoId,
  queryValidation.pagination,
  handleValidationErrors,
  async (req, res) => {
    try {
      const userId = req.params.id;

      if (req.user.userType !== 'admin' && 
          req.user._id.toString() !== userId) {
        return res.status(403).json({ 
          error: 'Access denied' 
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const { Payment } = require('../models');
      const payments = await Payment.find({ user: userId })
        .populate('collections', 'collectionId status')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit);

      const total = await Payment.countDocuments({ user: userId });

      res.json({
        payments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalPayments: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      });

    } catch (error) {
      console.error('Get user payments error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch payments' 
      });
    }
  }
);

router.get('/stats/overview', 
  authMiddleware,
  authorize('admin'),
  async (req, res) => {
    try {
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ accountStatus: 'active' });
      const pendingUsers = await User.countDocuments({ accountStatus: 'pending' });
      const suspendedUsers = await User.countDocuments({ accountStatus: 'suspended' });

      const usersByType = await User.aggregate([
        {
          $group: {
            _id: '$userType',
            count: { $sum: 1 }
          }
        }
      ]);

      const recentRegistrations = await User.find()
        .sort('-createdAt')
        .limit(5)
        .select('name email userType createdAt accountStatus');

      res.json({
        overview: {
          total: totalUsers,
          active: activeUsers,
          pending: pendingUsers,
          suspended: suspendedUsers
        },
        byType: usersByType,
        recentRegistrations
      });

    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch user statistics' 
      });
    }
  }
);

module.exports = router;