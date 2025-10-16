const express = require('express');
const router = express.Router();
const IssueController = require('../controllers/IssueController');
const { issueValidation } = require('../middleware/validation');

router.get('/', IssueController.getAllIssues);
router.get('/stats', IssueController.getIssueStats);
router.get('/:id', IssueController.getIssue);
router.post('/', issueValidation.create, IssueController.createIssue);
router.put('/:id', IssueController.updateIssue);
router.patch('/:id/resolve', IssueController.resolveIssue);
router.patch('/:id/escalate', IssueController.escalateIssue);

module.exports = router;