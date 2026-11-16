from django.contrib import admin

from .models import Organization


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "plan", "billing_cycle", "status", "trial_ends_at", "current_period_end"]
    list_filter = ["plan", "status"]
    search_fields = ["name", "slug"]
