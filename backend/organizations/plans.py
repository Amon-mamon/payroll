"""
Static subscription catalogue. Prices are in PHP. There is no payment provider:
subscribing starts a free trial, and "activating" is recorded without charging.
"""
from decimal import Decimal

TRIAL_DAYS = 14
YEARLY_MONTHS_CHARGED = 10  # pay 10 months, get 12

PLANS = {
    "starter": {
        "code": "starter",
        "name": "Starter",
        "tagline": "For small teams getting off spreadsheets.",
        "price_monthly": Decimal("1499.00"),
        "max_employees": 10,
        "features": [
            "Up to 10 employees",
            "Web time clock with late tracking",
            "Leave requests & balances",
            "Semi-monthly payroll & payslips",
        ],
        "highlight": False,
    },
    "growth": {
        "code": "growth",
        "name": "Growth",
        "tagline": "For growing companies with a dedicated HR team.",
        "price_monthly": Decimal("3999.00"),
        "max_employees": 50,
        "features": [
            "Up to 50 employees",
            "Everything in Starter",
            "Multiple HR accounts",
            "Per-employee schedules & overtime",
        ],
        "highlight": True,
    },
    "business": {
        "code": "business",
        "name": "Business",
        "tagline": "For established companies with many departments.",
        "price_monthly": Decimal("9999.00"),
        "max_employees": 250,
        "features": [
            "Up to 250 employees",
            "Everything in Growth",
            "Department-level reporting",
            "Priority support",
        ],
        "highlight": False,
    },
}

PLAN_CHOICES = [(code, p["name"]) for code, p in PLANS.items()]


def plan_price(code: str, cycle: str) -> Decimal:
    monthly = PLANS[code]["price_monthly"]
    return monthly * YEARLY_MONTHS_CHARGED if cycle == "yearly" else monthly


def public_plans():
    return [
        {
            **{k: v for k, v in p.items() if k != "price_monthly"},
            "price_monthly": str(p["price_monthly"]),
            "price_yearly": str(plan_price(p["code"], "yearly")),
        }
        for p in PLANS.values()
    ]
