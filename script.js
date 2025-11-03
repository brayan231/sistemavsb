// Variables globales
let currentSaleItems = [];
let editingProductId = null;
let editingClientId = null;
let editingCategoryId = null;
let currentSaleId = null;
let selectedPaymentMethod = 'efectivo';
let isPartialPayment = false;
let selectedProducts = [];
let currentDiscount = null;
let allProducts = [];
let selectedProductForCart = null;

// Configuración de la API RENIEC
const API_CONFIG = {
    baseUrl: 'https://apiperu.dev/api',
    token: '3a451e42f184f40438d77992c710b41f39de11872984aebf33058276a75a46c6'
};

// CONFIGURACIÓN FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyCNPAq_JrdikWJBLWR5QYzo-U0PhV4vvxA",
    authDomain: "basededatos-b8f89.firebaseapp.com",
    databaseURL: "https://basededatos-b8f89-default-rtdb.firebaseio.com",
    projectId: "basededatos-b8f89",
    storageBucket: "basededatos-b8f89.firebasestorage.app",
    messagingSenderId: "1026805766467",
    appId: "1:1026805766467:web:16c5b1c8e8c4d42b4e37f6"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// === FUNCIONES FIREBASE ===
function getProducts() {
    return new Promise((resolve) => {
        database.ref('products').once('value', (snapshot) => {
            const data = snapshot.val();
            resolve(data ? Object.values(data) : []);
        });
    });
}

function saveProducts(products) {
    return database.ref('products').set(products);
}

function getClients() {
    return new Promise((resolve) => {
        database.ref('clients').once('value', (snapshot) => {
            const data = snapshot.val();
            resolve(data ? Object.values(data) : []);
        });
    });
}

function saveClients(clients) {
    return database.ref('clients').set(clients);
}

function getSales() {
    return new Promise((resolve) => {
        database.ref('sales').once('value', (snapshot) => {
            const data = snapshot.val();
            resolve(data ? Object.values(data) : []);
        });
    });
}

function saveSales(sales) {
    return database.ref('sales').set(sales);
}

function getCategories() {
    return new Promise((resolve) => {
        database.ref('categories').once('value', (snapshot) => {
            const data = snapshot.val();
            resolve(data ? Object.values(data) : []);
        });
    });
}

function saveCategories(categories) {
    return database.ref('categories').set(categories);
}

// === INICIALIZACIÓN ===
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando sistema...');
    
    initializeSystem().then(() => {
        setupNavigation();
        setupEventListeners();
        setupRealtimeUpdates();
        setupMobileMenu();
        initializePaymentMethods();
        setupNumericInputs();
        loadDiscountReasons();
        return loadInitialData();
    }).then(() => {
        console.log('✅ Sistema inicializado correctamente');
        setTimeout(() => {
            updateDashboardStats();
        }, 500);
    }).catch(error => {
        console.error('❌ Error inicializando sistema:', error);
        showAlert('Error al inicializar el sistema: ' + error.message, 'error');
    });
});

async function initializeSystem() {
    try {
        const products = await getProducts();
        const clients = await getClients();
        const sales = await getSales();
        const categories = await getCategories();
        
        if (products.length === 0 && clients.length === 0) {
            const initialData = {
                products: [
                    { id: 1, name: "Laptop HP 15\"", category: "Electrónicos", price: 450.00, cost: 350.00, stock: 12, minStock: 5, description: "Laptop HP" },
                    { id: 2, name: "Mouse Inalámbrico", category: "Electrónicos", price: 25.50, cost: 15.00, stock: 3, minStock: 10, description: "Mouse ergonómico" },
                    { id: 3, name: "Teclado Mecánico", category: "Electrónicos", price: 75.00, cost: 45.00, stock: 5, minStock: 8, description: "Teclado gaming" }
                ],
                clients: [
                    { id: 1, dni: "12345678", name: "Juan Pérez", email: "juan@example.com", phone: "555-1234", address: "Calle Principal 123", type: "regular" },
                    { id: 2, dni: "87654321", name: "María García", email: "maria@example.com", phone: "555-5678", address: "Av. Central 456", type: "premium" }
                ],
                sales: [],
                categories: [
                    { id: 1, name: "Electrónicos", description: "Productos electrónicos" },
                    { id: 2, name: "Ropa", description: "Prendas de vestir" },
                    { id: 3, name: "Hogar", description: "Artículos para el hogar" }
                ]
            };
            
            await saveProducts(initialData.products);
            await saveClients(initialData.clients);
            await saveSales(initialData.sales);
            await saveCategories(initialData.categories);
            
            showAlert('Sistema inicializado con datos de ejemplo', 'success');
        } else {
            showAlert('Sistema cargado correctamente desde Firebase', 'success');
        }
    } catch (error) {
        console.error('Error inicializando sistema:', error);
        showAlert('Error al cargar el sistema: ' + error.message, 'error');
    }
}

// === NAVEGACIÓN ===
function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            document.querySelector('.page-title h1').textContent = this.querySelector('span').textContent;
        });
    });
}

function showSection(section) {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(section + '-section');
    if (target) target.classList.remove('hidden');
    
    if (section === 'dashboard') {
        updateDashboardStats();
        loadPendingSalesDashboard();
    } else if (section === 'sales') {
        populateSaleSelects();
        loadProductsGrid();
    } else if (section === 'products') {
        loadProductsTable();
        loadProductsGrid();
    } else if (section === 'clients') {
        loadClientsTable();
    } else if (section === 'categories') {
        loadCategoriesTable();
    }
}

// === EVENT LISTENERS ===
function setupEventListeners() {
    console.log('🔧 Configurando event listeners...');
    
    // Productos
    document.getElementById('add-product-btn').addEventListener('click', showProductForm);
    document.querySelector('#product-modal .close-modal').addEventListener('click', hideProductForm);
    document.getElementById('cancel-product-btn').addEventListener('click', hideProductForm);
    document.getElementById('save-product-btn').addEventListener('click', saveProduct);

    // Clientes
    document.getElementById('add-client-btn').addEventListener('click', showClientForm);
    document.querySelector('#client-modal .close-modal').addEventListener('click', hideClientForm);
    document.getElementById('cancel-client-btn').addEventListener('click', hideClientForm);
    document.getElementById('save-client-btn').addEventListener('click', saveClient);
    
    // API RENIEC
    document.getElementById('search-dni-btn').addEventListener('click', searchDNI);
    setupDNIValidation();

    // Ventas
    setupSaleButtonListener();
    document.getElementById('clear-sale').addEventListener('click', clearCurrentSale);
    document.getElementById('add-selected-product').addEventListener('click', addSelectedProductToCart);

    // Categorías
    document.getElementById('add-category-btn').addEventListener('click', showCategoryForm);
    document.getElementById('save-category-btn').addEventListener('click', saveCategory);
    document.getElementById('cancel-category-btn').addEventListener('click', hideCategoryForm);
    document.querySelector('#category-modal .close-modal').addEventListener('click', hideCategoryForm);

    // Reportes
    document.getElementById('report-form').addEventListener('submit', function(e) {
        e.preventDefault();
        generateReport();
    });

    // Cerrar modales
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Pagos parciales
    document.getElementById('partial-payment-checkbox').addEventListener('change', togglePartialPayment);
    
    console.log('✅ Event listeners configurados correctamente');
}

