from django.contrib import admin
from django.contrib.auth.admin import GroupAdmin
from django.contrib.auth.models import Group
from .models import User
# Unregister the default (if it was registered) and register with our custom label
# This makes it show up under "Accounts" instead of "Authentication"
class AccountAdmin(admin.ModelAdmin):
    list_display = ["id", "username", "email", "is_staff"]
    readonly_fields = ["id"]
admin.site.register(User, AccountAdmin)