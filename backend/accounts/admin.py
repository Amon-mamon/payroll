from django.contrib import admin

from .models import User


@admin.register(User)
class AccountAdmin(admin.ModelAdmin):
    list_display = ["id", "username", "email", "role", "is_active", "is_staff"]
    list_filter = ["role", "is_active"]
    readonly_fields = ["id"]
