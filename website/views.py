from django.shortcuts import render
from django.views.generic import View
from website.models import File, Folder
from clonedrive.forms import FileForm, FolderForm

class Home(View):
    template_name = 'home.html'

    def get(self, request):
        context = {
            'files': File.objects.all(),
            'folders': Folder.objects.all(),
            'folderForm' : FolderForm(),
            'fileForm' : FileForm()
        }
        return render(request, self.template_name, context)