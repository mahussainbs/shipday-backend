
const express = require('express');
const router = express.Router();
const { createOrder,getOrderById,deleteOrderById,getAllOrders,updateOrderStatus,getOrdersByPhone,getOrdersWithTracking } = require('../controller/orderController');
const { getOrderDetails, getShipmentById } = require('../controller/adminController');

router.post('/orders', createOrder); 
router.get('/orders/with-tracking', getOrdersWithTracking);
router.get('/orders/by-phone/:phone', getOrdersByPhone);
router.get('/orders/details/:orderId', getOrderDetails);
router.get('/orders/:id', getOrderById);
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.delete('/orders/:id', deleteOrderById); 
router.get('/shipments/:shipmentId', getShipmentById);



module.exports = router;
