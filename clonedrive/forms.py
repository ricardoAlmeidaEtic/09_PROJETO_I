from django import forms

class FolderForm(forms.Form):
    folder_name = forms.CharField(label="Folder name", max_length=100)

class FileForm(forms.Form):
    name = forms.CharField(label="File name", max_length=100)
    file_content = forms.FileInput()