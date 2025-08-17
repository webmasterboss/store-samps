// Complete, enhanced script.js with all features working
let allProducts = [];
let filteredProducts = [];
let selectedCategory = '';
let selectedSort = '';
let selectedPriceRange = '';
let searchTerm = '';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Page loaded, initializing...');
    initializeEventListeners();
    loadProducts();
});

// Load products from API
async function loadProducts() {
    console.log('📡 Loading products...');
    
    try {
        const loading = document.getElementById('loading');
        const grid = document.getElementById('productsGrid');
        const noProducts = document.getElementById('noProducts');
        
        if (loading) loading.style.display = 'block';
        
        const response = await fetch('/api/products');
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const products = await response.json();
        console.log('Products loaded:', products.length);
        
        allProducts = products;
        filteredProducts = [...products];
        
        displayProducts(filteredProducts);
        updateResultsCount();
        
        if (loading) loading.style.display = 'none';
        if (noProducts) noProducts.style.display = 'none';
        
    } catch (error) {
        console.error('❌ Error loading products:', error);
        handleLoadError(error);
    }
}

// Display products in grid
function displayProducts(products) {
    console.log('🎨 Displaying products:', products.length);
    
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    if (!products || products.length === 0) {
        grid.innerHTML = '<div class="no-products-message"><h3>No products found</h3><p>Try adjusting your filters</p></div>';
        return;
    }
    
    grid.innerHTML = products.map(product => `
        <div class="product-card" onclick="openProductModal(${product.id})" style="cursor: pointer;">
            <img src="${product.image}" 
                 alt="${product.name}" 
                 class="product-image"
                 onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+'; this.style.padding='20px';">
            
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-brand">${product.brand}</p>
                
                <div class="product-rating">
                    <span class="rating-badge">${product.rating} ⭐</span>
                    <span class="rating-count">(${product.reviews ? product.reviews.toLocaleString() : '0'})</span>
                </div>
                
                <div class="product-price">
                    <span class="current-price">₹${product.price.toLocaleString()}</span>
                    ${product.originalPrice && product.originalPrice > product.price ? `
                        <span class="original-price">₹${product.originalPrice.toLocaleString()}</span>
                        <span class="discount">${product.discount || 0}% off</span>
                    ` : ''}
                </div>
                
                <div class="product-features">
                    ${product.category}
                </div>
                
                <div class="stock-status ${product.inStock ? 'in-stock' : 'out-of-stock'}">
                    ${product.inStock ? '✅ In Stock' : '❌ Out of Stock'}
                </div>
            </div>
        </div>
    `).join('');
}

