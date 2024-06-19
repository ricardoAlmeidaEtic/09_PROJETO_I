import hashlib
from http.client import HTTPResponse
import json
import logging
import os
import uuid
from django.http import HttpResponseBadRequest, JsonResponse
from django.shortcuts import redirect, render
from django.views.generic import View
from clonedrive import settings
from website.models import File, Folder
from clonedrive.forms import FileForm, FolderForm
from django.core.serializers import serialize
from django.forms.models import model_to_dict
from django.core.serializers.json import DjangoJSONEncoder
from django.contrib.auth.models import AnonymousUser

logger = logging.getLogger(name=__name__)

logging.basicConfig(level=logging.DEBUG)

class Home(View):
    template_name = 'home.html'

    def post(self, request, *args, **kwargs):

        if(request.user.is_staff):
            return redirect('/admin')
        
        content_type = request.content_type
        user = request.user

        if content_type == 'application/json':
            try:
                data = json.loads(request.body)
                action = data.get('action')

                if action == 'goToFolder':
                        
                    if data.get('id') != '':
                        id = data.get('id')
                    else:
                        id = None

                    folders = Folder.objects.filter(parent_folder = id, user = request.user).values('id', 'name', 'date', 'parent_folder')
                    files = File.objects.filter(folder = id, user = request.user).values('id', 'name', 'date', 'folder')
                    
                    return JsonResponse({'success': True, 'folders': list(folders), "files": list(files)})

                elif action == 'createFolder':
                    try:
                        if data.get('parent_folder'):
                            parent_folder_instance = Folder.objects.get(id = data.get('parent_folder'))

                            Folder.objects.create(
                                name=data.get('name'),
                                user=user,
                                parent_folder=parent_folder_instance
                            ).save()

                        else:

                            Folder.objects.create(
                                name=data.get('name'),
                                user=user
                            ).save()

                        return JsonResponse({'success': True})
                    except Exception as e:
                        return JsonResponse({'success': False, 'error': f'Error creating folder: {str(e)}'})

                elif action == 'deleteFile':
                    try:
                        File.objects.filter(id = data.get('id')).delete()
                        return JsonResponse({'success': True})
                    except Exception as e:
                        return JsonResponse({'success': False, 'error': f'Error deleting file: {str(e)}'})

                elif action == 'deleteFolder':
                    try:
                        Folder.objects.filter(id = data.get('id')).delete()
                        return JsonResponse({'success': True})
                    except Exception as e:
                        return JsonResponse({'success': False, 'error': f'Error deleting folder: {str(e)}'})

                else:
                    return HttpResponseBadRequest('Invalid action')

            except json.JSONDecodeError:
                return HttpResponseBadRequest('Invalid JSON')

        elif content_type.startswith('multipart/form-data'):
            action = request.POST.get('action')

            if action == 'createFile':
                try:
                    file = request.FILES['file']
                    folder_id = request.POST.get('folder')
                    unique_string = str(uuid.uuid4()) + file.name
                    hash = hashlib.sha256(unique_string.encode()).hexdigest()

                    if folder_id:
                        try:
                            parent_folder_instance = Folder.objects.get(id = folder_id)

                            File.objects.create(
                                name = file.name,
                                file_content = file,
                                user = user,
                                folder = parent_folder_instance,
                                hash = hash
                            ).save()

                        except Folder.DoesNotExist:
                            return JsonResponse({'success': False, 'error': "Error creating file: Folder does not exist."})
                        except ValueError:
                            return JsonResponse({'success': False, 'error': "Error creating file: Invalid folder id."})
                    else:

                        File.objects.create(
                            name = file.name,
                            file_content = file,
                            user = user,
                            hash = hash
                        ).save()

                    return JsonResponse({'success': True})
                except KeyError:
                    return JsonResponse({'success': False, 'error': "Error creating file: No file provided."})
                except Exception as e:
                    return JsonResponse({'success': False, 'error': f"Error creating file: {str(e)}"})

            else:
                return HttpResponseBadRequest('Invalid action')

        else:
            return HttpResponseBadRequest('Unsupported content type')
        
    def get(self, request):
        
        if(request.user.is_staff):
            return redirect('/admin')

        context = {}

        logger.info(request.user)

        if not isinstance(request.user, AnonymousUser):
            try:
                context = {
                    'files' : File.objects.filter(folder = None, user = request.user),
                    'folders' : Folder.objects.filter(parent_folder = None, user = request.user),
                    'folderForm' : FolderForm(),
                    'fileForm' : FileForm(),           
                    'allFolders' : Folder.objects.filter(user = request.user)
                }
            except:
                context = {
                    'files' : None,
                    'folders' : None,
                    'folderForm' : FolderForm(),
                    'fileForm' : FileForm(),           
                    'allFolders' : None
                }


        return render(request, self.template_name, context)
    
    def download(request, path):
        file_path = os.path.join("files/", path)
        if os.path.exists(file_path):
            with open(file_path, 'rb') as fh:
                response = HTTPResponse(fh.read(), content_type="application/vnd.ms-excel")
                response['Content-Disposition'] = 'inline; filename=' + os.path.basename(file_path)
                return response