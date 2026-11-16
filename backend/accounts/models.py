from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.TextChoices):
    ADMIN = "admin", "Admin"
    HR = "hr", "HR"
    EMPLOYEE = "employee", "Employee"


class User(AbstractUser):
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.EMPLOYEE)
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="users",
        help_text="The subscribing company this account belongs to. Empty only for platform superusers.",
    )

    REQUIRED_FIELDS = ["email"]
    USERNAME_FIELD = "username"

    def save(self, *args, **kwargs):
        # Superusers (e.g. created via `createsuperuser`) are always admins.
        if self.is_superuser:
            self.role = Role.ADMIN
        super().save(*args, **kwargs)

    @property
    def is_admin(self) -> bool:
        return self.is_superuser or self.role == Role.ADMIN

    @property
    def is_hr(self) -> bool:
        return self.role == Role.HR

    @property
    def is_hr_or_admin(self) -> bool:
        return self.is_admin or self.is_hr

    def __str__(self):
        return f"USER: {self.username}"
