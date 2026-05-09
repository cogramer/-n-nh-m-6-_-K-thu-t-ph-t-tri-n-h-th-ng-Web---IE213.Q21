import express from 'express';
// import { getAllProducts, getProductById } from '../controllers/ProductCtrl';
import { upload } from "../config/multer.js";
import * as productCtrl from '../controllers/ProductCtrl.js';
import authenticateToken, { requireAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// GET /api/products alternative import example
router.get('/getAll', productCtrl.getAllProducts);          // GET /api/products 
router.get('/filter', productCtrl.filterProducts);    // GET/ api/products/filter
router.get('/:id', productCtrl.getProductById);      // GET /api/products/:id        
router.post(  // POST /api/products
  "/create",
  authenticateToken,
  requireAdmin,
  upload.fields([
    { name: "thumbnailImage", maxCount: 1 },
    { name: "heroImage", maxCount: 1 },
    { name: "galleryImages", maxCount: 10 }
  ]),
  productCtrl.createProduct
);  

router.put(  // PUT /api/products/:id
  '/edit/:id',
  authenticateToken,
  requireAdmin,
  upload.fields([
    { name: "thumbnailImage", maxCount: 1 },
    { name: "heroImage", maxCount: 1 },
    { name: "galleryImages", maxCount: 10 }
  ]),
  productCtrl.updateProduct
);      
router.delete('/deleteOne/:id',authenticateToken,requireAdmin, productCtrl.deleteProduct);    // DELETE /api/products/:id

export default router;  