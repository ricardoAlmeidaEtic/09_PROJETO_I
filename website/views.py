from django.shortcuts import redirect, render
from django.views.generic import View
from website.models import File, Folder
from clonedrive.forms import FileForm, FolderForm

class Home(View):
    template_name = 'home.html'

    def get(self, request, folder_id=None):
        
        if(request.user.is_staff):
            return redirect('/admin')

        context = {}

        try:
            if(folder_id):
                context['files'] = File.objects.filter(folder = folder_id, user = request.user)
                context['folders'] = Folder.objects.filter(parent_folder = folder_id, user = request.user)
            else:
                context['files'] = File.objects.filter(folder = None, user = request.user)
                context['folders'] = Folder.objects.filter(parent_folder = None, user = request.user)
        except:
            context['folders'] = None

        context['folderForm'] = FolderForm()
        context['fileForm'] = FileForm()
        

        return render(request, self.template_name, context)