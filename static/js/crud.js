document.addEventListener('DOMContentLoaded', function() {
    const usuariosTableBody = document.getElementById('usuariosTableBody');
    const loadingTable = document.getElementById('loadingTable');
    const noUsuarios = document.getElementById('noUsuarios');
    const searchUsuario = document.getElementById('searchUsuario');
    
    const btnNuevoUsuario = document.getElementById('btnNuevoUsuario');
    const usuarioModal = document.getElementById('usuarioModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const usuarioForm = document.getElementById('usuarioForm');
    const modalTitulo = document.getElementById('modalTitulo');
    
    const confirmModal = document.getElementById('confirmModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

    let todosLosUsuarios = [];
    let usuariosFiltrados = [];
    let usuarioAEliminar = null;
    let modoEdicion = false;

    // Cargar usuarios al inicio
    cargarUsuarios();

    async function cargarUsuarios() {
        try {
            const response = await fetch('/api/usuarios');
            const data = await response.json();

            if (data.success) {
                todosLosUsuarios = data.usuarios;
                usuariosFiltrados = todosLosUsuarios;
                mostrarUsuarios(usuariosFiltrados);
            } else {
                mostrarError('Error al cargar clientes');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarError('Error de conexión');
        } finally {
            loadingTable.classList.add('hidden');
        }
    }

    function mostrarUsuarios(usuarios) {
        usuariosTableBody.innerHTML = '';

        if (usuarios.length === 0) {
            noUsuarios.classList.remove('hidden');
            return;
        }

        noUsuarios.classList.add('hidden');

        usuarios.forEach((usuario, index) => {
            const row = crearFilaUsuario(usuario, index);
            usuariosTableBody.appendChild(row);
            
            // Animación de entrada
            setTimeout(() => {
                row.classList.add('opacity-100', 'translate-x-0');
            }, index * 30);
        });
    }

    function crearFilaUsuario(usuario, index) {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-200 hover:bg-pink-50 transition-all duration-300 opacity-0 translate-x-4';
        
        const estadoBadge = usuario.estado === 'activo' ?
            '<span class="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">Activo</span>' :
            '<span class="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded">Inactivo</span>';

        row.innerHTML = `
            <td class="px-4 py-3 text-sm text-gray-700">${usuario.id}</td>
            <td class="px-4 py-3 text-sm text-gray-800 font-medium">${usuario.nombre}</td>
            <td class="px-4 py-3 text-sm text-gray-700">${usuario.apellidos}</td>
            <td class="px-4 py-3 text-sm text-gray-700">${usuario.dni}</td>
            <td class="px-4 py-3 text-sm text-gray-700">${usuario.telefono}</td>
            <td class="px-4 py-3 text-sm text-gray-700">${usuario.correo}</td>
            <td class="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">${usuario.direccion}</td>
            <td class="px-4 py-3 text-sm">${estadoBadge}</td>
            <td class="px-4 py-3 text-sm">
                <div class="flex space-x-2">
                    <button onclick="editarUsuario(${usuario.id})" 
                        class="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-110 text-xs font-semibold">
                        Editar
                    </button>
                    <button onclick="confirmarEliminar(${usuario.id})" 
                        class="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-110 text-xs font-semibold">
                        Eliminar
                    </button>
                </div>
            </td>
        `;

        return row;
    }

    // Búsqueda de usuarios
    searchUsuario.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        
        usuariosFiltrados = todosLosUsuarios.filter(usuario => {
            return usuario.nombre.toLowerCase().includes(searchTerm) ||
                   usuario.apellidos.toLowerCase().includes(searchTerm) ||
                   usuario.dni.includes(searchTerm) ||
                   usuario.correo.toLowerCase().includes(searchTerm);
        });

        mostrarUsuarios(usuariosFiltrados);
    });

    // Nuevo usuario
    btnNuevoUsuario.addEventListener('click', function() {
        modoEdicion = false;
        modalTitulo.textContent = 'Nuevo Cliente';
        usuarioForm.reset();
        document.getElementById('usuarioId').value = '';
        abrirModal();
    });

    // Editar usuario (función global para onclick)
    window.editarUsuario = async function(id) {
        modoEdicion = true;
        modalTitulo.textContent = 'Editar Cliente';
        
        const usuario = todosLosUsuarios.find(u => u.id === id);
        if (usuario) {
            document.getElementById('usuarioId').value = usuario.id;
            document.getElementById('nombre').value = usuario.nombre;
            document.getElementById('apellidos').value = usuario.apellidos;
            document.getElementById('dni').value = usuario.dni;
            document.getElementById('telefono').value = usuario.telefono;
            document.getElementById('correo').value = usuario.correo;
            document.getElementById('direccion').value = usuario.direccion;
            document.getElementById('estado').value = usuario.estado;
            
            abrirModal();
        }
    };

    // Confirmar eliminación
    window.confirmarEliminar = function(id) {
        usuarioAEliminar = id;
        confirmModal.classList.remove('hidden');
        confirmModal.classList.add('flex');
    };

    confirmDeleteBtn.addEventListener('click', async function() {
        if (usuarioAEliminar) {
            await eliminarUsuario(usuarioAEliminar);
            cerrarConfirmModal();
        }
    });

    cancelDeleteBtn.addEventListener('click', cerrarConfirmModal);

    function cerrarConfirmModal() {
        confirmModal.classList.add('hidden');
        confirmModal.classList.remove('flex');
        usuarioAEliminar = null;
    }

    async function eliminarUsuario(id) {
        try {
            const response = await fetch(`/api/usuarios/${id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                mostrarNotificacion('Cliente eliminado exitosamente', 'success');
                await cargarUsuarios();
            } else {
                mostrarNotificacion(data.message || 'Error al eliminar cliente', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error de conexión', 'error');
        }
    }

    // Abrir y cerrar modal
    function abrirModal() {
        usuarioModal.classList.remove('hidden');
        usuarioModal.classList.add('flex');
        document.getElementById('formError').classList.add('hidden');
        
        // Animación
        setTimeout(() => {
            usuarioModal.querySelector('.bg-white').classList.add('scale-100');
        }, 10);
    }

    function cerrarModal() {
        usuarioModal.querySelector('.bg-white').classList.remove('scale-100');
        setTimeout(() => {
            usuarioModal.classList.add('hidden');
            usuarioModal.classList.remove('flex');
        }, 300);
    }

    closeModalBtn.addEventListener('click', cerrarModal);
    cancelBtn.addEventListener('click', cerrarModal);

    usuarioModal.addEventListener('click', function(e) {
        if (e.target === usuarioModal) {
            cerrarModal();
        }
    });

    // Validaciones en tiempo real
    document.getElementById('dni').addEventListener('input', function(e) {
        this.value = this.value.replace(/\D/g, '');
        validarCampo(this, /^\d{8}$/.test(this.value));
    });

    document.getElementById('telefono').addEventListener('input', function(e) {
        this.value = this.value.replace(/\D/g, '');
        validarCampo(this, /^\d{9}$/.test(this.value));
    });

    document.getElementById('correo').addEventListener('input', function(e) {
        validarCampo(this, /^[\w\.-]+@[\w\.-]+\.\w+$/.test(this.value));
    });

    function validarCampo(campo, esValido) {
        if (campo.value.length === 0) {
            campo.classList.remove('border-red-500', 'border-green-500');
            return;
        }
        
        if (esValido) {
            campo.classList.add('border-green-500');
            campo.classList.remove('border-red-500');
        } else {
            campo.classList.add('border-red-500');
            campo.classList.remove('border-green-500');
        }
    }

    // Enviar formulario
    usuarioForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = {
            nombre: document.getElementById('nombre').value.trim(),
            apellidos: document.getElementById('apellidos').value.trim(),
            dni: document.getElementById('dni').value.trim(),
            telefono: document.getElementById('telefono').value.trim(),
            correo: document.getElementById('correo').value.trim(),
            direccion: document.getElementById('direccion').value.trim(),
            estado: document.getElementById('estado').value
        };

        const formError = document.getElementById('formError');
        const saveBtn = document.getElementById('saveBtn');

        // Validaciones
        if (!validarFormulario(formData, formError)) {
            return;
        }

        // Deshabilitar botón
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<div class="flex items-center justify-center"><div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>Guardando...</div>';

        try {
            const usuarioId = document.getElementById('usuarioId').value;
            const url = modoEdicion ? `/api/usuarios/${usuarioId}` : '/api/usuarios';
            const method = modoEdicion ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                mostrarNotificacion(
                    modoEdicion ? 'Cliente actualizado exitosamente' : 'Cliente creado exitosamente',
                    'success'
                );
                cerrarModal();
                await cargarUsuarios();
            } else {
                mostrarErrorForm(formError, data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarErrorForm(formError, 'Error de conexión');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'Guardar';
        }
    });

    function validarFormulario(data, errorDiv) {
        if (!data.nombre || !data.apellidos || !data.dni || !data.telefono || !data.correo || !data.direccion) {
            mostrarErrorForm(errorDiv, 'Todos los campos son obligatorios');
            return false;
        }

        if (!/^\d{8}$/.test(data.dni)) {
            mostrarErrorForm(errorDiv, 'El DNI debe tener 8 dígitos');
            return false;
        }

        if (!/^\d{9}$/.test(data.telefono)) {
            mostrarErrorForm(errorDiv, 'El teléfono debe tener 9 dígitos');
            return false;
        }

        if (!/^[\w\.-]+@[\w\.-]+\.\w+$/.test(data.correo)) {
            mostrarErrorForm(errorDiv, 'Formato de correo inválido');
            return false;
        }

        return true;
    }

    function mostrarErrorForm(element, mensaje) {
        element.textContent = mensaje;
        element.classList.remove('hidden');
        element.classList.add('animate-pulse');
        
        setTimeout(() => {
            element.classList.remove('animate-pulse');
        }, 1000);
    }

    function mostrarError(mensaje) {
        usuariosTableBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-8 text-red-600">
                    ${mensaje}
                </td>
            </tr>
        `;
    }

    function mostrarNotificacion(mensaje, tipo) {
        const notif = document.createElement('div');
        notif.className = `fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg text-white z-50 transform transition-all duration-500 translate-x-full ${
            tipo === 'success' ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'
        }`;
        notif.textContent = mensaje;
        
        document.body.appendChild(notif);
        
        setTimeout(() => {
            notif.classList.remove('translate-x-full');
        }, 100);
        
        setTimeout(() => {
            notif.classList.add('translate-x-full');
            setTimeout(() => {
                document.body.removeChild(notif);
            }, 500);
        }, 3000);
    }
});