import hashlib
import json
import logging
import os
import uuid
from django.http import JsonResponse, FileResponse, HttpResponseBadRequest
from website.models import File, Folder

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.DEBUG)

def go_to_folder(data, user):
    folder_id = data.get('id') or None
    folders = Folder.objects.filter(parent_folder = folder_id, user = user).values('id', 'name', 'date', 'parent_folder')
    files = File.objects.filter(folder = folder_id, user = user).values('id', 'name', 'date', 'folder')
    return JsonResponse({'success': True, 'folders': list(folders), 'files': list(files)})

def create_folder(data, user):
    try:
        parent_folder_id = data.get('parent_folder')
        parent_folder = Folder.objects.get(id=parent_folder_id) if parent_folder_id else None
        Folder.objects.create(name=data.get('name'), user=user, parent_folder=parent_folder)
        return JsonResponse({'success': True})
    except Folder.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Parent folder does not exist.'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': f'Error creating folder: {str(e)}'})

def delete_file(data):
    try:
        File.objects.filter(id=data.get('id')).delete()
        return JsonResponse({'success': True})
    except Exception as e:
        return JsonResponse({'success': False, 'error': f'Error deleting file: {str(e)}'})

def delete_folder(data):
    try:
        Folder.objects.filter(id=data.get('id')).delete()
        return JsonResponse({'success': True})
    except Exception as e:
        return JsonResponse({'success': False, 'error': f'Error deleting folder: {str(e)}'})

def create_file(request, user):
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

def download_file(data):
    file_id = data.get('id')
    logger.info(f"FILE: {file_id}")

    try:
        file = File.objects.get(id=file_id)
        file_path = file.file_content.path
        logger.info(f"file_path: {file_path}")

        if os.path.exists(file_path):
            response = FileResponse(open(file_path, 'rb'), content_type='application/octet-stream')
            response['Content-Disposition'] = f'attachment; filename="{file.name}"'
            return response
        else:
            return HttpResponseBadRequest('File not found')
    except File.DoesNotExist:
        return HttpResponseBadRequest('File not found')
    except Exception as e:
        logger.error(f'Error downloading file: {str(e)}')
        return HttpResponseBadRequest('Error downloading file')
    
def download_folder(data):
    logger.info("FOLDER: " + data.get('id'))
    #file_path = os.path.join('files/', path)
    #if os.path.exists(file_path):
    #    return FileResponse(open(file_path, 'rb'), content_type='application/vnd.ms-excel', filename=os.path.basename(file_path))
    #else:
    return HttpResponseBadRequest('Folder not found')

def change_location(data):
    id = data.get('id')
    parentFolder = data.get('parentId')
    type = data.get('type')

    try:
        if(type == 1):
            parent_folder = Folder.objects.get(id = parentFolder)
            current_folder = Folder.objects.get(id = id)

            current_folder.parent_folder = parent_folder
            current_folder.save()
        else:
            parent_folder = Folder.objects.get(id = parentFolder)
            current_file = File.objects.get(id = id)

            current_file.folder = parent_folder
            current_file.save()
        return JsonResponse({'success': True})
    except File.DoesNotExist:
        return HttpResponseBadRequest('Folder not found')
    except Exception as e:
        logger.error(f'Error downloading location: {str(e)}')
        return HttpResponseBadRequest('Error downloading changing location')
