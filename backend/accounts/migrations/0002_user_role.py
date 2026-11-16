from django.db import migrations, models


def assign_roles(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    for user in User.objects.all():
        groups = set(user.groups.values_list("name", flat=True))
        if user.is_superuser or "Admin" in groups:
            user.role = "admin"
        elif "HR" in groups:
            user.role = "hr"
        else:
            user.role = "employee"
        user.save(update_fields=["role"])


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="role",
            field=models.CharField(
                choices=[("admin", "Admin"), ("hr", "HR"), ("employee", "Employee")],
                default="employee",
                max_length=20,
            ),
        ),
        migrations.RunPython(assign_roles, migrations.RunPython.noop),
    ]