// === FUNCIONES DE CATEGORÍAS COMPLETAS ===
async function loadCategoriesTable() {
    const categories = await getCategories();
    const products = await getProducts();
    const tbody = document.getElementById('categories-table-body');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (categories.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><i class="fas fa-tags"></i><p>No hay categorías registradas</p></td></tr>';
        return;
    }
    
    categories.forEach(category => {
        const productCount = products.filter(p => p.category === category.name).length;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${category.id}</td>
            <td><strong>${category.name}</strong></td>
            <td>${category.description || 'Sin descripción'}</td>
            <td><span class="badge badge-info">${productCount} productos</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-primary btn-sm" onclick="editCategory(${category.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteCategory(${category.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function showCategoryForm() {
    document.getElementById('category-form-title').textContent = 'Agregar Categoría';
    document.getElementById('category-name').value = '';
    document.getElementById('category-description').value = '';
    document.getElementById('category-modal').style.display = 'flex';
    editingCategoryId = null;
    
    setTimeout(() => {
        document.getElementById('category-name').focus();
    }, 100);
}

function hideCategoryForm() {
    document.getElementById('category-modal').style.display = 'none';
    editingCategoryId = null;
}

async function saveCategory() {
    const categories = await getCategories();
    const name = document.getElementById('category-name').value.trim();
    const description = document.getElementById('category-description').value.trim();
    
    if (!name) {
        showAlert('El nombre de la categoría es obligatorio', 'error');
        return;
    }
    
    if (!editingCategoryId) {
        const existingCategory = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
        if (existingCategory) {
            showAlert('Ya existe una categoría con este nombre', 'error');
            return;
        }
    } else {
        const existingCategory = categories.find(c => c.name.toLowerCase() === name.toLowerCase() && c.id !== editingCategoryId);
        if (existingCategory) {
            showAlert('Ya existe otra categoría con este nombre', 'error');
            return;
        }
    }
    
    if (editingCategoryId) {
        const index = categories.findIndex(c => c.id === editingCategoryId);
        const oldName = categories[index].name;
        categories[index] = { ...categories[index], name, description };
        
        const products = await getProducts();
        const updatedProducts = products.map(p => {
            if (p.category === oldName) {
                return { ...p, category: name };
            }
            return p;
        });
        
        await saveProducts(updatedProducts);
        await saveCategories(categories);
        
        showAlert('✅ Categoría actualizada correctamente', 'success');
    } else {
        const newId = categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1;
        categories.push({ id: newId, name, description });
        
        await saveCategories(categories);
        showAlert('✅ Categoría guardada correctamente', 'success');
    }
    
    hideCategoryForm();
    loadCategoriesTable();
    loadCategoriesIntoSelect('product-category');
    loadCategoriesIntoSelect('report-category');
}

async function editCategory(id) {
    const categories = await getCategories();
    const category = categories.find(c => c.id === id);
    
    if (category) {
        document.getElementById('category-name').value = category.name;
        document.getElementById('category-description').value = category.description || '';
        document.getElementById('category-form-title').textContent = 'Editar Categoría';
        document.getElementById('category-modal').style.display = 'flex';
        editingCategoryId = id;
        
        setTimeout(() => {
            document.getElementById('category-name').focus();
        }, 100);
    }
}

async function deleteCategory(id) {
    const categories = await getCategories();
    const products = await getProducts();
    const category = categories.find(c => c.id === id);
    
    if (!category) return;
    
    const productsWithCategory = products.filter(p => p.category === category.name);
    
    if (productsWithCategory.length > 0) {
        showAlert(`❌ No se puede eliminar la categoría "${category.name}" porque tiene ${productsWithCategory.length} producto(s) asociado(s)`, 'error');
        return;
    }
    
    if (confirm(`¿Está seguro de eliminar la categoría "${category.name}"?`)) {
        const updatedCategories = categories.filter(c => c.id !== id);
        await saveCategories(updatedCategories);
        
        showAlert('✅ Categoría eliminada correctamente', 'success');
        loadCategoriesTable();
        loadCategoriesIntoSelect('product-category');
        loadCategoriesIntoSelect('report-category');
    }
}

async function loadCategories() {
    const categories = await getCategories();
    loadCategoriesIntoSelect('product-category');
    loadCategoriesIntoSelect('report-category');
    await loadCategoriesTable();
}

function loadCategoriesIntoSelect(selectId) {
    getCategories().then(categories => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        const currentValue = select.value;
        const defaultOption = select.options[0];
        select.innerHTML = '';
        
        if (defaultOption) {
            select.appendChild(defaultOption);
        } else {
            select.innerHTML = '<option value="">Seleccione categoría</option>';
        }
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name;
            select.appendChild(option);
        });
        
        if (currentValue) {
            select.value = currentValue;
        }
    });
}

// === FUNCIONES DE DESCUENTOS CORREGIDAS ===
function loadDiscountReasons() {
    const reasons = [
        "Cliente frecuente",
        "Promoción especial", 
        "Compra al por mayor",
        "Daño en empaque",
        "Producto de exhibición",
        "Pago en efectivo",
        "Primera compra",
        "Temporada baja",
        "Otro (especificar)"
    ];
    
    const select = document.getElementById('discount-reason');
    select.innerHTML = '<option value="">Seleccione motivo</option>';
    
    reasons.forEach(reason => {
        const option = document.createElement('option');
        option.value = reason;
        option.textContent = reason;
        select.appendChild(option);
    });
}

function handleDiscountReasonChange() {
    const reason = document.getElementById('discount-reason').value;
    const customContainer = document.getElementById('custom-reason-container');
    
    if (reason === 'Otro (especificar)') {
        customContainer.classList.remove('hidden');
    } else {
        customContainer.classList.add('hidden');
    }
}

function toggleDiscountSection() {
    console.log('🔄 Toggle discount section');
    const applyDiscount = document.getElementById('apply-discount-checkbox').checked;
    const discountControls = document.getElementById('discount-controls');
    
    if (applyDiscount) {
        discountControls.classList.remove('hidden');
        console.log('✅ Sección de descuento mostrada');
    } else {
        if (!currentDiscount) {
            discountControls.classList.add('hidden');
            console.log('❌ Sección de descuento ocultada');
        } else {
            if (confirm('¿Desea quitar el descuento aplicado?')) {
                clearDiscount();
                discountControls.classList.add('hidden');
            } else {
                document.getElementById('apply-discount-checkbox').checked = true;
            }
        }
    }
}

function updateDiscountCalculation() {
    const discountType = document.getElementById('discount-type').value;
    const discountAmount = parseFloat(document.getElementById('discount-amount').value) || 0;
    const subtotal = currentSaleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    let discountValue = 0;
    
    if (discountType === 'percentage') {
        discountValue = subtotal * (discountAmount / 100);
        document.getElementById('discount-amount-label').textContent = 'Descuento (%)';
    } else {
        discountValue = Math.min(discountAmount, subtotal);
        document.getElementById('discount-amount-label').textContent = 'Descuento (S/)';
    }
    
    const total = subtotal - discountValue;
    
    const preview = document.getElementById('discount-preview');
    if (subtotal > 0 && discountAmount > 0) {
        preview.classList.remove('hidden');
        document.getElementById('preview-subtotal').textContent = subtotal.toFixed(2);
        document.getElementById('preview-discount').textContent = discountValue.toFixed(2);
        document.getElementById('preview-total').textContent = total.toFixed(2);
    } else {
        preview.classList.add('hidden');
    }
}

function applyDiscount() {
    console.log('🎯 Aplicando descuento...');
    
    const discountType = document.getElementById('discount-type').value;
    const discountAmount = parseFloat(document.getElementById('discount-amount').value) || 0;
    const reasonSelect = document.getElementById('discount-reason');
    let reason = reasonSelect.value;
    
    if (reason === 'Otro (especificar)') {
        reason = document.getElementById('custom-discount-reason').value.trim();
    }
    
    if (!reason) {
        showAlert('❌ Seleccione o especifique un motivo para el descuento', 'error');
        return;
    }
    
    if (discountAmount <= 0) {
        showAlert('❌ Ingrese un monto de descuento válido mayor a 0', 'error');
        return;
    }
    
    const subtotal = currentSaleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (subtotal === 0) {
        showAlert('❌ No hay productos en la venta para aplicar descuento', 'error');
        return;
    }
    
    if (discountType === 'percentage' && discountAmount > 100) {
        showAlert('❌ El porcentaje no puede ser mayor a 100%', 'error');
        return;
    }
    
    let discountValue = 0;
    if (discountType === 'percentage') {
        discountValue = subtotal * (discountAmount / 100);
    } else {
        if (discountAmount > subtotal) {
            showAlert('❌ El descuento no puede ser mayor al subtotal', 'error');
            return;
        }
        discountValue = discountAmount;
    }
    
    currentDiscount = {
        type: discountType,
        amount: discountAmount,
        reason: reason,
        value: discountValue
    };
    
    console.log('✅ Descuento guardado:', currentDiscount);
    
    updateSaleTotals();
    
    const mensaje = discountType === 'percentage' 
        ? `✅ Descuento del ${discountAmount}% aplicado (-S/${discountValue.toFixed(2)})`
        : `✅ Descuento de S/${discountAmount.toFixed(2)} aplicado`;
    
    showAlert(mensaje, 'success');
    
    document.getElementById('discount-type').disabled = true;
    document.getElementById('discount-amount').disabled = true;
    document.getElementById('discount-reason').disabled = true;
    const customReasonInput = document.getElementById('custom-discount-reason');
    if (customReasonInput) {
        customReasonInput.disabled = true;
    }
    
    const discountActions = document.querySelector('.discount-actions');
    if (discountActions) {
        discountActions.innerHTML = `
            <button type="button" class="btn btn-warning btn-sm" onclick="modifyDiscount()">
                <i class="fas fa-edit"></i> Modificar Descuento
            </button>
            <button type="button" class="btn btn-danger btn-sm" onclick="removeDiscount()">
                <i class="fas fa-trash"></i> Quitar Descuento
            </button>
        `;
    }
    
    console.log('✅ Descuento aplicado. Sección visible.');
}

function clearDiscount() {
    console.log('🧹 Limpiando descuento...');
    
    currentDiscount = null;
    updateSaleTotals();
    
    document.getElementById('discount-amount').value = '0';
    document.getElementById('discount-reason').value = '';
    document.getElementById('custom-discount-reason').value = '';
    document.getElementById('custom-reason-container').classList.add('hidden');
    document.getElementById('discount-preview').classList.add('hidden');
    
    document.getElementById('discount-type').disabled = false;
    document.getElementById('discount-amount').disabled = false;
    document.getElementById('discount-reason').disabled = false;
    document.getElementById('custom-discount-reason').disabled = false;
    
    const discountActions = document.querySelector('.discount-actions');
    if (discountActions) {
        discountActions.innerHTML = `
            <button type="button" class="btn btn-success btn-sm" onclick="applyDiscount()">
                <i class="fas fa-check"></i> Aplicar Descuento
            </button>
            <button type="button" class="btn btn-danger btn-sm" onclick="cancelDiscount()">
                <i class="fas fa-times"></i> Cancelar
            </button>
        `;
    }
    
    console.log('✅ Descuento limpiado');
}

function cancelDiscount() {
    console.log('❌ Cancelando descuento...');
    clearDiscount();
    document.getElementById('apply-discount-checkbox').checked = false;
    document.getElementById('discount-controls').classList.add('hidden');
}

function modifyDiscount() {
    console.log('✏️ Modificando descuento...');
    
    document.getElementById('discount-type').disabled = false;
    document.getElementById('discount-amount').disabled = false;
    document.getElementById('discount-reason').disabled = false;
    document.getElementById('custom-discount-reason').disabled = false;
    
    const discountActions = document.querySelector('.discount-actions');
    if (discountActions) {
        discountActions.innerHTML = `
            <button type="button" class="btn btn-success btn-sm" onclick="applyDiscount()">
                <i class="fas fa-check"></i> Aplicar Descuento
            </button>
            <button type="button" class="btn btn-danger btn-sm" onclick="cancelDiscount()">
                <i class="fas fa-times"></i> Cancelar
            </button>
        `;
    }
    
    showAlert('✏️ Ahora puede modificar el descuento', 'info');
}

function removeDiscount() {
    if (confirm('¿Está seguro de quitar el descuento aplicado?')) {
        clearDiscount();
        document.getElementById('apply-discount-checkbox').checked = false;
        document.getElementById('discount-controls').classList.add('hidden');
        showAlert('✅ Descuento removido correctamente', 'success');
    }
}

// === CONFIGURACIÓN DE BOTONES DE VENTA ===
function setupSaleButtonListener() {
    console.log('🛒 Configurando botones de venta...');
    
    const addButton = document.getElementById('add-selected-product');
    const newAddButton = addButton.cloneNode(true);
    addButton.parentNode.replaceChild(newAddButton, addButton);
    document.getElementById('add-selected-product').addEventListener('click', addSelectedProductToCart);
    
    console.log('✅ Botones de venta configurados correctamente');
}

// === FUNCIONES DE CARGA DE DATOS ===
async function loadInitialData() {
    console.log('📊 Cargando datos iniciales...');
    
    try {
        await loadProductsTable();
        await loadProductsGrid();
        await loadClientsTable();
        await loadSalesHistory();
        await populateSaleSelects();
        await loadRecentSales();
        await updateDashboardStats();
        await loadCategories();
        await loadCategoriesTable();
        
        console.log('✅ Datos iniciales cargados');
    } catch (error) {
        console.error('❌ Error cargando datos iniciales:', error);
        throw error;
    }
}

// === FUNCIONES DE PRODUCTOS ===
async function loadProductsTable() {
    const products = await getProducts();
    const tbody = document.getElementById('products-table-body');
    tbody.innerHTML = '';
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-box-open"></i><p>No hay productos</p></td></tr>';
        return;
    }
    
    products.forEach(product => {
        const statusClass = product.stock === 0 ? 'badge-danger' : 
                          product.stock <= product.minStock ? 'badge-warning' : 'badge-success';
        const statusText = product.stock === 0 ? 'Sin Stock' : 
                         product.stock <= product.minStock ? 'Bajo' : 'Disponible';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>S/${product.price.toFixed(2)}</td>
            <td>${product.stock}</td>
            <td><span class="badge ${statusClass}">${statusText}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-primary btn-sm" onclick="editProduct(${product.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProduct(${product.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function loadProductsGrid() {
    const products = await getProducts();
    allProducts = products;
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';
    
    if (products.length === 0) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>No hay productos disponibles</p></div>';
        return;
    }
    
    products.filter(p => p.stock > 0).forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.setAttribute('data-product-id', product.id);
        productCard.setAttribute('data-product-name', product.name.toLowerCase());
        productCard.setAttribute('data-product-category', product.category.toLowerCase());
        
        productCard.innerHTML = `
            <div class="product-card-inner">
                <div class="product-image">
                    <i class="fas fa-box"></i>
                </div>
                <div class="product-info">
                    <h4 class="product-name">${product.name}</h4>
                    <p class="product-category">${product.category}</p>
                    <p class="product-price">S/${product.price.toFixed(2)}</p>
                    <p class="product-stock">Stock: ${product.stock}</p>
                </div>
                <button class="btn btn-primary btn-sm add-to-cart-btn" onclick="selectProductForCart(${product.id})">
                    <i class="fas fa-cart-plus"></i> Agregar
                </button>
            </div>
        `;
        grid.appendChild(productCard);
    });
}

function filterProducts() {
    const searchTerm = document.getElementById('product-search-input').value.toLowerCase();
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        const productName = card.getAttribute('data-product-name');
        const productCategory = card.getAttribute('data-product-category');
        
        if (productName.includes(searchTerm) || productCategory.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function selectProductForCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    selectedProductForCart = product;
    
    document.getElementById('quantity-controls').classList.remove('hidden');
    document.getElementById('selected-product-name').textContent = product.name;
    document.getElementById('selected-product-price').textContent = `S/${product.price.toFixed(2)}`;
    document.getElementById('selected-product-stock').textContent = `Stock disponible: ${product.stock}`;
    document.getElementById('visual-sale-quantity').value = 1;
    document.getElementById('quantity-controls').scrollIntoView({ behavior: 'smooth' });
}

function adjustQuantity(change) {
    const quantityInput = document.getElementById('visual-sale-quantity');
    let quantity = parseInt(quantityInput.value) || 1;
    quantity += change;
    
    if (quantity < 1) quantity = 1;
    if (selectedProductForCart && quantity > selectedProductForCart.stock) {
        quantity = selectedProductForCart.stock;
        showAlert(`No hay suficiente stock. Máximo disponible: ${selectedProductForCart.stock} unidades`, 'error');
    }
    
    quantityInput.value = quantity;
}

function addSelectedProductToCart() {
    if (!selectedProductForCart) {
        showAlert('❌ No hay producto seleccionado', 'error');
        return;
    }
    
    const quantity = parseInt(document.getElementById('visual-sale-quantity').value) || 1;
    
    if (quantity <= 0) {
        showAlert('❌ La cantidad debe ser mayor a 0', 'error');
        return;
    }
    
    if (quantity > selectedProductForCart.stock) {
        showAlert(`❌ Stock insuficiente. Solo hay ${selectedProductForCart.stock} unidades disponibles`, 'error');
        return;
    }
    
    const existingIndex = currentSaleItems.findIndex(item => item.productId === selectedProductForCart.id);
    
    if (existingIndex !== -1) {
        const newQuantity = currentSaleItems[existingIndex].quantity + quantity;
        if (newQuantity > selectedProductForCart.stock) {
            showAlert(`❌ No hay suficiente stock. Máximo disponible: ${selectedProductForCart.stock} unidades`, 'error');
            return;
        }
        currentSaleItems[existingIndex].quantity = newQuantity;
    } else {
        currentSaleItems.push({
            productId: selectedProductForCart.id,
            name: selectedProductForCart.name,
            price: selectedProductForCart.price,
            quantity: quantity
        });
    }
    
    updateCartDisplay();
    updateSaleTotals();
    showAlert(`✅ ${selectedProductForCart.name} agregado al carrito`, 'success');
    document.getElementById('quantity-controls').classList.add('hidden');
    selectedProductForCart = null;
}

// === CARRITO DE COMPRAS VISUAL ===
function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    const emptyCart = document.getElementById('empty-cart');
    
    if (currentSaleItems.length === 0) {
        cartItems.innerHTML = '';
        emptyCart.classList.remove('hidden');
        return;
    }
    
    emptyCart.classList.add('hidden');
    cartItems.innerHTML = '';
    
    currentSaleItems.forEach((item, index) => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-image">
                    <i class="fas fa-box"></i>
                </div>
                <div class="cart-item-details">
                    <h5>${item.name}</h5>
                    <p>S/${item.price.toFixed(2)} x ${item.quantity} = S/${(item.price * item.quantity).toFixed(2)}</p>
                </div>
            </div>
            <div class="cart-item-actions">
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateCartItemQuantity(${index}, -1)">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateCartItemQuantity(${index}, 1)">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <button class="btn btn-danger btn-sm" onclick="removeFromCart(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });
}

function updateCartItemQuantity(index, change) {
    const product = allProducts.find(p => p.id === currentSaleItems[index].productId);
    if (!product) return;
    
    const newQuantity = currentSaleItems[index].quantity + change;
    
    if (newQuantity < 1) {
        removeFromCart(index);
        return;
    }
    
    if (newQuantity > product.stock) {
        showAlert(`❌ No hay suficiente stock. Máximo disponible: ${product.stock} unidades`, 'error');
        return;
    }
    
    currentSaleItems[index].quantity = newQuantity;
    updateCartDisplay();
    updateSaleTotals();
}

function removeFromCart(index) {
    currentSaleItems.splice(index, 1);
    updateCartDisplay();
    updateSaleTotals();
    showAlert('Producto removido del carrito', 'success');
}

// === FUNCIONES DE VENTAS - ACTUALIZAR TOTALES ===
function updateSaleTotals() {
    console.log('📊 Actualizando totales...');
    
    let subtotal = 0;
    
    currentSaleItems.forEach(item => {
        subtotal += item.price * item.quantity;
    });
    
    console.log('Subtotal:', subtotal);
    
    let discountAmount = 0;
    if (currentDiscount) {
        if (currentDiscount.type === 'percentage') {
            discountAmount = subtotal * (currentDiscount.amount / 100);
        } else {
            discountAmount = currentDiscount.amount;
        }
        discountAmount = Math.min(discountAmount, subtotal);
        console.log('Descuento aplicado:', discountAmount);
    }
    
    const total = subtotal - discountAmount;
    console.log('Total final:', total);
    
    document.getElementById('sale-subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('sale-total').textContent = total.toFixed(2);
    
    const discountRow = document.querySelector('.discount-row');
    if (currentDiscount && discountAmount > 0) {
        if (discountRow) {
            discountRow.style.display = 'flex';
            document.getElementById('sale-discount').textContent = discountAmount.toFixed(2);
            console.log('✅ Fila de descuento VISIBLE');
        }
    } else {
        if (discountRow) {
            discountRow.style.display = 'none';
            console.log('❌ Fila de descuento oculta');
        }
    }
    
    updatePaymentCalculations();
    console.log('✅ Totales actualizados');
}

// === FUNCIONES DE PAGOS PARCIALES ===
function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    
    document.querySelectorAll('.payment-method').forEach(el => {
        el.classList.remove('selected');
    });
    
    const methodElement = document.querySelector(`[data-method="${method}"]`);
    if (methodElement) {
        methodElement.classList.add('selected');
    }
}

function initializePaymentMethods() {
    selectPaymentMethod('efectivo');
    
    document.querySelectorAll('.payment-method').forEach(method => {
        method.addEventListener('click', function() {
            const methodType = this.getAttribute('data-method');
            selectPaymentMethod(methodType);
        });
    });
}

function togglePartialPayment() {
    isPartialPayment = document.getElementById('partial-payment-checkbox').checked;
    const partialSection = document.getElementById('partial-payment-section');
    const normalSection = document.getElementById('normal-payment-section');
    
    if (isPartialPayment) {
        partialSection.classList.remove('hidden');
        normalSection.classList.add('hidden');
        updateProductSelectionList();
    } else {
        partialSection.classList.add('hidden');
        normalSection.classList.remove('hidden');
    }
    
    updatePaymentCalculations();
}

function updateProductSelectionList() {
    const container = document.getElementById('product-selection-list');
    container.innerHTML = '';
    
    if (currentSaleItems.length === 0) {
        container.innerHTML = '<p class="empty-state">No hay productos en la venta</p>';
        return;
    }
    
    currentSaleItems.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        const checkbox = document.createElement('div');
        checkbox.className = 'product-checkbox';
        checkbox.innerHTML = `
            <input type="checkbox" id="product-${index}" onchange="updateSelectedProducts(${index})" checked>
            <label for="product-${index}" style="flex: 1;">
                <strong>${item.name}</strong> - ${item.quantity} x S/${item.price.toFixed(2)} = S/${itemTotal.toFixed(2)}
            </label>
        `;
        container.appendChild(checkbox);
    });
    
    selectedProducts = currentSaleItems.map((item, index) => index);
    updateSelectedTotal();
}

function updateSelectedProducts(index) {
    const checkbox = document.getElementById(`product-${index}`);
    
    if (checkbox.checked) {
        if (!selectedProducts.includes(index)) {
            selectedProducts.push(index);
        }
    } else {
        selectedProducts = selectedProducts.filter(i => i !== index);
    }
    
    updateSelectedTotal();
}

function updateSelectedTotal() {
    let selectedTotal = 0;
    
    selectedProducts.forEach(index => {
        const item = currentSaleItems[index];
        selectedTotal += item.price * item.quantity;
    });
    
    document.getElementById('selected-total').textContent = selectedTotal.toFixed(2);
    document.getElementById('payment-amount').value = selectedTotal.toFixed(2);
    calculateRemaining();
}

function calculateRemaining() {
    const selectedTotalText = document.getElementById('selected-total').textContent;
    const paymentAmountInput = document.getElementById('payment-amount').value;
    
    const selectedTotal = parseFloat(selectedTotalText) || 0;
    const paymentAmount = parseFloat(paymentAmountInput) || 0;
    
    const change = Math.max(0, paymentAmount - selectedTotal);
    const pending = Math.max(0, selectedTotal - paymentAmount);
    
    document.getElementById('entered-amount').textContent = paymentAmount.toFixed(2);
    document.getElementById('change-amount').textContent = change.toFixed(2);
    document.getElementById('pending-amount').textContent = pending.toFixed(2);
}

function calculateChange() {
    const totalText = document.getElementById('sale-total').textContent;
    const amountReceivedInput = document.getElementById('amount-received').value;
    
    const total = parseFloat(totalText) || 0;
    const amountReceived = parseFloat(amountReceivedInput) || 0;
    
    const change = Math.max(0, amountReceived - total);
    document.getElementById('normal-change').textContent = change.toFixed(2);
    
    if (amountReceivedInput === '') {
        document.getElementById('normal-change').textContent = '0.00';
    }
}

function updatePaymentCalculations() {
    if (isPartialPayment) {
        calculateRemaining();
    } else {
        calculateChange();
    }
}

// === FUNCIÓN COMPLETA PARA FINALIZAR VENTA ===
async function completeSale() {
    console.log('💰 Ejecutando completeSale...');
    
    const clientId = parseInt(document.getElementById('sale-client').value);
    
    if (!clientId) {
        showAlert('❌ Seleccione un cliente', 'error');
        return;
    }
    
    if (currentSaleItems.length === 0) {
        showAlert('❌ No hay productos en el carrito', 'error');
        return;
    }
    
    try {
        const clients = await getClients();
        const products = await getProducts();
        const sales = await getSales();
        
        const client = clients.find(c => c.id === clientId);
        if (!client) {
            showAlert('❌ Cliente no encontrado', 'error');
            return;
        }
        
        let subtotal = currentSaleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        let discountAmount = 0;
        
        if (currentDiscount) {
            if (currentDiscount.type === 'percentage') {
                discountAmount = subtotal * (currentDiscount.amount / 100);
            } else {
                discountAmount = currentDiscount.amount;
            }
            discountAmount = Math.min(discountAmount, subtotal);
        }
        
        const total = subtotal - discountAmount;
        
        const saleData = {
            id: sales.length > 0 ? Math.max(...sales.map(s => s.id)) + 1 : 1,
            clientId: clientId,
            clientName: client.name,
            items: currentSaleItems.map(item => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                total: item.price * item.quantity
            })),
            subtotal: subtotal,
            discount: currentDiscount ? {
                type: currentDiscount.type,
                amount: currentDiscount.amount,
                value: discountAmount,
                reason: currentDiscount.reason
            } : null,
            total: total,
            date: new Date().toLocaleDateString('es-PE'),
            paymentMethod: selectedPaymentMethod
        };
        
        if (isPartialPayment && selectedProducts.length > 0) {
            const selectedTotal = selectedProducts.reduce((sum, index) => {
                const item = currentSaleItems[index];
                return sum + (item.price * item.quantity);
            }, 0);
            
            const paymentAmount = parseFloat(document.getElementById('payment-amount').value) || 0;
            const paidAmount = Math.min(paymentAmount, selectedTotal);
            const pendingAmount = selectedTotal - paidAmount;
            
            if (paidAmount <= 0) {
                showAlert('❌ Ingrese un monto de pago válido', 'error');
                return;
            }
            
            saleData.isPartialPayment = true;
            saleData.status = 'Separado';
            saleData.paidAmount = paidAmount;
            saleData.pendingAmount = pendingAmount;
            saleData.selectedProducts = selectedProducts.map(index => currentSaleItems[index].productId);
            
        } else {
            const amountReceived = parseFloat(document.getElementById('amount-received').value) || total;
            
            if (amountReceived < total) {
                showAlert('❌ El monto recibido no cubre el total de la venta', 'error');
                return;
            }
            
            saleData.isPartialPayment = false;
            saleData.status = 'Pagado';
            saleData.paidAmount = total;
            saleData.pendingAmount = 0;
            
            await updateStockForSale(currentSaleItems, products);
        }
        
        sales.push(saleData);
        await saveSales(sales);
        
        await showSaleReceipt(saleData.id);
        clearCurrentSale();
        loadSalesHistory();
        loadRecentSales();
        updateDashboardStats();
        
        showAlert('✅ Venta registrada correctamente', 'success');
        
    } catch (error) {
        console.error('❌ Error al finalizar venta:', error);
        showAlert('❌ Error al finalizar venta: ' + error.message, 'error');
    }
}

async function updateStockForSale(saleItems, products) {
    const updatedProducts = products.map(product => {
        const saleItem = saleItems.find(item => item.productId === product.id);
        if (saleItem) {
            return {
                ...product,
                stock: product.stock - saleItem.quantity
            };
        }
        return product;
    });
    
    await saveProducts(updatedProducts);
    console.log('📊 Stock actualizado correctamente');
}

function clearCurrentSale() {
    // Limpieza directa sin confirmación ni validación
    currentSaleItems = [];
    selectedProducts = [];
    selectedProductForCart = null;
    currentDiscount = null;
    
    document.getElementById('sale-client').value = '';
    document.getElementById('partial-payment-checkbox').checked = false;
    document.getElementById('amount-received').value = '';
    document.getElementById('payment-amount').value = '';
    document.getElementById('apply-discount-checkbox').checked = false;
    document.getElementById('discount-amount').value = '0';
    document.getElementById('discount-reason').value = '';
    
    togglePartialPayment();
    toggleDiscountSection();
    updateCartDisplay();
    updateSaleTotals();
    document.getElementById('quantity-controls').classList.add('hidden');
    
    // Sin ningún showAlert tampoco
}

// === FUNCIONES DE UTILIDAD ===
function setupNumericInputs() {
    // Configurar inputs numéricos si es necesario
}

function setupRealtimeUpdates() {
    database.ref('products').on('value', () => {
        loadProductsTable();
        loadProductsGrid();
        populateSaleSelects();
        updateDashboardStats();
    });
    
    database.ref('clients').on('value', () => {
        loadClientsTable();
        populateSaleSelects();
        updateDashboardStats();
    });
    
    database.ref('sales').on('value', () => {
        loadSalesHistory();
        loadRecentSales();
        updateDashboardStats();
    });
}

function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type === 'error' ? 'error' : 'success'}`;
    alert.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${message}
    `;
    
    const container = document.querySelector('.content-container');
    container.insertBefore(alert, container.firstChild);
    
    setTimeout(() => alert.remove(), 4000);
}

function setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    function toggleSidebar() {
        sidebar.classList.toggle('active');
        sidebarOverlay.classList.toggle('active');
        document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
    }

    function closeSidebar() {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }

    sidebarOverlay.addEventListener('click', closeSidebar);

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 1024) {
                closeSidebar();
            }
        });
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 1024) {
            closeSidebar();
        }
    });
}

