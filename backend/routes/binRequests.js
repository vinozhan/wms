const express = require('express');
const { BinRequest, WasteBin } = require('../models');
const { 
  authMiddleware, 
  authorize,
  handleValidationErrors
} = require('../middleware');
const { body } = require('express-validator');

const router = express.Router();


// Create bin request (for residents/business)
router.post('/', 
  authMiddleware,
  authorize('resident', 'business'),
  [
    body('binType').optional().isIn(['general', 'recyclable', 'organic', 'hazardous', 'electronic']),
    body('preferredLocation').optional().trim().isLength({ min: 1, max: 500 }),
    body('justification').optional().trim().isLength({ min: 1, max: 1000 }),
    body('contactPhone').optional().isLength({ min: 1, max: 20 })
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const {
        binType,
        preferredLocation,
        justification,
        contactPhone,
        additionalNotes
      } = req.body;

      const binRequest = new BinRequest({
        requester: req.user._id,
        binType,
        preferredLocation,
        justification,
        contactPhone,
        additionalNotes: additionalNotes || ''
      });

      await binRequest.save();

      const populatedRequest = await BinRequest.findById(binRequest._id)
        .populate('requester', 'name email phone address');

      res.status(201).json({
        message: 'Bin request submitted successfully',
        request: populatedRequest
      });

    } catch (error) {
      console.error('Create bin request error:', error);
      res.status(500).json({ 
        error: 'Failed to submit bin request'
      });
    }
  }
);

// Get bin requests (admin/collector view all, users view their own)
router.get('/', 
  authMiddleware,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const filter = {};
      
      // Regular users can only see their own requests
      if (req.user.userType !== 'admin' && req.user.userType !== 'collector') {
        filter.requester = req.user._id;
      }

      // Filter by status
      if (req.query.status) {
        filter.status = req.query.status;
      }

      // Filter by priority
      if (req.query.priority) {
        filter.priority = req.query.priority;
      }

      const requests = await BinRequest.find(filter)
        .populate('requester', 'name email phone address userType')
        .populate('reviewedBy', 'name')
        .populate('approvedBin', 'binId binType')
        .sort('-requestDate')
        .skip(skip)
        .limit(limit);

      const total = await BinRequest.countDocuments(filter);

      res.json({
        requests,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalRequests: total
        }
      });

    } catch (error) {
      console.error('Get bin requests error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch bin requests' 
      });
    }
  }
);

// Get single bin request
router.get('/:id', 
  authMiddleware,
  async (req, res) => {
    try {
      const request = await BinRequest.findById(req.params.id)
        .populate('requester', 'name email phone address userType')
        .populate('reviewedBy', 'name')
        .populate('approvedBin', 'binId binType location');

      if (!request) {
        return res.status(404).json({ 
          error: 'Bin request not found' 
        });
      }

      // Check access permissions
      if (req.user.userType !== 'admin' && 
          req.user.userType !== 'collector' && 
          request.requester._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          error: 'Access denied' 
        });
      }

      res.json({ request });

    } catch (error) {
      console.error('Get bin request error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch bin request' 
      });
    }
  }
);

// Approve bin request (admin only)
router.patch('/:id/approve', 
  authMiddleware,
  authorize('admin'),
  [
    body('reviewNotes').optional().trim().isLength({ max: 500 }),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const request = await BinRequest.findById(req.params.id);

      if (!request) {
        return res.status(404).json({ 
          error: 'Bin request not found' 
        });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({ 
          error: 'Request has already been reviewed' 
        });
      }

      // Update priority if provided
      if (req.body.priority) {
        request.priority = req.body.priority;
      }

      await request.approve(req.user._id, req.body.reviewNotes);

      const updatedRequest = await BinRequest.findById(request._id)
        .populate('requester', 'name email phone')
        .populate('reviewedBy', 'name');

      res.json({
        message: 'Bin request approved successfully',
        request: updatedRequest
      });

    } catch (error) {
      console.error('Approve bin request error:', error);
      res.status(500).json({ 
        error: 'Failed to approve bin request' 
      });
    }
  }
);

// Reject bin request (admin only)
router.patch('/:id/reject', 
  authMiddleware,
  authorize('admin'),
  [
    body('reviewNotes').trim().isLength({ min: 10, max: 500 }).withMessage('Rejection reason is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const request = await BinRequest.findById(req.params.id);

      if (!request) {
        return res.status(404).json({ 
          error: 'Bin request not found' 
        });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({ 
          error: 'Request has already been reviewed' 
        });
      }

      await request.reject(req.user._id, req.body.reviewNotes);

      const updatedRequest = await BinRequest.findById(request._id)
        .populate('requester', 'name email phone')
        .populate('reviewedBy', 'name');

      res.json({
        message: 'Bin request rejected',
        request: updatedRequest
      });

    } catch (error) {
      console.error('Reject bin request error:', error);
      res.status(500).json({ 
        error: 'Failed to reject bin request' 
      });
    }
  }
);

