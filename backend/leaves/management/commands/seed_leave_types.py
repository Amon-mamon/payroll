from django.core.management.base import BaseCommand
from leaves.models import LeaveType

class Command(BaseCommand):
    help = 'Seeds default leave types'

    def handle(self, *args, **kwargs):
        leave_types = [
            {"code": "VL",  "name": "Vacation Leave",          "default_days_per_year": 15,  "is_paid": True},
            {"code": "SL",  "name": "Sick Leave",              "default_days_per_year": 15,  "is_paid": True},
            {"code": "ML",  "name": "Maternity Leave",         "default_days_per_year": 105, "is_paid": True},
            {"code": "PL",  "name": "Paternity Leave",         "default_days_per_year": 7,   "is_paid": True},
            {"code": "SIL", "name": "Service Incentive Leave", "default_days_per_year": 5,   "is_paid": True},
            {"code": "BL",  "name": "Bereavement Leave",       "default_days_per_year": 3,   "is_paid": True},
            {"code": "UL",  "name": "Unpaid Leave",            "default_days_per_year": 0,   "is_paid": False},
        ]
        
        for lt in leave_types:
            LeaveType.objects.get_or_create(code=lt["code"], defaults=lt)
            
        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(leave_types)} leave types'))