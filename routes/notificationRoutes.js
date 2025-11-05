const express = require('express');
const router = express.Router();
const notificationController = require('../controller/notification');

router.post('/', notificationController.createNotification);
router.get('/', notificationController.getNotifications);
router.patch('/:id/read', notificationController.markAsRead);
router.delete('/clear-all', notificationController.clearAllNotifications);


module.exports = router;
