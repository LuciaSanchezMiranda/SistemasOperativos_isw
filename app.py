from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import mysql.connector
from mysql.connector import Error
from config import Config

app = Flask(__name__)
app.config.from_object(Config)

def get_db_connection():
    try:
        connection = mysql.connector.connect(**Config.DB_CONFIG)
        return connection
    except Error as e:
        print(f"Error al conectar a la base de datos: {e}")
        return None

def login_required(f):
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

def admin_required(f):
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or not session.get('is_admin'):
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

def hash_password(password):
    import hashlib
    return hashlib.sha256(password.encode()).hexdigest()

def validar_email(email):
    import re
    patron = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return re.match(patron, email) is not None

def validar_dni(dni):
    import re
    return re.match(r'^\d{8}$', dni) is not None

def validar_telefono(telefono):
    import re
    return re.match(r'^\d{9}$', telefono) is not None

@app.route('/')
def index():
    if 'user_id' in session:
        if session.get('is_admin'):
            return redirect(url_for('crud'))
        return redirect(url_for('productos'))
    return render_template('index.html')

@app.route('/productos')
@login_required
def productos():
    return render_template('productos.html', user_name=session.get('user_name'))

@app.route('/crud')
@admin_required
def crud():
    return render_template('crud.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    
    required_fields = ['nombre', 'apellidos', 'dni', 'telefono', 'correo', 'password', 'direccion']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'success': False, 'message': f'El campo {field} es requerido'}), 400
    
    if not validar_email(data['correo']):
        return jsonify({'success': False, 'message': 'Formato de correo inválido'}), 400
    
    if not validar_dni(data['dni']):
        return jsonify({'success': False, 'message': 'DNI debe tener 8 dígitos'}), 400
    
    if not validar_telefono(data['telefono']):
        return jsonify({'success': False, 'message': 'Teléfono debe tener 9 dígitos'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Error de conexión a la base de datos'}), 500
    
    try:
        cursor = conn.cursor()
        
        cursor.execute("SELECT id FROM usuarios WHERE correo = %s", (data['correo'],))
        if cursor.fetchone():
            return jsonify({'success': False, 'message': 'El correo ya está registrado'}), 400
        
        cursor.execute("SELECT id FROM usuarios WHERE dni = %s", (data['dni'],))
        if cursor.fetchone():
            return jsonify({'success': False, 'message': 'El DNI ya está registrado'}), 400
        
        query = """
            INSERT INTO usuarios (nombre, apellidos, dni, telefono, correo, password, direccion, estado)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'activo')
        """
        hashed_password = hash_password(data['password'])
        cursor.execute(query, (
            data['nombre'],
            data['apellidos'],
            data['dni'],
            data['telefono'],
            data['correo'],
            hashed_password,
            data['direccion']
        ))
        
        conn.commit()
        user_id = cursor.lastrowid
        
        session['user_id'] = user_id
        session['user_name'] = data['nombre']
        session['is_admin'] = False
        
        return jsonify({'success': True, 'message': 'Usuario registrado exitosamente'})
    
    except Error as e:
        return jsonify({'success': False, 'message': f'Error al registrar usuario: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data.get('correo') or not data.get('password'):
        return jsonify({'success': False, 'message': 'Correo y contraseña son requeridos'}), 400
    
    if data['correo'] == Config.ADMIN_EMAIL and data['password'] == Config.ADMIN_PASSWORD:
        session['user_id'] = 0
        session['user_name'] = 'Administrador'
        session['is_admin'] = True
        return jsonify({'success': True, 'is_admin': True, 'message': 'Login exitoso'})
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Error de conexión a la base de datos'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        hashed_password = hash_password(data['password'])
        query = "SELECT id, nombre, correo, estado FROM usuarios WHERE correo = %s AND password = %s"
        cursor.execute(query, (data['correo'], hashed_password))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'success': False, 'message': 'Credenciales incorrectas'}), 401
        
        if user['estado'] == 'inactivo':
            return jsonify({'success': False, 'message': 'Usuario inactivo. Contacte al administrador'}), 403
        
        session['user_id'] = user['id']
        session['user_name'] = user['nombre']
        session['is_admin'] = False
        
        return jsonify({'success': True, 'is_admin': False, 'message': 'Login exitoso'})
    
    except Error as e:
        return jsonify({'success': False, 'message': f'Error al iniciar sesión: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/usuarios', methods=['GET'])
@admin_required
def get_usuarios():
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Error de conexión'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, nombre, apellidos, dni, telefono, correo, direccion, estado FROM usuarios ORDER BY id DESC")
        usuarios = cursor.fetchall()
        return jsonify({'success': True, 'usuarios': usuarios})
    except Error as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/usuarios', methods=['POST'])
@admin_required
def create_usuario():
    data = request.get_json()
    
    required_fields = ['nombre', 'apellidos', 'dni', 'telefono', 'correo', 'direccion']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'success': False, 'message': f'El campo {field} es requerido'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Error de conexión'}), 500
    
    try:
        cursor = conn.cursor()
        
        cursor.execute("SELECT id FROM usuarios WHERE correo = %s OR dni = %s", 
                      (data['correo'], data['dni']))
        if cursor.fetchone():
            return jsonify({'success': False, 'message': 'Correo o DNI ya registrado'}), 400
        
        query = """
            INSERT INTO usuarios (nombre, apellidos, dni, telefono, correo, password, direccion, estado)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        default_password = hash_password('123456')
        cursor.execute(query, (
            data['nombre'],
            data['apellidos'],
            data['dni'],
            data['telefono'],
            data['correo'],
            default_password,
            data['direccion'],
            data.get('estado', 'activo')
        ))
        
        conn.commit()
        return jsonify({'success': True, 'message': 'Cliente creado exitosamente'})
    
    except Error as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/usuarios/<int:user_id>', methods=['PUT'])
@admin_required
def update_usuario(user_id):
    data = request.get_json()
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Error de conexión'}), 500
    
    try:
        cursor = conn.cursor()
        
        query = """
            UPDATE usuarios 
            SET nombre = %s, apellidos = %s, dni = %s, telefono = %s, 
                correo = %s, direccion = %s, estado = %s
            WHERE id = %s
        """
        cursor.execute(query, (
            data['nombre'],
            data['apellidos'],
            data['dni'],
            data['telefono'],
            data['correo'],
            data['direccion'],
            data['estado'],
            user_id
        ))
        
        conn.commit()
        return jsonify({'success': True, 'message': 'Cliente actualizado exitosamente'})
    
    except Error as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/usuarios/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_usuario(user_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Error de conexión'}), 500
    
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM usuarios WHERE id = %s", (user_id,))
        conn.commit()
        
        if cursor.rowcount == 0:
            return jsonify({'success': False, 'message': 'Cliente no encontrado'}), 404
        
        return jsonify({'success': True, 'message': 'Cliente eliminado exitosamente'})
    
    except Error as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/productos', methods=['GET'])
@login_required
def get_productos():
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Error de conexión'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM productos ORDER BY id DESC")
        productos = cursor.fetchall()
        return jsonify({'success': True, 'productos': productos})
    except Error as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)