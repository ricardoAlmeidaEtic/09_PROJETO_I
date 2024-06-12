from django.db import models
from django.contrib.auth import get_user_model
import hashlib

# Create your models here.
class Folder(models.Model):
    id = models.BigAutoField(primary_key=True),
    name = models.CharField(max_length=100, null=False, blank=False,help_text="Folder Name")
    date = models.DateTimeField(auto_now_add=True, blank=True,help_text="Folder Creation Date")
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    parent_folder = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='subfolders', help_text="Parent Folder")

    def __str__(self) -> str:
        return f"{self.user} {self.name} {self.date}"

    class Meta:
        verbose_name = "Folder"
        verbose_name_plural = "Folders"

class File(models.Model):
    id = models.BigAutoField(primary_key=True),
    name = models.CharField(max_length=100, null=False, blank=False,help_text="Folder Name")
    date = models.DateTimeField(auto_now_add=True, blank=True,help_text="Folder Creation Date")
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE)
    folder = models.ForeignKey('Folder', on_delete=models.CASCADE, null=True, blank=True)
    file_content = models.FileField(upload_to='files/')
    hash = models.CharField(max_length=64, editable=False, unique=True)

    def __str__(self) -> str:
        return f"{self.user} {self.name} {self.date}"

    def save(self, *args, **kwargs):
        if not self.hash:
            self.hash = self.generate_hash()
        super().save(*args, **kwargs)

    def generate_hash(self):
        hash_input = f"{self.name}{self.date}{self.user.id}"
        return hashlib.sha256(hash_input.encode()).hexdigest()# SHA-256 hash length 

    class Meta:
        verbose_name = "File"
        verbose_name_plural = "Files"