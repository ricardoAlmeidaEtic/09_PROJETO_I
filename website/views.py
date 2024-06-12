import hashlib
import json
import uuid
from django.http import HttpResponseBadRequest, JsonResponse
from django.shortcuts import redirect, render
from django.views.generic import View
from website.models import File, Folder
from clonedrive.forms import FileForm, FolderForm
from django.core.serializers import serialize

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

                if action == 'createFolder':
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
        
    def get(self, request, folder_id=None):
        
        if(request.user.is_staff):
            return redirect('/admin')

        context = {}

        try:
            if(folder_id):
                context['files'] = File.objects.filter(folder = folder_id, user = request.user)
                context['folders'] = Folder.objects.filter(parent_folder = folder_id, user = request.user)
                context['folder_id'] = folder_id
            else:
                context['files'] = File.objects.filter(folder = None, user = request.user)
                context['folders'] = Folder.objects.filter(parent_folder = None, user = request.user)
        except:
            context['folders'] = None

        context['folderForm'] = FolderForm()
        context['fileForm'] = FileForm()
        context['allFolders'] = Folder.objects.filter(user = request.user)

        return render(request, self.template_name, context)
    

def get_all_folders(request):
    all_folders = Folder.objects.filter(user=request.user)
    serialized_folders = serialize('json', all_folders)
    return JsonResponse(serialized_folders, safe=False)
