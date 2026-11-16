from django.core.management.base import BaseCommand

from leaves.services import seed_leave_types
from organizations.models import Organization


class Command(BaseCommand):
    help = "Seeds the default leave types for every company"

    def handle(self, *args, **kwargs):
        orgs = Organization.objects.filter(is_deleted=False)
        for org in orgs:
            seed_leave_types(org)
        self.stdout.write(self.style.SUCCESS(f"Seeded leave types for {orgs.count()} company(ies)"))
