from django.urls import path
from website.views import Home, get_all_folders

urlpatterns = [
    path("", Home.as_view(), name="home"),
    path("createFolder/", Home.as_view(), name="home"),
    path("createFile/", Home.as_view(), name="home"),
    path("deleteFolder/", Home.as_view(), name="home"),
    path("deleteFile/", Home.as_view(), name="home"),
    path("<int:folder_id>/", Home.as_view(), name="home"),
    path('get_all_folders/', get_all_folders, name='get_all_folders'),
]
