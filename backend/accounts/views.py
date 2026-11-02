from django.shortcuts import render
from rest_framework import generics, permissions
from .models import User
from .serializers import UserSerializer

# Create your views here.
""" 
    MeView used generics because of what the class do (ONE JOB WHICH IS GET) - SINGLE PURPOSE ENDPOINTS ONLY
    
"""
class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    
