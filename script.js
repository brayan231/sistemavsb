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
let currentPendingSale = null;
let currentShipping = null;
let currentProductImage = null;


// Configuración de la API RENIEC
const API_CONFIG = {
    baseUrl: 'https://apiperu.dev/api',
    token: '3a451e42f184f40438d77992c710b41f39de11872984aebf33058276a75a46c6'
};

// CONFIGURACIÓN FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyBakQa9cYhWsaL1ozkpNS9K1CXRR2dYbI8",
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
function previewImage(input) {
    const previewContainer = document.getElementById('image-preview');
    const previewImage = document.getElementById('preview-image');
    
    if (input.files && input.files[0]) {
        const file = input.files[0];
        
        // Validar tamaño (máximo 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showAlert('❌ La imagen es muy grande. Máximo 2MB permitido.', 'error');
            input.value = '';
            return;
        }
        
        // Validar tipo de archivo
        if (!file.type.match('image.*')) {
            showAlert('❌ Por favor selecciona solo archivos de imagen.', 'error');
            input.value = '';
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            previewImage.src = e.target.result;
            previewContainer.style.display = 'block';
            currentProductImage = e.target.result; // Guardar la imagen en base64
        };
        
        reader.readAsDataURL(file);
    }
}

// === FUNCIÓN PARA QUITAR IMAGEN ===
function removeImage() {
    const input = document.getElementById('product-image-file');
    const previewContainer = document.getElementById('image-preview');
    
    input.value = '';
    previewContainer.style.display = 'none';
    currentProductImage = null;
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

function getInventoryMovements() {
    return new Promise((resolve) => {
        database.ref('inventoryMovements').once('value', (snapshot) => {
            const data = snapshot.val();
            resolve(data ? Object.values(data) : []);
        });
    });
}

function saveInventoryMovements(movements) {
    return database.ref('inventoryMovements').set(movements);
}

function getShippingCities() {
    return new Promise((resolve) => {
        database.ref('shippingCities').once('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                resolve(Object.values(data));
            } else {
                // Ciudades por defecto
                const defaultCities = [
                    { id: 1, name: 'Lima', cost: 15.00, time: '2-3 días', active: true },
                    { id: 2, name: 'Arequipa', cost: 20.00, time: '3-4 días', active: true },
                    { id: 3, name: 'Trujillo', cost: 18.00, time: '3-4 días', active: true },
                    { id: 4, name: 'Huancayo', cost: 12.00, time: '1-2 días', active: true }
                ];
                resolve(defaultCities);
            }
        });
    });
}

function saveShippingCities(cities) {
    return database.ref('shippingCities').set(cities);
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
        setupDNIValidation();
        setupModalEvents();
        setupImagePreview();
        initializeReportDates();
        loadRecentSalesSummary();
        // Removido: loadRecentProducts() - no existe
        updateCriticalAlerts();
        return loadInitialData();
    }).then(() => {
        console.log('✅ Sistema inicializado correctamente');
        updateDashboardStats();
    }).catch(error => {
        console.error('❌ Error inicializando sistema:', error);
        showAlert('Error al inicializar el sistema: ' + error.message, 'error');
    });
});


