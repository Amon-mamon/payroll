from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    groups = serializers.SlugRelatedField(many=True, read_only=True, slug_field='name')
    
    class Meta:  # <--- ADD THIS LINE
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "is_superuser", "groups"]
        read_only_fields = ["id"]