from django.shortcuts import render
from rest_framework import generics, permissions
from .models import User
from .serializers import UserSerializers

# Create your views here.
""" 
    MeView used generics because of what the class do (ONE JOB WHICH IS GET) - SINGLE PURPOSE ENDPOINTS ONLY
    
"""
class MeView(generics.RetriveAPIView):
    serializer_class = UserSerializers
    permission_classes = [permissions.isAuthenticated]
    
    def get_object(self):
        return self.request.user