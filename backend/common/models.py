import uuid
from django.db import models
from django.utils import timezone
# Create your models here.

class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.BooleanField(null=True, blank=True)
    
    class Meta:
        abstract = True
        ordering = ["-created_at"]
        
    def soft_delete(self):
        self.is_delete = True
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "deleted_at"])
        
    def restore(self):
        self.is_delete = False
        self.deleted_at = None
        self.save(update_fields=["is_deleted", "deleted_at"])
        
        