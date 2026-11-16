from datetime import timedelta

from django.db import models
from django.utils import timezone
from django.utils.text import slugify

from common.models import BaseModel

from .plans import PLAN_CHOICES, PLANS, TRIAL_DAYS


class SubscriptionStatus(models.TextChoices):
    TRIALING = "trialing", "Trialing"
    ACTIVE = "active", "Active"
    CANCELLED = "cancelled", "Cancelled"


class BillingCycle(models.TextChoices):
    MONTHLY = "monthly", "Monthly"
    YEARLY = "yearly", "Yearly"


class Organization(BaseModel):
    """A subscribing company (tenant). Every user and record belongs to exactly one."""

    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=160, unique=True)

    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default="starter")
    billing_cycle = models.CharField(max_length=10, choices=BillingCycle.choices, default=BillingCycle.MONTHLY)
    status = models.CharField(max_length=20, choices=SubscriptionStatus.choices, default=SubscriptionStatus.TRIALING)
    trial_ends_at = models.DateTimeField(null=True, blank=True)
    current_period_end = models.DateTimeField(null=True, blank=True)
    cancel_at_period_end = models.BooleanField(default=False)

    class Meta(BaseModel.Meta):
        ordering = ["name"]

    def __str__(self):
        return self.name

    # ---- helpers ---------------------------------------------------------

    @classmethod
    def unique_slug(cls, name):
        base = slugify(name)[:150] or "company"
        slug, n = base, 2
        while cls.objects.filter(slug=slug).exists():
            slug = f"{base}-{n}"
            n += 1
        return slug

    @classmethod
    def start_trial(cls, name, plan, billing_cycle):
        return cls.objects.create(
            name=name,
            slug=cls.unique_slug(name),
            plan=plan,
            billing_cycle=billing_cycle,
            status=SubscriptionStatus.TRIALING,
            trial_ends_at=timezone.now() + timedelta(days=TRIAL_DAYS),
        )

    @property
    def plan_info(self):
        return PLANS[self.plan]

    @property
    def max_employees(self):
        return self.plan_info["max_employees"]

    @property
    def access_ends_at(self):
        if self.status == SubscriptionStatus.TRIALING:
            return self.trial_ends_at
        return self.current_period_end

    @property
    def has_access(self):
        ends = self.access_ends_at
        return ends is not None and ends >= timezone.now()

    @property
    def effective_status(self):
        """trialing | active | cancelling | expired"""
        if not self.has_access:
            return "expired"
        if self.cancel_at_period_end:
            return "cancelling"
        return self.status

    def seats_used(self):
        return self.employees.filter(is_deleted=False, user__is_active=True).count()

    def activate(self, plan=None, billing_cycle=None):
        """Start (or renew) a paid period. Static: no payment is taken."""
        if plan:
            self.plan = plan
        if billing_cycle:
            self.billing_cycle = billing_cycle
        days = 365 if self.billing_cycle == BillingCycle.YEARLY else 30
        start = max(timezone.now(), self.current_period_end or timezone.now()) if self.status == SubscriptionStatus.ACTIVE and self.has_access else timezone.now()
        self.status = SubscriptionStatus.ACTIVE
        self.current_period_end = start + timedelta(days=days)
        self.cancel_at_period_end = False
        self.save()