// Complete bin request (mark as installed by collector or link to created bin by admin)
router.patch('/:id/complete', 
  authMiddleware,
  authorize('admin', 'collector'),
  [
    body('binId').optional()
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const request = await BinRequest.findById(req.params.id);

      if (!request) {
        return res.status(404).json({ 
          error: 'Bin request not found' 
        });
      }

      if (request.status !== 'approved') {
        return res.status(400).json({ 
          error: 'Request must be approved before completion' 
        });
      }

      // For admin: verify bin exists if binId is provided
      if (req.user.userType === 'admin' && req.body.binId) {
        const bin = await WasteBin.findById(req.body.binId);
        if (!bin) {
          return res.status(404).json({ 
            error: 'Bin not found' 
          });
        }
        await request.complete(req.body.binId);
      } else {
        // For collector: just mark as completed without linking to bin
        await request.complete(null);
      }

      const updatedRequest = await BinRequest.findById(request._id)
        .populate('requester', 'name email phone')
        .populate('reviewedBy', 'name')
        .populate('approvedBin', 'binId binType');

      res.json({
        message: req.user.userType === 'collector' ? 'Bin marked as installed successfully' : 'Bin request completed successfully',
        request: updatedRequest
      });

    } catch (error) {
      console.error('Complete bin request error:', error);
      res.status(500).json({ 
        error: 'Failed to complete bin request' 
      });
    }
  }
);

// Update bin request (requester only, pending status only)
router.put('/:id', 
  authMiddleware,
  authorize('resident', 'business'),
  [
    body('binType').optional().isIn(['general', 'recyclable', 'organic', 'hazardous', 'electronic']),
    body('preferredLocation').optional().trim().isLength({ min: 1, max: 500 }),
    body('justification').optional().trim().isLength({ min: 1, max: 1000 }),
    body('contactPhone').optional().isLength({ min: 1, max: 20 })
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const request = await BinRequest.findById(req.params.id);

      if (!request) {
        return res.status(404).json({ 
          error: 'Bin request not found' 
        });
      }

      // Check if requester owns the request
      if (request.requester.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          error: 'Access denied' 
        });
      }

      // Only allow updates to pending requests
      if (request.status !== 'pending') {
        return res.status(400).json({ 
          error: 'Can only update pending requests' 
        });
      }

      const updateData = {
        binType: req.body.binType,
        preferredLocation: req.body.preferredLocation,
        justification: req.body.justification,
        contactPhone: req.body.contactPhone,
        additionalNotes: req.body.additionalNotes || ''
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const updatedRequest = await BinRequest.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).populate('requester', 'name email phone address');

      res.json({
        message: 'Bin request updated successfully',
        request: updatedRequest
      });

    } catch (error) {
      console.error('Update bin request error:', error);
      res.status(500).json({ 
        error: 'Failed to update bin request' 
      });
    }
  }
);

// Delete bin request (requester only, pending status only)
router.delete('/:id', 
  authMiddleware,
  authorize('resident', 'business'),
  async (req, res) => {
    try {
      const request = await BinRequest.findById(req.params.id);

      if (!request) {
        return res.status(404).json({ 
          error: 'Bin request not found' 
        });
      }

      // Check if requester owns the request
      if (request.requester.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          error: 'Access denied' 
        });
      }

      // Only allow deletion of pending requests
      if (request.status !== 'pending') {
        return res.status(400).json({ 
          error: 'Can only delete pending requests' 
        });
      }

      await BinRequest.findByIdAndDelete(req.params.id);

      res.json({
        message: 'Bin request deleted successfully'
      });

    } catch (error) {
      console.error('Delete bin request error:', error);
      res.status(500).json({ 
        error: 'Failed to delete bin request' 
      });
    }
  }
);

// Get bin request statistics
router.get('/stats/overview', 
  authMiddleware,
  authorize('admin', 'collector'),
  async (req, res) => {
    try {
      const totalRequests = await BinRequest.countDocuments();
      const pendingRequests = await BinRequest.countDocuments({ status: 'pending' });
      const approvedRequests = await BinRequest.countDocuments({ status: 'approved' });
      const rejectedRequests = await BinRequest.countDocuments({ status: 'rejected' });
      const completedRequests = await BinRequest.countDocuments({ status: 'completed' });

      const requestsByType = await BinRequest.aggregate([
        {
          $group: {
            _id: '$binType',
            count: { $sum: 1 }
          }
        }
      ]);

      const requestsByPriority = await BinRequest.aggregate([
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 }
          }
        }
      ]);

      res.json({
        overview: {
          total: totalRequests,
          pending: pendingRequests,
          approved: approvedRequests,
          rejected: rejectedRequests,
          completed: completedRequests
        },
        byType: requestsByType,
        byPriority: requestsByPriority
      });

    } catch (error) {
      console.error('Get bin request stats error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch bin request statistics' 
      });
    }
  }
);

module.exports = router;