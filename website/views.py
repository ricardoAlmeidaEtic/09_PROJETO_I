import json
from django.http import HttpResponseBadRequest, JsonResponse
from django.shortcuts import redirect, render
from django.views.generic import View
from website.models import File, Folder
from clonedrive.forms import FileForm, FolderForm

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
                        instance = Folder.objects.create(name=data.get('name'), user=user)
                        instance.save()
                        return JsonResponse({'success': True, 'id': instance.id})
                    except Exception as e:
                        return JsonResponse({'success': False, 'error': f'Error creating folder: {str(e)}'})

                elif action == 'deleteFile':
                    try:
                        File.objects.filter(id=data.get('id')).delete()
                        return JsonResponse({'success': True})
                    except Exception as e:
                        return JsonResponse({'success': False, 'error': f'Error deleting file: {str(e)}'})

                elif action == 'deleteFolder':
                    try:
                        Folder.objects.filter(id=data.get('id')).delete()
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
                    instance = File.objects.create(name=file.name, file_content=file, user=user)
                    instance.save()
                    return JsonResponse({'success': True, 'id': instance.id})
                except Exception as e:
                    return JsonResponse({'success': False, 'error': f'Error creating file: {str(e)}'})

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
            else:
                context['files'] = File.objects.filter(folder = None, user = request.user)
                context['folders'] = Folder.objects.filter(parent_folder = None, user = request.user)
        except:
            context['folders'] = None

        context['folderForm'] = FolderForm()
        context['fileForm'] = FileForm()

        return render(request, self.template_name, context)