async function clearAllSalesHistory() {
    const sales = await getSales();
    
    if (sales.length === 0) {
        showAlert('No hay ventas en el historial', 'info');
        return;
    }
    
    if (confirm(`¿Está COMPLETAMENTE SEGURO de eliminar TODAS las ${sales.length} ventas del historial?\n\n⚠️ ADVERTENCIA: Esta acción eliminará todo el historial y reiniciará el contador a #0001.\n\n¡ESTA ACCIÓN NO SE PUEDE DESHACER!`)) {
        if (confirm('🔴 ÚLTIMA CONFIRMACIÓN:\n\n¿Realmente desea borrar TODO el historial de ventas?\n\nEscriba "SI" en su mente y presione Aceptar para continuar.')) {
            await saveSales([]);
            showAlert('✅ Historial de ventas eliminado completamente. El contador se reinició a #0001', 'success');
            setTimeout(() => {
                updateDashboardStats();
            }, 500);
        }
    }
}

// === FUNCIONES PARA COMPLETAR PAGOS PENDIENTES ===
async function completePendingPayment(saleId) {
    const sales = await getSales();
    const clients = await getClients();
    const products = await getProducts();
    
    const sale = sales.find(s => s.id === saleId);
    if (!sale) {
        showAlert('Venta no encontrada', 'error');
        return;
    }
    
    if (sale.status !== 'Separado') {
        showAlert('Esta venta ya está pagada', 'info');
        return;
    }
    
    const client = clients.find(c => c.id === sale.clientId);
    const remainingAmount = sale.pendingAmount;
    
    if (confirm(`¿Completar el pago pendiente de ${client.name}?\n\nSaldo pendiente: S/ ${remainingAmount.toFixed(2)}\nTotal original: S/ ${sale.total.toFixed(2)}`)) {
        
        const updatedSales = sales.map(s => {
            if (s.id === saleId) {
                return {
                    ...s,
                    paidAmount: s.total,
                    pendingAmount: 0,
                    status: 'Pagado',
                    paymentDate: new Date().toLocaleDateString('es-PE')
                };
            }
            return s;
        });
        
        const updatedProducts = products.map(product => {
            const saleItem = sale.items.find(item => item.productId === product.id);
            if (saleItem) {
                const newStock = product.stock - saleItem.quantity;
                return { 
                    ...product, 
                    stock: newStock 
                };
            }
            return product;
        });
        
        await saveSales(updatedSales);
        await saveProducts(updatedProducts);
        
        showAlert(`✅ Pago completado exitosamente. Stock actualizado.`, 'success');
        
        loadSalesHistory();
        loadRecentSales();
        updateDashboardStats();
        loadPendingSalesDashboard();
        closePendingPaymentModal();
    }
}

