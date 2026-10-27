from django.core.management.base import BaseCommand
from leaves.models import LeaveType

class Command(BaseCommand):
    help = 'Seeds default leave types'

    def handle(self, *args, **kwargs):
        leave_types = [
            {"code": "VL", "name": "Vacation Leave", "default_days_per_year": 15, "is_paid": True},
            {"code": "SL", "name": "Sick Leave", "default_days_per_year": 15, "is_paid": True},
            # ... add the rest ...
        ]
        
        for lt in leave_types:
            LeaveType.objects.get_or_create(code=lt["code"], defaults=lt)
            
        self.stdout.write(self.style.SUCCESS('Successfully seeded leave types'))