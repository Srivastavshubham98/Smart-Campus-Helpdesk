from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AdminUserDetailView,
    AdminUserListCreateView,
    CustomTokenObtainPairView,
    ProfileView,
    RegisterView,
    StaffListView,
)


urlpatterns = [
    path(
    "users/",
    AdminUserListCreateView.as_view(),
    name="admin-user-list-create",
),

path(
    "users/<int:pk>/",
    AdminUserDetailView.as_view(),
    name="admin-user-detail",
),
    path("register/", RegisterView.as_view(), name="register"),

    path(
        "login/",
        CustomTokenObtainPairView.as_view(),
        name="login",
    ),

    path(
        "refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),

    path("me/", ProfileView.as_view(), name="profile"),
    path("staff/", StaffListView.as_view(), name="staff-list"),
]