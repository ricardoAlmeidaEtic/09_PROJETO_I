import hashlib
import json
import logging
import os
import uuid
from django.http import HttpResponseBadRequest, JsonResponse, FileResponse
from django.shortcuts import redirect, render
from django.views import View
from website.models import File, Folder
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
            data = json.loads(request.body)
            action = data.get('action')

            if action == 'goToFolder':
                return self.go_to_folder(data, user)
            elif action == 'createFolder':
                return self.create_folder(data, user)
            elif action == 'deleteFile':
                return self.delete_file(data)
            elif action == 'deleteFolder':
                return self.delete_folder(data)
            else:
                return HttpResponseBadRequest('Invalid action')
        except json.JSONDecodeError:
            return HttpResponseBadRequest('Invalid JSON')

    def handle_multipart_request(self, request, user):
        action = request.POST.get('action')

        if action == 'createFile':
            return self.create_file(request, user)
        else:
            return HttpResponseBadRequest('Invalid action')

    def go_to_folder(self, data, user):
        folder_id = data.get('id') or None
        folders = Folder.objects.filter(parent_folder=folder_id, user=user).values('id', 'name', 'date', 'parent_folder')
        files = File.objects.filter(folder=folder_id, user=user).values('id', 'name', 'date', 'folder')
        return JsonResponse({'success': True, 'folders': list(folders), 'files': list(files)})

    def create_folder(self, data, user):
        try:
            parent_folder_id = data.get('parent_folder')
            parent_folder = Folder.objects.get(id=parent_folder_id) if parent_folder_id else None
            Folder.objects.create(name=data.get('name'), user=user, parent_folder=parent_folder)
            return JsonResponse({'success': True})
        except Folder.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Parent folder does not exist.'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': f'Error creating folder: {str(e)}'})

    def delete_file(self, data):
        try:
            File.objects.filter(id=data.get('id')).delete()
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'error': f'Error deleting file: {str(e)}'})

    def delete_folder(self, data):
        try:
            Folder.objects.filter(id=data.get('id')).delete()
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'error': f'Error deleting folder: {str(e)}'})

    def create_file(self, request, user):
        try:
            file = request.FILES['file']
            folder_id = request.POST.get('folder')
            hash = hashlib.sha256((str(uuid.uuid4()) + file.name).encode()).hexdigest()

            parent_folder = Folder.objects.get(id=folder_id) if folder_id else None
            File.objects.create(name=file.name, file_content=file, user=user, folder=parent_folder, hash=hash)
            return JsonResponse({'success': True})
        except Folder.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Error creating file: Folder does not exist.'})
        except KeyError:
            return JsonResponse({'success': False, 'error': 'Error creating file: No file provided.'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': f'Error creating file: {str(e)}'})

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
        file_path = os.path.join('files/', path)
        if os.path.exists(file_path):
            return FileResponse(open(file_path, 'rb'), content_type='application/vnd.ms-excel', filename=os.path.basename(file_path))
        else:
            return HttpResponseBadRequest('File not found')