import json
import logging
from django.http import HttpResponseBadRequest
from django.shortcuts import redirect, render
from django.views import View
from website.models import File, Folder
from website import utils
from clonedrive.forms import FileForm, FolderForm
from django.contrib.auth.models import AnonymousUser

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.DEBUG)

class Home(View):
    template_name = 'home.html'

    def post(self, request, *args, **kwargs):
        if request.user.is_staff:
            return redirect('/admin')

        content_type = request.content_type
        user = request.user

        if content_type == 'application/json':
            return self.handle_json_request(request, user)
        elif content_type.startswith('multipart/form-data'):
            return self.handle_multipart_request(request, user)
        else:
            return HttpResponseBadRequest('Unsupported content type')

    def handle_json_request(self, request, user):
        try:
            logger.info(request.body)
            data = json.loads(request.body)
            action = data.get('action')

            match action:
                case 'changeLocation':
                    return utils.change_location(data)
                
                case 'goToFolder':
                    return utils.go_to_folder(data, user)
                
                case 'createFolder':
                    return utils.create_folder(data, user)
                
                case 'deleteFile':
                    return utils.delete_file(data)
                
                case 'deleteFolder':
                    return utils.delete_folder(data)
                
                case 'downloadFile':
                    return utils.download_file(data)
                
                case _:
                    return HttpResponseBadRequest('Invalid action')
                
        except json.JSONDecodeError:
            return HttpResponseBadRequest('Invalid JSON')

    def handle_multipart_request(self, request, user):
        action = request.POST.get('action')

        if action == 'createFile':
            return utils.create_file(request, user)
        else:
            return HttpResponseBadRequest('Invalid action')

    def get(self, request):
        if request.user.is_staff:
            return redirect('/admin')

        context = self.get_context_data(request.user)
        return render(request, self.template_name, context)

    def get_context_data(self, user):

        context = {
            'folderForm': FolderForm(),
            'fileForm': FileForm(),
        }

        if not isinstance(user, AnonymousUser):
            try:
                context.update({
                    'files': File.objects.filter(folder=None, user=user),
                    'folders': Folder.objects.filter(parent_folder=None, user=user),
                    'allFolders': Folder.objects.filter(user=user)
                })
            except Exception as e:
                logger.error(f'Error fetching user data: {str(e)}')
                context.update({
                    'files': None,
                    'folders': None,
                    'allFolders': None
                })
        return context

    def download(request, path):
        return utils.download_file(path)