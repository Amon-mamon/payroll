from django.contrib.auth.models import AbstractBaseUser
from django.db import models
# Create your models here.
from common.models import BaseModel

""" 
    Don't inherit two class that both have id fields
    !Clashes of two inherist class models
"""
class User(AbstractBaseUser, BaseModel):
    #always unique 
    email = models.EmailField(unique=True)
    
    REQUIRED_FIELDS = ["email"]
    USERNAME_FIELD = "username"
    
    def __str__(self):
        return f"USERNAME: {self.username}"

    