async function showPendingSaleDetails(saleId) {
    const sales = await getSales();
    const clients = await getClients();
    const sale = sales.find(s => s.id === saleId);
    const client = clients.find(c => c.id === sale.clientId);
    
    if (!sale || sale.status !== 'Separado') return;
    
    const modalHTML = `
        <div class="modal" id="pending-payment-modal">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-money-bill-wave"></i> Completar Pago Pendiente</h3>
                        <button class="btn-close close-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="sale-details">
                            <h4>Detalles de la Separación</h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <label>Cliente:</label>
                                    <span>${client.name}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Fecha de Separación:</label>
                                    <span>${sale.date}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Total:</label>
                                    <span>S/ ${sale.total.toFixed(2)}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Adelanto Pagado:</label>
                                    <span>S/ ${sale.paidAmount.toFixed(2)}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Saldo Pendiente:</label>
                                    <span class="pending-amount">S/ ${sale.pendingAmount.toFixed(2)}</span>
                                </div>
                                <div class="detail-item">
                                    <label>Método de Pago Original:</label>
                                    <span>${sale.paymentMethod.toUpperCase()}</span>
                                </div>
                            </div>
                            
                            <h5>Productos Separados</h5>
                            <div class="table-responsive">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th>Cantidad</th>
                                            <th>Precio Unit.</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${sale.items.map(item => `
                                            <tr>
                                                <td>${item.name}</td>
                                                <td>${item.quantity}</td>
                                                <td>S/ ${item.price.toFixed(2)}</td>
                                                <td>S/ ${item.total.toFixed(2)}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-success" onclick="completePendingPayment(${saleId})">
                            <i class="fas fa-check-circle"></i> Completar Pago
                        </button>
                        <button class="btn btn-danger" onclick="closePendingPaymentModal()">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    if (!document.getElementById('pending-payment-modal')) {
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    document.getElementById('pending-payment-modal').style.display = 'flex';
    setupModalClose('pending-payment-modal');
}

function closePendingPaymentModal() {
    const modal = document.getElementById('pending-payment-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function setupModalClose(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
}

async function loadPendingSalesDashboard() {
    const sales = await getSales();
    const clients = await getClients();
    const pendingSales = sales.filter(s => s.status === 'Separado');
    
    const container = document.getElementById('pending-sales-list');
    if (!container) return;
    
    if (pendingSales.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle"></i><p>No hay ventas pendientes</p></div>';
        return;
    }
    
    container.innerHTML = pendingSales.map(sale => {
        const client = clients.find(c => c.id === sale.clientId);
        return `
            <div class="pending-sale-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee; margin-bottom: 8px;">
                <div style="flex: 1;">
                    <strong>#${sale.id.toString().padStart(4, '0')} - ${client ? client.name : 'Cliente no encontrado'}</strong>
                    <br>
                    <small style="color: #666;">Total: S/ ${sale.total.toFixed(2)} | Pendiente: S/ ${sale.pendingAmount.toFixed(2)}</small>
                    <br>
                    <small style="color: #888;">Fecha: ${sale.date}</small>
                </div>
                <div style="display: flex; gap: 5px;">
                    <button class="btn btn-primary btn-sm" onclick="showSaleReceipt(${sale.id})">
                        <i class="fas fa-receipt"></i>
                    </button>
                    <button class="btn btn-success btn-sm" onclick="showPendingSaleDetails(${sale.id})">
                        <i class="fas fa-money-bill-wave"></i> Pagar
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// === FUNCIONES DE MODALES Y FORMULARIOS ===
function showProductForm() {
    document.getElementById('product-form-title').textContent = 'Agregar Producto';
    document.getElementById('product-name').value = '';
    document.getElementById('product-category').value = '';
    document.getElementById('product-price').value = '';
    document.getElementById('product-stock').value = '0';
    document.getElementById('product-cost').value = '';
    document.getElementById('product-min-stock').value = '5';
    document.getElementById('product-description').value = '';
    document.getElementById('product-modal').style.display = 'flex';
    editingProductId = null;
    loadCategoriesIntoSelect('product-category');
}

function hideProductForm() {
    document.getElementById('product-modal').style.display = 'none';
    editingProductId = null;
}

async function saveProduct() {
    const products = await getProducts();
    const name = document.getElementById('product-name').value.trim();
    const category = document.getElementById('product-category').value;
    const price = parseFloat(document.getElementById('product-price').value);
    const stock = parseInt(document.getElementById('product-stock').value);
    const cost = parseFloat(document.getElementById('product-cost').value) || 0;
    const minStock = parseInt(document.getElementById('product-min-stock').value);
    const description = document.getElementById('product-description').value.trim();
    
    if (!name) {
        showAlert('El nombre del producto es obligatorio', 'error');
        return;
    }
    
    if (!category) {
        showAlert('La categoría es obligatoria', 'error');
        return;
    }
    
    if (price <= 0) {
        showAlert('El precio debe ser mayor a 0', 'error');
        return;
    }
    
    if (stock < 0) {
        showAlert('El stock no puede ser negativo', 'error');
        return;
    }
    
    if (editingProductId) {
        const index = products.findIndex(p => p.id === editingProductId);
        products[index] = { ...products[index], name, category, price, stock, cost, minStock, description };
    } else {
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        products.push({ id: newId, name, category, price, stock, cost, minStock, description });
    }
    
    await saveProducts(products);
    hideProductForm();
    showAlert('Producto guardado correctamente', 'success');
    
    setTimeout(() => {
        updateDashboardStats();
        loadProductsTable();
        loadProductsGrid();
    }, 500);
}

async function editProduct(id) {
    const products = await getProducts();
    const product = products.find(p => p.id === id);
    if (product) {
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-stock').value = product.stock;
        document.getElementById('product-cost').value = product.cost;
        document.getElementById('product-min-stock').value = product.minStock;
        document.getElementById('product-description').value = product.description;
        document.getElementById('product-form-title').textContent = 'Editar Producto';
        document.getElementById('product-modal').style.display = 'flex';
        editingProductId = id;
        loadCategoriesIntoSelect('product-category');
    }
}

async function deleteProduct(id) {
    const products = await getProducts();
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    if (confirm(`¿Está seguro de eliminar el producto "${product.name}"?`)) {
        const updatedProducts = products.filter(p => p.id !== id);
        await saveProducts(updatedProducts);
        showAlert('Producto eliminado correctamente', 'success');
        
        setTimeout(() => {
            updateDashboardStats();
            loadProductsTable();
            loadProductsGrid();
        }, 500);
    }
}

// === FUNCIONES DE CLIENTES ===
function showClientForm() {
    document.getElementById('client-form-title').textContent = 'Agregar Cliente';
    document.getElementById('client-dni').value = '';
    document.getElementById('client-name').value = '';
    document.getElementById('client-name').setAttribute('readonly', 'true');
    document.getElementById('client-email').value = '';
    document.getElementById('client-phone').value = '';
    document.getElementById('client-address').value = '';
    document.getElementById('client-type').value = 'regular';
    document.getElementById('client-modal').style.display = 'flex';
    editingClientId = null;
    
    setTimeout(() => {
        document.getElementById('client-dni').focus();
    }, 100);
}

function hideClientForm() {
    document.getElementById('client-modal').style.display = 'none';
    editingClientId = null;
}

async function saveClient() {
    const clients = await getClients();
    const dni = document.getElementById('client-dni').value.trim();
    const name = document.getElementById('client-name').value.trim();
    const email = document.getElementById('client-email').value.trim();
    const phone = document.getElementById('client-phone').value.trim();
    const address = document.getElementById('client-address').value.trim();
    const type = document.getElementById('client-type').value;
    
    if (!dni || dni.length !== 8) {
        showAlert('Ingrese un DNI válido de 8 dígitos', 'error');
        return;
    }
    
    if (!name) {
        showAlert('El nombre es obligatorio', 'error');
        document.getElementById('client-name').focus();
        return;
    }
    
    if (!editingClientId) {
        const existingClient = clients.find(c => c.dni === dni);
        if (existingClient) {
            showAlert('Ya existe un cliente con este DNI', 'error');
            return;
        }
    }
    
    if (email && !isValidEmail(email)) {
        showAlert('Ingrese un email válido', 'error');
        document.getElementById('client-email').focus();
        return;
    }
    
    if (editingClientId) {
        const index = clients.findIndex(c => c.id === editingClientId);
        clients[index] = { ...clients[index], dni, name, email, phone, address, type };
    } else {
        const newId = clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1;
        clients.push({ id: newId, dni, name, email, phone, address, type });
    }
    
    await saveClients(clients);
    hideClientForm();
    showAlert('Cliente guardado correctamente', 'success');
    
    setTimeout(() => {
        updateDashboardStats();
        loadClientsTable();
        populateSaleSelects();
    }, 500);
}

async function editClient(id) {
    const clients = await getClients();
    const client = clients.find(c => c.id === id);
    if (client) {
        document.getElementById('client-dni').value = client.dni || '';
        document.getElementById('client-name').value = client.name;
        document.getElementById('client-name').removeAttribute('readonly');
        document.getElementById('client-email').value = client.email;
        document.getElementById('client-phone').value = client.phone;
        document.getElementById('client-address').value = client.address;
        document.getElementById('client-type').value = client.type;
        document.getElementById('client-form-title').textContent = 'Editar Cliente';
        document.getElementById('client-modal').style.display = 'flex';
        editingClientId = id;
    }
}

async function deleteClient(id) {
    const clients = await getClients();
    const sales = await getSales();
    const client = clients.find(c => c.id === id);
    if (!client) return;
    
    const clientSales = sales.filter(s => s.clientId === id);
    if (clientSales.length > 0) {
        showAlert('No se puede eliminar el cliente porque tiene ventas asociadas', 'error');
        return;
    }
    
    if (confirm(`¿Está seguro de eliminar al cliente "${client.name}"?`)) {
        const updatedClients = clients.filter(c => c.id !== id);
        await saveClients(updatedClients);
        showAlert('Cliente eliminado correctamente', 'success');
        
        setTimeout(() => {
            updateDashboardStats();
            loadClientsTable();
            populateSaleSelects();
        }, 500);
    }
}

async function loadClientsTable() {
    const clients = await getClients();
    const tbody = document.getElementById('clients-table-body');
    tbody.innerHTML = '';
    
    if (clients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-users"></i><p>No hay clientes</p></td></tr>';
        return;
    }
    
    clients.forEach(client => {
        const typeClass = client.type === 'premium' ? 'badge-success' : 
                         client.type === 'corporativo' ? 'badge-info' : 'badge-primary';
        const typeText = client.type === 'premium' ? 'Premium' : 
                        client.type === 'corporativo' ? 'Corporativo' : 'Regular';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${client.id}</td>
            <td>${client.dni || 'N/A'}</td>
            <td>${client.name}</td>
            <td>${client.email || 'N/A'}</td>
            <td>${client.phone || 'N/A'}</td>
            <td>
                <span class="badge ${typeClass}">${typeText}</span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-primary btn-sm" onclick="editClient(${client.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteClient(${client.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// === FUNCIONES DE CLIENTES (RENIEC) ===
async function searchDNI() {
    const dni = document.getElementById('client-dni').value.trim();
    const searchBtn = document.getElementById('search-dni-btn');
    
    if (dni.length !== 8) {
        showAlert('Ingrese un DNI válido de 8 dígitos', 'error');
        return;
    }

    searchBtn.disabled = true;
    searchBtn.innerHTML = '<div class="spinner"></div> Buscando...';

    try {
        const response = await fetch(`${API_CONFIG.baseUrl}/dni/${dni}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_CONFIG.token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
            const fullName = `${data.data.nombres} ${data.data.apellido_paterno} ${data.data.apellido_materno}`;
            document.getElementById('client-name').value = fullName.trim();
            document.getElementById('client-name').removeAttribute('readonly');
            showAlert('✓ Datos encontrados exitosamente', 'success');
        } else {
            throw new Error(data.message || 'DNI no encontrado');
        }
        
    } catch (error) {
        console.error('Error al buscar DNI:', error);
        
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            showAlert('❌ Token inválido o expirado', 'error');
        } else if (error.message.includes('404') || error.message.includes('No encontrado')) {
            showAlert('❌ DNI no encontrado en RENIEC', 'error');
        } else if (error.message.includes('429')) {
            showAlert('⚠️ Límite de consultas excedido', 'error');
        } else {
            showAlert('❌ Error: ' + error.message, 'error');
        }
        
        document.getElementById('client-name').removeAttribute('readonly');
        document.getElementById('client-name').focus();
    } finally {
        searchBtn.disabled = false;
        searchBtn.innerHTML = '<i class="fas fa-search"></i> Buscar';
    }
}

function setupDNIValidation() {
    const dniInput = document.getElementById('client-dni');
    const searchBtn = document.getElementById('search-dni-btn');
    
    dniInput.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/\D/g, '').substring(0, 8);
        searchBtn.disabled = e.target.value.length !== 8;
        
        if (document.getElementById('client-name').value && !editingClientId) {
            document.getElementById('client-name').value = '';
            document.getElementById('client-name').setAttribute('readonly', 'true');
        }
    });
    
    dniInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && this.value.length === 8) {
            searchDNI();
        }
    });
}

