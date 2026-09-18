const express = require('express');
const router = express.Router();
const { getHierarchy, getWards, getDepartments } = require('../controllers/locationController');

router.get('/hierarchy', getHierarchy);
router.get('/wards', getWards);
router.get('/departments', getDepartments);

module.exports = router;
