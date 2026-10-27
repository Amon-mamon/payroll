from django.contrib import admin
from django.contrib.auth.admin import GroupAdmin
from django.contrib.auth.models import Group

# Unregister the default (if it was registered) and register with our custom label
# This makes it show up under "Accounts" instead of "Authentication"
admin.site.unregister(Group)
admin.site.register(Group, GroupAdmin)