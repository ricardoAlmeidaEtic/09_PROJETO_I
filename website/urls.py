from django.urls import path
from website.views import Home

urlpatterns = [
    path("", Home.as_view(), name="home"),
    path("createFolder/", Home.as_view(), name="home"),
    path("createFile/", Home.as_view(), name="home"),
    path("deleteFolder/", Home.as_view(), name="home"),
    path("deleteFile/", Home.as_view(), name="home"),
    path("<int:folder_id>/", Home.as_view(), name="home"),
]
