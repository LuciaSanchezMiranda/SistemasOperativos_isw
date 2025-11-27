import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'tu-clave-secreta-aqui')
    
    # Configuración de base de datos MySQL en AWS EC2
    DB_CONFIG = {
        'host': os.getenv('DB_HOST'),
        'user': os.getenv('DB_USER'),
        'password': os.getenv('DB_PASSWORD'),
        'database': os.getenv('DB_NAME'),
        'port': int(os.getenv('DB_PORT', 3306))
    }
    
    # Usuario administrador
    ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'admin@tiendatech.com')
    ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'Admin123!')