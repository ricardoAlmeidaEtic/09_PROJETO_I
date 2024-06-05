from django.urls import path
from website.views import Home

urlpatterns = [
    path("", Home.as_view(), name="home"),
    path("<int:folder_id>/", Home.as_view(), name="home"),
]