// === FUNCIONES DE VENTAS ===
async function populateSaleSelects() {
    const clients = await getClients();
    const clientSelect = document.getElementById('sale-client');
    
    clientSelect.innerHTML = '<option value="">Seleccione un cliente</option>';
    
    clients.forEach(client => {
        clientSelect.innerHTML += `<option value="${client.id}">${client.name} - ${client.dni}</option>`;
    });
}

// === FUNCIONES DEL DASHBOARD ===
async function updateDashboardStats() {
    try {
        const products = await getProducts();
        const clients = await getClients();
        const sales = await getSales();
        
        const totalProducts = products.length;
        const totalClients = clients.length;
        const totalSales = sales.length;
        
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyRevenue = sales
            .filter(sale => {
                try {
                    const saleDate = new Date(sale.date);
                    return saleDate.getMonth() === currentMonth && 
                           saleDate.getFullYear() === currentYear;
                } catch (error) {
                    console.error('Error procesando fecha:', sale.date);
                    return false;
                }
            })
            .reduce((sum, sale) => sum + (parseFloat(sale.total) || 0), 0);
        
        const lowStockProducts = products.filter(p => {
            const stock = parseInt(p.stock) || 0;
            const minStock = parseInt(p.minStock) || 0;
            return stock > 0 && stock <= minStock;
        }).length;
        
        const outOfStockProducts = products.filter(p => {
            const stock = parseInt(p.stock) || 0;
            return stock === 0;
        }).length;
        
        document.getElementById('total-products').textContent = totalProducts;
        document.getElementById('total-clients').textContent = totalClients;
        document.getElementById('total-sales').textContent = totalSales;
        document.getElementById('monthly-revenue').textContent = 'S/ ' + monthlyRevenue.toFixed(2);
        
        const lowStockAlertEl = document.getElementById('low-stock-alert');
        if (lowStockAlertEl) {
            lowStockAlertEl.textContent = lowStockProducts + outOfStockProducts;
        }
        
        updatePendingSalesAlert(sales);
        
    } catch (error) {
        console.error('Error actualizando dashboard:', error);
    }
}

