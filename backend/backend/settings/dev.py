import os
from .base import *

# Development keys and settings
SECRET_KEY = 'django-insecure-ys=q(i768x^ak#c*o8y)^af*b8-3jq8d$2-h*6pe0ztdb!7r85'
DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# Relaxed local security controls
CORS_ALLOW_ALL_ORIGINS = True

# Development SQLite database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
