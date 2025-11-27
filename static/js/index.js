document.addEventListener('DOMContentLoaded', function() {
    const loginCard = document.getElementById('loginCard');
    const registerCard = document.getElementById('registerCard');
    const showRegisterBtn = document.getElementById('showRegister');
    const showLoginBtn = document.getElementById('showLogin');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loadingModal = document.getElementById('loadingModal');

    // Animación inicial de las tarjetas
    setTimeout(() => {
        loginCard.classList.add('animate-fade-in');
    }, 100);

    // Alternar entre login y registro con animación
    showRegisterBtn.addEventListener('click', function() {
        loginCard.classList.add('opacity-0', 'scale-95');
        setTimeout(() => {
            loginCard.classList.add('hidden');
            registerCard.classList.remove('hidden');
            setTimeout(() => {
                registerCard.classList.remove('opacity-0', 'scale-95');
                registerCard.classList.add('opacity-100', 'scale-100');
            }, 50);
        }, 300);
    });

    showLoginBtn.addEventListener('click', function() {
        registerCard.classList.add('opacity-0', 'scale-95');
        setTimeout(() => {
            registerCard.classList.add('hidden');
            loginCard.classList.remove('hidden');
            setTimeout(() => {
                loginCard.classList.remove('opacity-0', 'scale-95');
                loginCard.classList.add('opacity-100', 'scale-100');
            }, 50);
        }, 300);
    });

    // Animaciones de los campos del formulario
    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach((group, index) => {
        const input = group.querySelector('input, textarea');
        
        input.addEventListener('focus', function() {
            group.classList.add('transform', 'scale-105');
            this.classList.add('shadow-lg');
        });
        
        input.addEventListener('blur', function() {
            group.classList.remove('transform', 'scale-105');
            this.classList.remove('shadow-lg');
        });

        // Validación en tiempo real
        input.addEventListener('input', function() {
            validateField(this);
        });
    });

    // Función de validación de campos
    function validateField(field) {
        const value = field.value.trim();
        const fieldId = field.id;

        // Validar DNI
        if (fieldId === 'regDni' && value.length > 0) {
            if (!/^\d{8}$/.test(value)) {
                field.classList.add('border-red-500');
                field.classList.remove('border-green-500');
            } else {
                field.classList.add('border-green-500');
                field.classList.remove('border-red-500');
            }
        }

        // Validar teléfono
        if (fieldId === 'regTelefono' && value.length > 0) {
            if (!/^\d{9}$/.test(value)) {
                field.classList.add('border-red-500');
                field.classList.remove('border-green-500');
            } else {
                field.classList.add('border-green-500');
                field.classList.remove('border-red-500');
            }
        }

        // Validar correo
        if ((fieldId === 'regCorreo' || fieldId === 'loginCorreo') && value.length > 0) {
            if (!/^[\w\.-]+@[\w\.-]+\.\w+$/.test(value)) {
                field.classList.add('border-red-500');
                field.classList.remove('border-green-500');
            } else {
                field.classList.add('border-green-500');
                field.classList.remove('border-red-500');
            }
        }

        // Validar contraseña
        if (fieldId === 'regPassword' && value.length > 0) {
            if (value.length < 6) {
                field.classList.add('border-red-500');
                field.classList.remove('border-green-500');
            } else {
                field.classList.add('border-green-500');
                field.classList.remove('border-red-500');
            }
        }
    }

    // Solo números para DNI y teléfono
    document.getElementById('regDni').addEventListener('input', function(e) {
        this.value = this.value.replace(/\D/g, '');
    });

    document.getElementById('regTelefono').addEventListener('input', function(e) {
        this.value = this.value.replace(/\D/g, '');
    });

    // Manejo del formulario de login
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const correo = document.getElementById('loginCorreo').value.trim();
        const password = document.getElementById('loginPassword').value;
        const errorDiv = document.getElementById('loginError');
        const loginBtn = document.getElementById('loginBtn');

        // Validaciones básicas
        if (!correo || !password) {
            showError(errorDiv, 'Por favor complete todos los campos');
            return;
        }

        // Mostrar loading
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<div class="flex items-center justify-center"><div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>Ingresando...</div>';
        loadingModal.classList.remove('hidden');
        loadingModal.classList.add('flex');

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ correo, password })
            });

            const data = await response.json();

            if (data.success) {
                errorDiv.classList.add('hidden');
                
                // Animación de éxito
                loginBtn.innerHTML = '✓ ¡Éxito!';
                loginBtn.classList.remove('bg-gradient-to-r', 'from-pink-600', 'to-rose-600');
                loginBtn.classList.add('bg-green-600');
                
                setTimeout(() => {
                    if (data.is_admin) {
                        window.location.href = '/crud';
                    } else {
                        window.location.href = '/productos';
                    }
                }, 500);
            } else {
                showError(errorDiv, data.message);
                loginBtn.disabled = false;
                loginBtn.innerHTML = 'Ingresar';
                shakeElement(loginCard);
            }
        } catch (error) {
            showError(errorDiv, 'Error de conexión. Intente nuevamente.');
            loginBtn.disabled = false;
            loginBtn.innerHTML = 'Ingresar';
            shakeElement(loginCard);
        } finally {
            loadingModal.classList.add('hidden');
            loadingModal.classList.remove('flex');
        }
    });

    // Manejo del formulario de registro
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            nombre: document.getElementById('regNombre').value.trim(),
            apellidos: document.getElementById('regApellidos').value.trim(),
            dni: document.getElementById('regDni').value.trim(),
            telefono: document.getElementById('regTelefono').value.trim(),
            correo: document.getElementById('regCorreo').value.trim(),
            password: document.getElementById('regPassword').value,
            direccion: document.getElementById('regDireccion').value.trim()
        };

        const errorDiv = document.getElementById('registerError');
        const registerBtn = document.getElementById('registerBtn');

        // Validaciones
        if (!formData.nombre || !formData.apellidos || !formData.dni || 
            !formData.telefono || !formData.correo || !formData.password || !formData.direccion) {
            showError(errorDiv, 'Por favor complete todos los campos');
            shakeElement(registerCard);
            return;
        }

        if (!/^\d{8}$/.test(formData.dni)) {
            showError(errorDiv, 'El DNI debe tener 8 dígitos');
            shakeElement(registerCard);
            return;
        }

        if (!/^\d{9}$/.test(formData.telefono)) {
            showError(errorDiv, 'El teléfono debe tener 9 dígitos');
            shakeElement(registerCard);
            return;
        }

        if (!/^[\w\.-]+@[\w\.-]+\.\w+$/.test(formData.correo)) {
            showError(errorDiv, 'Formato de correo inválido');
            shakeElement(registerCard);
            return;
        }

        if (formData.password.length < 6) {
            showError(errorDiv, 'La contraseña debe tener al menos 6 caracteres');
            shakeElement(registerCard);
            return;
        }

        // Mostrar loading
        registerBtn.disabled = true;
        registerBtn.innerHTML = '<div class="flex items-center justify-center"><div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>Registrando...</div>';
        loadingModal.classList.remove('hidden');
        loadingModal.classList.add('flex');

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                errorDiv.classList.add('hidden');
                
                // Animación de éxito
                registerBtn.innerHTML = '✓ ¡Cuenta creada!';
                registerBtn.classList.remove('bg-gradient-to-r', 'from-purple-600', 'to-pink-600');
                registerBtn.classList.add('bg-green-600');
                
                setTimeout(() => {
                    window.location.href = '/productos';
                }, 500);
            } else {
                showError(errorDiv, data.message);
                registerBtn.disabled = false;
                registerBtn.innerHTML = 'Crear Cuenta';
                shakeElement(registerCard);
            }
        } catch (error) {
            showError(errorDiv, 'Error de conexión. Intente nuevamente.');
            registerBtn.disabled = false;
            registerBtn.innerHTML = 'Crear Cuenta';
            shakeElement(registerCard);
        } finally {
            loadingModal.classList.add('hidden');
            loadingModal.classList.remove('flex');
        }
    });

    // Función para mostrar errores
    function showError(element, message) {
        element.textContent = message;
        element.classList.remove('hidden');
        element.classList.add('animate-pulse');
        
        setTimeout(() => {
            element.classList.remove('animate-pulse');
        }, 1000);
    }

    // Función para animar shake en errores
    function shakeElement(element) {
        element.classList.add('animate-shake');
        setTimeout(() => {
            element.classList.remove('animate-shake');
        }, 500);
    }
});