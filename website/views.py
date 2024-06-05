from django.shortcuts import render
from django.views.generic import View
from website.models import File, Folder
from clonedrive.forms import FileForm, FolderForm

class Home(View):
    template_name = 'home.html'

    def get(self, request, folder_id=None):

        context = {}

        try:
            if(folder_id):
                context['files'] = File.objects.filter(folder = folder_id)
                context['folders'] = Folder.objects.filter(parent_folder = folder_id)
            else:
                context['files'] = File.objects.filter(folder = None)
                context['folders'] = Folder.objects.filter(parent_folder = None)
        except:
            context['folders'] = None

        context['folderForm'] = FolderForm()
        context['fileForm'] = FileForm()
        

        return render(request, self.template_name, context)