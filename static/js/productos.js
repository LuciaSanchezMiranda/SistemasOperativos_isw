document.addEventListener('DOMContentLoaded', function() {
    const productosContainer = document.getElementById('productosContainer');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const noProducts = document.getElementById('noProducts');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const productModal = document.getElementById('productModal');
    const closeModal = document.getElementById('closeModal');

    let todosLosProductos = [];
    let productosFiltrados = [];

    // Cargar productos
    cargarProductos();

    async function cargarProductos() {
        try {
            const response = await fetch('/api/productos');
            const data = await response.json();

            if (data.success) {
                todosLosProductos = data.productos;
                productosFiltrados = todosLosProductos;
                mostrarProductos(productosFiltrados);
            } else {
                mostrarMensajeError();
            }
        } catch (error) {
            console.error('Error al cargar productos:', error);
            mostrarMensajeError();
        } finally {
            loadingSpinner.classList.add('hidden');
        }
    }

    function mostrarProductos(productos) {
        productosContainer.innerHTML = '';

        if (productos.length === 0) {
            noProducts.classList.remove('hidden');
            return;
        }

        noProducts.classList.add('hidden');

        productos.forEach((producto, index) => {
            const card = crearCardProducto(producto, index);
            productosContainer.appendChild(card);
            
            // Animación de entrada
            setTimeout(() => {
                card.classList.add('opacity-100', 'translate-y-0');
            }, index * 50);
        });
    }

    function crearCardProducto(producto, index) {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-500 hover:shadow-2xl hover:scale-105 opacity-0 translate-y-4 cursor-pointer border border-pink-100';
        
        const estadoStock = producto.stock > 0 ? 
            `<span class="bg-gradient-to-r from-green-400 to-green-500 text-white text-xs font-semibold px-2 py-1 rounded">${producto.stock} disponibles</span>` :
            `<span class="bg-gradient-to-r from-red-400 to-red-500 text-white text-xs font-semibold px-2 py-1 rounded">Agotado</span>`;

        const imagenUrl = producto.imagen || 'https://via.placeholder.com/400x300?text=Sin+Imagen';

        const categoriaNombre = {
            'maquillaje': 'Maquillaje',
            'skincare': 'Skincare',
            'fragancias': 'Fragancias',
            'cabello': 'Cabello',
            'cuidado_personal': 'Cuidado Personal'
        }[producto.categoria] || 'General';

        card.innerHTML = `
            <div class="relative">
                <img src="${imagenUrl}" alt="${producto.nombre}" 
                    class="w-full h-48 object-cover transition-transform duration-300 hover:scale-110"
                    onerror="this.src='https://via.placeholder.com/400x300?text=Sin+Imagen'">
                <div class="absolute top-2 right-2">
                    ${estadoStock}
                </div>
            </div>
            <div class="p-5">
                <div class="mb-2">
                    <span class="text-xs font-semibold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 uppercase tracking-wide">${categoriaNombre}</span>
                </div>
                <h3 class="text-xl font-bold text-gray-800 mb-2 truncate">${producto.nombre}</h3>
                <p class="text-gray-600 text-sm mb-4 line-clamp-2">${producto.descripcion || 'Sin descripción'}</p>
                <div class="flex justify-between items-center">
                    <span class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">S/ ${parseFloat(producto.precio).toFixed(2)}</span>
                    <button class="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all text-sm font-semibold shadow-md">
                        Ver Detalles
                    </button>
                </div>
            </div>
        `;

        card.addEventListener('click', () => mostrarDetalleProducto(producto));

        return card;
    }

    function mostrarDetalleProducto(producto) {
        document.getElementById('modalTitle').textContent = producto.nombre;
        
        const categoriaNombre = {
            'maquillaje': 'Maquillaje',
            'skincare': 'Skincare',
            'fragancias': 'Fragancias',
            'cabello': 'Cabello',
            'cuidado_personal': 'Cuidado Personal'
        }[producto.categoria] || 'General';
        
        document.getElementById('modalCategory').textContent = categoriaNombre;
        document.getElementById('modalDescription').textContent = producto.descripcion || 'Sin descripción';
        document.getElementById('modalSpecs').textContent = producto.especificaciones || 'No especificado';
        document.getElementById('modalPrice').textContent = `S/ ${parseFloat(producto.precio).toFixed(2)}`;
        
        const stockText = producto.stock > 0 ? 
            `✓ ${producto.stock} unidades disponibles` : 
            '✗ Agotado';
        const stockClass = producto.stock > 0 ? 'text-green-600' : 'text-red-600';
        document.getElementById('modalStock').textContent = stockText;
        document.getElementById('modalStock').className = `text-sm font-semibold ${stockClass}`;

        const imagenUrl = producto.imagen || 'https://via.placeholder.com/600x400?text=Sin+Imagen';
        document.getElementById('modalImage').innerHTML = `
            <img src="${imagenUrl}" alt="${producto.nombre}" 
                class="w-full h-full object-contain"
                onerror="this.src='https://via.placeholder.com/600x400?text=Sin+Imagen'">
        `;

        productModal.classList.remove('hidden');
        productModal.classList.add('flex');
        
        // Animación de entrada
        setTimeout(() => {
            productModal.querySelector('.bg-white').classList.add('scale-100');
        }, 10);
    }

    closeModal.addEventListener('click', cerrarModal);
    
    productModal.addEventListener('click', function(e) {
        if (e.target === productModal) {
            cerrarModal();
        }
    });

    function cerrarModal() {
        productModal.querySelector('.bg-white').classList.remove('scale-100');
        setTimeout(() => {
            productModal.classList.add('hidden');
            productModal.classList.remove('flex');
        }, 300);
    }

    // Búsqueda y filtrado
    searchInput.addEventListener('input', filtrarProductos);
    categoryFilter.addEventListener('change', filtrarProductos);

    function filtrarProductos() {
        const searchTerm = searchInput.value.toLowerCase();
        const category = categoryFilter.value;

        productosFiltrados = todosLosProductos.filter(producto => {
            const matchSearch = producto.nombre.toLowerCase().includes(searchTerm) ||
                              (producto.descripcion && producto.descripcion.toLowerCase().includes(searchTerm));
            const matchCategory = !category || producto.categoria === category;
            
            return matchSearch && matchCategory;
        });

        mostrarProductos(productosFiltrados);
    }

    function mostrarMensajeError() {
        productosContainer.innerHTML = `
            <div class="col-span-full text-center py-16">
                <svg class="w-24 h-24 text-red-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p class="text-gray-500 text-xl">Error al cargar los productos</p>
                <button onclick="location.reload()" class="mt-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all">
                    Reintentar
                </button>
            </div>
        `;
    }

    // Animación de entrada para los controles de filtrado
    setTimeout(() => {
        searchInput.classList.add('animate-fade-in');
        categoryFilter.classList.add('animate-fade-in');
    }, 200);
});