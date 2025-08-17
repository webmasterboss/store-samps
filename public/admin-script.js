// Fixed admin-script.js with proper error handling
let products = [];
let editingProductId = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Admin panel initializing...');
    loadProducts();
    setupImageUpload();
});

async function loadProducts() {
    try {
        console.log('📡 Loading products...');
        const response = await fetch('/api/products');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        products = await response.json();
        console.log('✅ Products loaded:', products.length);
        displayProductsTable();
        
    } catch (error) {
        console.error('❌ Error loading products:', error);
        showMessage(`Failed to load products: ${error.message}`, 'error');
    }
}

function displayProductsTable() {
    const tableBody = document.getElementById('productsTableBody');
    if (!tableBody) return;
    
    if (products.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">No products found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = products.map(product => `
        <tr>
            <td>${product.id}</td>
            <td>
                <img src="${product.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjRjBGMEYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiM5OTkiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5ObyBJbWc8L3RleHQ+PC9zdmc+'}" 
                     alt="${product.name}" 
                     style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"
                     onerror="this.onerror=null;">
            </td>
            <td>${product.name}</td>
            <td>${product.brand}</td>
            <td>₹${product.price.toLocaleString()}</td>
            <td>${product.category}</td>
            <td>
                <span class="stock-status ${product.inStock ? 'in-stock' : 'out-of-stock'}">
                    ${product.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="edit-btn" onclick="editProduct(${product.id})">Edit</button>
                    <button class="delete-btn" onclick="deleteProduct(${product.id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function setupImageUpload() {
    let fileInput = document.getElementById('productImageFile');
    if (fileInput) {
        fileInput.addEventListener('change', handleImageUpload);
    }
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showMessage('Please select a valid image file', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showMessage('Image size must be less than 5MB', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Image = e.target.result;
        document.getElementById('productImage').value = base64Image;
        
        const preview = document.getElementById('imagePreview');
        if (preview) {
            preview.src = base64Image;
            preview.style.display = 'block';
        }
        
        showMessage('Image uploaded successfully!', 'success');
    };
    
    reader.onerror = function() {
        showMessage('Failed to upload image', 'error');
    };
    
    reader.readAsDataURL(file);
}

function showAddForm() {
    document.getElementById('formTitle').textContent = 'Add New Product';
    document.getElementById('productForm').style.display = 'block';
    editingProductId = null;
    clearForm();
    document.getElementById('productForm').scrollIntoView({ behavior: 'smooth' });
}

function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    editingProductId = productId;
    document.getElementById('formTitle').textContent = 'Edit Product';
    document.getElementById('productForm').style.display = 'block';
    
    // Fill form with product data
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productBrand').value = product.brand;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productOriginalPrice').value = product.originalPrice || '';
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productRating').value = product.rating || '';
    document.getElementById('productReviews').value = product.reviews || '';
    document.getElementById('productImage').value = product.image || '';
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productInStock').checked = product.inStock;
    
    // Show image preview
    const preview = document.getElementById('imagePreview');
    if (preview && product.image) {
        preview.src = product.image;
        preview.style.display = 'block';
    }
    
    document.getElementById('productForm').scrollIntoView({ behavior: 'smooth' });
}

async function saveProduct(event) {
    event.preventDefault();
    console.log('💾 Saving product...');
    
    const formData = {
        name: document.getElementById('productName').value.trim(),
        brand: document.getElementById('productBrand').value.trim(),
        price: parseFloat(document.getElementById('productPrice').value),
        originalPrice: parseFloat(document.getElementById('productOriginalPrice').value) || 0,
        category: document.getElementById('productCategory').value,
        rating: parseFloat(document.getElementById('productRating').value) || 0,
        reviews: parseInt(document.getElementById('productReviews').value) || 0,
        image: document.getElementById('productImage').value,
        description: document.getElementById('productDescription').value.trim(),
        inStock: document.getElementById('productInStock').checked
    };
    
    // Validate required fields
    if (!formData.name || !formData.brand || !formData.price || !formData.category) {
        showMessage('Please fill all required fields', 'error');
        return;
    }
    
    try {
        let response;
        
        if (editingProductId) {
            console.log('Updating product:', editingProductId);
            response = await fetch(`/api/products/${editingProductId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
        } else {
            console.log('Creating new product');
            response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
        }
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Product saved:', result);
        
        showMessage(`Product ${editingProductId ? 'updated' : 'added'} successfully!`, 'success');
        cancelForm();
        loadProducts(); // Reload products
        
    } catch (error) {
        console.error('❌ Error saving product:', error);
        showMessage(`Failed to save product: ${error.message}`, 'error');
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    console.log('🗑️ Deleting product:', productId);
    
    try {
        const response = await fetch(`/api/products/${productId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Product deleted:', result);
        
        showMessage('Product deleted successfully!', 'success');
        loadProducts(); // Reload products
        
    } catch (error) {
        console.error('❌ Error deleting product:', error);
        showMessage(`Failed to delete product: ${error.message}`, 'error');
    }
}

function cancelForm() {
    document.getElementById('productForm').style.display = 'none';
    editingProductId = null;
    clearForm();
}

function clearForm() {
    document.getElementById('productId').value = '';
    document.getElementById('productName').value = '';
    document.getElementById('productBrand').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productOriginalPrice').value = '';
    document.getElementById('productCategory').value = '';
    document.getElementById('productRating').value = '';
    document.getElementById('productReviews').value = '';
    document.getElementById('productImage').value = '';
    document.getElementById('productDescription').value = '';
    document.getElementById('productInStock').checked = true;
    
    const preview = document.getElementById('imagePreview');
    if (preview) {
        preview.style.display = 'none';
        preview.src = '';
    }
}

function showMessage(message, type) {
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // Remove existing messages
    document.querySelectorAll('.message').forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `
        ${message}
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; margin-left: 10px; cursor: pointer; font-size: 18px;">×</button>
    `;
    
    // Insert at the top
    const container = document.querySelector('.admin-container');
    if (container) {
        container.insertBefore(messageDiv, container.firstChild);
    }
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentElement) {
            messageDiv.remove();
        }
    }, 5000);
}

console.log('✅ Admin script loaded successfully');