function updatePendingSalesAlert(sales) {
    const pendingSales = sales.filter(s => s.status === 'Separado');
    const totalPendingAmount = pendingSales.reduce((sum, sale) => sum + (parseFloat(sale.pendingAmount) || 0), 0);
    
    let pendingAlert = document.querySelector('.pending-sales-alert');
    
    if (pendingSales.length > 0) {
        if (!pendingAlert) {
            pendingAlert = document.createElement('div');
            pendingAlert.className = 'alert alert-warning pending-sales-alert';
            pendingAlert.style.margin = '20px 0';
            pendingAlert.style.padding = '15px';
            pendingAlert.style.borderRadius = '8px';
            pendingAlert.style.border = '1px solid #ffeaa7';
            pendingAlert.style.backgroundColor = '#fff9e6';
            
            const dashboardSection = document.getElementById('dashboard-section');
            if (dashboardSection) {
                const statsGrid = dashboardSection.querySelector('.stats-grid');
                if (statsGrid) {
                    dashboardSection.insertBefore(pendingAlert, statsGrid);
                } else {
                    dashboardSection.appendChild(pendingAlert);
                }
            }
        }
        
        pendingAlert.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center;">
                    <i class="fas fa-clock" style="font-size: 1.2em; margin-right: 10px; color: #f39c12;"></i>
                    <div>
                        <strong style="color: #e67e22;">Tienes ${pendingSales.length} ventas pendientes</strong>
                        <div style="font-size: 0.9em; color: #7d6608;">
                            Total pendiente: S/ ${totalPendingAmount.toFixed(2)}
                        </div>
                    </div>
                </div>
                <button class="btn btn-success btn-sm" onclick="showSection('sales')">
                    <i class="fas fa-eye"></i> Ver Pendientes
                </button>
            </div>
        `;
    } else if (pendingAlert) {
        pendingAlert.remove();
    }
}

// === FUNCIONES DE HISTORIAL DE VENTAS ===
async function loadSalesHistory() {
    const sales = await getSales();
    const clients = await getClients();
    const tbody = document.getElementById('sales-history-body');
    tbody.innerHTML = '';
    
    if (sales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fas fa-receipt"></i><p>No hay ventas registradas</p></td></tr>';
        return;
    }
    
    sales.slice().reverse().forEach(sale => {
        const client = clients.find(c => c.id === sale.clientId);
        const statusClass = sale.status === 'Pagado' ? 'badge-success' : 
                          sale.status === 'Separado' ? 'badge-warning' : 'badge-danger';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${sale.id.toString().padStart(4, '0')}</td>
            <td>${client ? client.name : 'N/A'}</td>
            <td>${sale.date}</td>
            <td>S/${sale.total.toFixed(2)}</td>
            <td><span class="badge ${statusClass}">${sale.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-primary btn-sm" onclick="showSaleReceipt(${sale.id})">
                        <i class="fas fa-receipt"></i> Ver
                    </button>
                    ${sale.status === 'Separado' ? `
                    <button class="btn btn-success btn-sm" onclick="showPendingSaleDetails(${sale.id})">
                        <i class="fas fa-money-bill-wave"></i> Pagar
                    </button>
                    ` : ''}
                    <button class="btn btn-danger btn-sm" onclick="deleteSale(${sale.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function loadRecentSales() {
    const sales = await getSales();
    const clients = await getClients();
    const tbody = document.getElementById('recent-sales-body');
    tbody.innerHTML = '';
    
    if (sales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><i class="fas fa-receipt"></i><p>No hay ventas recientes</p></td></tr>';
        return;
    }
    
    sales.slice(-5).reverse().forEach(sale => {
        const client = clients.find(c => c.id === sale.clientId);
        const statusClass = sale.status === 'Pagado' ? 'badge-success' : 
                          sale.status === 'Separado' ? 'badge-warning' : 'badge-danger';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${sale.id.toString().padStart(4, '0')}</td>
            <td>${client ? client.name : 'N/A'}</td>
            <td>${sale.date}</td>
            <td>S/${sale.total.toFixed(2)}</td>
            <td><span class="badge ${statusClass}">${sale.status}</span></td>
        `;
        tbody.appendChild(row);
    });
}

async function deleteSale(saleId) {
    if (confirm('¿Está seguro de eliminar esta venta? Esta acción no se puede deshacer.')) {
        const sales = await getSales();
        const updatedSales = sales.filter(s => s.id !== saleId);
        await saveSales(updatedSales);
        showAlert('Venta eliminada correctamente', 'success');
        
        setTimeout(() => {
            updateDashboardStats();
        }, 500);
    }
}

