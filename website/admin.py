from django.contrib import admin
from website.models import Folder, File


# Register your models here.
@admin.register(Folder)
class ProductAdmin(admin.ModelAdmin):
    list_display=("id","user","name","date","parent_folder")
    list_editable=()

@admin.register(File)
class ProductAdmin(admin.ModelAdmin):
    list_display=("id","user","name","date","folder")
    list_editable=()