// Open product details modal
function openProductModal(productId) {
    console.log('🔍 Opening product modal for ID:', productId);
    
    const product = allProducts.find(p => p.id === productId);
    if (!product) {
        console.error('Product not found:', productId);
        return;
    }
    
    const modal = document.getElementById('productModal');
    const modalContent = document.getElementById('modalContent');
    
    if (!modal || !modalContent) {
        alert(`Product Details:\n\nName: ${product.name}\nBrand: ${product.brand}\nPrice: ₹${product.price.toLocaleString()}\nDescription: ${product.description || 'No description available'}`);
        return;
    }
    
    modalContent.innerHTML = `
        <div class="product-detail">
            <div class="product-detail-left">
                <img src="${product.image}" 
                     alt="${product.name}" 
                     class="product-detail-image"
                     onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';">
            </div>
            <div class="product-detail-right">
                <h2>${product.name}</h2>
                <p class="product-brand">by ${product.brand}</p>
                
                <div class="product-rating" style="margin: 12px 0;">
                    <span class="rating-badge">${product.rating} ⭐</span>
                    <span class="rating-count">(${product.reviews ? product.reviews.toLocaleString() : '0'} reviews)</span>
                </div>
                
                <div class="product-price" style="margin: 16px 0;">
                    <span class="current-price" style="font-size: 24px;">₹${product.price.toLocaleString()}</span>
                    ${product.originalPrice && product.originalPrice > product.price ? `
                        <span class="original-price">₹${product.originalPrice.toLocaleString()}</span>
                        <span class="discount">${product.discount || 0}% off</span>
                    ` : ''}
                </div>
                
                <p class="product-description" style="margin: 16px 0; line-height: 1.6;">
                    ${product.description || 'No description available for this product.'}
                </p>
                
                <div class="stock-status ${product.inStock ? 'in-stock' : 'out-of-stock'}" style="margin: 16px 0;">
                    ${product.inStock ? '✅ In Stock - Ready to ship' : '❌ Currently out of stock'}
                </div>
                
                ${product.specifications ? `
                    <div class="product-specs" style="margin: 20px 0;">
                        <h3>Specifications:</h3>
                        <table class="specs-table" style="width: 100%; border-collapse: collapse; margin-top: 8px;">
                            ${Object.entries(product.specifications).map(([key, value]) => `
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 8px; font-weight: bold; width: 40%;">${key}</td>
                                    <td style="padding: 8px;">${value}</td>
                                </tr>
                            `).join('')}
                        </table>
                    </div>
                ` : ''}
                
                <div style="margin-top: 24px;">
                    <button class="add-to-cart-btn" ${!product.inStock ? 'disabled' : ''} 
                            onclick="addToCart(${product.id})"
                            style="background: #ff9f00; color: white; border: none; padding: 12px 24px; border-radius: 4px; font-size: 16px; margin-right: 12px; cursor: pointer;">
                        ${product.inStock ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                    <button class="buy-now-btn" ${!product.inStock ? 'disabled' : ''} 
                            onclick="buyNow(${product.id})"
                            style="background: #fb641b; color: white; border: none; padding: 12px 24px; border-radius: 4px; font-size: 16px; cursor: pointer;">
                        ${product.inStock ? 'Buy Now' : 'Unavailable'}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Add to cart functionality
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        showNotification(`${product.name} added to cart!`, 'success');
        closeModal();
    }
}

// Buy now functionality
function buyNow(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        showNotification(`Proceeding to checkout for ${product.name}`, 'info');
        closeModal();
    }
}

// Apply all filters
function applyFilters() {
    console.log('🔧 Applying filters...', { selectedCategory, selectedSort, selectedPriceRange, searchTerm });
    
    let filtered = [...allProducts];
    
    // Apply search filter
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(product => 
            product.name.toLowerCase().includes(term) ||
            product.brand.toLowerCase().includes(term) ||
            product.category.toLowerCase().includes(term) ||
            (product.description && product.description.toLowerCase().includes(term))
        );
    }
    
    // Apply category filter
    if (selectedCategory) {
        filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    // Apply price range filter
    if (selectedPriceRange) {
        const [min, max] = selectedPriceRange.split('-').map(Number);
        filtered = filtered.filter(product => {
            if (max) {
                return product.price >= min && product.price <= max;
            } else {
                return product.price >= min;
            }
        });
    }
    
    // Apply sorting
    switch (selectedSort) {
        case 'price-low':
            filtered.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filtered.sort((a, b) => b.price - a.price);
            break;
        case 'rating':
            filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
        case 'newest':
            filtered.sort((a, b) => b.id - a.id);
            break;
    }
    
    filteredProducts = filtered;
    displayProducts(filteredProducts);
    updateResultsCount();
}

// Search functionality
function searchProducts() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchTerm = searchInput.value.trim();
        console.log('🔍 Searching for:', searchTerm);
        applyFilters();
    }
}

// Filter by category (top dropdown)
function filterProducts() {
    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');
    const priceFilter = document.getElementById('priceFilter');
    
    if (categoryFilter) selectedCategory = categoryFilter.value;
    if (sortFilter) selectedSort = sortFilter.value;
    if (priceFilter) selectedPriceRange = priceFilter.value;
    
    console.log('📊 Filter changed:', { selectedCategory, selectedSort, selectedPriceRange });
    applyFilters();
}

// Update results count
function updateResultsCount() {
    const resultsElement = document.getElementById('resultsCount');
    if (resultsElement) {
        const showing = filteredProducts.length;
        const total = allProducts.length;
        resultsElement.textContent = showing === total ? 
            `Showing all ${total} products` : 
            `Showing ${showing} of ${total} products`;
    }
}

// Initialize event listeners
function initializeEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchTerm = this.value.trim();
            applyFilters();
        });
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchProducts();
            }
        });
    }
    
    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterProducts);
    }
    
    // Sort filter
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        sortFilter.addEventListener('change', filterProducts);
    }
    
    // Price filter
    const priceFilter = document.getElementById('priceFilter');
    if (priceFilter) {
        priceFilter.addEventListener('change', filterProducts);
    }
    
    // Price range slider
    const priceRange = document.getElementById('priceRange');
    if (priceRange) {
        priceRange.addEventListener('input', function() {
            const maxPrice = this.value;
            selectedPriceRange = `0-${maxPrice}`;
            applyFilters();
            
            // Update label
            const priceLabels = document.querySelector('.price-labels');
            if (priceLabels) {
                const spans = priceLabels.querySelectorAll('span');
                if (spans.length >= 2) {
                    spans[1].textContent = `₹${parseInt(maxPrice).toLocaleString()}+`;
                }
            }
        });
    }
    
    // Sidebar checkboxes
    const categoryCheckboxes = document.querySelectorAll('.filter-options input[type="checkbox"]');
    categoryCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                selectedCategory = this.value;
                // Uncheck others
                categoryCheckboxes.forEach(cb => {
                    if (cb !== this) cb.checked = false;
                });
            } else {
                selectedCategory = '';
            }
            applyFilters();
        });
    });
    
    // Modal close events
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // Escape key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
    
    console.log('✅ Event listeners set up successfully');
}

// Handle load errors
function handleLoadError(error) {
    const loading = document.getElementById('loading');
    const noProducts = document.getElementById('noProducts');
    
    if (loading) loading.style.display = 'none';
    if (noProducts) {
        noProducts.style.display = 'block';
        noProducts.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h3>❌ Failed to load products</h3>
                <p>Error: ${error.message}</p>
                <button onclick="loadProducts()" style="background: #2874f0; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; margin-top: 16px;">
                    Try Again
                </button>
            </div>
        `;
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        font-size: 14px;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .product-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: all 0.3s ease;
    }
    
    .no-products-message {
        text-align: center;
        padding: 60px 20px;
        color: #666;
        grid-column: 1 / -1;
    }
`;
document.head.appendChild(style);

console.log('✅ Enhanced script loaded successfully');