// === FUNCIONES UTILITARIAS ===
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// === FUNCIONES DE REPORTES ===
async function generateReport() {
    const type = document.getElementById('report-type').value;
    const period = document.getElementById('report-period').value;
    
    if (!type || !period) {
        showAlert('Seleccione tipo y período', 'error');
        return;
    }
    
    const today = new Date();
    let startDate, endDate;
    
    switch (period) {
        case 'today':
            startDate = new Date(today);
            endDate = new Date(today);
            break;
        case 'week':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 7);
            endDate = new Date(today);
            break;
        case 'month':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            break;
        case 'year':
            startDate = new Date(today.getFullYear(), 0, 1);
            endDate = new Date(today.getFullYear(), 11, 31);
            break;
    }
    
    let content = '';
    const sales = await getSales();
    const products = await getProducts();
    const clients = await getClients();
    
    if (type === 'sales') {
        const filtered = sales.filter(s => {
            const saleDate = new Date(s.date);
            return saleDate >= startDate && saleDate <= endDate;
        });
        
        const total = filtered.reduce((sum, s) => sum + s.total, 0);
        const totalSales = filtered.length;
        
        content = `
            <h4>Reporte de Ventas</h4>
            <p><strong>Período:</strong> ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</p>
            <p><strong>Total Ventas:</strong> ${totalSales}</p>
            <p><strong>Ingresos Totales:</strong> S/${total.toFixed(2)}</p>
            
            ${totalSales > 0 ? `
            <table class="table">
                <thead>
                    <tr>
                        <th>ID Venta</th>
                        <th>Cliente</th>
                        <th>Fecha</th>
                        <th>Total</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered.map(s => {
                        const client = clients.find(c => c.id === s.clientId);
                        const statusClass = s.status === 'Pagado' ? 'badge-success' : 'badge-warning';
                        return `
                            <tr>
                                <td>#${s.id.toString().padStart(4, '0')}</td>
                                <td>${client ? client.name : 'N/A'}</td>
                                <td>${s.date}</td>
                                <td>S/${s.total.toFixed(2)}</td>
                                <td><span class="badge ${statusClass}">${s.status}</span></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            ` : '<p class="empty-state">No hay ventas en este período</p>'}
        `;
    } else if (type === 'products') {
        const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
        const lowStockProducts = products.filter(p => p.stock <= p.minStock);
        
        content = `
            <h4>Reporte de Inventario</h4>
            <p><strong>Total Productos:</strong> ${products.length}</p>
            <p><strong>Valor Total Inventario:</strong> S/${totalValue.toFixed(2)}</p>
            <p><strong>Productos con Stock Bajo:</strong> ${lowStockProducts.length}</p>
            
            <h5 style="margin-top: 20px;">Productos con Stock Bajo</h5>
            ${lowStockProducts.length > 0 ? `
            <table class="table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Stock Actual</th>
                        <th>Stock Mínimo</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${lowStockProducts.map(p => `
                        <tr>
                            <td>${p.name}</td>
                            <td>${p.stock}</td>
                            <td>${p.minStock}</td>
                            <td><span class="badge badge-warning">Stock Bajo</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ` : '<p>No hay productos con stock bajo</p>'}
            
            <h5 style="margin-top: 20px;">Todos los Productos</h5>
            <table class="table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Categoría</th>
                        <th>Precio</th>
                        <th>Stock</th>
                        <th>Valor</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(p => `
                        <tr>
                            <td>${p.name}</td>
                            <td>${p.category}</td>
                            <td>S/${p.price.toFixed(2)}</td>
                            <td>${p.stock}</td>
                            <td>S/${(p.price * p.stock).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else if (type === 'clients') {
        const premiumClients = clients.filter(c => c.type === 'premium').length;
        const regularClients = clients.filter(c => c.type === 'regular').length;
        const corporativoClients = clients.filter(c => c.type === 'corporativo').length;
        
        content = `
            <h4>Reporte de Clientes</h4>
            <p><strong>Total Clientes:</strong> ${clients.length}</p>
            <p><strong>Clientes Premium:</strong> ${premiumClients}</p>
            <p><strong>Clientes Corporativos:</strong> ${corporativoClients}</p>
            <p><strong>Clientes Regulares:</strong> ${regularClients}</p>
            
            <table class="table">
                <thead>
                    <tr>
                        <th>DNI</th>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th>Tipo</th>
                        <th>Compras</th>
                    </tr>
                </thead>
                <tbody>
                    ${clients.map(c => {
                        const purchases = sales.filter(s => s.clientId === c.id).length;
                        const typeClass = c.type === 'premium' ? 'badge-success' : 
                                        c.type === 'corporativo' ? 'badge-info' : 'badge-primary';
                        return `
                            <tr>
                                <td>${c.dni || 'N/A'}</td>
                                <td>${c.name}</td>
                                <td>${c.email || 'N/A'}</td>
                                <td>${c.phone || 'N/A'}</td>
                                <td><span class="badge ${typeClass}">${c.type}</span></td>
                                <td>${purchases}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    } else if (type === 'categories') {
        const categories = await getCategories();
        const categorySales = {};
        
        sales.forEach(sale => {
            sale.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (product) {
                    if (!categorySales[product.category]) {
                        categorySales[product.category] = 0;
                    }
                    categorySales[product.category] += item.total;
                }
            });
        });
        
        content = `
            <h4>Reporte por Categorías</h4>
            <p><strong>Total Categorías:</strong> ${categories.length}</p>
            
            <h5 style="margin-top: 20px;">Ventas por Categoría</h5>
            ${Object.keys(categorySales).length > 0 ? `
            <table class="table">
                <thead>
                    <tr>
                        <th>Categoría</th>
                        <th>Ventas Totales</th>
                        <th>Porcentaje</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(categorySales).map(([category, total]) => {
                        const percentage = (total / sales.reduce((sum, s) => sum + s.total, 0) * 100).toFixed(1);
                        return `
                            <tr>
                                <td>${category}</td>
                                <td>S/${total.toFixed(2)}</td>
                                <td>${percentage}%</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            ` : '<p>No hay ventas por categorías en este período</p>'}
            
            <h5 style="margin-top: 20px;">Todas las Categorías</h5>
            <table class="table">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th>Productos</th>
                    </tr>
                </thead>
                <tbody>
                    ${categories.map(category => {
                        const categoryProducts = products.filter(p => p.category === category.name);
                        return `
                            <tr>
                                <td>${category.name}</td>
                                <td>${category.description || 'Sin descripción'}</td>
                                <td>${categoryProducts.length}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }
    
    document.getElementById('report-content').innerHTML = content;
    document.getElementById('report-results').classList.remove('hidden');
}

// === FUNCIONES DE BOLETA ELECTRÓNICA CON DESCUENTO VISIBLE ===
async function showSaleReceipt(saleId) {
    const sales = await getSales();
    const clients = await getClients();
    const sale = sales.find(s => s.id === saleId);
    
    if (!sale) {
        showAlert('Venta no encontrada', 'error');
        return;
    }
    
    const client = clients.find(c => c.id === sale.clientId);
    
    if (!client) {
        showAlert('Cliente no encontrado', 'error');
        return;
    }
    
    const now = new Date();
    const currentDate = now.toLocaleDateString('es-PE');
    const currentTime = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const paymentMethodNames = {
        'efectivo': 'EFECTIVO',
        'tarjeta': 'TARJETA',
        'transferencia': 'TRANSFERENCIA',
        'yape': 'YAPE/PLIN'
    };
    
    const paymentInfo = sale.isPartialPayment && sale.status === 'Separado'
        ? `
            <p><i class="fas fa-money-bill-wave"></i> <strong>Método de Pago:</strong> ${paymentMethodNames[sale.paymentMethod] || sale.paymentMethod.toUpperCase()}</p>
            <p><i class="fas fa-cash-register"></i> <strong>Adelanto:</strong> S/ ${sale.paidAmount.toFixed(2)}</p>
            <p><i class="fas fa-clock"></i> <strong>Saldo Pendiente:</strong> S/ ${sale.pendingAmount.toFixed(2)}</p>
            <p><i class="fas fa-check-circle"></i> <strong>Estado:</strong> <span class="sale-status status-separado">SEPARADO</span></p>
        `
        : `
            <p><i class="fas fa-money-bill-wave"></i> <strong>Método de Pago:</strong> ${paymentMethodNames[sale.paymentMethod] || sale.paymentMethod.toUpperCase()}</p>
            <p><i class="fas fa-check-circle"></i> <strong>Estado:</strong> <span class="sale-status status-paid">PAGADO</span></p>
        `;

    let discountInfo = '';
    if (sale.discount && sale.discount.value > 0) {
        const discountText = sale.discount.type === 'percentage' 
            ? `${sale.discount.amount}%` 
            : `S/ ${sale.discount.amount.toFixed(2)}`;
        
        discountInfo = `
        <div class="total-row discount-applied">
            <span class="total-label">
                <i class="fas fa-tag"></i> Descuento (${sale.discount.reason}):
                <br>
                <small style="font-size: 0.85em; color: #666;">${discountText}</small>
            </span>
            <span class="total-value" style="color: #e74c3c;">- S/ ${sale.discount.value.toFixed(2)}</span>
        </div>
        `;
    }

    const receiptHTML = `
        <div class="electronic-receipt" id="electronic-receipt">
            <div class="receipt-header">
                <div class="company-brand">
                    <div class="company-logo">
                        <img src="logo.png" alt="Logo" style="width: 60px; height: 60px; object-fit: contain; border-radius: 8px;">
                    </div>
                    <div class="company-info">
                        <h1>SkinBri Shop</h1>
                        <p class="company-slogan">“Más que belleza, bienestar que sí puedes pagar.”</p>
                        <div class="company-details">
                            <span><i class="fas fa-phone"></i> +51 942 571 951</span>
                            <span><i class="fas fa-map-marker-alt"></i> Tarma - Junín</span>
                        </div>
                    </div>
                </div>
                <div class="receipt-badge">
                    <div class="badge-content">
                        <span>${sale.isPartialPayment && sale.status === 'Separado' ? 'COMPROBANTE DE SEPARACIÓN' : 'BOLETA ELECTRÓNICA'}</span>
                        <div class="receipt-number">${sale.isPartialPayment && sale.status === 'Separado' ? 'S' : 'B'}001-${sale.id.toString().padStart(4, '0')}</div>
                    </div>
                </div>
            </div>

            <div class="receipt-meta">
                <div class="meta-grid">
                    <div class="meta-item">
                        <label><i class="fas fa-calendar"></i> Fecha:</label>
                        <span>${currentDate}</span>
                    </div>
                    <div class="meta-item">
                        <label><i class="fas fa-clock"></i> Hora:</label>
                        <span>${currentTime}</span>
                    </div>
                    <div class="meta-item">
                        <label><i class="fas fa-user-tie"></i> Vendedor:</label>
                        <span>Administrador</span>
                    </div>
                </div>
            </div>

            <div class="client-section">
                <div class="section-header-compact">
                    <i class="fas fa-user"></i> DATOS DEL CLIENTE
                </div>
                <div class="client-details-compact">
                    <div class="client-row">
                        <span><strong>Nombre:</strong> ${client.name}</span>
                        <span><strong>DNI:</strong> ${client.dni || 'N/A'}</span>
                    </div>
                    <div class="client-row">
                        <span><strong>Email:</strong> ${client.email || 'No registrado'}</span>
                        <span><strong>Teléfono:</strong> ${client.phone || 'No registrado'}</span>
                    </div>
                </div>
            </div>

            <div class="products-section">
                <div class="section-header-compact">
                    <i class="fas fa-shopping-cart"></i> DETALLE DE PRODUCTOS
                </div>
                <div class="products-table-container">
                    <table class="products-table-compact">
                        <thead>
                            <tr>
                                <th class="product-col">Descripción</th>
                                <th class="qty-col">Cant.</th>
                                <th class="price-col">P. Unit.</th>
                                <th class="total-col">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sale.items.map(item => `
                                <tr>
                                    <td class="product-name">${item.name}</td>
                                    <td class="quantity">${item.quantity}</td>
                                    <td class="unit-price">S/ ${item.price.toFixed(2)}</td>
                                    <td class="product-total">S/ ${item.total.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="totals-section-compact">
                <div class="totals-grid-compact">
                    <div class="total-row">
                        <span class="total-label">SUBTOTAL:</span>
                        <span class="total-value">S/ ${sale.subtotal.toFixed(2)}</span>
                    </div>
                    
                    ${discountInfo}
                    
                    <div class="total-row">
                        <span class="total-label">IGV (0%):</span>
                        <span class="total-value">S/ 0.00</span>
                    </div>
                    <div class="total-row grand-total">
                        <span class="total-label">TOTAL A PAGAR:</span>
                        <span class="total-value">S/ ${sale.total.toFixed(2)}</span>
                    </div>
                    ${sale.isPartialPayment && sale.status === 'Separado' ? `
                    <div class="total-row">
                        <span class="total-label">ADELANTO:</span>
                        <span class="total-value">S/ ${sale.paidAmount.toFixed(2)}</span>
                    </div>
                    <div class="total-row">
                        <span class="total-label">SALDO PENDIENTE:</span>
                        <span class="total-value">S/ ${sale.pendingAmount.toFixed(2)}</span>
                    </div>
                    ` : ''}
                </div>
            </div>

            <div class="receipt-footer-compact">
                <div class="footer-info">${paymentInfo}</div>
                
                <div class="legal-compact">
                    <p><strong>${sale.isPartialPayment && sale.status === 'Separado' ? '¡Gracias por su separación!' : '¡Gracias por su compra!'}</strong></p>
                    ${sale.discount && sale.discount.value > 0 ? `
                    <p style="color: #27ae60; font-weight: bold;">
                        <i class="fas fa-check-circle"></i> ¡Descuento aplicado! Ahorro: S/ ${sale.discount.value.toFixed(2)}
                    </p>
                    ` : ''}
                    <p>Documento generado electrónicamente</p>
                    <p><strong>Conserve este comprobante</strong></p>  
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('receipt-content').innerHTML = receiptHTML;
    updateReceiptModalFooter(saleId, client);
    document.getElementById('sale-receipt-modal').style.display = 'flex';
    
    setupReceiptModalESC();
}

function updateReceiptModalFooter(saleId, client) {
    const modalFooter = document.querySelector('#sale-receipt-modal .modal-footer');
    modalFooter.innerHTML = `
        <button class="btn btn-success btn-sm" onclick="printReceipt()">
            <i class="fas fa-print"></i> Imprimir
        </button>
        <button class="btn btn-whatsapp btn-sm" onclick="shareToWhatsApp(${saleId})">
            <i class="fab fa-whatsapp"></i> Enviar por WhatsApp
        </button>
        <button class="btn btn-danger btn-sm" onclick="closeReceiptModal()">
            <i class="fas fa-times"></i> Cerrar (ESC)
        </button>
    `;
}

function printReceipt() {
    const receiptContent = document.getElementById('electronic-receipt');
    if (!receiptContent) {
        showAlert('No hay recibo para imprimir', 'error');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Imprimir Boleta</title>
            <link rel="stylesheet" href="style.css">
            <style>
                @media print {
                    body { margin: 0; padding: 20px; }
                    .electronic-receipt { box-shadow: none !important; }
                }
            </style>
        </head>
        <body>
            ${receiptContent.outerHTML}
            <script>
                window.onload = function() {
                    window.print();
                    window.onafterprint = function() {
                        window.close();
                    };
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

function closeReceiptModal() {
    const modal = document.getElementById('sale-receipt-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function setupReceiptModalESC() {
    const closeOnEsc = function(e) {
        if (e.key === 'Escape') {
            closeReceiptModal();
            document.removeEventListener('keydown', closeOnEsc);
        }
    };
    
    document.removeEventListener('keydown', closeOnEsc);
    document.addEventListener('keydown', closeOnEsc);
}

// === FUNCIONES DE WHATSAPP Y PDF ===
async function shareToWhatsApp(saleId) {
    const sales = await getSales();
    const clients = await getClients();
    const sale = sales.find(s => s.id === saleId);
    const client = clients.find(c => c.id === sale.clientId);
    
    const loadingAlert = showAlert('Generando PDF... por favor espere', 'info');
    
    try {
        const receiptElement = document.getElementById('electronic-receipt');
        if (!receiptElement) {
            throw new Error('No se encontró la boleta');
        }
        
        const modalFooter = document.querySelector('#sale-receipt-modal .modal-footer');
        const originalDisplay = modalFooter ? modalFooter.style.display : '';
        if (modalFooter) modalFooter.style.display = 'none';
        
        if (typeof html2canvas === 'undefined') {
            throw new Error('html2canvas no está cargado');
        }
        
        if (typeof jspdf === 'undefined') {
            throw new Error('jspdf no está cargado');
        }
        
        const canvas = await html2canvas(receiptElement, {
            scale: 3,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 800,
            windowHeight: receiptElement.scrollHeight
        });
        
        if (modalFooter) modalFooter.style.display = originalDisplay;
        
        const imgData = canvas.toDataURL('image/png', 1.0);
        const { jsPDF } = window.jspdf;
        
        const pdfWidth = 210;
        const pdfHeight = 297;
        const imgWidth = pdfWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
        });
        
        let finalHeight = imgHeight;
        let finalWidth = imgWidth;
        
        if (imgHeight > pdfHeight - 20) {
            finalHeight = pdfHeight - 20;
            finalWidth = (canvas.width * finalHeight) / canvas.height;
        }
        
        const xOffset = (pdfWidth - finalWidth) / 2;
        const yOffset = 10;
        
        pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight, '', 'FAST');
        
        const fileName = `${sale.isPartialPayment && sale.status === 'Separado' ? 'Separacion' : 'Boleta'}_${sale.id.toString().padStart(4, '0')}_${client.name.replace(/\s+/g, '_')}.pdf`;
        pdf.save(fileName);
        
        const message = sale.isPartialPayment && sale.status === 'Separado'
            ? `¡Hola ${client.name}! 👋\n\n` +
              `*SkinBri Shop* te envía tu comprobante de separación.\n\n` +
              `📄 *N° Separación:* S001-${sale.id.toString().padStart(4, '0')}\n` +
              `📅 *Fecha:* ${sale.date}\n` +
              `👤 *Cliente:* ${client.name}\n` +
              `💰 *Total:* S/${sale.total.toFixed(2)}\n` +
              `💵 *Adelanto:* S/${sale.paidAmount.toFixed(2)}\n` +
              `⏳ *Saldo Pendiente:* S/${sale.pendingAmount.toFixed(2)}\n\n` +
              `¡Gracias por tu confianza! 🎉`
            : `¡Hola ${client.name}! 👋\n\n` +
              `*SkinBri Shop* te envía tu comprobante de venta.\n\n` +
              `📄 *N° Boleta:* B001-${sale.id.toString().padStart(4, '0')}\n` +
              `📅 *Fecha:* ${sale.date}\n` +
              `👤 *Cliente:* ${client.name}\n` +
              `💰 *Total:* S/${sale.total.toFixed(2)}\n\n` +
              `¡Gracias por tu compra! 🎉`;
        
        const encodedMessage = encodeURIComponent(message);
        const phoneNumber = client.phone ? client.phone.replace(/\D/g, '') : '';
        
        setTimeout(() => {
            const whatsappUrl = phoneNumber 
                ? `https://wa.me/51${phoneNumber}?text=${encodedMessage}`
                : `https://wa.me/?text=${encodedMessage}`;
            window.open(whatsappUrl, '_blank');
        }, 1500);
        
        loadingAlert.remove();
        showAlert('✅ PDF generado y descargado. Adjúntalo en WhatsApp', 'success');
        
    } catch (error) {
        console.error('Error al generar PDF:', error);
        loadingAlert.remove();
        showAlert('❌ Error al generar el PDF: ' + error.message, 'error');
        
        const modalFooter = document.querySelector('#sale-receipt-modal .modal-footer');
        if (modalFooter) modalFooter.style.display = '';
    }
}

// Función auxiliar para agregar producto rápidamente (compatibilidad)
function quickAddProduct() {
    if (selectedProductForCart) {
        addSelectedProductToCart();
    } else {
        showAlert('❌ Primero seleccione un producto', 'error');
    }
}