// Inicializar gráficos del dashboard
function initializeDashboardCharts() {
  // Gráfico de ventas mensuales
  const monthlySalesCtx = document.getElementById('monthly-sales-chart').getContext('2d');
  const monthlySalesChart = new Chart(monthlySalesCtx, {
    type: 'line',
    data: {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
      datasets: [{
        label: 'Ventas Mensuales (S/)',
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(52, 152, 219, 0.2)',
        borderColor: 'rgba(52, 152, 219, 1)',
        borderWidth: 2,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  // Gráfico de productos más vendidos
  const topProductsCtx = document.getElementById('top-products-chart').getContext('2d');
  const topProductsChart = new Chart(topProductsCtx, {
    type: 'bar',
    data: {
      labels: ['Producto 1', 'Producto 2', 'Producto 3', 'Producto 4', 'Producto 5'],
      datasets: [{
        label: 'Unidades Vendidas',
        data: [0, 0, 0, 0, 0],
        backgroundColor: [
          'rgba(155, 89, 182, 0.7)',
          'rgba(52, 152, 219, 0.7)',
          'rgba(46, 204, 113, 0.7)',
          'rgba(241, 196, 15, 0.7)',
          'rgba(230, 126, 34, 0.7)'
        ],
        borderColor: [
          'rgba(155, 89, 182, 1)',
          'rgba(52, 152, 219, 1)',
          'rgba(46, 204, 113, 1)',
          'rgba(241, 196, 15, 1)',
          'rgba(230, 126, 34, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  // Gráfico de métodos de pago
  const paymentMethodsCtx = document.getElementById('payment-methods-chart').getContext('2d');
  const paymentMethodsChart = new Chart(paymentMethodsCtx, {
    type: 'doughnut',
    data: {
      labels: ['Efectivo', 'Tarjeta', 'Transferencia', 'Yape/Plin'],
      datasets: [{
        data: [0, 0, 0, 0],
        backgroundColor: [
          'rgba(46, 204, 113, 0.7)',
          'rgba(52, 152, 219, 0.7)',
          'rgba(155, 89, 182, 0.7)',
          'rgba(241, 196, 15, 0.7)'
        ],
        borderColor: [
          'rgba(46, 204, 113, 1)',
          'rgba(52, 152, 219, 1)',
          'rgba(155, 89, 182, 1)',
          'rgba(241, 196, 15, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
        }
      }
    }
  });

  return {
    monthlySalesChart,
    topProductsChart,
    paymentMethodsChart
  };
}

// Llamar a esta función cuando se cargue el dashboard
let dashboardCharts;
document.addEventListener('DOMContentLoaded', function() {
  dashboardCharts = initializeDashboardCharts();
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
        
        await initializeInventoryModule();
        await initializeShippingModule();
        
    } catch (error) {
        console.error('Error inicializando sistema:', error);
        showAlert('Error al inicializar el sistema: ' + error.message, 'error');
    }
}

async function initializeInventoryModule() {
    try {
        const movements = await getInventoryMovements();
        if (movements.length === 0) {
            await saveInventoryMovements([]);
        }
        console.log('✅ Módulo de inventario inicializado');
    } catch (error) {
        console.error('❌ Error inicializando módulo de inventario:', error);
    }
}

async function initializeShippingModule() {
    try {
        const cities = await getShippingCities();
        if (!cities || cities.length === 0) {
            const defaultCities = [
                { id: 1, name: 'Lima', cost: 15.00, time: '2-3 días', active: true },
                { id: 2, name: 'Arequipa', cost: 20.00, time: '3-4 días', active: true },
                { id: 3, name: 'Trujillo', cost: 18.00, time: '3-4 días', active: true },
                { id: 4, name: 'Huancayo', cost: 12.00, time: '1-2 días', active: true }
            ];
            await saveShippingCities(defaultCities);
        }
        console.log('✅ Módulo de envíos inicializado');
    } catch (error) {
        console.error('❌ Error inicializando módulo de envíos:', error);
    }
}

// === CONFIGURACIÓN DE EVENTOS ===
function setupEventListeners() {
    // Botones de agregar
    const addProductBtn = document.getElementById('add-product-btn');
    const addClientBtn = document.getElementById('add-client-btn');
    const addCategoryBtn = document.getElementById('add-category-btn');
    
    if (addProductBtn) addProductBtn.addEventListener('click', showProductForm);
    if (addClientBtn) addClientBtn.addEventListener('click', showClientForm);
    if (addCategoryBtn) addCategoryBtn.addEventListener('click', showCategoryForm);
    
    // Botón limpiar venta
    const clearSaleBtn = document.getElementById('clear-sale');
    if (clearSaleBtn) clearSaleBtn.addEventListener('click', clearCurrentSale);
    
    // Botón agregar producto seleccionado
    const addSelectedBtn = document.getElementById('add-selected-product');
    if (addSelectedBtn) addSelectedBtn.addEventListener('click', addSelectedProductToCart);
    
    console.log('✅ Event listeners configurados');
}

function setupModalEvents() {
    // Cerrar modales al hacer click fuera
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    });
    
    // Cerrar modales con botón X
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    console.log('✅ Eventos de modal configurados');
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            if (section) {
                showSection(section);
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                
                const pageTitle = document.querySelector('.page-title h1');
                const linkText = this.querySelector('span');
                if (pageTitle && linkText) {
                    pageTitle.textContent = linkText.textContent;
                }
            }
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
    } else if (section === 'inventory') {
        loadInventoryData();
    } else if (section === 'pending-sales') {
        loadPendingSalesSection();
    } else if (section === 'shipping') {
        loadShippingSection();
    } else if (section === 'reports') { 
    loadReportsSection();
    } else if (section === 'reports') {
        loadReportsSection();
    }
}

function setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (!menuToggle || !sidebar || !sidebarOverlay) return;

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

    menuToggle.addEventListener('click', toggleSidebar);
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

function setupNumericInputs() {
    // Configurar inputs numéricos para aceptar solo números
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (!/[0-9.]/.test(e.key)) {
                e.preventDefault();
            }
        });
    });
}

// === FUNCIONES DE PRODUCTOS ===
async function loadProductsTable() {
    const products = await getProducts();
    const tbody = document.getElementById('products-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><i class="fas fa-box-open"></i><p>No hay productos</p></td></tr>';
        return;
    }
    
    products.forEach(product => {
        const statusClass = product.stock === 0 ? 'badge-danger' : 
                          product.stock <= product.minStock ? 'badge-warning' : 'badge-success';
        const statusText = product.stock === 0 ? 'Sin Stock' : 
                         product.stock <= product.minStock ? 'Bajo' : 'Disponible';
        
        // MOSTRAR IMAGEN EN LA TABLA
        const imageHTML = product.image 
            ? `<img src="${product.image}" alt="${product.name}" class="product-table-image" onerror="this.style.display='none'">`
            : `<div class="product-table-icon"><i class="fas fa-box"></i></div>`;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="product-image-cell">
                    ${imageHTML}
                </div>
            </td>
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
    if (!grid) return;
    
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
        
        // MOSTRAR IMAGEN O ICONO POR DEFECTO
        const imageHTML = product.image 
            ? `<img src="${product.image}" alt="${product.name}" onerror="this.style.display='none'">`
            : `<div class="product-image-placeholder"><i class="fas fa-box"></i></div>`;
        
        productCard.innerHTML = `
            <div class="product-card-inner">
                <div class="product-image">
                    ${imageHTML}
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

function showProductForm() {
    document.getElementById('product-form-title').textContent = 'Agregar Producto';
    document.getElementById('product-name').value = '';
    document.getElementById('product-category').value = '';
    document.getElementById('product-price').value = '';
    document.getElementById('product-stock').value = '0';
    document.getElementById('product-cost').value = '';
    document.getElementById('product-min-stock').value = '5';
    document.getElementById('product-description').value = '';
    document.getElementById('product-image-file').value = ''; // LIMPIAR ARCHIVO
    document.getElementById('product-modal').style.display = 'flex';
    editingProductId = null;
    currentProductImage = null; // RESETEAR IMAGEN ACTUAL
    
    // OCULTAR VISTA PREVIA
    document.getElementById('image-preview').style.display = 'none';
    
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
    
    // Validaciones
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
    
    // Preparar datos del producto
    const productData = {
        name, category, price, stock, cost, minStock, description
    };
    
    // Agregar imagen si existe
    if (currentProductImage) {
        productData.image = currentProductImage;
    }
    
    if (editingProductId) {
        const index = products.findIndex(p => p.id === editingProductId);
        // Mantener la imagen existente si no se subió una nueva
        if (!currentProductImage && products[index].image) {
            productData.image = products[index].image;
        }
        products[index] = { 
            ...products[index], 
            ...productData
        };
    } else {
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        products.push({ 
            id: newId,
            ...productData
        });
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
        currentProductImage = null; // Resetear imagen nueva
        
        // MOSTRAR VISTA PREVIA SI HAY IMAGEN EXISTENTE
        if (product.image) {
            document.getElementById('preview-image').src = product.image;
            document.getElementById('image-preview').style.display = 'block';
            currentProductImage = product.image; // Mantener imagen existente
        } else {
            document.getElementById('image-preview').style.display = 'none';
        }
        
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
    if (!tbody) return;
    
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

// === FUNCIONES DE CATEGORÍAS ===
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
    }
}

async function loadCategories() {
    const categories = await getCategories();
    loadCategoriesIntoSelect('product-category');
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

// === FUNCIONES DE VENTAS ===
async function populateSaleSelects() {
    const clients = await getClients();
    const clientSelect = document.getElementById('sale-client');
    if (!clientSelect) return;
    
    clientSelect.innerHTML = '<option value="">Seleccione un cliente</option>';
    
    clients.forEach(client => {
        clientSelect.innerHTML += `<option value="${client.id}">${client.name} - ${client.dni}</option>`;
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

function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    const emptyCart = document.getElementById('empty-cart');
    
    if (!cartItems || !emptyCart) return;
    
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

function updateSaleTotals() {
    let subtotal = 0;
    
    currentSaleItems.forEach(item => {
        subtotal += item.price * item.quantity;
    });
    
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
    
    document.getElementById('sale-subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('sale-total').textContent = total.toFixed(2);
    
    const discountRow = document.querySelector('.discount-row');
    if (currentDiscount && discountAmount > 0) {
        if (discountRow) {
            discountRow.style.display = 'flex';
            document.getElementById('sale-discount').textContent = discountAmount.toFixed(2);
        }
    } else {
        if (discountRow) {
            discountRow.style.display = 'none';
        }
    }
    
    updatePaymentCalculations();
}

// === FUNCIONES DE PAGOS ===
function initializePaymentMethods() {
    selectPaymentMethod('efectivo');
    
    document.querySelectorAll('.payment-method').forEach(method => {
        method.addEventListener('click', function() {
            const methodType = this.getAttribute('data-method');
            selectPaymentMethod(methodType);
        });
    });
}

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

function togglePartialPayment() {
    const partialCheckbox = document.getElementById('partial-payment-checkbox');
    if (!partialCheckbox) return;
    
    isPartialPayment = partialCheckbox.checked;
    const partialSection = document.getElementById('partial-payment-section');
    const normalSection = document.getElementById('normal-payment-section');
    
    if (partialSection && normalSection) {
        if (isPartialPayment) {
            partialSection.classList.remove('hidden');
            normalSection.classList.add('hidden');
            updateProductSelectionList();
        } else {
            partialSection.classList.add('hidden');
            normalSection.classList.remove('hidden');
        }
    }
    
    updatePaymentCalculations();
}

function updateProductSelectionList() {
    const container = document.getElementById('product-selection-list');
    if (!container) return;
    
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
    if (!checkbox) return;
    
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
    // Calcular subtotal de productos seleccionados
    let selectedSubtotal = 0;
    
    selectedProducts.forEach(index => {
        const item = currentSaleItems[index];
        selectedSubtotal += item.price * item.quantity;
    });
    
    // Aplicar descuento proporcionalmente
    let selectedDiscountAmount = 0;
    
    if (currentDiscount) {
        const totalSubtotal = currentSaleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        if (currentDiscount.type === 'percentage') {
            selectedDiscountAmount = selectedSubtotal * (currentDiscount.amount / 100);
        } else {
            // Calcular proporción del descuento
            const discountProportion = selectedSubtotal / totalSubtotal;
            selectedDiscountAmount = currentDiscount.value * discountProportion;
        }
    }
    
    const selectedTotal = selectedSubtotal - selectedDiscountAmount;
    
    // Mostrar información detallada
    document.getElementById('selected-total').textContent = selectedTotal.toFixed(2);
    document.getElementById('payment-amount').value = selectedTotal.toFixed(2);
    
    // Mostrar detalles del descuento aplicado
    const discountInfo = document.getElementById('discount-info');
    if (!discountInfo) {
        const container = document.getElementById('partial-payment-section');
        if (container) {
            container.insertAdjacentHTML('beforeend', `
                <div class="discount-info alert alert-info" id="discount-info" style="margin-top: 10px; padding: 8px; font-size: 12px;">
                    <i class="fas fa-tag"></i> Descuento aplicado: S/ <span id="selected-discount-amount">0.00</span>
                </div>
            `);
        }
    }
    
    if (currentDiscount && selectedDiscountAmount > 0) {
        document.getElementById('selected-discount-amount').textContent = selectedDiscountAmount.toFixed(2);
        document.getElementById('discount-info').style.display = 'block';
    } else {
        const discountInfoEl = document.getElementById('discount-info');
        if (discountInfoEl) {
            discountInfoEl.style.display = 'none';
        }
    }
    
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

// === FUNCIONES DE DESCUENTOS ===
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
    if (!select) return;
    
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
    const applyDiscount = document.getElementById('apply-discount-checkbox').checked;
    const discountControls = document.getElementById('discount-controls');
    
    if (applyDiscount) {
        discountControls.classList.remove('hidden');
    } else {
        if (!currentDiscount) {
            discountControls.classList.add('hidden');
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
}

function clearDiscount() {
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
}

function cancelDiscount() {
    clearDiscount();
    document.getElementById('apply-discount-checkbox').checked = false;
    document.getElementById('discount-controls').classList.add('hidden');
}

function modifyDiscount() {
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

// === FUNCIÓN COMPLETA PARA FINALIZAR VENTA ===
async function completeSale() {
    const clientId = parseInt(document.getElementById('sale-client').value);
    const requiresShipping = document.getElementById('requires-shipping').checked;
    
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
        
        // CALCULAR SUBTOTAL Y DESCUENTO
        let subtotal = currentSaleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        let discountAmount = 0;
        let discountPercentage = 0;
        
        if (currentDiscount) {
            if (currentDiscount.type === 'percentage') {
                discountPercentage = currentDiscount.amount;
                discountAmount = subtotal * (currentDiscount.amount / 100);
            } else {
                discountAmount = currentDiscount.amount;
                discountPercentage = (discountAmount / subtotal) * 100;
            }
            discountAmount = Math.min(discountAmount, subtotal);
        }
        
        const total = subtotal - discountAmount;
        
        // **SIEMPRE ACTUALIZAR EL STOCK** - los productos se venden/separan
        await updateStockForSale(currentSaleItems, products);
        
        // Preparar datos de la venta
        const saleData = {
            id: sales.length > 0 ? Math.max(...sales.map(s => s.id)) + 1 : 1,
            clientId: clientId,
            clientName: client.name,
            items: currentSaleItems.map(item => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                total: item.price * item.quantity,
                priceWithDiscount: currentDiscount ? 
                    item.price * (1 - (discountPercentage / 100)) : item.price
            })),
            subtotal: subtotal,
            discount: currentDiscount ? {
                type: currentDiscount.type,
                amount: currentDiscount.amount,
                value: discountAmount,
                reason: currentDiscount.reason,
                percentage: discountPercentage
            } : null,
            total: total,
            date: new Date().toLocaleDateString('es-PE'),
            time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
            paymentMethod: selectedPaymentMethod,
            requiresShipping: requiresShipping,
            shippingStatus: requiresShipping ? 'pending' : 'not_required',
            shippingCode: requiresShipping ? generateProductBasedCode(currentSaleItems, products) : null,
            shippingCity: requiresShipping ? document.getElementById('shipping-city').value : null,
            shippingAddress: requiresShipping ? document.getElementById('shipping-address').value : null,
            shippingReference: requiresShipping ? document.getElementById('shipping-reference').value : null,
            shippingPhone: requiresShipping ? document.getElementById('shipping-phone').value : null
        };
        
        if (isPartialPayment && selectedProducts.length > 0) {
            // CALCULAR EL TOTAL SELECCIONADO CON DESCUENTO PROPORCIONAL
            const selectedSubtotal = selectedProducts.reduce((sum, index) => {
                const item = currentSaleItems[index];
                return sum + (item.price * item.quantity);
            }, 0);
            
            // Aplicar el descuento proporcionalmente al subtotal seleccionado
            let selectedDiscountAmount = 0;
            if (currentDiscount) {
                if (currentDiscount.type === 'percentage') {
                    selectedDiscountAmount = selectedSubtotal * (currentDiscount.amount / 100);
                } else {
                    // Calcular el porcentaje del descuento sobre el total seleccionado
                    const discountProportion = selectedSubtotal / subtotal;
                    selectedDiscountAmount = discountAmount * discountProportion;
                }
            }
            
            const selectedTotal = selectedSubtotal - selectedDiscountAmount;
            const paymentAmount = parseFloat(document.getElementById('payment-amount').value) || 0;
            const paidAmount = Math.min(paymentAmount, selectedTotal);
            const pendingAmount = selectedTotal - paidAmount;
            
            if (paidAmount <= 0) {
                showAlert('❌ Ingrese un monto de pago válido', 'error');
                return;
            }
            
            // Calcular el descuento restante para productos no seleccionados
            const remainingSubtotal = subtotal - selectedSubtotal;
            let remainingDiscountAmount = 0;
            if (currentDiscount) {
                if (currentDiscount.type === 'percentage') {
                    remainingDiscountAmount = remainingSubtotal * (currentDiscount.amount / 100);
                } else {
                    const discountProportion = remainingSubtotal / subtotal;
                    remainingDiscountAmount = discountAmount * discountProportion;
                }
            }
            
            saleData.isPartialPayment = true;
            saleData.status = 'Separado';
            saleData.paidAmount = paidAmount;
            saleData.pendingAmount = pendingAmount + remainingDiscountAmount;
            saleData.selectedProducts = selectedProducts.map(index => currentSaleItems[index].productId);
            saleData.selectedTotal = selectedTotal;
            saleData.selectedDiscount = selectedDiscountAmount;
            saleData.remainingDiscount = remainingDiscountAmount;
            
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
            const newStock = product.stock - saleItem.quantity;
            if (newStock < 0) {
                throw new Error(`Stock insuficiente para ${product.name}. Stock actual: ${product.stock}, solicitado: ${saleItem.quantity}`);
            }
            return {
                ...product,
                stock: newStock
            };
        }
        return product;
    });
    
    await saveProducts(updatedProducts);
}



function clearCurrentSale() {
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
}
function updateDashboardCharts() {
  // Datos de ejemplo para los gráficos
  const monthlySalesData = [1200, 1900, 1500, 1800, 2200, 2500, 2800, 2600, 2400, 2100, 1800, 1600];
  const topProductsData = [45, 38, 32, 28, 22];
  const paymentMethodsData = [45, 30, 15, 10];
  
  // Actualizar gráfico de ventas mensuales
  dashboardCharts.monthlySalesChart.data.datasets[0].data = monthlySalesData;
  dashboardCharts.monthlySalesChart.update();
  
  // Actualizar gráfico de productos más vendidos
  dashboardCharts.topProductsChart.data.datasets[0].data = topProductsData;
  dashboardCharts.topProductsChart.update();
  
  // Actualizar gráfico de métodos de pago
  dashboardCharts.paymentMethodsChart.data.datasets[0].data = paymentMethodsData;
  dashboardCharts.paymentMethodsChart.update();
}

// Llamar estas funciones cuando se muestre el dashboard
document.addEventListener('DOMContentLoaded', function() {
  // Inicializar gráficos
  dashboardCharts = initializeDashboardCharts();
  
  // Actualizar datos
  updateDashboardStats();
  updateDashboardCharts();
});


// === FUNCIONES DEL DASHBOARD ===
async function updateDashboardStats() {
    try {
        console.log('📊 Actualizando dashboard...');
        const products = await getProducts();
        const clients = await getClients();
        const sales = await getSales();
        
        // 1. Calcular total de productos
        const totalProducts = products.length;
        document.getElementById('total-products').textContent = totalProducts;
        
        // 2. Calcular ingresos mensuales (CORREGIDO)
        const now = new Date();
        const currentMonth = now.getMonth(); // 0-11
        const currentYear = now.getFullYear();
        
        const monthlyRevenue = sales.reduce((total, sale) => {
            try {
                // Si la venta tiene fecha en formato string "dd/mm/yyyy"
                let saleDate;
                
                if (sale.date && sale.date.includes('/')) {
                    // Formato: "dd/mm/yyyy"
                    const [day, month, year] = sale.date.split('/').map(num => parseInt(num));
                    saleDate = new Date(year, month - 1, day); // month-1 porque enero es 0
                } else if (sale.date) {
                    // Intentar parsear como Date
                    saleDate = new Date(sale.date);
                } else {
                    return total;
                }
                
                // Verificar si la venta es del mes y año actual
                if (saleDate.getMonth() === currentMonth && 
                    saleDate.getFullYear() === currentYear) {
                    return total + (parseFloat(sale.total) || 0);
                }
            } catch (error) {
                console.warn('Error procesando fecha de venta:', sale.date, error);
            }
            return total;
        }, 0);
        
        document.getElementById('monthly-revenue').textContent = `S/ ${monthlyRevenue.toFixed(2)}`;
        
        // 3. Calcular total de clientes
        const totalClients = clients.length;
        document.getElementById('total-clients').textContent = totalClients;
        
        // 4. Calcular total de envíos
        const shippingSales = sales.filter(sale => sale.requiresShipping === true);
        document.getElementById('total-shipping').textContent = shippingSales.length;
        
        // 5. Calcular total de ventas
        const totalSales = sales.length;
        document.getElementById('total-sales').textContent = totalSales;
        
        // 6. Calcular envíos pendientes
        const pendingShipping = sales.filter(sale => 
            sale.requiresShipping === true && 
            sale.shippingStatus === 'pending'
        ).length;
        document.getElementById('pending-shipping').textContent = pendingShipping;
        
        // 7. Calcular productos con stock bajo
        const lowStockProducts = products.filter(p => {
            const stock = parseInt(p.stock) || 0;
            const minStock = parseInt(p.minStock) || 5;
            return stock > 0 && stock <= minStock;
        }).length;
        document.getElementById('low-stock-products').textContent = lowStockProducts;
        
        // 8. Calcular ventas del día (CORREGIDO)
        const today = new Date();
        const todayStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
        
        const todaySales = sales.filter(sale => {
            try {
                if (sale.date === todayStr) {
                    return true;
                }
                // También verificar si la fecha coincide en otro formato
                if (sale.date) {
                    const saleDate = new Date(sale.date);
                    const saleDateStr = `${saleDate.getDate().toString().padStart(2, '0')}/${(saleDate.getMonth() + 1).toString().padStart(2, '0')}/${saleDate.getFullYear()}`;
                    return saleDateStr === todayStr;
                }
                return false;
            } catch (error) {
                return false;
            }
        }).length;
        
        document.getElementById('today-sales').textContent = todaySales;
        
        // 9. Calcular ticket promedio
        let averageTicket = 0;
        if (sales.length > 0) {
            const totalRevenueAllTime = sales.reduce((sum, sale) => sum + (parseFloat(sale.total) || 0), 0);
            averageTicket = totalRevenueAllTime / sales.length;
        }
        document.getElementById('average-ticket').textContent = `S/ ${averageTicket.toFixed(2)}`;
        
        // 10. Calcular tasa de conversión
        const conversionRate = calculateConversionRate(sales, clients);
        document.getElementById('conversion-rate').textContent = `${conversionRate}%`;
        
        // 11. Actualizar alerta de stock bajo
        const outOfStockProducts = products.filter(p => (parseInt(p.stock) || 0) === 0).length;
        const totalLowStock = lowStockProducts + outOfStockProducts;
        document.getElementById('low-stock-alert').textContent = totalLowStock;
        
        // 12. Actualizar alertas críticas
        updateCriticalAlertsWithProducts(products);        
        
        // 13. Actualizar ventas recientes (SOLO ESTA FUNCIÓN EXISTE)
        loadRecentSalesSummary();
        
        
        // 14. Actualizar gráficos (si existen)
        if (window.dashboardCharts) {
            updateDashboardCharts(sales, products);
        }
        
        console.log('✅ Dashboard actualizado correctamente. Ingresos mensuales:', monthlyRevenue);
        
    } catch (error) {
        console.error('❌ Error actualizando dashboard:', error);
        showAlert('Error al actualizar dashboard: ' + error.message, 'error');
    }
}

// Función auxiliar para actualizar alertas críticas (sin parámetros)
async function updateCriticalAlerts() {
    try {
        const products = await getProducts();
        updateCriticalAlertsWithProducts(products);
    } catch (error) {
        console.error('❌ Error cargando productos para alertas:', error);
    }
}

// Renombra la función existente (para evitar conflicto)
async function updateCriticalAlertsWithProducts(products) {
    const container = document.getElementById('critical-alerts-container');
    
    if (!container) return;
    
    // Filtrar productos críticos
    const criticalProducts = products.filter(product => {
        const stock = parseInt(product.stock) || 0;
        const minStock = parseInt(product.minStock) || 5;
        return stock === 0 || stock <= minStock;
    });
    
    if (criticalProducts.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    // Crear alertas específicas
    let alertsHTML = '';
    
    // Productos sin stock
    const outOfStock = criticalProducts.filter(p => (parseInt(p.stock) || 0) === 0);
    if (outOfStock.length > 0) {
        alertsHTML += `
            <div class="alert alert-error mt-2">
                <i class="fas fa-times-circle"></i>
                <strong>${outOfStock.length} producto(s) sin stock:</strong>
                ${outOfStock.map(p => p.name).slice(0, 3).join(', ')}
                ${outOfStock.length > 3 ? `... y ${outOfStock.length - 3} más` : ''}
            </div>
        `;
    }
    
    // Productos con stock bajo
    const lowStock = criticalProducts.filter(p => {
        const stock = parseInt(p.stock) || 0;
        const minStock = parseInt(p.minStock) || 5;
        return stock > 0 && stock <= minStock;
    });
    
    if (lowStock.length > 0) {
        alertsHTML += `
            <div class="alert alert-warning mt-2">
                <i class="fas fa-exclamation-triangle"></i>
                <strong>${lowStock.length} producto(s) con stock bajo:</strong>
                ${lowStock.slice(0, 3).map(p => `${p.name} (${p.stock} unidades)`).join(', ')}
                ${lowStock.length > 3 ? `... y ${lowStock.length - 3} más` : ''}
            </div>
        `;
    }
    
    container.innerHTML = alertsHTML;
}


// Función para calcular tasa de conversión (ejemplo)
function calculateConversionRate(sales, clients) {
    if (clients.length === 0) return 0;
    
    // Contar clientes únicos que han comprado
    const clientsWithPurchases = [...new Set(sales.map(sale => sale.clientId))].length;
    const conversionRate = (clientsWithPurchases / clients.length) * 100;
    
    return Math.min(Math.round(conversionRate * 10) / 10, 100);
}


async function loadRecentSalesSummary() {
    try {
        const sales = await getSales();
        const clients = await getClients();
        const tbody = document.getElementById('recent-sales-summary-body');
        
        if (!tbody) return;
        
        // Mostrar las últimas 5 ventas
        const recentSales = sales.slice(-5).reverse();
        
        if (recentSales.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">
                        <i class="fas fa-receipt"></i>
                        <p>No hay ventas recientes</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = recentSales.map(sale => {
            const client = clients.find(c => c.id === sale.clientId);
            return `
                <tr>
                    <td>#${sale.id.toString().padStart(4, '0')}</td>
                    <td>${client ? client.name.substring(0, 20) + (client.name.length > 20 ? '...' : '') : 'N/A'}</td>
                    <td>S/ ${(sale.total || 0).toFixed(2)}</td>
                    <td>${sale.date || 'N/A'}</td>
                </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error cargando ventas recientes:', error);
    }
}



// Actualizar alerta de ventas pendientes
function updatePendingSalesAlert(sales) {
    const pendingSales = sales.filter(s => s.status === 'Separado');
    const totalPendingAmount = pendingSales.reduce((sum, sale) => sum + (parseFloat(sale.pendingAmount) || 0), 0);
    
    let pendingAlert = document.querySelector('.pending-sales-alert');
    
    if (pendingSales.length > 0) {
        if (!pendingAlert) {
            // Crear alerta si no existe
            pendingAlert = document.createElement('div');
            pendingAlert.className = 'alert alert-warning pending-sales-alert';
            pendingAlert.style.margin = '20px 0';
            pendingAlert.style.padding = '15px';
            pendingAlert.style.borderRadius = '8px';
            pendingBorder = '1px solid #ffeaa7';
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
                <button class="btn btn-success btn-sm" onclick="showSection('pending-sales')">
                    <i class="fas fa-eye"></i> Ver Pendientes
                </button>
            </div>
        `;
    } else if (pendingAlert) {
        // Eliminar alerta si no hay ventas pendientes
        pendingAlert.remove();
    }
}

// === FUNCIÓN PARA ACTUALIZAR GRÁFICOS DEL DASHBOARD ===
function updateDashboardCharts(sales, products) {
    // Verificar si los gráficos existen
    if (!window.dashboardCharts) {
        console.log('📊 Inicializando gráficos del dashboard...');
        window.dashboardCharts = initializeDashboardCharts();
    }
    
    // Datos para ventas mensuales
    const monthlyData = calculateMonthlySales(sales);
    if (window.dashboardCharts.monthlySalesChart) {
        window.dashboardCharts.monthlySalesChart.data.datasets[0].data = monthlyData;
        window.dashboardCharts.monthlySalesChart.update();
    }
    
    // Datos para productos más vendidos
    const topProductsData = calculateTopProducts(sales, products);
    if (window.dashboardCharts.topProductsChart) {
        window.dashboardCharts.topProductsChart.data.datasets[0].data = topProductsData.data;
        window.dashboardCharts.topProductsChart.data.labels = topProductsData.labels;
        window.dashboardCharts.topProductsChart.update();
    }
    
    // Datos para métodos de pago
    const paymentMethodsData = calculatePaymentMethods(sales);
    if (window.dashboardCharts.paymentMethodsChart) {
        window.dashboardCharts.paymentMethodsChart.data.datasets[0].data = paymentMethodsData.data;
        window.dashboardCharts.paymentMethodsChart.update();
    }
}

// Calcular ventas mensuales
function calculateMonthlySales(sales) {
    const monthlyData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const currentYear = new Date().getFullYear();
    
    sales.forEach(sale => {
        try {
            const saleDate = new Date(sale.date);
            if (saleDate.getFullYear() === currentYear) {
                const month = saleDate.getMonth();
                monthlyData[month] += parseFloat(sale.total) || 0;
            }
        } catch (error) {
            // Ignorar fechas inválidas
        }
    });
    
    return monthlyData;
}

// Calcular productos más vendidos
function calculateTopProducts(sales, products) {
    const productSales = {};
    
    sales.forEach(sale => {
        sale.items.forEach(item => {
            if (!productSales[item.productId]) {
                productSales[item.productId] = {
                    name: item.name,
                    quantity: 0
                };
            }
            productSales[item.productId].quantity += parseInt(item.quantity) || 0;
        });
    });
    
    const sortedProducts = Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
    
    return {
        labels: sortedProducts.map(p => p.name),
        data: sortedProducts.map(p => p.quantity)
    };
}

// Calcular métodos de pago
function calculatePaymentMethods(sales) {
    const paymentMethods = {
        efectivo: 0,
        tarjeta: 0,
        transferencia: 0,
        yape: 0
    };
    
    sales.forEach(sale => {
        const method = sale.paymentMethod || 'efectivo';
        if (paymentMethods.hasOwnProperty(method)) {
            paymentMethods[method] += parseFloat(sale.total) || 0;
        } else {
            paymentMethods.efectivo += parseFloat(sale.total) || 0;
        }
    });
    
    return {
        data: [
            paymentMethods.efectivo,
            paymentMethods.tarjeta,
            paymentMethods.transferencia,
            paymentMethods.yape
        ]
    };
}

// === MODIFICAR LA FUNCIÓN DE INICIALIZACIÓN ===
async function loadInitialData() {
    console.log('📊 Cargando datos iniciales...');
    
    try {
        await loadProductsTable();
        await loadProductsGrid();
        await loadClientsTable();
        await loadSalesHistory();
        await populateSaleSelects();
        await loadRecentSales();
        await updateDashboardStats(); // ESTA ES LA LÍNEA CLAVE
        await loadCategories();
        await loadCategoriesTable();
        
        console.log('✅ Datos iniciales cargados');
    } catch (error) {
        console.error('❌ Error cargando datos iniciales:', error);
        throw error;
    }
}

// === ACTUALIZAR setupRealtimeUpdates ===
function setupRealtimeUpdates() {
    console.log('🔄 Configurando actualizaciones en tiempo real...');
    
    // Escuchar cambios en productos
    database.ref('products').on('value', () => {
        loadProductsTable();
        loadProductsGrid();
        populateSaleSelects();
        updateDashboardStats(); // Actualizar dashboard cuando cambien productos
    });
    
    // Escuchar cambios en clientes
    database.ref('clients').on('value', () => {
        loadClientsTable();
        populateSaleSelects();
        updateDashboardStats(); // Actualizar dashboard cuando cambien clientes
    });
    
    // Escuchar cambios en ventas
    database.ref('sales').on('value', () => {
        loadSalesHistory();
        loadRecentSales();
        updateDashboardStats(); // Actualizar dashboard cuando cambien ventas
        updateAllBadges();
    });
}

// === ACTUALIZAR showSection ===
function showSection(section) {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(section + '-section');
    if (target) target.classList.remove('hidden');
    
    if (section === 'dashboard') {
        updateDashboardStats(); // ACTUALIZAR CUANDO SE VISUALICE EL DASHBOARD
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
    } else if (section === 'inventory') {
        loadInventoryData();
    } else if (section === 'pending-sales') {
        loadPendingSalesSection();
    } else if (section === 'shipping') {
        loadShippingSection();
    } else if (section === 'reports') {
        loadReportsSection();
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
                <button class="btn btn-success btn-sm" onclick="showSection('pending-sales')">
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
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (sales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-receipt"></i><p>No hay ventas registradas</p></td></tr>';
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
                    <button class="btn btn-success btn-sm" onclick="downloadReceipt(${sale.id})" title="Descargar Boleta">
                        <i class="fas fa-download"></i> Descargar
                    </button>
                    ${sale.status === 'Separado' ? `
                    <button class="btn btn-warning btn-sm" onclick="showPendingSaleDetails(${sale.id})">
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
    if (!tbody) return;
    
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

// === FUNCIONES DE VENTAS PENDIENTES ===
async function loadPendingSalesSection() {
    await loadPendingSalesTable();
    await loadPendingSalesStats();
    await loadPendingReminders();
}

async function loadPendingSalesTable() {
    const sales = await getSales();
    const clients = await getClients();
    const products = await getProducts(); // Obtener todos los productos
    const tbody = document.getElementById('pending-sales-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const pendingSales = sales.filter(sale => 
        sale.status === 'Separado' || 
        sale.status === 'Parcial' || 
        (sale.pendingAmount && sale.pendingAmount > 0)
    );
    
    if (pendingSales.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="empty-state">
                    <i class="fas fa-clock"></i>
                    <p>No hay ventas pendientes</p>
                </td>
            </tr>
        `;
        return;
    }
    
    pendingSales.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    pendingSales.forEach(sale => {
        const client = clients.find(c => c.id === sale.clientId);
        const statusClass = getPendingStatusClass(sale.status);
        const isOverdue = isSaleOverdue(sale);
        
        // Generar HTML de productos con imágenes
        const productsHTML = sale.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            const imageHTML = product?.image 
                ? `<img src="${product.image}" alt="${item.name}" class="product-mini-image" onerror="this.style.display='none'">`
                : `<div class="product-mini-icon"><i class="fas fa-box"></i></div>`;
            
            return `
                <div class="product-mini-item">
                    <div class="product-mini-image-container">
                        ${imageHTML}
                    </div>
                    <div class="product-mini-info">
                        <span class="product-mini-name">${item.name}</span>
                        <span class="product-mini-quantity">(${item.quantity} und.)</span>
                    </div>
                </div>
            `;
        }).join('');
        
        const row = document.createElement('tr');
        row.className = isOverdue ? 'overdue-sale' : '';
        row.innerHTML = `
            <td>
                <strong>#${sale.id.toString().padStart(4, '0')}</strong>
                ${isOverdue ? '<br><small class="overdue-badge">VENCIDA</small>' : ''}
            </td>
            <td>
                <div class="client-info-small">
                    <strong>${client ? client.name : 'N/A'}</strong>
                    <br>
                    <small>${client ? client.phone || 'Sin teléfono' : ''}</small>
                </div>
            </td>
            <td>${sale.date}</td>
            <td>
                <div class="products-preview-with-images">
                    ${productsHTML}
                    ${sale.items.length > 2 ? `<span class="more-products">+${sale.items.length - 2} más</span>` : ''}
                </div>
            </td>
            <td><strong>S/ ${sale.total.toFixed(2)}</strong></td>
            <td>S/ ${sale.paidAmount ? sale.paidAmount.toFixed(2) : '0.00'}</td>
            <td><strong class="pending-amount">S/ ${sale.pendingAmount ? sale.pendingAmount.toFixed(2) : sale.total.toFixed(2)}</strong></td>
            <td>
                <span class="status-badge ${statusClass}">${sale.status}</span>
            </td>
            <td>
                ${sale.deliveryDate ? `
                    <span class="${isOverdue ? 'overdue-date' : ''}">${sale.deliveryDate}</span>
                ` : '<span class="no-date">No definida</span>'}
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-primary btn-sm" onclick="managePendingSale(${sale.id})">
                        <i class="fas fa-edit"></i> Gestionar
                    </button>
                    <button class="btn btn-success btn-sm" onclick="completePendingSale(${sale.id})">
                        <i class="fas fa-check"></i> Completar
                    </button>
                    <button class="btn btn-info btn-sm" onclick="showSaleReceipt(${sale.id})">
                        <i class="fas fa-receipt"></i> Ver
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function getPendingStatusClass(status) {
    switch(status) {
        case 'Separado': return 'status-separado';
        case 'Parcial': return 'status-parcial';
        case 'Entregado': return 'status-entregado';
        default: return 'status-pendiente';
    }
}

function isSaleOverdue(sale) {
    if (!sale.deliveryDate) return false;
    const deliveryDate = new Date(sale.deliveryDate);
    const today = new Date();
    return deliveryDate < today;
}

async function loadPendingSalesStats() {
    const sales = await getSales();
    const pendingSales = sales.filter(sale => 
        sale.status === 'Separado' || 
        sale.status === 'Parcial' || 
        (sale.pendingAmount && sale.pendingAmount > 0)
    );
    
    const totalPendingAmount = pendingSales.reduce((sum, sale) => 
        sum + (sale.pendingAmount || sale.total), 0
    );
    
    const deliveredSales = sales.filter(sale => sale.status === 'Entregado');
    const overdueSales = pendingSales.filter(sale => isSaleOverdue(sale));
    
    document.getElementById('total-pending-sales').textContent = pendingSales.length;
    document.getElementById('total-pending-amount').textContent = `S/ ${totalPendingAmount.toFixed(2)}`;
    document.getElementById('total-delivered').textContent = deliveredSales.length;
    document.getElementById('overdue-sales').textContent = overdueSales.length;
    
    const badge = document.getElementById('pending-sales-badge');
    if (badge) {
        badge.textContent = pendingSales.length;
        badge.style.display = pendingSales.length > 0 ? 'flex' : 'none';
    }
}

async function loadPendingReminders() {
    const sales = await getSales();
    const clients = await getClients();
    const container = document.getElementById('pending-reminders');
    if (!container) return;
    
    const pendingSales = sales.filter(sale => 
        (sale.status === 'Separado' || sale.status === 'Parcial') && 
        sale.deliveryDate
    );
    
    if (pendingSales.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i>
                No hay recordatorios de entregas pendientes.
            </div>
        `;
        return;
    }
    
    pendingSales.sort((a, b) => new Date(a.deliveryDate) - new Date(b.deliveryDate));
    
    container.innerHTML = '';
    
    pendingSales.forEach(sale => {
        const client = clients.find(c => c.id === sale.clientId);
        const deliveryDate = new Date(sale.deliveryDate);
        const today = new Date();
        const daysDiff = Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24));
        
        let alertType = 'info';
        let icon = 'fa-calendar';
        let message = '';
        
        if (daysDiff < 0) {
            alertType = 'error';
            icon = 'fa-exclamation-triangle';
            message = `ENTREGA VENCIDA hace ${Math.abs(daysDiff)} días`;
        } else if (daysDiff === 0) {
            alertType = 'warning';
            icon = 'fa-bell';
            message = 'ENTREGA PARA HOY';
        } else if (daysDiff <= 3) {
            alertType = 'warning';
            icon = 'fa-clock';
            message = `Entrega en ${daysDiff} día${daysDiff > 1 ? 's' : ''}`;
        } else {
            return;
        }
        
        const reminder = document.createElement('div');
        reminder.className = `alert alert-${alertType} reminder-item`;
        reminder.innerHTML = `
            <div class="reminder-content">
                <div class="reminder-header">
                    <i class="fas ${icon}"></i>
                    <strong>${message}</strong>
                </div>
                <div class="reminder-details">
                    <span><strong>Venta #${sale.id.toString().padStart(4, '0')}</strong> - ${client ? client.name : 'N/A'}</span>
                    <span>Entrega: ${sale.deliveryDate}</span>
                    <span>Pendiente: S/ ${sale.pendingAmount ? sale.pendingAmount.toFixed(2) : sale.total.toFixed(2)}</span>
                </div>
                <div class="reminder-actions">
                    <button class="btn btn-primary btn-sm" onclick="managePendingSale(${sale.id})">
                        <i class="fas fa-edit"></i> Gestionar
                    </button>
                    <button class="btn btn-success btn-sm" onclick="completePendingSale(${sale.id})">
                        <i class="fas fa-check"></i> Completar
                    </button>
                </div>
            </div>
        `;
        container.appendChild(reminder);
    });
}

async function managePendingSale(saleId) {
    const sales = await getSales();
    const clients = await getClients();
    const products = await getProducts();
    
    currentPendingSale = sales.find(s => s.id === saleId);
    
    if (!currentPendingSale) {
        showAlert('Venta no encontrada', 'error');
        return;
    }
    
    const client = clients.find(c => c.id === currentPendingSale.clientId);
    
    const detailsContainer = document.getElementById('pending-sale-details');
    detailsContainer.innerHTML = `
        <div class="sale-header-info">
            <div class="sale-basic-info">
                <h4>Venta #${currentPendingSale.id.toString().padStart(4, '0')}</h4>
                <p><strong>Cliente:</strong> ${client ? client.name : 'N/A'}</p>
                <p><strong>Teléfono:</strong> ${client ? client.phone || 'No registrado' : 'N/A'}</p>
                <p><strong>Fecha de separación:</strong> ${currentPendingSale.date}</p>
            </div>
            <div class="sale-financial-info">
                <div class="financial-item">
                    <label>Total:</label>
                    <span>S/ ${currentPendingSale.total.toFixed(2)}</span>
                </div>
                <div class="financial-item">
                    <label>Pagado:</label>
                    <span>S/ ${currentPendingSale.paidAmount ? currentPendingSale.paidAmount.toFixed(2) : '0.00'}</span>
                </div>
                <div class="financial-item pending">
                    <label>Pendiente:</label>
                    <span>S/ ${currentPendingSale.pendingAmount ? currentPendingSale.pendingAmount.toFixed(2) : currentPendingSale.total.toFixed(2)}</span>
                </div>
            </div>
        </div>
        
        <div class="sale-products-list">
            <h5>Productos Separados</h5>
            <div class="products-table">
                ${currentPendingSale.items.map(item => {
                    const product = products.find(p => p.id === item.productId);
                    return `
                        <div class="product-row">
                            <div class="product-info">
                                <strong>${item.name}</strong>
                                <span>Cantidad: ${item.quantity}</span>
                            </div>
                            <div class="product-pricing">
                                <span>S/ ${item.price.toFixed(2)} c/u</span>
                                <span class="product-total">S/ ${item.total.toFixed(2)}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    
    await loadSaleHistory(saleId);
    document.getElementById('pending-sale-modal').style.display = 'flex';
}

async function loadSaleHistory(saleId) {
    const timeline = document.getElementById('sale-history-timeline');
    const historyEvents = [
        {
            date: new Date().toLocaleDateString('es-PE'),
            time: new Date().toLocaleTimeString('es-PE'),
            action: 'Venta gestionada',
            user: 'Administrador',
            details: 'Revisión de estado de la venta pendiente'
        }
    ];
    
    timeline.innerHTML = historyEvents.map(event => `
        <div class="timeline-event">
            <div class="event-dot"></div>
            <div class="event-content">
                <div class="event-header">
                    <strong>${event.action}</strong>
                    <span class="event-time">${event.date} ${event.time}</span>
                </div>
                <div class="event-details">
                    <span>Por: ${event.user}</span>
                    ${event.details ? `<span> - ${event.details}</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

async function completePendingSale(saleId) {
    if (confirm('¿Está seguro de marcar esta venta como COMPLETADA?\n\nEsta acción actualizará el stock y marcará la venta como pagada.')) {
        const sales = await getSales();
        const products = await getProducts();
        
        const saleIndex = sales.findIndex(s => s.id === saleId);
        if (saleIndex === -1) return;
        
        const sale = sales[saleIndex];
        
        if (sale.status === 'Separado') {
            const updatedProducts = products.map(product => {
                const saleItem = sale.items.find(item => item.productId === product.id);
                if (saleItem) {
                    return {
                        ...product,
                        stock: product.stock - saleItem.quantity
                    };
                }
                return product;
            });
            
            await saveProducts(updatedProducts);
        }
        
        sales[saleIndex] = {
            ...sale,
            status: 'Pagado',
            paidAmount: sale.total,
            pendingAmount: 0,
            deliveryDate: new Date().toLocaleDateString('es-PE'),
            deliveryStatus: 'entregado'
        };
        
        await saveSales(sales);
        
        showAlert('✅ Venta completada exitosamente. Stock actualizado.', 'success');
        
        loadPendingSalesSection();
        loadSalesHistory();
        updateDashboardStats();
        document.getElementById('pending-sale-modal').style.display = 'none';
    }
}

async function savePendingSaleManagement() {
    if (!currentPendingSale) return;
    
    const additionalPayment = parseFloat(document.getElementById('additional-payment').value) || 0;
    const paymentMethod = document.getElementById('additional-payment-method').value;
    const paymentNotes = document.getElementById('payment-notes').value;
    const deliveryStatus = document.getElementById('delivery-status').value;
    const deliveryDate = document.getElementById('delivery-date').value;
    const deliveryNotes = document.getElementById('delivery-notes').value;
    
    const sales = await getSales();
    const saleIndex = sales.findIndex(s => s.id === currentPendingSale.id);
    
    if (saleIndex === -1) return;
    
    let updatedSale = { ...sales[saleIndex] };
    
    if (additionalPayment > 0) {
        const newPaidAmount = (updatedSale.paidAmount || 0) + additionalPayment;
        const newPendingAmount = Math.max(0, updatedSale.total - newPaidAmount);
        
        updatedSale.paidAmount = newPaidAmount;
        updatedSale.pendingAmount = newPendingAmount;
        updatedSale.status = newPendingAmount > 0 ? 'Parcial' : 'Pagado';
        
        if (!updatedSale.paymentHistory) {
            updatedSale.paymentHistory = [];
        }
        
        updatedSale.paymentHistory.push({
            date: new Date().toLocaleDateString('es-PE'),
            amount: additionalPayment,
            method: paymentMethod,
            notes: paymentNotes
        });
    }
    
    updatedSale.deliveryStatus = deliveryStatus;
    if (deliveryDate) {
        updatedSale.deliveryDate = deliveryDate;
    }
    if (deliveryNotes) {
        updatedSale.deliveryNotes = deliveryNotes;
    }
    
    if (deliveryStatus === 'entregado' && updatedSale.status !== 'Pagado') {
        const products = await getProducts();
        const updatedProducts = products.map(product => {
            const saleItem = updatedSale.items.find(item => item.productId === product.id);
            if (saleItem) {
                return {
                    ...product,
                    stock: product.stock - saleItem.quantity
                };
            }
            return product;
        });
        
        await saveProducts(updatedProducts);
        updatedSale.status = 'Entregado';
    }
    
    sales[saleIndex] = updatedSale;
    await saveSales(sales);
    
    showAlert('✅ Gestión de venta guardada correctamente', 'success');
    loadPendingSalesSection();
    document.getElementById('pending-sale-modal').style.display = 'none';
}

function toggleDeliveryFields() {
    const deliveryStatus = document.getElementById('delivery-status').value;
    const notesContainer = document.getElementById('delivery-notes-container');
    
    if (deliveryStatus === 'entregado') {
        notesContainer.style.display = 'block';
        document.getElementById('delivery-date').value = new Date().toISOString().split('T')[0];
    } else {
        notesContainer.style.display = 'none';
    }
}

async function markAsDelivered() {
    if (!currentPendingSale) return;
    
    if (confirm('¿Marcar esta venta como ENTREGADA?\n\nEsta acción actualizará el stock y completará la venta.')) {
        document.getElementById('delivery-status').value = 'entregado';
        document.getElementById('delivery-date').value = new Date().toISOString().split('T')[0];
        toggleDeliveryFields();
        
        setTimeout(() => {
            savePendingSaleManagement();
        }, 500);
    }
}

async function cancelPendingSale() {
    if (!currentPendingSale) return;
    
    if (confirm('¿Está seguro de CANCELAR esta venta pendiente?\n\nEsta acción no se puede deshacer y los productos volverán al stock.')) {
        const sales = await getSales();
        const saleIndex = sales.findIndex(s => s.id === currentPendingSale.id);
        
        if (saleIndex === -1) return;
        
        sales.splice(saleIndex, 1);
        await saveSales(sales);
        
        showAlert('✅ Venta pendiente cancelada', 'success');
        loadPendingSalesSection();
        updateDashboardStats();
        document.getElementById('pending-sale-modal').style.display = 'none';
    }
}

function printPendingSaleReceipt() {
    if (!currentPendingSale) return;
    showSaleReceipt(currentPendingSale.id);
}

// === FUNCIONES DE INVENTARIO ===
async function loadInventoryData() {
    await loadInventoryTable();
    await loadInventoryStats();
    await loadInventoryMovements();
    await loadCriticalStockAlerts();
}

async function loadInventoryTable() {
    const products = await getProducts();
    const tbody = document.getElementById('inventory-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><i class="fas fa-boxes"></i><p>No hay productos en inventario</p></td></tr>';
        return;
    }
    
    products.forEach(product => {
        const statusClass = getStockStatusClass(product.stock, product.minStock);
        const statusText = getStockStatusText(product.stock, product.minStock);
        const stockValue = (product.price * product.stock).toFixed(2);
        
        // MOSTRAR IMAGEN DEL PRODUCTO EN LA TABLA
        const imageHTML = product.image 
            ? `<img src="${product.image}" alt="${product.name}" class="product-table-image-small" onerror="this.style.display='none'">`
            : `<div class="product-table-icon-small"><i class="fas fa-box"></i></div>`;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="product-info-small">
                    <div class="product-image-cell-small">
                        ${imageHTML}
                    </div>
                    <div class="product-text-info">
                        <strong>${product.name}</strong>
                        <br>
                        <small>ID: ${product.id}</small>
                    </div>
                </div>
            </td>
            <td>${product.category}</td>
            <td>
                <span class="stock-badge ${statusClass}">${product.stock}</span>
            </td>
            <td>${product.minStock || 5}</td>
            <td>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </td>
            <td>S/ ${stockValue}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-primary btn-sm" onclick="quickAdjustStock(${product.id})">
                        <i class="fas fa-edit"></i> Ajustar
                    </button>
                    <button class="btn btn-info btn-sm" onclick="viewProductMovements(${product.id})">
                        <i class="fas fa-history"></i> Historial
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function getStockStatusClass(stock, minStock) {
    if (stock === 0) return 'out-of-stock';
    if (stock <= minStock) return 'low-stock';
    return 'in-stock';
}

function getStockStatusText(stock, minStock) {
    if (stock === 0) return 'Sin Stock';
    if (stock <= minStock) return 'Stock Bajo';
    return 'En Stock';
}

async function loadInventoryStats() {
    const products = await getProducts();
    const movements = await getInventoryMovements();
    
    const totalValue = products.reduce((sum, product) => {
        return sum + (product.price * product.stock);
    }, 0);
    
    const lowStockCount = products.filter(product => {
        return product.stock > 0 && product.stock <= (product.minStock || 5);
    }).length;
    
    const outOfStockCount = products.filter(product => product.stock === 0).length;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyMovements = movements.filter(movement => {
        const movementDate = new Date(movement.date);
        return movementDate.getMonth() === currentMonth && 
               movementDate.getFullYear() === currentYear;
    }).length;
    
    document.getElementById('total-inventory-value').textContent = `S/ ${totalValue.toFixed(2)}`;
    document.getElementById('low-stock-count').textContent = lowStockCount;
    document.getElementById('out-of-stock-count').textContent = outOfStockCount;
    document.getElementById('monthly-movements').textContent = monthlyMovements;
}

async function loadInventoryMovements() {
    const movements = await getInventoryMovements();
    const products = await getProducts();
    const tbody = document.getElementById('movements-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (movements.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><i class="fas fa-exchange-alt"></i><p>No hay movimientos registrados</p></td></tr>';
        return;
    }
    
    movements.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    movements.forEach(movement => {
        const product = products.find(p => p.id === movement.productId);
        const typeClass = getMovementTypeClass(movement.type);
        const typeText = getMovementTypeText(movement.type);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${movement.date}</td>
            <td>${product ? product.name : 'Producto no encontrado'}</td>
            <td><span class="movement-badge ${typeClass}">${typeText}</span></td>
            <td>${movement.quantity}</td>
            <td>${movement.previousStock}</td>
            <td>${movement.newStock}</td>
            <td>${movement.reason}</td>
            <td>${movement.user || 'Sistema'}</td>
        `;
        tbody.appendChild(row);
    });
}

function getMovementTypeClass(type) {
    switch(type) {
        case 'entry': return 'movement-entry';
        case 'sale': return 'movement-sale';
        case 'adjustment_increment': return 'movement-adjustment-positive';
        case 'adjustment_decrement': return 'movement-adjustment-negative';
        case 'adjustment_set': return 'movement-adjustment-neutral';
        default: return 'movement-other';
    }
}

function getMovementTypeText(type) {
    switch(type) {
        case 'entry': return 'Entrada';
        case 'sale': return 'Venta';
        case 'adjustment_increment': return 'Ajuste +';
        case 'adjustment_decrement': return 'Ajuste -';
        case 'adjustment_set': return 'Ajuste =';
        default: return 'Otro';
    }
}

async function loadCriticalStockAlerts() {
    const products = await getProducts();
    const container = document.getElementById('critical-stock-alerts');
    if (!container) return;
    
    const criticalProducts = products.filter(product => 
        product.stock === 0 || product.stock <= (product.minStock || 5)
    );
    
    if (criticalProducts.length === 0) {
        container.innerHTML = `
            <div class="alert alert-success">
                <i class="fas fa-check-circle"></i>
                <strong>¡Todo en orden!</strong> No hay productos con stock crítico.
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    criticalProducts.forEach(product => {
        const alertType = product.stock === 0 ? 'error' : 'warning';
        const alertIcon = product.stock === 0 ? 'fa-times-circle' : 'fa-exclamation-triangle';
        const alertText = product.stock === 0 ? 'SIN STOCK' : 'STOCK BAJO';
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${alertType}`;
        alert.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas ${alertIcon}"></i>
                    <div>
                        <strong>${product.name}</strong> - ${product.category}
                        <br>
                        <small>Stock actual: ${product.stock} | Stock mínimo: ${product.minStock || 5}</small>
                    </div>
                </div>
                <button class="btn btn-primary btn-sm" onclick="quickAdjustStock(${product.id})">
                    <i class="fas fa-edit"></i> Ajustar
                </button>
            </div>
        `;
        container.appendChild(alert);
    });
}

function filterInventory() {
    const searchTerm = document.getElementById('inventory-search').value.toLowerCase();
    const rows = document.querySelectorAll('#inventory-table-body tr');
    
    rows.forEach(row => {
        const productName = row.querySelector('td:first-child strong')?.textContent.toLowerCase() || '';
        const category = row.querySelector('td:nth-child(2)')?.textContent.toLowerCase() || '';
        
        if (productName.includes(searchTerm) || category.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function filterMovements() {
    const filterValue = document.getElementById('movement-filter').value;
    const rows = document.querySelectorAll('#movements-table-body tr');
    
    rows.forEach(row => {
        if (filterValue === 'all') {
            row.style.display = '';
            return;
        }
        
        const movementType = row.querySelector('.movement-badge')?.textContent.toLowerCase() || '';
        let shouldShow = false;
        
        switch(filterValue) {
            case 'entry':
                shouldShow = movementType === 'entrada';
                break;
            case 'sale':
                shouldShow = movementType === 'venta';
                break;
            case 'adjustment':
                shouldShow = movementType.includes('ajuste');
                break;
        }
        
        row.style.display = shouldShow ? '' : 'none';
    });
}

// === FUNCIONES DE MODALES DE INVENTARIO ===
async function showStockAdjustmentModal() {
    const products = await getProducts();
    const select = document.getElementById('adjustment-product');
    if (!select) return;
    
    select.innerHTML = '<option value="">Seleccione producto</option>';
    products.forEach(product => {
        select.innerHTML += `<option value="${product.id}">${product.name} (Stock: ${product.stock})</option>`;
    });
    
    document.getElementById('stock-adjustment-modal').style.display = 'flex';
}

function hideStockAdjustmentModal() {
    document.getElementById('stock-adjustment-modal').style.display = 'none';
    document.getElementById('stock-adjustment-form').reset();
    document.getElementById('stock-info-card').style.display = 'none';
}

async function loadProductStockInfo() {
    const productId = document.getElementById('adjustment-product').value;
    
    if (!productId) {
        document.getElementById('stock-info-card').style.display = 'none';
        return;
    }
    
    const products = await getProducts();
    const product = products.find(p => p.id === parseInt(productId));
    
    if (product) {
        document.getElementById('current-stock').textContent = product.stock;
        document.getElementById('min-stock').textContent = product.minStock || 5;
        document.getElementById('unit-value').textContent = `S/ ${product.price.toFixed(2)}`;
        document.getElementById('stock-info-card').style.display = 'block';
    }
}

function toggleAdjustmentReason() {
    const reason = document.getElementById('adjustment-reason').value;
    const customContainer = document.getElementById('custom-reason-container');
    
    if (reason === 'other') {
        customContainer.style.display = 'block';
    } else {
        customContainer.style.display = 'none';
    }
}

async function applyStockAdjustment() {
    const productId = document.getElementById('adjustment-product').value;
    const adjustmentType = document.getElementById('adjustment-type').value;
    const quantity = parseInt(document.getElementById('adjustment-quantity').value);
    const reason = document.getElementById('adjustment-reason').value;
    const customReason = document.getElementById('custom-adjustment-reason').value;
    const notes = document.getElementById('adjustment-notes').value;
    
    if (!productId || !quantity || quantity <= 0 || !reason) {
        showAlert('Complete todos los campos requeridos', 'error');
        return;
    }
    
    const products = await getProducts();
    const product = products.find(p => p.id === parseInt(productId));
    
    if (!product) {
        showAlert('Producto no encontrado', 'error');
        return;
    }
    
    const previousStock = product.stock;
    let newStock = previousStock;
    let movementType = '';
    
    switch(adjustmentType) {
        case 'increment':
            newStock = previousStock + quantity;
            movementType = 'adjustment_increment';
            break;
        case 'decrement':
            if (quantity > previousStock) {
                showAlert('No puede reducir más stock del disponible', 'error');
                return;
            }
            newStock = previousStock - quantity;
            movementType = 'adjustment_decrement';
            break;
        case 'set':
            newStock = quantity;
            movementType = 'adjustment_set';
            break;
    }
    
    product.stock = newStock;
    await saveProducts(products);
    
    await recordInventoryMovement({
        productId: parseInt(productId),
        type: movementType,
        quantity: adjustmentType === 'set' ? (newStock - previousStock) : quantity,
        previousStock: previousStock,
        newStock: newStock,
        reason: customReason || reason,
        notes: notes,
        user: 'Administrador',
        date: new Date().toLocaleDateString('es-PE')
    });
    
    showAlert(`Stock ajustado correctamente: ${previousStock} → ${newStock}`, 'success');
    hideStockAdjustmentModal();
    loadInventoryData();
}

async function recordInventoryMovement(movement) {
    const movements = await getInventoryMovements();
    const newId = movements.length > 0 ? Math.max(...movements.map(m => m.id)) + 1 : 1;
    
    movements.push({
        id: newId,
        ...movement
    });
    
    await saveInventoryMovements(movements);
}

async function quickAdjustStock(productId) {
    const products = await getProducts();
    const product = products.find(p => p.id === productId);
    
    if (!product) return;
    
    const newStock = prompt(`Ajuste rápido de stock para: ${product.name}\n\nStock actual: ${product.stock}\nIngrese nuevo stock:`, product.stock);
    
    if (newStock === null) return;
    
    const stockValue = parseInt(newStock);
    if (isNaN(stockValue) || stockValue < 0) {
        showAlert('Ingrese un valor válido para el stock', 'error');
        return;
    }
    
    const previousStock = product.stock;
    product.stock = stockValue;
    await saveProducts(products);
    
    await recordInventoryMovement({
        productId: productId,
        type: 'adjustment_set',
        quantity: stockValue - previousStock,
        previousStock: previousStock,
        newStock: stockValue,
        reason: 'Ajuste rápido',
        notes: 'Ajuste realizado desde el panel de inventario',
        user: 'Administrador',
        date: new Date().toLocaleDateString('es-PE')
    });
    
    showAlert(`Stock actualizado: ${previousStock} → ${stockValue}`, 'success');
    loadInventoryData();
}

async function showInventoryEntryModal() {
    const products = await getProducts();
    const select = document.getElementById('entry-product');
    if (!select) return;
    
    select.innerHTML = '<option value="">Seleccione producto</option>';
    products.forEach(product => {
        select.innerHTML += `<option value="${product.id}">${product.name}</option>`;
    });
    
    document.getElementById('inventory-entry-modal').style.display = 'flex';
}

function hideInventoryEntryModal() {
    document.getElementById('inventory-entry-modal').style.display = 'none';
    document.getElementById('inventory-entry-form').reset();
}

async function loadProductCostInfo() {
    const productId = document.getElementById('entry-product').value;
    
    if (!productId) return;
    
    const products = await getProducts();
    const product = products.find(p => p.id === parseInt(productId));
    
    if (product && product.cost) {
        document.getElementById('entry-unit-cost').value = product.cost;
        calculateEntryTotalCost();
    }
}

function calculateEntryTotalCost() {
    const quantity = parseInt(document.getElementById('entry-quantity').value) || 0;
    const unitCost = parseFloat(document.getElementById('entry-unit-cost').value) || 0;
    const totalCost = quantity * unitCost;
    
    document.getElementById('entry-total-cost').value = totalCost.toFixed(2);
}

async function saveInventoryEntry() {
    const productId = document.getElementById('entry-product').value;
    const quantity = parseInt(document.getElementById('entry-quantity').value);
    const unitCost = parseFloat(document.getElementById('entry-unit-cost').value);
    const supplier = document.getElementById('entry-supplier').value;
    const invoice = document.getElementById('entry-invoice').value;
    const date = document.getElementById('entry-date').value;
    const notes = document.getElementById('entry-notes').value;
    
    if (!productId || !quantity || quantity <= 0 || !unitCost || unitCost <= 0) {
        showAlert('Complete todos los campos requeridos', 'error');
        return;
    }
    
    const products = await getProducts();
    const product = products.find(p => p.id === parseInt(productId));
    
    if (!product) {
        showAlert('Producto no encontrado', 'error');
        return;
    }
    
    const previousStock = product.stock;
    const newStock = previousStock + quantity;
    
    product.stock = newStock;
    if (unitCost !== product.cost) {
        product.cost = unitCost;
    }
    
    await saveProducts(products);
    
    await recordInventoryMovement({
        productId: parseInt(productId),
        type: 'entry',
        quantity: quantity,
        previousStock: previousStock,
        newStock: newStock,
        reason: 'Compra/Entrada',
        notes: `Proveedor: ${supplier}${invoice ? ` | Factura: ${invoice}` : ''}${notes ? ` | ${notes}` : ''}`,
        user: 'Administrador',
        date: date || new Date().toLocaleDateString('es-PE')
    });
    
    showAlert(`Entrada registrada: +${quantity} unidades`, 'success');
    hideInventoryEntryModal();
    loadInventoryData();
}

async function viewProductMovements(productId) {
    const movements = await getInventoryMovements();
    const products = await getProducts();
    
    const productMovements = movements
        .filter(m => m.productId === productId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        showAlert('Producto no encontrado', 'error');
        return;
    }
    
    let content = `
        <h4><i class="fas fa-history"></i> Historial de Movimientos - ${product.name}</h4>
        <p><strong>Stock actual:</strong> ${product.stock} | <strong>Stock mínimo:</strong> ${product.minStock || 5}</p>
        
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Cantidad</th>
                        <th>Stock Anterior</th>
                        <th>Stock Nuevo</th>
                        <th>Motivo</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    if (productMovements.length === 0) {
        content += `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-exchange-alt"></i>
                    <p>No hay movimientos para este producto</p>
                </td>
            </tr>
        `;
    } else {
        productMovements.forEach(movement => {
            const typeClass = getMovementTypeClass(movement.type);
            const typeText = getMovementTypeText(movement.type);
            
            content += `
                <tr>
                    <td>${movement.date}</td>
                    <td><span class="movement-badge ${typeClass}">${typeText}</span></td>
                    <td>${movement.quantity > 0 ? '+' : ''}${movement.quantity}</td>
                    <td>${movement.previousStock}</td>
                    <td>${movement.newStock}</td>
                    <td>${movement.reason}</td>
                </tr>
            `;
        });
    }
    
    content += `
                </tbody>
            </table>
        </div>
    `;
    
    const modalHTML = `
        <div class="modal" id="product-movements-modal">
            <div class="modal-dialog" style="max-width: 900px;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-history"></i> Historial de Movimientos</h3>
                        <button class="btn-close close-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-danger" onclick="closeProductMovementsModal()">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    if (!document.getElementById('product-movements-modal')) {
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    } else {
        document.getElementById('product-movements-modal').querySelector('.modal-body').innerHTML = content;
    }
    
    document.getElementById('product-movements-modal').style.display = 'flex';
    setupModalClose('product-movements-modal');
}

function closeProductMovementsModal() {
    const modal = document.getElementById('product-movements-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// === FUNCIONES DE ENVÍOS ===
async function loadShippingSection() {
    await loadShippingTable();
    await loadShippingStats();
    await loadShippingCities(); // Para el filtro de ciudades
    await loadCitiesDistribution();
}


function filterShipping(status) {
    const rows = document.querySelectorAll('#shipping-table-body tr');
    const filterButtons = document.querySelectorAll('.filter-buttons .btn');
    
    // Remover clase active de todos los botones
    filterButtons.forEach(btn => btn.classList.remove('active'));
    
    // Agregar clase active al botón clickeado
    event.target.classList.add('active');
    
    rows.forEach(row => {
        if (row.classList.contains('empty-state')) return;
        
        const statusBadge = row.querySelector('.status-badge');
        if (!statusBadge) return;
        
        const statusClass = statusBadge.className;
        
        let shouldShow = true;
        
        if (status !== 'all') {
            if (status === 'pending' && !statusClass.includes('pending')) shouldShow = false;
            if (status === 'transit' && !statusClass.includes('transit')) shouldShow = false;
            if (status === 'delivered' && !statusClass.includes('delivered')) shouldShow = false;
        }
        
        row.style.display = shouldShow ? '' : 'none';
    });
}


async function loadShippingTable() {
    const sales = await getSales();
    const clients = await getClients();
    const products = await getProducts();
    const tbody = document.getElementById('shipping-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const shippingSales = sales.filter(sale => sale.requiresShipping === true);
    
    if (shippingSales.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    <i class="fas fa-shipping-fast"></i>
                    <p>No hay envíos registrados</p>
                </td>
            </tr>
        `;
        return;
    }
    
    shippingSales.sort((a, b) => {
        if (a.shippingStatus === 'pending' && b.shippingStatus !== 'pending') return -1;
        if (a.shippingStatus !== 'pending' && b.shippingStatus === 'pending') return 1;
        return new Date(b.date) - new Date(a.date);
    });
    
    shippingSales.forEach(sale => {
        const client = clients.find(c => c.id === sale.clientId);
        
        if (!sale.shippingCode) {
            sale.shippingCode = generateProductBasedCode(sale.items, products);
        }
        
        let statusText, statusClass, badgeIcon, isDisabled = false;
        switch(sale.shippingStatus) {
            case 'sent':
            case 'transit':
                statusText = 'EN TRÁNSITO';
                statusClass = 'status-transit';
                badgeIcon = 'fa-truck';
                break;
            case 'delivered':
                statusText = 'ENVIADO ✓';
                statusClass = 'status-delivered';
                badgeIcon = 'fa-check-circle';
                isDisabled = true; // ¡IMPORTANTE! Esto marca como deshabilitado
                break;
            case 'cancelled':
                statusText = 'CANCELADO';
                statusClass = 'status-cancelled';
                badgeIcon = 'fa-times-circle';
                isDisabled = true;
                break;
            default:
                statusText = 'PENDIENTE';
                statusClass = 'status-pending';
                badgeIcon = 'fa-clock';
        }
        
        // Generar lista de productos con imágenes
        const productsList = sale.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            const imageHTML = product?.image 
                ? `<img src="${product.image}" alt="${item.name}" class="shipping-product-image" onerror="this.style.display='none'">`
                : `<div class="shipping-product-icon"><i class="fas fa-box"></i></div>`;
            
            return `
                <div class="shipping-product-item">
                    <div class="shipping-product-image-container">
                        ${imageHTML}
                    </div>
                    <div class="shipping-product-info">
                        <span class="shipping-product-name">${item.name}</span>
                        <span class="shipping-product-quantity">(${item.quantity})</span>
                    </div>
                </div>
            `;
        }).join('');
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${sale.id.toString().padStart(4, '0')}</td>
            <td>
                <div class="shipping-client-info">
                    <strong>${client ? client.name : 'N/A'}</strong>
                    <br>
                    <small>${client ? client.phone || 'Sin teléfono' : ''}</small>
                </div>
            </td>
            <td>
                <div class="shipping-products-summary">
                    <div class="shipping-products-images">
                        ${productsList}
                    </div>
                </div>
            </td>
            <td>${sale.shippingCity || 'No especificada'}</td>
            <td>${sale.shippingAddress || 'N/A'}</td>
            <td>${sale.date || 'N/A'}</td>
            <td>
                <div class="shipping-code">
                    <strong>${sale.shippingCode}</strong>
                </div>
            </td>
            <td>
                <span class="status-badge ${statusClass}">
                    <i class="fas ${badgeIcon}"></i> ${statusText}
                </span>
                ${sale.shippingStatus === 'delivered' && sale.sentDate ? `
                <br>
                <small class="sent-date">Enviado: ${sale.sentDate} ${sale.sentTime || ''}</small>
                ` : ''}
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-info btn-sm" onclick="showShippingDetails(${sale.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-success btn-sm" 
                            onclick="markAsSent(${sale.id})" 
                            ${isDisabled ? 'disabled' : ''}
                            style="${isDisabled ? 'opacity: 0.6; cursor: not-allowed; background-color: #95a5a6;' : ''}">
                        <i class="fas fa-check"></i>
                        ${isDisabled ? 'Enviado' : 'Enviar'}
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}


// === ACTUALIZACIONES AUTOMÁTICAS ===
function setupRealtimeUpdates() {
    console.log('🔄 Configurando actualizaciones en tiempo real...');
    
    // Escuchar cambios en ventas (para badges de pendientes y envíos)
    database.ref('sales').on('value', (snapshot) => {
        console.log('📊 Cambios detectados en ventas, actualizando badges...');
        updateAllBadges();
    });
    
    // Escuchar cambios en productos (para alertas de stock)
    database.ref('products').on('value', () => {
        updateDashboardStats();
        updateStockAlerts();
    });
    
    // Escuchar cambios en clientes
    database.ref('clients').on('value', () => {
        updateDashboardStats();
    });
}

// Función para actualizar todos los badges
async function updateAllBadges() {
    try {
        const sales = await getSales();
        
        // Actualizar badge de ventas pendientes
        const pendingSales = sales.filter(sale => 
            sale.status === 'Separado' || 
            (sale.pendingAmount && sale.pendingAmount > 0)
        );
        
        const pendingBadge = document.getElementById('pending-sales-badge');
        if (pendingBadge) {
            pendingBadge.textContent = pendingSales.length;
            pendingBadge.style.display = pendingSales.length > 0 ? 'flex' : 'none';
        }
        
        // Actualizar badge de envíos pendientes
        const shippingSales = sales.filter(sale => 
            sale.requiresShipping === true && 
            sale.shippingStatus === 'pending'
        );
        
        const shippingBadge = document.getElementById('shipping-badge');
        if (shippingBadge) {
            shippingBadge.textContent = shippingSales.length;
            shippingBadge.style.display = shippingSales.length > 0 ? 'flex' : 'none';
        }
        
        console.log('🔄 Badges actualizados:', {
            pendientes: pendingSales.length,
            envios: shippingSales.length
        });
        
    } catch (error) {
        console.error('❌ Error actualizando badges:', error);
    }
}

// Función para actualizar alertas de stock
async function updateStockAlerts() {
    const products = await getProducts();
    const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= (p.minStock || 5)).length;
    const outOfStockProducts = products.filter(p => p.stock === 0).length;
    
    const alertElement = document.getElementById('low-stock-alert');
    if (alertElement) {
        alertElement.textContent = lowStockProducts + outOfStockProducts;
    }
}


// Función para forzar actualización de estadísticas
async function refreshShippingStats() {
    await loadShippingStats();
    await loadShippingTable();
}


async function markAsPending(saleId) {
    if (confirm('¿Volver a marcar este pedido como PENDIENTE?')) {
        const sales = await getSales();
        const saleIndex = sales.findIndex(s => s.id === saleId);
        
        if (saleIndex === -1) return;
        
        sales[saleIndex].shippingStatus = 'pending';
        delete sales[saleIndex].sentDate;
        delete sales[saleIndex].sentTime;
        
        await saveSales(sales);
        
        showAlert('✅ Pedido marcado como pendiente', 'success');
        loadShippingSection();
    }
}
function getShippingStatusClass(status) {
    switch(status) {
        case 'pending': return 'status-pending';
        case 'preparing': return 'status-preparing';
        case 'transit': return 'status-transit';
        case 'delivered': return 'status-delivered';
        case 'cancelled': return 'status-cancelled';
        default: return 'status-pending';
    }
}

function getShippingStatusText(status) {
    switch(status) {
        case 'pending': return 'Pendiente';
        case 'preparing': return 'Preparando';
        case 'transit': return 'En Tránsito';
        case 'delivered': return 'Entregado';
        case 'cancelled': return 'Cancelado';
        default: return 'Pendiente';
    }
}

async function loadShippingStats() {
    const sales = await getSales();
    const shippingSales = sales.filter(sale => sale.requiresShipping === true);
    
    const pendingCount = shippingSales.filter(s => s.shippingStatus === 'pending').length;
    const transitCount = shippingSales.filter(s => s.shippingStatus === 'sent').length;
    const deliveredCount = shippingSales.filter(s => s.shippingStatus === 'delivered').length;
    const cancelledCount = shippingSales.filter(s => s.shippingStatus === 'cancelled').length;
    const totalCount = shippingSales.length;
    
    // Actualizar estadísticas principales
    document.getElementById('total-pending-shipping').textContent = pendingCount;
    document.getElementById('total-in-transit').textContent = transitCount;
    document.getElementById('total-delivered').textContent = deliveredCount;
    
    // Actualizar filtros rápidos
    document.getElementById('count-all').textContent = totalCount;
    document.getElementById('count-pending').textContent = pendingCount;
    document.getElementById('count-transit').textContent = transitCount;
    document.getElementById('count-delivered').textContent = deliveredCount;
    document.getElementById('count-cancelled').textContent = cancelledCount;
    
    // Actualizar badge en el sidebar
    const badge = document.getElementById('shipping-badge');
    if (badge) {
        badge.textContent = pendingCount;
        badge.style.display = pendingCount > 0 ? 'flex' : 'none';
    }
    
    console.log('📊 Estadísticas de envíos actualizadas:', {
        total: totalCount,
        pendientes: pendingCount,
        transito: transitCount,
        entregados: deliveredCount
    });
}


async function showShippingDetails(saleId) {
    const sales = await getSales();
    const clients = await getClients();
    const products = await getProducts();
    
    const sale = sales.find(s => s.id === saleId);
    
    if (!sale) {
        showAlert('Pedido no encontrado', 'error');
        return;
    }
    
    const client = clients.find(c => c.id === sale.clientId);
    
    // Determinar estado para mostrar - CORREGIDO
    let statusText, statusClass;
    if (sale.shippingStatus === 'delivered') {
        statusText = 'ENVIADO';
        statusClass = 'status-delivered';
    } else if (sale.shippingStatus === 'sent' || sale.shippingStatus === 'transit') {
        statusText = 'EN TRÁNSITO';
        statusClass = 'status-transit';
    } else if (sale.shippingStatus === 'pending') {
        statusText = 'PENDIENTE';
        statusClass = 'status-pending';
    } else {
        statusText = 'PENDIENTE';
        statusClass = 'status-pending';
    }
    
    const modalHTML = `
        <div class="modal" id="shipping-details-modal">
            <div class="modal-dialog" style="max-width: 600px;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-shipping-fast"></i> Detalles del Pedido</h3>
                        <button class="btn-close close-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="shipping-info-simple">
                            <div class="info-section">
                                <h4><i class="fas fa-user"></i> Cliente</h4>
                                <p><strong>Nombre:</strong> ${client ? client.name : 'N/A'}</p>
                                <p><strong>Teléfono:</strong> ${client ? client.phone || 'No registrado' : 'N/A'}</p>
                                <p><strong>Dirección:</strong> ${sale.shippingAddress || 'N/A'}</p>
                                <p><strong>Ciudad:</strong> ${sale.shippingCity || 'N/A'}</p>
                                ${sale.shippingReference ? `<p><strong>Referencia:</strong> ${sale.shippingReference}</p>` : ''}
                            </div>
                            
                            <div class="info-section">
                                <h4><i class="fas fa-boxes"></i> Productos</h4>
                                <div class="products-list-simple">
                                    ${sale.items.map(item => {
                                        const product = products.find(p => p.id === item.productId);
                                        return `
                                            <div class="product-item-simple">
                                                <span class="product-name">${item.name}</span>
                                                <span class="product-quantity">${item.quantity} und.</span>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                            
                            <div class="info-section">
                                <h4><i class="fas fa-qrcode"></i> Código de Identificación</h4>
                                <div class="code-display">
                                    <div class="code-value">${sale.shippingCode}</div>
                                    <button class="btn btn-info btn-sm" onclick="copyShippingCode('${sale.shippingCode}')">
                                        <i class="fas fa-copy"></i> Copiar
                                    </button>
                                </div>
                                <small>Este código identifica el pedido para el cliente</small>
                            </div>
                            
                            <div class="info-section">
                                <h4><i class="fas fa-info-circle"></i> Estado</h4>
                                <div class="status-info">
                                    <span class="status-badge ${statusClass}">
                                        ${statusText}
                                    </span>
                                    ${sale.shippingStatus === 'delivered' && sale.sentDate ? `
                                        <p><small>Enviado el: ${sale.sentDate} ${sale.sentTime || ''}</small></p>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        ${sale.shippingStatus === 'pending' ? `
                        <button class="btn btn-success" onclick="markAsSent(${sale.id})">
                            <i class="fas fa-check"></i> Marcar como Enviado
                        </button>
                        ` : `
                        `}
                        <button class="btn btn-danger" onclick="closeShippingModal()">
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal existente si hay
    const existingModal = document.getElementById('shipping-details-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('shipping-details-modal').style.display = 'flex';
    setupModalClose('shipping-details-modal');
}



function closeShippingModal() {
    const modal = document.getElementById('shipping-details-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function copyShippingCode(code) {
    navigator.clipboard.writeText(code).then(() => {
        showAlert('✅ Código copiado: ' + code, 'success');
    });
}
async function loadShippingTimeline(saleId) {
    const timeline = document.getElementById('shipping-timeline-content');
    
    const shippingEvents = [
        {
            date: new Date().toLocaleDateString('es-PE'),
            time: new Date().toLocaleTimeString('es-PE'),
            status: 'pending',
            action: 'Envío registrado',
            notes: 'Pedido preparado para envío'
        }
    ];
    
    timeline.innerHTML = shippingEvents.map(event => `
        <div class="timeline-event">
            <div class="event-dot ${getShippingStatusClass(event.status)}"></div>
            <div class="event-content">
                <div class="event-header">
                    <strong>${event.action}</strong>
                    <span class="event-time">${event.date} ${event.time}</span>
                </div>
                <div class="event-details">
                    <span>${event.notes}</span>
                </div>
            </div>
        </div>
    `).join('');
}

async function updateShippingStatus() {
    if (!currentShipping) return;
    
    const newStatus = document.getElementById('shipping-status-update').value;
    const updateDate = document.getElementById('status-update-date').value;
    const notes = document.getElementById('status-update-notes').value;
    
    const sales = await getSales();
    const saleIndex = sales.findIndex(s => s.id === currentShipping.id);
    
    if (saleIndex === -1) return;
    
    sales[saleIndex].shippingStatus = newStatus;
    if (updateDate) {
        sales[saleIndex].statusUpdateDate = updateDate;
    }
    
    if (!sales[saleIndex].shippingHistory) {
        sales[saleIndex].shippingHistory = [];
    }
    
    sales[saleIndex].shippingHistory.push({
        date: new Date().toLocaleDateString('es-PE'),
        status: newStatus,
        notes: notes,
        user: 'Administrador'
    });
    
    await saveSales(sales);
    
    showAlert('✅ Estado de envío actualizado', 'success');
    loadShippingSection();
    document.getElementById('shipping-details-modal').style.display = 'none';
}
function generateShippingPassword() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// Generar código numérico de 4 dígitos
function generateProductBasedCode(items, products) {
    // Generar número aleatorio de 4 dígitos (1000-9999)
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return randomNum.toString();
}

async function markAsSent(saleId) {
    if (confirm('¿Marcar este pedido como ENVIADO?\n\nEl botón se deshabilitará y mostrará el estado de ENVIADO.')) {
        const sales = await getSales();
        const saleIndex = sales.findIndex(s => s.id === saleId);
        
        if (saleIndex === -1) return;
        
        // Cambiar a 'delivered' (enviado)
        sales[saleIndex].shippingStatus = 'delivered';
        sales[saleIndex].sentDate = new Date().toLocaleDateString('es-PE');
        sales[saleIndex].sentTime = new Date().toLocaleTimeString('es-PE');
        
        await saveSales(sales);
        
        showAlert('✅ Pedido marcado como ENVIADO. El botón ahora está deshabilitado.', 'success');
        loadShippingSection();
        updateAllBadges();
    }
}

async function markMultipleAsShipped() {
    const checkboxes = document.querySelectorAll('.shipping-checkbox:checked');
    const selectedIds = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    if (selectedIds.length === 0) {
        showAlert('Seleccione al menos un envío', 'error');
        return;
    }
    
    if (confirm(`¿Marcar ${selectedIds.length} envío(s) como ENVIADOS?`)) {
        const sales = await getSales();
        
        selectedIds.forEach(saleId => {
            const saleIndex = sales.findIndex(s => s.id === saleId);
            if (saleIndex !== -1) {
                sales[saleIndex].shippingStatus = 'delivered';
                sales[saleIndex].shippedDate = new Date().toLocaleDateString('es-PE');
            }
        });
        
        await saveSales(sales);
        
        showAlert(`✅ ${selectedIds.length} envío(s) marcados como enviados`, 'success');
        loadShippingSection();
    }
}

function toggleSelectAllShipping() {
    const selectAll = document.getElementById('select-all-shipping').checked;
    const checkboxes = document.querySelectorAll('.shipping-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll;
    });
}

function filterShipping(status) {
    const rows = document.querySelectorAll('#shipping-table-body tr');
    const filterButtons = document.querySelectorAll('.filter-buttons .btn');
    
    // Remover clase active de todos los botones
    filterButtons.forEach(btn => btn.classList.remove('active'));
    
    // Agregar clase active al botón clickeado
    event.target.classList.add('active');
    
    let visibleCount = 0;
    
    rows.forEach(row => {
        if (row.classList.contains('empty-state')) {
            row.style.display = 'none';
            return;
        }
        
        const statusBadge = row.querySelector('.status-badge');
        if (!statusBadge) return;
        
        const statusClass = statusBadge.className;
        let shouldShow = true;
        
        if (status !== 'all') {
            if (status === 'pending' && !statusClass.includes('pending')) shouldShow = false;
            if (status === 'transit' && !statusClass.includes('transit')) shouldShow = false;
            if (status === 'delivered' && !statusClass.includes('delivered')) shouldShow = false;
            if (status === 'cancelled' && !statusClass.includes('cancelled')) shouldShow = false;
        }
        
        row.style.display = shouldShow ? '' : 'none';
        if (shouldShow) visibleCount++;
    });
    
    console.log(`🔍 Filtro aplicado: ${status}, Mostrando: ${visibleCount} envíos`);
}


function searchShipping() {
    const searchTerm = document.getElementById('shipping-search').value.toLowerCase();
    const rows = document.querySelectorAll('#shipping-table-body tr');
    
    rows.forEach(row => {
        if (row.classList.contains('empty-state')) return;
        
        const rowText = row.textContent.toLowerCase();
        row.style.display = rowText.includes(searchTerm) ? '' : 'none';
    });
}

function filterByCity() {
    const city = document.getElementById('shipping-city-filter').value;
    const rows = document.querySelectorAll('#shipping-table-body tr');
    
    rows.forEach(row => {
        if (row.classList.contains('empty-state')) return;
        
        const cityCell = row.querySelector('td:nth-child(5)').textContent;
        const shouldShow = city === 'all' || cityCell === city;
        
        row.style.display = shouldShow ? '' : 'none';
    });
}

async function loadShippingCities() {
    try {
        const cities = await getShippingCities();
        const filter = document.getElementById('shipping-city-filter');
        if (!filter) return;
        
        filter.innerHTML = '<option value="all">Todas las ciudades</option>';
        
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city.name;
            option.textContent = city.name;
            filter.appendChild(option);
        });
        
        console.log('🏙️ Ciudades cargadas en filtro:', cities.length);
    } catch (error) {
        console.error('❌ Error cargando ciudades:', error);
    }
}

async function loadCitiesDistribution() {
    const sales = await getSales();
    const container = document.getElementById('cities-distribution');
    if (!container) return;
    
    const cityStats = {};
    
    sales.filter(sale => sale.shippingCity).forEach(sale => {
        const city = sale.shippingCity;
        if (!cityStats[city]) {
            cityStats[city] = { count: 0, total: 0 };
        }
        cityStats[city].count++;
        cityStats[city].total += sale.total;
    });
    
    if (Object.keys(cityStats).length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No hay datos de distribución</p></div>';
        return;
    }
    
    let content = '<h4>Estadísticas por Ciudad</h4><div class="cities-stats">';
    
    Object.entries(cityStats).forEach(([city, stats]) => {
        content += `
            <div class="city-stat-item">
                <div class="city-name">${city}</div>
                <div class="city-stats">
                    <span>${stats.count} envío(s)</span>
                    <span>S/ ${stats.total.toFixed(2)}</span>
                </div>
            </div>
        `;
    });
    
    content += '</div>';
    container.innerHTML = content;
}

// === FUNCIONES DE ENVÍO EN VENTAS ===
function toggleShippingSection() {
    const requiresShipping = document.getElementById('requires-shipping');
    const shippingSection = document.getElementById('shipping-info-section');
    
    if (!requiresShipping || !shippingSection) return;
    
    if (requiresShipping.checked) {
        shippingSection.classList.remove('hidden');
        loadShippingCitiesIntoSelect();
    } else {
        shippingSection.classList.add('hidden');
        const trackingSection = document.getElementById('tracking-code-section');
        if (trackingSection) {
            trackingSection.classList.add('hidden');
        }
    }
}

async function loadShippingCitiesIntoSelect() {
    try {
        const cities = await getShippingCities();
        const select = document.getElementById('shipping-city');
        if (!select) return;
        
        select.innerHTML = '<option value="">Seleccione ciudad</option>';
        
        cities.filter(city => city.active).forEach(city => {
            const option = document.createElement('option');
            option.value = city.name;
            option.textContent = `${city.name} - S/ ${city.cost.toFixed(2)} (${city.time})`;
            option.setAttribute('data-cost', city.cost);
            option.setAttribute('data-time', city.time);
            select.appendChild(option);
        });
    } catch (error) {
        console.error('❌ Error cargando ciudades de envío:', error);
    }
}

function calculateShippingCost() {
    const citySelect = document.getElementById('shipping-city');
    if (!citySelect) return;
    
    const selectedOption = citySelect.options[citySelect.selectedIndex];
    
    if (selectedOption.value) {
        const cost = selectedOption.getAttribute('data-cost');
        const time = selectedOption.getAttribute('data-time');
        
        const costDisplay = document.getElementById('shipping-cost-display');
        const timeDisplay = document.getElementById('shipping-time-display');
        
        if (costDisplay) costDisplay.textContent = `S/ ${parseFloat(cost).toFixed(2)}`;
        if (timeDisplay) timeDisplay.textContent = time;
        
        generateTrackingCode();
    } else {
        const costDisplay = document.getElementById('shipping-cost-display');
        const timeDisplay = document.getElementById('shipping-time-display');
        const trackingSection = document.getElementById('tracking-code-section');
        
        if (costDisplay) costDisplay.textContent = 'S/ 0.00';
        if (timeDisplay) timeDisplay.textContent = '-';
        if (trackingSection) trackingSection.classList.add('hidden');
    }
}

function generateTrackingCode() {
    const trackingCode = `TRK${Date.now().toString().slice(-8)}`;
    const generatedCodeElement = document.getElementById('generated-tracking-code');
    const trackingSection = document.getElementById('tracking-code-section');
    
    if (generatedCodeElement) {
        generatedCodeElement.textContent = trackingCode;
    }
    if (trackingSection) {
        trackingSection.classList.remove('hidden');
    }
}

function copyTrackingCode() {
    const trackingCode = document.getElementById('generated-tracking-code').textContent;
    navigator.clipboard.writeText(trackingCode).then(() => {
        showAlert('✅ Código copiado al portapapeles', 'success');
    });
}

function printTrackingCode() {
    showAlert('Funcionalidad de impresión en desarrollo', 'info');
}

function sendTrackingSMS() {
    showAlert('Funcionalidad de SMS en desarrollo', 'info');
}

function generateShippingLabel() {
    showAlert('Funcionalidad de etiqueta en desarrollo', 'info');
}

// === FUNCIONES DE CONFIGURACIÓN DE CIUDADES ===
async function showShippingConfigModal() {
    await loadCitiesList();
    document.getElementById('shipping-config-modal').style.display = 'flex';
}

function hideShippingConfigModal() {
    document.getElementById('shipping-config-modal').style.display = 'none';
}

async function loadCitiesList() {
    const cities = await getShippingCities();
    const container = document.getElementById('cities-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (cities.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No hay ciudades configuradas</p></div>';
        return;
    }
    
    cities.forEach(city => {
        const cityElement = document.createElement('div');
        cityElement.className = 'city-item';
        cityElement.innerHTML = `
            <div class="city-info">
                <strong>${city.name}</strong>
                <div class="city-details">
                    <span>Costo: S/ ${city.cost.toFixed(2)}</span>
                    <span>Tiempo: ${city.time}</span>
                </div>
            </div>
            <div class="city-actions">
                <button class="btn btn-primary btn-sm" onclick="editCity(${city.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteCity(${city.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(cityElement);
    });
    
    loadCitiesIntoFilter();
}

async function addNewCity() {
    const name = document.getElementById('new-city-name').value.trim();
    const cost = parseFloat(document.getElementById('new-city-cost').value);
    const time = document.getElementById('new-city-time').value.trim();
    
    if (!name || !cost || !time) {
        showAlert('Complete todos los campos', 'error');
        return;
    }
    
    const cities = await getShippingCities();
    const newId = cities.length > 0 ? Math.max(...cities.map(c => c.id)) + 1 : 1;
    
    cities.push({
        id: newId,
        name: name,
        cost: cost,
        time: time,
        active: true
    });
    
    await saveShippingCities(cities);
    
    showAlert('✅ Ciudad agregada correctamente', 'success');
    document.getElementById('new-city-name').value = '';
    document.getElementById('new-city-cost').value = '';
    document.getElementById('new-city-time').value = '';
    
    loadCitiesList();
}

function loadCitiesIntoFilter() {
    getShippingCities().then(cities => {
        const filter = document.getElementById('shipping-city-filter');
        if (!filter) return;
        
        filter.innerHTML = '<option value="all">Todas las ciudades</option>';
        
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city.name;
            option.textContent = city.name;
            filter.appendChild(option);
        });
    });
}

async function saveShippingConfig() {
    showAlert('✅ Configuración guardada correctamente', 'success');
    hideShippingConfigModal();
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
    
    if (!dniInput || !searchBtn) return;
    
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

// === FUNCIONES DE RECIBOS ===
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
    
    // Determinar tipo de comprobante
    const isSeparation = sale.isPartialPayment && sale.status === 'Separado';
    const receiptType = isSeparation ? 'COMPROBANTE DE SEPARACIÓN' : 'BOLETA ELECTRÓNICA';
    const receiptNumber = isSeparation ? '' : 'B001';
    
    // Información de envío
    const hasShipping = sale.requiresShipping && sale.shippingCity;
    const shippingInfo = hasShipping ? `
        <div class="shipping-section">
            <div class="section-header-compact">
                <i class="fas fa-shipping-fast"></i> INFORMACIÓN DE ENVÍO
            </div>
            <div class="shipping-details-compact">
                <div class="shipping-row">
                    <span><strong><i class="fas fa-map-marker-alt"></i> Ciudad:</strong> ${sale.shippingCity}</span>
                    <span><strong><i class="fas fa-location-dot"></i> Dirección:</strong> ${sale.shippingAddress || 'N/A'}</span>
                </div>
                ${sale.shippingReference ? `
                <div class="shipping-row">
                    <span><strong><i class="fas fa-signs-post"></i> Referencia:</strong> ${sale.shippingReference}</span>
                </div>
                ` : ''}
                ${sale.shippingPhone ? `
                <div class="shipping-row">
                    <span><strong><i class="fas fa-phone"></i> Contacto:</strong> ${sale.shippingPhone}</span>
                </div>
                ` : ''}
                ${sale.shippingCode ? `
                <div class="shipping-row">
                    <span><strong><i class="fas fa-qrcode"></i> Código:</strong> ${sale.shippingCode}</span>
                </div>
                ` : ''}
            </div>
        </div>
    ` : '';

    const receiptHTML = `
        <div class="electronic-receipt" id="electronic-receipt">
            <!-- ENCABEZADO CON LOGO Y DATOS DE EMPRESA -->
            <div class="receipt-header">
                <div class="company-brand">
                    <div class="company-logo">
                        <img src="logo.png" alt="SkinBri Shop" onerror="this.style.display='none'">
                        <div class="logo-fallback">SB</div>
                    </div>
                    <div class="company-info">
                        <h1>SkinBri Shop</h1>
                        <p class="company-slogan">"Más que belleza, bienestar que sí puedes pagar."</p>
                        <div class="company-details">
                            <span><i class="fas fa-phone"></i>900 442 538 | 942 571 921</span>
                            <span><i class="fas fa-map-marker-alt"></i> Tarma – Junín</span>
                        </div>
                    </div>
                </div>
                <div class="receipt-badge">
                    <div class="badge-content">
                        <span>${receiptType}</span>
                        <div class="receipt-number">${receiptNumber}-${sale.id.toString().padStart(4, '0')}</div>
                    </div>
                </div>
            </div>

            <!-- INFORMACIÓN DE FECHA Y VENDEDOR -->
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

            <!-- DATOS DEL CLIENTE -->
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

            <!-- INFORMACIÓN DE ENVÍO (si aplica) -->
            ${hasShipping ? shippingInfo : ''}

            <!-- DETALLE DE PRODUCTOS -->
            <div class="products-section">
                <div class="section-header-compact">
                    <i class="fas fa-shopping-cart"></i> DETALLE DE PRODUCTOS
                </div>
                <div class="products-table-container">
                    <table class="products-table-compact">
                        <thead>
                            <tr>
                                <th class="product-col">DESCRIPCIÓN</th>
                                <th class="qty-col">CANT.</th>
                                <th class="price-col">P. UNIT.</th>
                                <th class="total-col">TOTAL</th>
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

            <!-- TOTALES -->
            <div class="totals-section-compact">
                <div class="totals-grid-compact">
                    <div class="total-row">
                        <span class="total-label">SUBTOTAL:</span>
                        <span class="total-value">S/ ${sale.subtotal.toFixed(2)}</span>
                    </div>
                    
                    ${sale.discount && sale.discount.value > 0 ? `
                    <div class="total-row discount-row">
                        <span class="total-label">
                            DESCUENTO:
                            ${sale.discount.reason ? `<br><small>${sale.discount.reason}</small>` : ''}
                        </span>
                        <span class="total-value">- S/ ${sale.discount.value.toFixed(2)}</span>
                    </div>
                    ` : ''}
                    
                    <div class="total-row">
                        <span class="total-label">IGV (0%):</span>
                        <span class="total-value">S/ 0.00</span>
                    </div>
                    
                    ${hasShipping ? `
                    ` : ''}
                    
                    <div class="total-row grand-total">
                        <span class="total-label">TOTAL A PAGAR:</span>
                        <span class="total-value">S/ ${sale.total.toFixed(2)}</span>
                    </div>
                    
                    ${isSeparation ? `
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

            <!-- INFORMACIÓN DE PAGO Y PIE DE PÁGINA -->
            <div class="receipt-footer-compact">
                <div class="payment-info">
                    <p><i class="fas fa-money-bill-wave"></i> <strong>Método de Pago:</strong> ${paymentMethodNames[sale.paymentMethod] || sale.paymentMethod.toUpperCase()}</p>
                    <p><i class="fas fa-check-circle"></i> <strong>Estado:</strong> 
                        <span class="sale-status ${isSeparation ? 'status-separado' : 'status-paid'}">
                            ${isSeparation ? 'SEPARADO' : 'PAGADO'}
                        </span>
                    </p>
                    ${hasShipping ? `
                    <p><i class="fas fa-truck"></i> <strong>Enviado a:</strong> ${sale.shippingCity}</p>
                    ` : ''}
                    ${isSeparation ? `
                    <p><i class="fas fa-cash-register"></i> <strong>Adelanto:</strong> S/ ${sale.paidAmount.toFixed(2)}</p>
                    <p><i class="fas fa-clock"></i> <strong>Saldo Pendiente:</strong> S/ ${sale.pendingAmount.toFixed(2)}</p>
                    ` : ''}
                </div>
                
                <div class="legal-compact">
                    <p><strong>${isSeparation ? '¡Gracias por su separación!' : '¡Gracias por su compra!'}</strong></p>
                    ${sale.discount && sale.discount.value > 0 ? `
                    <p style="color: #27ae60; font-weight: bold;">
                        <i class="fas fa-check-circle"></i> ¡Descuento aplicado! Ahorro: S/ ${sale.discount.value.toFixed(2)}
                    </p>
                    ` : ''}
                    ${hasShipping ? `
                    <p style="color: #3498db; font-weight: bold;">
                        <i class="fas fa-map-marker-alt"></i> Envío a: ${sale.shippingCity}
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

// Función auxiliar para obtener el costo de envío (puedes adaptarla según tu estructura de datos)
function getShippingCost(cityName) {
    const shippingCosts = {
        
    };
    return shippingCosts[cityName] || '0.00';
}

function updateReceiptModalFooter(saleId, client) {
    const modalFooter = document.querySelector('#sale-receipt-modal .modal-footer');
    if (!modalFooter) return;
    
    modalFooter.innerHTML = `
        <button class="btn btn-success" onclick="downloadReceipt(${saleId})">
            <i class="fas fa-download"></i> Descargar Boleta
        </button>
        <button class="btn btn-primary" onclick="printReceipt()">
            <i class="fas fa-print"></i> Imprimir
        </button>
        <button class="btn btn-whatsapp" onclick="sendReceiptByWhatsApp(${saleId})">
            <i class="fab fa-whatsapp"></i> Enviar por WhatsApp
        </button>
        <button class="btn btn-danger" onclick="closeReceiptModal()">
            <i class="fas fa-times"></i> Cerrar
        </button>
    `;
}

function sendReceiptByWhatsApp(saleId) {
    // Obtener datos de la venta
    getSales().then(sales => {
        const sale = sales.find(s => s.id === saleId);
        getClients().then(clients => {
            const client = clients.find(c => c.id === sale.clientId);
            
            if (client && client.phone) {
                // Mensaje personalizado para WhatsApp
                const message = `Hola ${client.name}, aquí tienes tu comprobante de compra de SkinBri Shop.\n\n` +
                               `*Venta #${sale.id.toString().padStart(4, '0')}*\n` +
                               `Total: S/ ${sale.total.toFixed(2)}\n` +
                               `Fecha: ${sale.date}\n\n` +
                               `¡Gracias por tu preferencia! 🛍️`;
                
                // Abrir WhatsApp con el mensaje
                const whatsappUrl = `https://wa.me/51${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
                
                showAlert('✅ Abriendo WhatsApp... Adjunta la boleta descargada', 'success');
            } else {
                showAlert('❌ El cliente no tiene número de teléfono registrado', 'error');
            }
        });
    });
}


function printReceipt() {
    try {
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
                <style>
                    @media print {
                        body { margin: 0; padding: 10px; }
                        .electronic-receipt { 
                            box-shadow: none !important;
                            border: 1px solid #000 !important;
                            margin: 0 auto !important;
                        }
                        .btn, .action-buttons, .modal-footer {
                            display: none !important;
                        }
                        * {
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                    }
                    @page {
                        margin: 10mm;
                        size: A4;
                    }
                </style>
            </head>
            <body>
                ${receiptContent.outerHTML}
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(() => window.close(), 1000);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
        
    } catch (error) {
        console.error('Error al imprimir:', error);
        showAlert('❌ Error al imprimir la boleta', 'error');
    }
}



function closeReceiptModal() {
    const modal = document.getElementById('sale-receipt-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function setupReceiptModalESC() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeReceiptModal();
        }
    });
}

// === FUNCIONES DE PAGOS PENDIENTES ===
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

function closePendingPaymentModal() {
    const modal = document.getElementById('pending-payment-modal');
    if (modal) {
        modal.style.display = 'none';
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

// === FUNCIONES UTILITARIAS ===
function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type === 'error' ? 'error' : 'success'}`;
    alert.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${message}
    `;
    
    const container = document.querySelector('.content-container');
    if (container) {
        container.insertBefore(alert, container.firstChild);
        
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 4000);
    } else {
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 4000);
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
async function regeneratePassword(saleId) {
    if (confirm('¿Generar nueva contraseña para este envío?\n\nLa contraseña anterior dejará de ser válida.')) {
        const sales = await getSales();
        const saleIndex = sales.findIndex(s => s.id === saleId);
        
        if (saleIndex === -1) return;
        
        sales[saleIndex].shippingPassword = generateShippingPassword();
        await saveSales(sales);
        
        showAlert('✅ Nueva contraseña generada', 'success');
        showShippingDetails(saleId); // Recargar detalles
        loadShippingSection(); // Actualizar tabla
    }
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

function clearAllSalesHistory() {
    getSales().then(sales => {
        if (sales.length === 0) {
            showAlert('No hay ventas en el historial', 'info');
            return;
        }
        
        if (confirm(`¿Está COMPLETAMENTE SEGURO de eliminar TODAS las ${sales.length} ventas del historial?\n\n⚠️ ADVERTENCIA: Esta acción eliminará todo el historial y reiniciará el contador a #0001.\n\n¡ESTA ACCIÓN NO SE PUEDE DESHACER!`)) {
            if (confirm('🔴 ÚLTIMA CONFIRMACIÓN:\n\n¿Realmente desea borrar TODO el historial de ventas?\n\nEscriba "SI" en su mente y presione Aceptar para continuar.')) {
                saveSales([]).then(() => {
                    showAlert('✅ Historial de ventas eliminado completamente. El contador se reinició a #0001', 'success');
                    setTimeout(() => {
                        updateDashboardStats();
                    }, 500);
                });
            }
        }
    });
}

// Funciones de ciudad (placeholder)
function editCity(id) {
    showAlert('Funcionalidad de edición de ciudad en desarrollo', 'info');
}

function deleteCity(id) {
    if (confirm('¿Está seguro de eliminar esta ciudad?')) {
        showAlert('Funcionalidad de eliminación de ciudad en desarrollo', 'info');
    }
}

// Función auxiliar para agregar producto rápidamente
function quickAddProduct() {
    if (selectedProductForCart) {
        addSelectedProductToCart();
    } else {
        showAlert('❌ Primero seleccione un producto', 'error');
    }
}
// === FUNCIONES DE FILTRADO PARA VENTAS PENDIENTES ===
function filterPendingSales() {
    const statusFilter = document.getElementById('pending-status-filter').value;
    const clientFilter = document.getElementById('pending-client-filter').value.toLowerCase();
    const dateFilter = document.getElementById('pending-date-filter').value;
    const productFilter = document.getElementById('pending-product-filter').value.toLowerCase();
    const searchFilter = document.getElementById('pending-search').value.toLowerCase();
    
    const rows = document.querySelectorAll('#pending-sales-table-body tr');
    
    rows.forEach(row => {
        if (row.classList.contains('empty-state')) return;
        
        const status = row.querySelector('.status-badge')?.textContent || '';
        const client = row.querySelector('.client-info-small strong')?.textContent.toLowerCase() || '';
        const date = row.querySelector('td:nth-child(3)')?.textContent || '';
        const products = row.querySelector('.products-preview')?.textContent.toLowerCase() || '';
        const rowText = row.textContent.toLowerCase();
        
        let shouldShow = true;
        
        // Filtro por estado
        if (statusFilter !== 'all' && status !== statusFilter) {
            shouldShow = false;
        }
        
        // Filtro por cliente
        if (clientFilter && !client.includes(clientFilter)) {
            shouldShow = false;
        }
        
        // Filtro por fecha
        if (dateFilter && date !== dateFilter) {
            shouldShow = false;
        }
        
        // Filtro por producto
        if (productFilter && !products.includes(productFilter)) {
            shouldShow = false;
        }
        
        // Filtro de búsqueda general
        if (searchFilter && !rowText.includes(searchFilter)) {
            shouldShow = false;
        }
        
        row.style.display = shouldShow ? '' : 'none';
    });
}

// === FUNCIONES DE EXPORTACIÓN ===
function exportPendingSales() {
    showAlert('📊 Función de exportación en desarrollo', 'info');
}

function exportShippingReport() {
    showAlert('📊 Función de exportación en desarrollo', 'info');
}

// === FUNCIONES DE CONFIGURACIÓN DE CIUDADES ===
async function loadCitiesList() {
    const cities = await getShippingCities();
    const container = document.getElementById('cities-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (cities.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No hay ciudades configuradas</p></div>';
        return;
    }
    
    cities.forEach(city => {
        const cityElement = document.createElement('div');
        cityElement.className = 'city-item';
        cityElement.innerHTML = `
            <div class="city-info">
                <strong>${city.name}</strong>
                <div class="city-details">
                    <span>Costo: S/ ${city.cost.toFixed(2)}</span>
                    <span>Tiempo: ${city.time}</span>
                </div>
            </div>
            <div class="city-actions">
                <button class="btn btn-primary btn-sm" onclick="editCity(${city.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteCity(${city.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(cityElement);
    });
}

async function addNewCity() {
    const name = document.getElementById('new-city-name').value.trim();
    const cost = parseFloat(document.getElementById('new-city-cost').value);
    const time = document.getElementById('new-city-time').value.trim();
    
    if (!name || !cost || !time) {
        showAlert('Complete todos los campos', 'error');
        return;
    }
    
    const cities = await getShippingCities();
    const newId = cities.length > 0 ? Math.max(...cities.map(c => c.id)) + 1 : 1;
    
    cities.push({
        id: newId,
        name: name,
        cost: cost,
        time: time,
        active: true
    });
    
    await saveShippingCities(cities);
    
    showAlert('✅ Ciudad agregada correctamente', 'success');
    document.getElementById('new-city-name').value = '';
    document.getElementById('new-city-cost').value = '';
    document.getElementById('new-city-time').value = '';
    
    loadCitiesList();
    loadShippingCitiesIntoSelect();
}

function saveShippingConfig() {
    showAlert('✅ Configuración guardada correctamente', 'success');
    hideShippingConfigModal();
}

// Funciones placeholder para ciudades
function editCity(id) {
    showAlert('Funcionalidad de edición de ciudad en desarrollo', 'info');
}

function deleteCity(id) {
    if (confirm('¿Está seguro de eliminar esta ciudad?')) {
        showAlert('Funcionalidad de eliminación de ciudad en desarrollo', 'info');
    }
}

// === FUNCIONES DE FILTRADO PARA ENVÍOS ===
function searchShipping() {
    const searchTerm = document.getElementById('shipping-search').value.toLowerCase();
    const rows = document.querySelectorAll('#shipping-table-body tr');
    
    rows.forEach(row => {
        if (row.classList.contains('empty-state')) return;
        
        const rowText = row.textContent.toLowerCase();
        row.style.display = rowText.includes(searchTerm) ? '' : 'none';
    });
}

function filterByCity() {
    const city = document.getElementById('shipping-city-filter').value;
    const rows = document.querySelectorAll('#shipping-table-body tr');
    
    rows.forEach(row => {
        if (row.classList.contains('empty-state')) return;
        
        const cityCell = row.querySelector('td:nth-child(2)')?.textContent || '';
        const shouldShow = city === 'all' || cityCell === city;
        
        row.style.display = shouldShow ? '' : 'none';
    });
}
// Agrega esta función para ver la imagen mientras escribes la URL
function setupImagePreview() {
    const imageInput = document.getElementById('product-image');
    const previewContainer = document.getElementById('image-preview');
    const previewImage = document.getElementById('preview-image');
    
    if (imageInput && previewContainer && previewImage) {
        imageInput.addEventListener('input', function() {
            if (this.value && this.value.startsWith('http')) {
                previewImage.src = this.value;
                previewContainer.style.display = 'block';
                
                // Si la imagen no carga, mostrar error
                previewImage.onerror = function() {
                    previewContainer.innerHTML = '<p style="color: red;">❌ Error al cargar la imagen</p>';
                };
                
                previewImage.onload = function() {
                    console.log('✅ Imagen cargada correctamente');
                };
            } else {
                previewContainer.style.display = 'none';
            }
        });
    }
}
// Variables globales para gráficos
let salesChart = null;
let paymentChart = null;

// Función para cargar la sección de reportes
async function loadReportsSection() {
    await loadReportsData();
    setupDateChangeListeners();
}

// Función principal para cargar datos de reportes
async function loadReportsData() {
    try {
        const sales = await getSales();
        const products = await getProducts();
        const clients = await getClients();
        
        const period = document.getElementById('report-period').value;
        const filteredSales = filterSalesByPeriod(sales, period);
        
        updateReportStats(filteredSales, products, clients);
        updateTopProductsTable(filteredSales, products);
        updateCategorySalesTable(filteredSales, products);
        updateTopClientsTable(filteredSales, clients);
        updateStockAlerts(products);
        updateCharts(filteredSales);
        
    } catch (error) {
        console.error('Error cargando reportes:', error);
        showAlert('Error al cargar los reportes', 'error');
    }
}

// Filtrar ventas por período
function filterSalesByPeriod(sales, period) {
    const now = new Date();
    let startDate = new Date();
    
    switch(period) {
        case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
        case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        case 'quarter':
            startDate.setMonth(now.getMonth() - 3);
            break;
        case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        case 'custom':
            const start = document.getElementById('start-date').value;
            const end = document.getElementById('end-date').value;
            if (start && end) {
                return sales.filter(sale => {
                    const saleDate = new Date(sale.date);
                    return saleDate >= new Date(start) && saleDate <= new Date(end);
                });
            }
            break;
    }
    
    return sales.filter(sale => new Date(sale.date) >= startDate);
}

// Actualizar estadísticas principales
function updateReportStats(sales, products, clients) {
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalProductsSold = sales.reduce((sum, sale) => 
        sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
    
    const uniqueClients = [...new Set(sales.map(sale => sale.clientId))].length;
    
    document.getElementById('total-revenue').textContent = `S/ ${totalRevenue.toFixed(2)}`;
    document.getElementById('total-sales-count').textContent = sales.length;
    document.getElementById('total-products-sold').textContent = totalProductsSold;
    document.getElementById('unique-clients').textContent = uniqueClients;
}

// Actualizar tabla de productos más vendidos
function updateTopProductsTable(sales, products) {
    const productSales = {};
    
    sales.forEach(sale => {
        sale.items.forEach(item => {
            if (!productSales[item.productId]) {
                productSales[item.productId] = {
                    name: item.name,
                    quantity: 0,
                    revenue: 0
                };
            }
            productSales[item.productId].quantity += item.quantity;
            productSales[item.productId].revenue += item.total;
        });
    });
    
    const topProducts = Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
    
    const totalRevenue = topProducts.reduce((sum, product) => sum + product.revenue, 0);
    
    const tbody = document.getElementById('top-products-body');
    tbody.innerHTML = topProducts.map(product => `
        <tr>
            <td>${product.name}</td>
            <td>${product.quantity}</td>
            <td>S/ ${product.revenue.toFixed(2)}</td>
            <td>${totalRevenue > 0 ? ((product.revenue / totalRevenue) * 100).toFixed(1) : 0}%</td>
        </tr>
    `).join('');
}

// Actualizar ventas por categoría
function updateCategorySalesTable(sales, products) {
    const categorySales = {};
    
    sales.forEach(sale => {
        sale.items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                const category = product.category || 'Sin Categoría';
                if (!categorySales[category]) {
                    categorySales[category] = {
                        sales: 0,
                        revenue: 0,
                        products: 0
                    };
                }
                categorySales[category].sales++;
                categorySales[category].revenue += item.total;
                categorySales[category].products += item.quantity;
            }
        });
    });
    
    const tbody = document.getElementById('category-sales-body');
    tbody.innerHTML = Object.entries(categorySales)
        .sort(([,a], [,b]) => b.revenue - a.revenue)
        .map(([category, data]) => `
            <tr>
                <td>${category}</td>
                <td>${data.sales}</td>
                <td>S/ ${data.revenue.toFixed(2)}</td>
                <td>${data.products}</td>
            </tr>
        `).join('');
}

// Actualizar clientes más activos
function updateTopClientsTable(sales, clients) {
    const clientStats = {};
    
    sales.forEach(sale => {
        if (!clientStats[sale.clientId]) {
            clientStats[sale.clientId] = {
                purchases: 0,
                totalSpent: 0,
                lastPurchase: sale.date
            };
        }
        clientStats[sale.clientId].purchases++;
        clientStats[sale.clientId].totalSpent += sale.total;
        if (new Date(sale.date) > new Date(clientStats[sale.clientId].lastPurchase)) {
            clientStats[sale.clientId].lastPurchase = sale.date;
        }
    });
    
    const topClients = Object.entries(clientStats)
        .map(([clientId, stats]) => {
            const client = clients.find(c => c.id === parseInt(clientId));
            return {
                name: client ? client.name : 'Cliente No Encontrado',
                ...stats
            };
        })
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10);
    
    const tbody = document.getElementById('top-clients-body');
    tbody.innerHTML = topClients.map(client => `
        <tr>
            <td>${client.name}</td>
            <td>${client.purchases}</td>
            <td>S/ ${client.totalSpent.toFixed(2)}</td>
            <td>${client.lastPurchase}</td>
        </tr>
    `).join('');
}

// Actualizar alertas de stock
function updateStockAlerts(products) {
    const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= (p.minStock || 5));
    const outOfStockProducts = products.filter(p => p.stock === 0);
    
    const container = document.getElementById('stock-alerts-container');
    
    if (lowStockProducts.length === 0 && outOfStockProducts.length === 0) {
        container.innerHTML = `
            <div class="alert alert-success">
                <i class="fas fa-check-circle"></i>
                <strong>¡Todo en orden!</strong> No hay productos con stock crítico.
            </div>
        `;
        return;
    }
    
    let alertsHTML = '';
    
    if (outOfStockProducts.length > 0) {
        alertsHTML += `
            <div class="alert alert-error">
                <i class="fas fa-times-circle"></i>
                <strong>Productos Sin Stock (${outOfStockProducts.length})</strong>
                <ul>
                    ${outOfStockProducts.map(p => `<li>${p.name} - Stock: ${p.stock}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    if (lowStockProducts.length > 0) {
        alertsHTML += `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle"></i>
                <strong>Productos con Stock Bajo (${lowStockProducts.length})</strong>
                <ul>
                    ${lowStockProducts.map(p => `<li>${p.name} - Stock: ${p.stock} (Mínimo: ${p.minStock || 5})</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    container.innerHTML = alertsHTML;
}

// Actualizar gráficos
function updateCharts(sales) {
    updateSalesChart(sales);
    updatePaymentMethodsChart(sales);
}

// Gráfico de tendencia de ventas
function updateSalesChart(sales) {
    const ctx = document.getElementById('sales-chart').getContext('2d');
    
    // Destruir gráfico anterior si existe
    if (salesChart) {
        salesChart.destroy();
    }
    
    // Agrupar ventas por día
    const dailySales = {};
    sales.forEach(sale => {
        const date = sale.date;
        if (!dailySales[date]) {
            dailySales[date] = 0;
        }
        dailySales[date] += sale.total;
    });
    
    const labels = Object.keys(dailySales).sort();
    const data = labels.map(date => dailySales[date]);
    
    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ventas Diarias (S/)',
                data: data,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Tendencia de Ventas'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'S/ ' + value;
                        }
                    }
                }
            }
        }
    });
}

// Gráfico de métodos de pago
function updatePaymentMethodsChart(sales) {
    const ctx = document.getElementById('payment-chart').getContext('2d');
    
    // Destruir gráfico anterior si existe
    if (paymentChart) {
        paymentChart.destroy();
    }
    
    const paymentMethods = {};
    sales.forEach(sale => {
        const method = sale.paymentMethod || 'efectivo';
        if (!paymentMethods[method]) {
            paymentMethods[method] = 0;
        }
        paymentMethods[method] += sale.total;
    });
    
    const labels = Object.keys(paymentMethods);
    const data = Object.values(paymentMethods);
    const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6'];
    
    paymentChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.map(method => method.toUpperCase()),
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: 'Distribución por Método de Pago'
                }
            }
        }
    });
}

// Funciones de utilidad
function changeReportType() {
    const reportType = document.getElementById('report-type').value;
    // Aquí puedes agregar lógica para cambiar entre diferentes tipos de reportes
    loadReportsData();
}

function setupDateChangeListeners() {
    const periodSelect = document.getElementById('report-period');
    const customRange = document.getElementById('custom-date-range');
    
    periodSelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            customRange.style.display = 'block';
        } else {
            customRange.style.display = 'none';
            loadReportsData();
        }
    });
    
    document.getElementById('start-date').addEventListener('change', loadReportsData);
    document.getElementById('end-date').addEventListener('change', loadReportsData);
}

function refreshReports() {
    loadReportsData();
    showAlert('Reportes actualizados correctamente', 'success');
}

function generateReport(type) {
    // Aquí puedes implementar la generación de PDF
    showAlert('Función de exportación PDF en desarrollo', 'info');
}

// Inicializar fechas para el filtro personalizado
function initializeReportDates() {
    const today = new Date().toISOString().split('T')[0];
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStr = lastMonth.toISOString().split('T')[0];
    
    document.getElementById('start-date').value = lastMonthStr;
    document.getElementById('end-date').value = today;
}

// Llamar esta función cuando se cargue la página
initializeReportDates();
// === FUNCIONES DE REPORTES - CORREGIDAS ===
async function loadReportsSection() {
    console.log('📊 Cargando sección de reportes...');
    await loadReportsData();
    setupDateChangeListeners();
}

// Función principal para cargar datos de reportes
async function loadReportsData() {
    try {
        console.log('📈 Cargando datos para reportes...');
        const sales = await getSales();
        const products = await getProducts();
        const clients = await getClients();
        
        const period = document.getElementById('report-period').value;
        const filteredSales = filterSalesByPeriod(sales, period);
        
        updateReportStats(filteredSales, products, clients);
        updateTopProductsTable(filteredSales, products);
        updateCategorySalesTable(filteredSales, products);
        updateTopClientsTable(filteredSales, clients);
        updateStockAlerts(products);
        updateCharts(filteredSales);
        
        console.log('✅ Reportes cargados correctamente');
    } catch (error) {
        console.error('❌ Error cargando reportes:', error);
        showAlert('Error al cargar los reportes: ' + error.message, 'error');
    }
}

// Filtrar ventas por período
function filterSalesByPeriod(sales, period) {
    const now = new Date();
    let startDate = new Date();
    
    switch(period) {
        case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
        case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        case 'quarter':
            startDate.setMonth(now.getMonth() - 3);
            break;
        case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        case 'custom':
            const start = document.getElementById('start-date').value;
            const end = document.getElementById('end-date').value;
            if (start && end) {
                return sales.filter(sale => {
                    try {
                        const saleDate = new Date(sale.date);
                        return saleDate >= new Date(start) && saleDate <= new Date(end);
                    } catch (e) {
                        return false;
                    }
                });
            }
            break;
    }
    
    return sales.filter(sale => {
        try {
            const saleDate = new Date(sale.date);
            return saleDate >= startDate;
        } catch (e) {
            return false;
        }
    });
}

// Actualizar estadísticas principales
function updateReportStats(sales, products, clients) {
    const totalRevenue = sales.reduce((sum, sale) => sum + (parseFloat(sale.total) || 0), 0);
    const totalProductsSold = sales.reduce((sum, sale) => 
        sum + sale.items.reduce((itemSum, item) => itemSum + (parseInt(item.quantity) || 0), 0), 0
    );
    
    const uniqueClients = [...new Set(sales.map(sale => sale.clientId))].length;
    
    // Actualizar elementos en el DOM
    const totalRevenueEl = document.getElementById('total-revenue');
    const totalSalesCountEl = document.getElementById('total-sales-count');
    const totalProductsSoldEl = document.getElementById('total-products-sold');
    const uniqueClientsEl = document.getElementById('unique-clients');
    
    if (totalRevenueEl) totalRevenueEl.textContent = `S/ ${totalRevenue.toFixed(2)}`;
    if (totalSalesCountEl) totalSalesCountEl.textContent = sales.length;
    if (totalProductsSoldEl) totalProductsSoldEl.textContent = totalProductsSold;
    if (uniqueClientsEl) uniqueClientsEl.textContent = uniqueClients;
}

// Actualizar tabla de productos más vendidos
function updateTopProductsTable(sales, products) {
    const productSales = {};
    
    sales.forEach(sale => {
        sale.items.forEach(item => {
            if (!productSales[item.productId]) {
                productSales[item.productId] = {
                    name: item.name,
                    quantity: 0,
                    revenue: 0
                };
            }
            productSales[item.productId].quantity += parseInt(item.quantity) || 0;
            productSales[item.productId].revenue += parseFloat(item.total) || 0;
        });
    });
    
    const topProducts = Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
    
    const totalRevenue = topProducts.reduce((sum, product) => sum + product.revenue, 0);
    
    const tbody = document.getElementById('top-products-body');
    if (!tbody) return;
    
    tbody.innerHTML = topProducts.map(product => `
        <tr>
            <td>${product.name}</td>
            <td>${product.quantity}</td>
            <td>S/ ${product.revenue.toFixed(2)}</td>
            <td>${totalRevenue > 0 ? ((product.revenue / totalRevenue) * 100).toFixed(1) : 0}%</td>
        </tr>
    `).join('');
}

// Actualizar ventas por categoría
function updateCategorySalesTable(sales, products) {
    const categorySales = {};
    
    sales.forEach(sale => {
        sale.items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                const category = product.category || 'Sin Categoría';
                if (!categorySales[category]) {
                    categorySales[category] = {
                        sales: 0,
                        revenue: 0,
                        products: 0
                    };
                }
                categorySales[category].sales++;
                categorySales[category].revenue += parseFloat(item.total) || 0;
                categorySales[category].products += parseInt(item.quantity) || 0;
            }
        });
    });
    
    const tbody = document.getElementById('category-sales-body');
    if (!tbody) return;
    
    tbody.innerHTML = Object.entries(categorySales)
        .sort(([,a], [,b]) => b.revenue - a.revenue)
        .map(([category, data]) => `
            <tr>
                <td>${category}</td>
                <td>${data.sales}</td>
                <td>S/ ${data.revenue.toFixed(2)}</td>
                <td>${data.products}</td>
            </tr>
        `).join('');
}

// Actualizar clientes más activos
function updateTopClientsTable(sales, clients) {
    const clientStats = {};
    
    sales.forEach(sale => {
        if (!clientStats[sale.clientId]) {
            clientStats[sale.clientId] = {
                purchases: 0,
                totalSpent: 0,
                lastPurchase: sale.date
            };
        }
        clientStats[sale.clientId].purchases++;
        clientStats[sale.clientId].totalSpent += parseFloat(sale.total) || 0;
        try {
            if (new Date(sale.date) > new Date(clientStats[sale.clientId].lastPurchase)) {
                clientStats[sale.clientId].lastPurchase = sale.date;
            }
        } catch (e) {
            // Si hay error en la fecha, mantener la actual
        }
    });
    
    const topClients = Object.entries(clientStats)
        .map(([clientId, stats]) => {
            const client = clients.find(c => c.id === parseInt(clientId));
            return {
                name: client ? client.name : 'Cliente No Encontrado',
                ...stats
            };
        })
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10);
    
    const tbody = document.getElementById('top-clients-body');
    if (!tbody) return;
    
    tbody.innerHTML = topClients.map(client => `
        <tr>
            <td>${client.name}</td>
            <td>${client.purchases}</td>
            <td>S/ ${client.totalSpent.toFixed(2)}</td>
            <td>${client.lastPurchase}</td>
        </tr>
    `).join('');
}

// Actualizar alertas de stock para reportes
function updateStockAlerts(products) {
    const lowStockProducts = products.filter(p => {
        const stock = parseInt(p.stock) || 0;
        const minStock = parseInt(p.minStock) || 5;
        return stock > 0 && stock <= minStock;
    });
    
    const outOfStockProducts = products.filter(p => {
        const stock = parseInt(p.stock) || 0;
        return stock === 0;
    });
    
    const container = document.getElementById('stock-alerts-container');
    if (!container) return;
    
    if (lowStockProducts.length === 0 && outOfStockProducts.length === 0) {
        container.innerHTML = `
            <div class="alert alert-success">
                <i class="fas fa-check-circle"></i>
                <strong>¡Todo en orden!</strong> No hay productos con stock crítico.
            </div>
        `;
        return;
    }
    
    let alertsHTML = '';
    
    if (outOfStockProducts.length > 0) {
        alertsHTML += `
            <div class="alert alert-error">
                <i class="fas fa-times-circle"></i>
                <strong>Productos Sin Stock (${outOfStockProducts.length})</strong>
                <ul>
                    ${outOfStockProducts.slice(0, 5).map(p => `<li>${p.name} - Stock: ${p.stock}</li>`).join('')}
                    ${outOfStockProducts.length > 5 ? `<li>... y ${outOfStockProducts.length - 5} más</li>` : ''}
                </ul>
            </div>
        `;
    }
    
    if (lowStockProducts.length > 0) {
        alertsHTML += `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle"></i>
                <strong>Productos con Stock Bajo (${lowStockProducts.length})</strong>
                <ul>
                    ${lowStockProducts.slice(0, 5).map(p => `<li>${p.name} - Stock: ${p.stock} (Mínimo: ${p.minStock || 5})</li>`).join('')}
                    ${lowStockProducts.length > 5 ? `<li>... y ${lowStockProducts.length - 5} más</li>` : ''}
                </ul>
            </div>
        `;
    }
    
    container.innerHTML = alertsHTML;
}

// Actualizar gráficos
function updateCharts(sales) {
    updateSalesChart(sales);
    updatePaymentMethodsChart(sales);
}

// Gráfico de tendencia de ventas
function updateSalesChart(sales) {
    const ctx = document.getElementById('sales-chart');
    if (!ctx) {
        console.error('❌ No se encontró el canvas para el gráfico de ventas');
        return;
    }
    
    // Destruir gráfico anterior si existe
    if (window.salesChart) {
        window.salesChart.destroy();
    }
    
    // Agrupar ventas por día
    const dailySales = {};
    sales.forEach(sale => {
        const date = sale.date;
        if (!dailySales[date]) {
            dailySales[date] = 0;
        }
        dailySales[date] += parseFloat(sale.total) || 0;
    });
    
    const labels = Object.keys(dailySales).sort();
    const data = labels.map(date => dailySales[date]);
    
    // Si no hay datos, mostrar mensaje
    if (labels.length === 0) {
        ctx.parentElement.innerHTML = '<div class="empty-state"><p>No hay datos de ventas para el período seleccionado</p></div>';
        return;
    }
    
    window.salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ventas Diarias (S/)',
                data: data,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Tendencia de Ventas'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'S/ ' + value;
                        }
                    }
                }
            }
        }
    });
}

// Gráfico de métodos de pago
function updatePaymentMethodsChart(sales) {
    const ctx = document.getElementById('payment-chart');
    if (!ctx) {
        console.error('❌ No se encontró el canvas para el gráfico de métodos de pago');
        return;
    }
    
    // Destruir gráfico anterior si existe
    if (window.paymentChart) {
        window.paymentChart.destroy();
    }
    
    const paymentMethods = {};
    sales.forEach(sale => {
        const method = sale.paymentMethod || 'efectivo';
        if (!paymentMethods[method]) {
            paymentMethods[method] = 0;
        }
        paymentMethods[method] += parseFloat(sale.total) || 0;
    });
    
    const labels = Object.keys(paymentMethods);
    const data = Object.values(paymentMethods);
    
    // Si no hay datos, mostrar mensaje
    if (labels.length === 0) {
        ctx.parentElement.innerHTML = '<div class="empty-state"><p>No hay datos de pagos para el período seleccionado</p></div>';
        return;
    }
    
    const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6'];
    
    window.paymentChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.map(method => method.toUpperCase()),
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: 'Distribución por Método de Pago'
                }
            }
        }
    });
}

// Funciones de utilidad para reportes
function changeReportType() {
    const reportType = document.getElementById('report-type').value;
    console.log('Cambiando tipo de reporte a:', reportType);
    loadReportsData();
}

function setupDateChangeListeners() {
    const periodSelect = document.getElementById('report-period');
    const customRange = document.getElementById('custom-date-range');
    
    if (!periodSelect || !customRange) {
        console.error('❌ No se encontraron elementos para los filtros de fecha');
        return;
    }
    
    periodSelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            customRange.style.display = 'block';
        } else {
            customRange.style.display = 'none';
            loadReportsData();
        }
    });
    
    const startDate = document.getElementById('start-date');
    const endDate = document.getElementById('end-date');
    
    if (startDate) {
        startDate.addEventListener('change', loadReportsData);
    }
    if (endDate) {
        endDate.addEventListener('change', loadReportsData);
    }
}

function refreshReports() {
    loadReportsData();
    showAlert('Reportes actualizados correctamente', 'success');
}

function generateReport(type) {
    showAlert('Función de exportación PDF en desarrollo', 'info');
}

// Inicializar fechas para el filtro personalizado
function initializeReportDates() {
    const today = new Date().toISOString().split('T')[0];
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStr = lastMonth.toISOString().split('T')[0];
    
    const startDate = document.getElementById('start-date');
    const endDate = document.getElementById('end-date');
    
    if (startDate) startDate.value = lastMonthStr;
    if (endDate) endDate.value = today;
}

async function downloadReceiptCompact(saleId) {
    try {
        showAlert('🔄 Generando versión ultra-compacta...', 'info');
        
        await showSaleReceipt(saleId);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const receiptElement = document.getElementById('electronic-receipt');
        if (!receiptElement) return;

        // Compactación extrema
        receiptElement.style.width = '550px';
        receiptElement.style.padding = '5px';
        receiptElement.style.margin = '0 auto';
        receiptElement.style.fontSize = '11px';

        // Reducir todo al mínimo
        const allElements = receiptElement.querySelectorAll('*');
        allElements.forEach(el => {
            if (el.style) {
                el.style.margin = '1px 0';
                el.style.padding = '2px 3px';
                
                if (el.tagName === 'H1') el.style.fontSize = '16px';
                if (el.tagName === 'H2' || el.tagName === 'H3') el.style.fontSize = '12px';
                if (el.tagName === 'TABLE') el.style.fontSize = '9px';
            }
        });

        const canvas = await html2canvas(receiptElement, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            width: 550,
            height: Math.min(receiptElement.scrollHeight, 700)
        });

        const pdf = new jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgWidth = pdfWidth - 15;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(canvas, 'PNG', 7.5, 10, imgWidth, imgHeight);
        pdf.save(`boleta-compacta-${saleId}.pdf`);

        showAlert('✅ Boleta compacta descargada', 'success');

    } catch (error) {
        console.error('Error:', error);
        showAlert('❌ Error: ' + error.message, 'error');
    }
}




// === FUNCIÓN MEJORADA PARA DESCARGAR BOLETA CON DISEÑO ===


// === VERSIÓN ALTERNATIVA MÁS RÁPIDA ===
async function downloadReceiptFast(saleId) {
    try {
        showAlert('🔄 Generando versión rápida...', 'info');
        
        await showSaleReceipt(saleId);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const receiptElement = document.getElementById('electronic-receipt');
        if (!receiptElement) return;

        // Aplicar estilos optimizados para PDF
        const originalStyles = {
            width: receiptElement.style.width,
            margin: receiptElement.style.margin,
            padding: receiptElement.style.padding
        };
        
        receiptElement.style.width = '700px';
        receiptElement.style.margin = '0 auto';
        receiptElement.style.padding = '15px';

        const canvas = await html2canvas(receiptElement, {
            scale: 1.5,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        // Restaurar estilos originales
        receiptElement.style.width = originalStyles.width;
        receiptElement.style.margin = originalStyles.margin;
        receiptElement.style.padding = originalStyles.padding;

        const pdf = new jspdf.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgWidth = pdfWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(canvas, 'PNG', 10, 10, imgWidth, imgHeight);
        pdf.save(`boleta-rapida-${saleId}.pdf`);
        
        showAlert('✅ PDF rápido generado', 'success');

    } catch (error) {
        console.error('Error:', error);
        showAlert('❌ Error al generar PDF rápido', 'error');
    }
}

// === FUNCIÓN PARA VERIFICAR LIBRERÍAS ===
function checkAndLoadLibraries() {
    return new Promise((resolve) => {
        let loadedCount = 0;
        
        const checkLoaded = () => {
            loadedCount++;
            if (loadedCount === 2) resolve();
        };

        // Verificar html2canvas
        if (typeof html2canvas === 'undefined') {
            console.log('📦 Cargando html2canvas...');
            const script1 = document.createElement('script');
            script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            script1.onload = checkLoaded;
            document.head.appendChild(script1);
        } else {
            loadedCount++;
        }

        // Verificar jsPDF
        if (typeof jspdf === 'undefined') {
            console.log('📦 Cargando jsPDF...');
            const script2 = document.createElement('script');
            script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script2.onload = checkLoaded;
            document.head.appendChild(script2);
        } else {
            loadedCount++;
        }

        if (loadedCount === 2) resolve();
    });
}

// === FUNCIÓN MEJORADA CON OPCIONES ===
async function downloadReceiptWithOptions(saleId) {
    try {
        // Verificar librerías primero
        await checkAndLoadLibraries();
        
        // Dar opción al usuario
        const userChoice = confirm(
            '¿Cómo deseas descargar la boleta?\n\n' +
            '✅ Aceptar: Diseño completo (más lento)\n' +
            '❌ Cancelar: Versión rápida'
        );
        
        if (userChoice) {
            await downloadReceipt(saleId); // Diseño completo
        } else {
            await downloadReceiptFast(saleId); // Versión rápida
        }
        
    } catch (error) {
        console.error('Error en descarga:', error);
        showAlert('❌ Error al preparar la descarga', 'error');
    }
}

// === ACTUALIZAR EL MODAL CON LA NUEVA FUNCIÓN ===
function updateReceiptModalFooter(saleId, client) {
    const modalFooter = document.querySelector('#sale-receipt-modal .modal-footer');
    if (!modalFooter) return;
    
    modalFooter.innerHTML = `
        <button class="btn btn-success" onclick="downloadReceipt(${saleId})">
            <i class="fas fa-file-pdf"></i> Descargar PDF
        </button>
        <button class="btn btn-info" onclick="downloadReceiptCompact(${saleId})">
            <i class="fas fa-compress"></i> Versión Compacta
        </button>
        <button class="btn btn-primary" onclick="printReceipt()">
            <i class="fas fa-print"></i> Imprimir
        </button>
        <button class="btn btn-danger" onclick="closeReceiptModal()">
            <i class="fas fa-times"></i> Cerrar
        </button>
    `;
}

// === MEJORAR LA FUNCIÓN DE IMPRESIÓN ===
function printReceipt() {
    try {
        const receiptElement = document.getElementById('electronic-receipt');
        if (!receiptElement) {
            showAlert('No hay recibo para imprimir', 'error');
            return;
        }

        // Clonar el elemento para la impresión
        const printElement = receiptElement.cloneNode(true);
        
        // Ajustar estilos para impresión
        printElement.style.width = '100%';
        printElement.style.margin = '0';
        printElement.style.padding = '20px';
        printElement.style.boxShadow = 'none';
        printElement.style.border = '1px solid #000';

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Boleta SkinBri Shop</title>
                <meta charset="UTF-8">
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                <style>
                    @media print {
                        body { 
                            margin: 0 !important; 
                            padding: 10px !important;
                            background: white !important;
                            font-family: Arial, sans-serif !important;
                        }
                        .electronic-receipt { 
                            box-shadow: none !important;
                            border: 1px solid #000 !important;
                            margin: 0 auto !important;
                            width: 100% !important;
                            padding: 20px !important;
                        }
                        .btn, .action-buttons, .modal-footer {
                            display: none !important;
                        }
                        @page {
                            margin: 10mm;
                            size: A4;
                        }
                        * {
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                    }
                    @media screen {
                        body { 
                            margin: 20px; 
                            background: #f5f5f5;
                        }
                        .electronic-receipt {
                            max-width: 800px;
                            margin: 0 auto;
                        }
                    }
                </style>
            </head>
            <body>
                ${printElement.outerHTML}
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(() => {
                            window.close();
                        }, 1000);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
        
    } catch (error) {
        console.error('Error al imprimir:', error);
        showAlert('❌ Error al imprimir la boleta', 'error');
    }
}

// === INICIALIZAR LIBRERÍAS AL CARGAR LA PÁGINA ===
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Inicializando librerías PDF...');
    checkAndLoadLibraries().then(() => {
        console.log('✅ Librerías PDF listas');
    });
});

// === AGREGAR CSS PARA MEJORAR LA BOLETA EN PDF ===
const pdfStyles = `
<style id="pdf-styles">
/* Estilos optimizados para PDF */
.electronic-receipt {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    overflow: hidden;
}

.receipt-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    text-align: center;
}

.company-brand {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    margin-bottom: 10px;
}

.company-logo {
    width: 60px;
    height: 60px;
    background: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: #667eea;
}

.receipt-badge {
    background: rgba(255,255,255,0.2);
    padding: 8px 15px;
    border-radius: 20px;
    display: inline-block;
    margin-top: 10px;
}

/* Asegurar buena legibilidad en PDF */
.receipt-meta, .client-section, .products-section, .totals-section-compact {
    padding: 15px;
    border-bottom: 1px solid #eee;
}

.section-header-compact {
    background: #f8f9fa;
    padding: 10px 15px;
    margin: -15px -15px 15px -15px;
    border-left: 4px solid #667eea;
    font-weight: bold;
}

/* Mejorar tablas para PDF */
.products-table-compact {
    width: 100%;
    border-collapse: collapse;
}

.products-table-compact th {
    background: #f8f9fa;
    padding: 8px;
    text-align: left;
    border-bottom: 2px solid #dee2e6;
}

.products-table-compact td {
    padding: 8px;
    border-bottom: 1px solid #dee2e6;
}

/* Totales más destacados */
.grand-total {
    background: #f8f9fa;
    border-top: 2px solid #667eea;
    font-weight: bold;
}

/* Estado de venta */
.sale-status {
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: bold;
}

.status-paid {
    background: #d4edda;
    color: #155724;
}

.status-separado {
    background: #fff3cd;
    color: #856404;
}
</style>
`;

// Insertar estilos en el documento
document.head.insertAdjacentHTML('beforeend', pdfStyles);



// === ACTUALIZAR MODAL (SOLO 1 BOTÓN) ===
function updateReceiptModalFooter(saleId, client) {
    const modalFooter = document.querySelector('#sale-receipt-modal .modal-footer');
    if (!modalFooter) return;
    
    modalFooter.innerHTML = `
        <button class="btn btn-success" onclick="downloadReceipt(${saleId})">
            <i class="fas fa-file-pdf"></i> Descargar PDF
        </button>
        <button class="btn btn-primary" onclick="printReceipt()">
            <i class="fas fa-print"></i> Imprimir
        </button>
        <button class="btn btn-danger" onclick="closeReceiptModal()">
            <i class="fas fa-times"></i> Cerrar
        </button>
    `;
}

async function downloadReceiptAsHTML(saleId) {
    try {
        await showSaleReceipt(saleId);
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const receiptElement = document.getElementById('electronic-receipt');
        if (!receiptElement) return;

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Boleta SkinBri Shop</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body { 
            margin: 20px; 
            padding: 0; 
            background: white;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .electronic-receipt {
            max-width: 800px;
            margin: 0 auto;
        }
    </style>
</head>
<body>
    ${receiptElement.outerHTML}
</body>
</html>`;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `boleta-${saleId}.html`;
        a.click();
        
        showAlert('📄 Descargando versión HTML...', 'info');
        
    } catch (error) {
        showAlert('❌ Error al descargar', 'error');
    }
}

// === FUNCIÓN MEJORADA PARA IMPRIMIR ===
function printReceipt() {
    try {
        const receiptElement = document.getElementById('electronic-receipt');
        if (!receiptElement) {
            showAlert('No hay recibo para imprimir', 'error');
            return;
        }

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Imprimir Boleta</title>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                <style>
                    @media print {
                        body { 
                            margin: 0 !important; 
                            padding: 10px !important;
                            background: white !important;
                        }
                        .electronic-receipt { 
                            box-shadow: none !important;
                            border: 1px solid #000 !important;
                            margin: 0 auto !important;
                        }
                        .btn, .action-buttons, .modal-footer {
                            display: none !important;
                        }
                        @page {
                            margin: 10mm;
                            size: A4;
                        }
                    }
                    @media screen {
                        body { margin: 20px; }
                    }
                </style>
            </head>
            <body>
                ${receiptElement.outerHTML}
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(() => {
                            window.close();
                        }, 1000);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
        
    } catch (error) {
        console.error('Error al imprimir:', error);
        showAlert('❌ Error al imprimir', 'error');
    }
}


// === VERSIÓN SIMPLIFICADA (ALTERNATIVA) ===
async function downloadReceiptSimple(saleId) {
    try {
        // Usamos showSaleReceipt para generar el HTML
        await showSaleReceipt(saleId);
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const receiptElement = document.getElementById('receipt-content');
        if (!receiptElement) {
            showAlert('No se pudo generar la boleta', 'error');
            return;
        }

        // HTML básico que referenciará los estilos existentes
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Boleta SkinBri Shop</title>
    <!-- Referencia a Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Los estilos ya están aplicados inline en el HTML generado por showSaleReceipt -->
</head>
<body style="margin: 20px; padding: 0; background: white;">
    ${receiptElement.innerHTML}
</body>
</html>`;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `boleta-${saleId}.html`;
        a.click();
        
        showAlert('✅ Boleta descargada', 'success');
        
    } catch (error) {
        showAlert('❌ Error al descargar', 'error');
    }
}

function checkPDFLibraries() {
    if (typeof html2canvas === 'undefined') {
        console.warn('html2canvas no está cargado');
        // Cargar html2canvas dinámicamente
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        document.head.appendChild(script);
    }
    
    if (typeof jspdf === 'undefined') {
        console.warn('jsPDF no está cargado');
        // Cargar jsPDF dinámicamente
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        document.head.appendChild(script);
    }
}

// Verificar librerías cuando se cargue la página
document.addEventListener('DOMContentLoaded', function() {
    checkPDFLibraries();
});

async function previewReceiptSize(saleId) {
    await showSaleReceipt(saleId);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const receiptElement = document.getElementById('electronic-receipt');
    if (!receiptElement) return;
    
    const height = receiptElement.scrollHeight;
    const estimatedPages = Math.ceil(height / 1000); // Aproximación
    
    if (estimatedPages > 1) {
        if (confirm(`La boleta ocupará aproximadamente ${estimatedPages} páginas. ¿Desea usar la versión compacta para una sola hoja?`)) {
            downloadReceiptCompact(saleId);
        } else {
            downloadReceipt(saleId);
        }
    } else {
        downloadReceipt(saleId);
    }
}

// === FUNCIÓN MEJORADA PARA PDF CON MEJOR USO DEL ANCHO ===
async function downloadReceipt(saleId) {
    try {
        showAlert('🔄 Generando boleta PDF...', 'info');
        
        // Generar la boleta en el modal primero
        await showSaleReceipt(saleId);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const receiptElement = document.getElementById('electronic-receipt');
        if (!receiptElement) {
            showAlert('❌ No se pudo generar la boleta', 'error');
            return;
        }

        // Guardar estilos originales
        const originalStyles = {
            width: receiptElement.style.width,
            margin: receiptElement.style.margin
        };

        // Aplicar estilos para PDF - reducir ancho
        receiptElement.style.width = '160mm'; // Reducir de 180mm a 160mm
        receiptElement.style.margin = '0 auto';

        // Verificar si las librerías están cargadas
        if (typeof html2canvas === 'undefined') {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
        }
        
        if (typeof jspdf === 'undefined') {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Esperar a que las librerías estén listas
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Crear el canvas con menor escala
        const canvas = await html2canvas(receiptElement, {
            scale: 1.5, // Reducir de 2 a 1.5
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        // Crear PDF
        const pdf = new jspdf.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // Calcular dimensiones ajustadas
        const imgWidth = 150; // Reducir aún más
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Verificar si cabe en una página
        if (imgHeight > pdfHeight) {
            // Si es muy alto, ajustar para que quepa
            const adjustedWidth = (pdfHeight * imgWidth) / imgHeight;
            const xPos = (pdfWidth - adjustedWidth) / 2;
            
            pdf.addImage(canvas, 'PNG', xPos, 0, adjustedWidth, pdfHeight);
        } else {
            // Centrar normalmente
            const xPos = (pdfWidth - imgWidth) / 2;
            const yPos = (pdfHeight - imgHeight) / 2;
            pdf.addImage(canvas, 'PNG', xPos, yPos, imgWidth, imgHeight);
        }
        
        // Descargar
        pdf.save(`boleta-${saleId}.pdf`);

        // Restaurar estilos
        receiptElement.style.width = originalStyles.width;
        receiptElement.style.margin = originalStyles.margin;
        
        showAlert('✅ Boleta descargada correctamente', 'success');

    } catch (error) {
        console.error('Error:', error);
        showAlert('❌ Error al descargar: ' + error.message, 'error');
    }
}

// Función auxiliar para cargar scripts
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Función alternativa más simple
async function downloadReceiptSimple(saleId) {
    try {
        showAlert('🔄 Preparando descarga...', 'info');
        
        await showSaleReceipt(saleId);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const receiptElement = document.getElementById('electronic-receipt');
        if (!receiptElement) return;

        // Usar la función de impresión nativa del navegador
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Boleta #${saleId}</title>
                <style>
                    body { 
                        margin: 0; 
                        padding: 20px; 
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        background: white;
                    }
                    .electronic-receipt { 
                        margin: 0 auto;
                        box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    }
                    @media print {
                        body { padding: 0; }
                        .electronic-receipt { box-shadow: none; }
                    }
                </style>
            </head>
            <body>
                ${receiptElement.outerHTML}
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(() => window.close(), 1000);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
        
    } catch (error) {
        console.error('Error:', error);
        showAlert('❌ Error: ' + error.message, 'error');
    }
}

// Actualizar el modal para usar la versión simple
function updateReceiptModalFooter(saleId, client) {
    const modalFooter = document.querySelector('#sale-receipt-modal .modal-footer');
    if (!modalFooter) return;
    
    modalFooter.innerHTML = `
        <button class="btn btn-success" onclick="downloadReceiptSimple(${saleId})">
            <i class="fas fa-file-pdf"></i> Descargar PDF
        </button>
        <button class="btn btn-primary" onclick="printReceipt()">
            <i class="fas fa-print"></i> Imprimir
        </button>
        <button class="btn btn-danger" onclick="closeReceiptModal()">
            <i class="fas fa-times"></i> Cerrar
        </button>
    `;
}

// 🔥 FUNCIÓN PARA OPTIMIZAR EL LAYOUT HORIZONTAL
function optimizeReceiptLayout(receiptElement) {
    // 1. ENCABEZADO MÁS COMPACTO Y ANCHO
    const header = receiptElement.querySelector('.receipt-header');
    if (header) {
        header.style.padding = '10px 15px';
        header.style.marginBottom = '8px';
    }

    // 2. LOGO Y INFO DE EMPRESA EN LÍNEA
    const companyBrand = receiptElement.querySelector('.company-brand');
    if (companyBrand) {
        companyBrand.style.display = 'flex';
        companyBrand.style.alignItems = 'center';
        companyBrand.style.justifyContent = 'space-between';
        companyBrand.style.gap = '15px';
    }

    const companyLogo = receiptElement.querySelector('.company-logo');
    if (companyLogo) {
        companyLogo.style.width = '40px';
        companyLogo.style.height = '40px';
        companyLogo.style.fontSize = '14px';
        companyLogo.style.flexShrink = '0';
    }

    const companyInfo = receiptElement.querySelector('.company-info');
    if (companyInfo) {
        companyInfo.style.flex = '1';
        companyInfo.style.textAlign = 'left';
        
        const h1 = companyInfo.querySelector('h1');
        if (h1) {
            h1.style.fontSize = '16px';
            h1.style.margin = '0 0 2px 0';
        }
        
        const slogan = companyInfo.querySelector('.company-slogan');
        if (slogan) {
            slogan.style.fontSize = '9px';
            slogan.style.margin = '0 0 3px 0';
        }
        
        const details = companyInfo.querySelector('.company-details');
        if (details) {
            details.style.fontSize = '8px';
            details.style.display = 'flex';
            details.style.gap = '10px';
            details.style.flexWrap = 'wrap';
        }
    }

    // 3. BADGE MÁS COMPACTO
    const badge = receiptElement.querySelector('.receipt-badge');
    if (badge) {
        badge.style.padding = '6px 10px';
        badge.style.fontSize = '10px';
        badge.style.flexShrink = '0';
    }

    // 4. METADATA EN GRID DE 3 COLUMNAS
    const receiptMeta = receiptElement.querySelector('.receipt-meta');
    if (receiptMeta) {
        receiptMeta.style.padding = '8px 0';
        receiptMeta.style.marginBottom = '8px';
    }

    const metaGrid = receiptElement.querySelector('.meta-grid');
    if (metaGrid) {
        metaGrid.style.display = 'grid';
        metaGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
        metaGrid.style.gap = '5px';
        metaGrid.style.fontSize = '9px';
    }

    // 5. INFORMACIÓN DE CLIENTE EN 2 COLUMNAS
    const clientDetails = receiptElement.querySelector('.client-details-compact');
    if (clientDetails) {
        clientDetails.style.padding = '8px 0';
    }

    const clientRows = receiptElement.querySelectorAll('.client-row');
    clientRows.forEach(row => {
        row.style.display = 'grid';
        row.style.gridTemplateColumns = '1fr 1fr';
        row.style.gap = '10px';
        row.style.marginBottom = '3px';
        row.style.fontSize = '9px';
    });

    // 6. TABLA DE PRODUCTOS MÁS ANCHA Y COMPACTA
    const productsTable = receiptElement.querySelector('.products-table-compact');
    if (productsTable) {
        productsTable.style.width = '100%';
        productsTable.style.fontSize = '8px';
        productsTable.style.margin = '5px 0';
    }

    const tableHeaders = productsTable?.querySelectorAll('th');
    tableHeaders?.forEach(th => {
        th.style.padding = '3px 4px';
        th.style.fontSize = '8px';
        
        // Ajustar anchos de columnas
        if (th.classList.contains('product-col')) {
            th.style.width = '50%';
        } else if (th.classList.contains('qty-col')) {
            th.style.width = '15%';
        } else if (th.classList.contains('price-col')) {
            th.style.width = '20%';
        } else if (th.classList.contains('total-col')) {
            th.style.width = '15%';
        }
    });

    const tableCells = receiptElement.querySelectorAll('.products-table-compact td');
    tableCells.forEach(td => {
        td.style.padding = '2px 4px';
        td.style.fontSize = '8px';
    });

    // 7. TOTALES EN 2 COLUMNAS
    const totalsGrid = receiptElement.querySelector('.totals-grid-compact');
    if (totalsGrid) {
        totalsGrid.style.display = 'grid';
        totalsGrid.style.gridTemplateColumns = '1fr auto';
        totalsGrid.style.gap = '5px';
        totalsGrid.style.fontSize = '9px';
    }

    const totalRows = receiptElement.querySelectorAll('.total-row');
    totalRows.forEach(row => {
        row.style.display = 'contents'; // Usar grid del contenedor padre
    });

    // 8. FOOTER COMPACTO
    const footer = receiptElement.querySelector('.receipt-footer-compact');
    if (footer) {
        footer.style.padding = '8px 0';
        footer.style.marginTop = '8px';
        footer.style.fontSize = '8px';
    }

    const paymentInfo = receiptElement.querySelector('.payment-info');
    if (paymentInfo) {
        paymentInfo.style.display = 'grid';
        paymentInfo.style.gridTemplateColumns = '1fr 1fr';
        paymentInfo.style.gap = '5px';
        paymentInfo.style.fontSize = '8px';
    }

    // 9. REDUCIR TODOS LOS MÁRGENES Y PADDINGS
    const allElements = receiptElement.querySelectorAll('*');
    allElements.forEach(el => {
        if (el.style) {
            const style = el.style;
            // Reducir márgenes
            if (style.margin && parseInt(style.margin) > 5) {
                style.margin = '2px 0';
            }
            if (style.marginTop && parseInt(style.marginTop) > 5) {
                style.marginTop = '3px';
            }
            if (style.marginBottom && parseInt(style.marginBottom) > 5) {
                style.marginBottom = '3px';
            }
            // Reducir paddings
            if (style.padding && parseInt(style.padding) > 10) {
                style.padding = '4px';
            }
            if (style.paddingLeft && parseInt(style.paddingLeft) > 10) {
                style.paddingLeft = '5px';
            }
            if (style.paddingRight && parseInt(style.paddingRight) > 10) {
                style.paddingRight = '5px';
            }
        }
    });
}

// FUNCIÓN PARA RESTAURAR EL LAYOUT ORIGINAL
function restoreReceiptLayout(receiptElement) {
    // Restaurar estilos específicos que fueron modificados
    const companyBrand = receiptElement.querySelector('.company-brand');
    if (companyBrand) {
        companyBrand.style.display = '';
    }

    const metaGrid = receiptElement.querySelector('.meta-grid');
    if (metaGrid) {
        metaGrid.style.display = '';
        metaGrid.style.gridTemplateColumns = '';
        metaGrid.style.gap = '';
        metaGrid.style.fontSize = '';
    }

    const clientRows = receiptElement.querySelectorAll('.client-row');
    clientRows.forEach(row => {
        row.style.display = '';
        row.style.gridTemplateColumns = '';
        row.style.gap = '';
        row.style.marginBottom = '';
        row.style.fontSize = '';
    });

    const totalsGrid = receiptElement.querySelector('.totals-grid-compact');
    if (totalsGrid) {
        totalsGrid.style.display = '';
        totalsGrid.style.gridTemplateColumns = '';
        totalsGrid.style.gap = '';
        totalsGrid.style.fontSize = '';
    }

    const totalRows = receiptElement.querySelectorAll('.total-row');
    totalRows.forEach(row => {
        row.style.display = '';
    });

    const paymentInfo = receiptElement.querySelector('.payment-info');
    if (paymentInfo) {
        paymentInfo.style.display = '';
        paymentInfo.style.gridTemplateColumns = '';
        paymentInfo.style.gap = '';
        paymentInfo.style.fontSize = '';
    }
}

// === VERSIÓN EXTRA-COMPACTA PARA BOLETAS MUY LARGAS ===
async function downloadReceiptUltraCompact(saleId) {
    try {
        showAlert('🔄 Generando versión ultra-compacta...', 'info');
        
        await showSaleReceipt(saleId);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const receiptElement = document.getElementById('electronic-receipt');
        if (!receiptElement) return;

        // CONFIGURACIÓN ULTRA COMPACTA
        receiptElement.style.width = '100%';
        receiptElement.style.maxWidth = '200mm';
        receiptElement.style.padding = '10px 15px';
        receiptElement.style.margin = '0 auto';
        receiptElement.style.fontSize = '10px';
        receiptElement.style.boxSizing = 'border-box';
        
        // APLICAR COMPACTACIÓN EXTREMA
        applyUltraCompactStyles(receiptElement);

        await new Promise(resolve => setTimeout(resolve, 400));

        const canvas = await html2canvas(receiptElement, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            width: receiptElement.scrollWidth,
            height: receiptElement.scrollHeight
        });

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const margin = 3; // Márgenes mínimos
        const availableWidth = pdfWidth - (margin * 2);
        
        let imgWidth = availableWidth;
        let imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(canvas, 'PNG', margin, margin, imgWidth, imgHeight);
        pdf.save(`boleta-compacta-${saleId}.pdf`);

        showAlert('✅ Boleta ultra-compacta descargada', 'success');

    } catch (error) {
        console.error('Error:', error);
        showAlert('❌ Error: ' + error.message, 'error');
    }
}

function applyUltraCompactStyles(receiptElement) {
    // Estilos ultra compactos para todos los elementos
    const allElements = receiptElement.querySelectorAll('*');
    allElements.forEach(el => {
        if (el.style) {
            el.style.margin = '1px 0';
            el.style.padding = '2px 3px';
            el.style.fontSize = '9px';
            
            // Reducir específicamente elementos grandes
            if (el.tagName === 'H1') el.style.fontSize = '14px';
            if (el.tagName === 'H2' || el.tagName === 'H3') el.style.fontSize = '11px';
            if (el.classList.contains('company-logo')) {
                el.style.width = '30px';
                el.style.height = '30px';
                el.style.fontSize = '12px';
            }
        }
    });
    
    // Tabla ultra compacta
    const tableCells = receiptElement.querySelectorAll('th, td');
    tableCells.forEach(cell => {
        cell.style.padding = '1px 2px';
        cell.style.fontSize = '7px';
    });
}

// Función para compactar todos los elementos de la boleta
function compactAllElements(receiptElement) {
    // Compactar encabezado
    const header = receiptElement.querySelector('.receipt-header');
    if (header) {
        header.style.padding = '12px 15px';
        header.style.marginBottom = '8px';
    }

    // Compactar logo
    const logo = receiptElement.querySelector('.company-logo');
    if (logo) {
        logo.style.width = '45px';
        logo.style.height = '45px';
        logo.style.fontSize = '14px';
    }

    // Compactar información de empresa
    const companyInfo = receiptElement.querySelector('.company-info');
    if (companyInfo) {
        const h1 = companyInfo.querySelector('h1');
        if (h1) h1.style.fontSize = '16px';
        
        const slogan = companyInfo.querySelector('.company-slogan');
        if (slogan) slogan.style.fontSize = '9px';
        
        const details = companyInfo.querySelector('.company-details');
        if (details) details.style.fontSize = '10px';
    }

    // Compactar badge
    const badge = receiptElement.querySelector('.receipt-badge');
    if (badge) {
        badge.style.padding = '8px 12px';
    }

    // Compactar metadata
    const meta = receiptElement.querySelector('.receipt-meta');
    if (meta) {
        meta.style.padding = '12px';
        meta.style.marginBottom = '12px';
    }

    // Compactar secciones
    const sections = receiptElement.querySelectorAll('.client-section, .shipping-section, .products-section, .totals-section-compact');
    sections.forEach(section => {
        section.style.padding = '10px';
        section.style.marginBottom = '8px';
    });

    // Compactar headers de sección
    const sectionHeaders = receiptElement.querySelectorAll('.section-header-compact');
    sectionHeaders.forEach(header => {
        header.style.padding = '6px 8px';
        header.style.fontSize = '10px';
        header.style.margin = '-10px -10px 8px -10px';
    });

    // Compactar detalles de cliente
    const clientDetails = receiptElement.querySelector('.client-details-compact');
    if (clientDetails) {
        clientDetails.style.padding = '10px';
    }

    // Compactar filas de cliente
    const clientRows = receiptElement.querySelectorAll('.client-row');
    clientRows.forEach(row => {
        row.style.marginBottom = '4px';
        row.style.padding = '3px 0';
    });

    // Compactar tabla de productos
    const productsTable = receiptElement.querySelector('.products-table-compact');
    if (productsTable) {
        productsTable.style.fontSize = '9px';
    }

    const tableCells = receiptElement.querySelectorAll('.products-table-compact th, .products-table-compact td');
    tableCells.forEach(cell => {
        cell.style.padding = '3px 5px';
        cell.style.fontSize = '8px';
    });

    // Compactar totales
    const totalRows = receiptElement.querySelectorAll('.total-row');
    totalRows.forEach(row => {
        row.style.padding = '2px 0';
        row.style.fontSize = '9px';
    });

    // Compactar footer
    const footer = receiptElement.querySelector('.receipt-footer-compact');
    if (footer) {
        footer.style.padding = '8px';
        footer.style.fontSize = '8px';
        footer.style.marginTop = '12px';
    }

    // Compactar información de pago
    const paymentInfo = receiptElement.querySelector('.payment-info');
    if (paymentInfo) {
        paymentInfo.style.padding = '10px';
    }

    // Compactar texto legal
    const legal = receiptElement.querySelector('.legal-compact');
    if (legal) {
        legal.style.fontSize = '9px';
    }

    // Reducir márgenes y paddings de todos los elementos
    const allElements = receiptElement.querySelectorAll('*');
    allElements.forEach(el => {
        if (el.style) {
            const style = el.style;
            if (parseInt(style.margin) > 5) style.margin = '2px 0';
            if (parseInt(style.padding) > 10) style.padding = '3px 4px';
            if (parseInt(style.marginBottom) > 10) style.marginBottom = '5px';
            if (parseInt(style.paddingTop) > 10) style.paddingTop = '4px';
            if (parseInt(style.paddingBottom) > 10) style.paddingBottom = '4px';
        }
    });
}



function compactReceiptForPDF(receiptElement) {
    // Compactar encabezado
    const header = receiptElement.querySelector('.receipt-header');
    if (header) {
        header.style.padding = '15px';
        header.style.marginBottom = '10px';
    }

    // Compactar logo
    const logo = receiptElement.querySelector('.company-logo');
    if (logo) {
        logo.style.width = '50px';
        logo.style.height = '50px';
        logo.style.fontSize = '16px';
    }

    // Compactar texto de empresa
    const companyInfo = receiptElement.querySelector('.company-info');
    if (companyInfo) {
        const h1 = companyInfo.querySelector('h1');
        if (h1) h1.style.fontSize = '18px';
        
        const slogan = companyInfo.querySelector('.company-slogan');
        if (slogan) slogan.style.fontSize = '10px';
    }

    // Compactar secciones
    const sections = receiptElement.querySelectorAll('.client-section, .shipping-section, .receipt-meta');
    sections.forEach(section => {
        section.style.padding = '10px';
        section.style.marginBottom = '10px';
    });

    // Compactar headers de sección
    const sectionHeaders = receiptElement.querySelectorAll('.section-header-compact');
    sectionHeaders.forEach(header => {
        header.style.padding = '8px 10px';
        header.style.fontSize = '12px';
        header.style.margin = '-10px -10px 10px -10px';
    });

    // Compactar tabla de productos
    const productsTable = receiptElement.querySelector('.products-table-compact');
    if (productsTable) {
        productsTable.style.fontSize = '10px';
    }

    const tableCells = receiptElement.querySelectorAll('.products-table-compact th, .products-table-compact td');
    tableCells.forEach(cell => {
        cell.style.padding = '4px 6px';
        cell.style.fontSize = '9px';
    });

    // Compactar totales
    const totalRows = receiptElement.querySelectorAll('.total-row');
    totalRows.forEach(row => {
        row.style.padding = '3px 0';
        row.style.fontSize = '10px';
    });

    // Compactar footer
    const footer = receiptElement.querySelector('.receipt-footer-compact');
    if (footer) {
        footer.style.padding = '10px';
        footer.style.fontSize = '9px';
    }
}


// === ACTUALIZAR EL MODAL PARA USAR LA NUEVA FUNCIÓN ===
function updateReceiptModalFooter(saleId, client) {
    const modalFooter = document.querySelector('#sale-receipt-modal .modal-footer');
    if (!modalFooter) return;
    
    modalFooter.innerHTML = `
        <button class="btn btn-success" onclick="downloadReceipt(${saleId})">
            <i class="fas fa-file-pdf"></i> Descargar
        </button>
        <button class="btn btn-primary" onclick="printReceipt()">
            <i class="fas fa-print"></i> Imprimir
        </button>
        <button class="btn btn-danger" onclick="closeReceiptModal()">
            <i class="fas fa-times"></i> Cerrar
        </button>
    `;
}


// === FUNCIÓN ALTERNATIVA PARA GUARDAR COMO PDF ===
function downloadReceiptAsPDF(saleId) {
    try {
        const receiptContent = document.getElementById('electronic-receipt');
        
        if (!receiptContent) {
            showAlert('No hay recibo para descargar', 'error');
            return;
        }

        // Usar la funcionalidad nativa de impresión para guardar como PDF
        const printContent = receiptContent.outerHTML;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Boleta SkinBri Shop</title>
                <style>
                    body { 
                        margin: 0; 
                        padding: 20px; 
                        font-family: Arial, sans-serif;
                    }
                    .electronic-receipt { 
                        box-shadow: none;
                        border: 1px solid #ddd;
                    }
                    .btn, .action-buttons, .modal-footer {
                        display: none;
                    }
                    @media print {
                        body { margin: 0; padding: 0; }
                    }
                </style>
            </head>
            <body>
                ${printContent}
                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
        
        showAlert('✅ Abriendo boleta para guardar como PDF...', 'success');
        
    } catch (error) {
        console.error('Error al generar PDF:', error);
        showAlert('❌ Error al generar el PDF', 'error');
    }
}




console.log('✅ Sistema de ventas cargado correctamente');
