const express = require('express');
const router = express.Router();
const IssueController = require('../controllers/IssueController');
const { validateIssue } = require('../middleware/validation');

// Debug middleware to log all issue requests
router.use((req, res, next) => {
  console.log(`Issue Route: ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

router.get('/', IssueController.getAllIssues);
router.get('/stats', IssueController.getIssueStats);
router.get('/:id', IssueController.getIssue);
router.post('/', validateIssue, IssueController.createIssue); // Add validation
router.put('/:id', validateIssue, IssueController.updateIssue); // Add validation
router.patch('/:id/resolve', IssueController.resolveIssue);
router.patch('/:id/escalate', IssueController.escalateIssue);

module.exports = router;