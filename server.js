const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - IMPORTANT: Order matters!
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // Increased limit for base64 images
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Database file path
const dbPath = path.join(__dirname, 'data', 'products.json');

// Ensure data directory exists
const ensureDataDir = () => {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log('✅ Created data directory');
    }
};

// Initialize database with sample data
const initializeDatabase = () => {
    ensureDataDir();
    
    if (!fs.existsSync(dbPath)) {
        const sampleProducts = [
            {
                id: 1,
                name: "Samsung Galaxy S24 Ultra",
                price: 129999,
                originalPrice: 139999,
                discount: 7,
                image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300&h=300&fit=crop",
                category: "Electronics",
                rating: 4.3,
                reviews: 890,
                description: "Premium Android smartphone with S Pen and advanced AI features",
                specifications: {
                    "Screen Size": "6.8 inch",
                    "Storage": "256GB",
                    "RAM": "12GB",
                    "Camera": "200MP Quad Camera",
                    "Battery": "5000 mAh"
                },
                inStock: true,
                brand: "Samsung"
            },
            {
                id: 2,
                name: "iPhone 15 Pro",
                price: 134900,
                originalPrice: 149900,
                discount: 10,
                image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=300&fit=crop",
                category: "Electronics",
                rating: 4.5,
                reviews: 1250,
                description: "Latest iPhone with titanium design and advanced camera system",
                specifications: {
                    "Screen Size": "6.1 inch",
                    "Storage": "128GB",
                    "RAM": "8GB",
                    "Camera": "48MP Triple Camera",
                    "Battery": "3274 mAh"
                },
                inStock: true,
                brand: "Apple"
            }
        ];
        
        try {
            fs.writeFileSync(dbPath, JSON.stringify(sampleProducts, null, 2));
            console.log('✅ Database initialized with sample products');
        } catch (error) {
            console.error('❌ Error initializing database:', error);
        }
    }
};

// Helper functions
const readProducts = () => {
    try {
        if (!fs.existsSync(dbPath)) {
            console.log('⚠️ Database file not found, initializing...');
            initializeDatabase();
        }
        const data = fs.readFileSync(dbPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('❌ Error reading products:', error);
        return [];
    }
};

const writeProducts = (products) => {
    try {
        ensureDataDir();
        fs.writeFileSync(dbPath, JSON.stringify(products, null, 2));
        console.log('✅ Products saved successfully');
        return true;
    } catch (error) {
        console.error('❌ Error writing products:', error);
        return false;
    }
};

// Initialize database on startup
initializeDatabase();

// API Routes with enhanced error handling

// GET all products
app.get('/api/products', (req, res) => {
    try {
        const products = readProducts();
        console.log(`📦 Serving ${products.length} products`);
        res.json(products);
    } catch (error) {
        console.error('API Error (GET /api/products):', error);
        res.status(500).json({ 
            error: 'Failed to load products',
            message: error.message 
        });
    }
});

// GET single product
app.get('/api/products/:id', (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const products = readProducts();
        const product = products.find(p => p.id === productId);
        
        if (!product) {
            console.log(`⚠️ Product not found: ${productId}`);
            return res.status(404).json({ error: 'Product not found' });
        }
        
        console.log(`📱 Serving product: ${product.name}`);
        res.json(product);
    } catch (error) {
        console.error('API Error (GET /api/products/:id):', error);
        res.status(500).json({ 
            error: 'Failed to load product',
            message: error.message 
        });
    }
});

// POST new product
app.post('/api/products', (req, res) => {
    try {
        console.log('📝 Creating new product:', req.body.name);
        
        const products = readProducts();
        const newProduct = {
            id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
            ...req.body,
            price: parseFloat(req.body.price) || 0,
            originalPrice: parseFloat(req.body.originalPrice) || 0,
            rating: parseFloat(req.body.rating) || 0,
            reviews: parseInt(req.body.reviews) || 0,
            discount: parseInt(req.body.discount) || 0,
            inStock: req.body.inStock !== false,
            specifications: req.body.specifications || {}
        };
        
        // Calculate discount if not provided
        if (!newProduct.discount && newProduct.originalPrice > newProduct.price) {
            newProduct.discount = Math.round(((newProduct.originalPrice - newProduct.price) / newProduct.originalPrice) * 100);
        }
        
        products.push(newProduct);
        
        if (writeProducts(products)) {
            console.log(`✅ Product created: ${newProduct.name} (ID: ${newProduct.id})`);
            res.status(201).json(newProduct);
        } else {
            throw new Error('Failed to save product to database');
        }
        
    } catch (error) {
        console.error('API Error (POST /api/products):', error);
        res.status(500).json({ 
            error: 'Failed to create product',
            message: error.message 
        });
    }
});

// PUT update product
app.put('/api/products/:id', (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        console.log(`✏️ Updating product: ${productId}`);
        
        const products = readProducts();
        const index = products.findIndex(p => p.id === productId);
        
        if (index === -1) {
            console.log(`⚠️ Product not found for update: ${productId}`);
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const updatedProduct = {
            ...products[index],
            ...req.body,
            id: productId, // Ensure ID doesn't change
            price: parseFloat(req.body.price) || products[index].price,
            originalPrice: parseFloat(req.body.originalPrice) || products[index].originalPrice,
            rating: parseFloat(req.body.rating) || products[index].rating,
            reviews: parseInt(req.body.reviews) || products[index].reviews,
            discount: parseInt(req.body.discount) || products[index].discount,
            specifications: req.body.specifications || products[index].specifications || {}
        };
        
        // Recalculate discount if needed
        if (updatedProduct.originalPrice > updatedProduct.price) {
            updatedProduct.discount = Math.round(((updatedProduct.originalPrice - updatedProduct.price) / updatedProduct.originalPrice) * 100);
        }
        
        products[index] = updatedProduct;
        
        if (writeProducts(products)) {
            console.log(`✅ Product updated: ${updatedProduct.name}`);
            res.json(updatedProduct);
        } else {
            throw new Error('Failed to save updated product');
        }
        
    } catch (error) {
        console.error('API Error (PUT /api/products/:id):', error);
        res.status(500).json({ 
            error: 'Failed to update product',
            message: error.message 
        });
    }
});

// DELETE product
app.delete('/api/products/:id', (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        console.log(`🗑️ Deleting product: ${productId}`);
        
        const products = readProducts();
        const index = products.findIndex(p => p.id === productId);
        
        if (index === -1) {
            console.log(`⚠️ Product not found for deletion: ${productId}`);
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const deletedProduct = products[index];
        products.splice(index, 1);
        
        if (writeProducts(products)) {
            console.log(`✅ Product deleted: ${deletedProduct.name}`);
            res.json({ 
                message: 'Product deleted successfully',
                deletedProduct: deletedProduct 
            });
        } else {
            throw new Error('Failed to save after deletion');
        }
        
    } catch (error) {
        console.error('API Error (DELETE /api/products/:id):', error);
        res.status(500).json({ 
            error: 'Failed to delete product',
            message: error.message 
        });
    }
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: err.message 
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🛍️ Store: http://localhost:${PORT}`);
    console.log(`⚙️ Admin: http://localhost:${PORT}/admin`);
    console.log(`📡 API: http://localhost:${PORT}/api/products`);
    console.log(`🏥 Health: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down server...');
    process.exit(0);
});

const quotationRouter = require('./routes/quotationRouter');
app.use('/api/quotations', quotationRouter);
app.get('/quotation', (_, res) =>
  res.sendFile(path.join(__dirname,'public/quotation/quotation.html'))
);
