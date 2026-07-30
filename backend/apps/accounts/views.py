from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
)

from .models import User
from .permissions import IsAdminRole
from .serializers import (
    AdminUserSerializer,
    CustomTokenObtainPairSerializer,
    ProfileSerializer,
    RegisterSerializer,
    StaffSerializer,
)


class CustomTokenObtainPairView(
    TokenObtainPairView
):
    serializer_class = (
        CustomTokenObtainPairSerializer
    )


class RegisterView(
    generics.CreateAPIView
):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class StaffListView(
    generics.ListAPIView
):
    serializer_class = StaffSerializer
    permission_classes = [
        IsAuthenticated,
        IsAdminRole,
    ]

    def get_queryset(self):
        return User.objects.filter(
            role=User.Role.STAFF,
            is_active=True,
        ).order_by("username")


class ProfileView(
    generics.RetrieveUpdateAPIView
):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    http_method_names = [
        "get",
        "patch",
        "put",
        "head",
        "options",
    ]

    def get_object(self):
        return self.request.user


class AdminUserListCreateView(
    generics.ListCreateAPIView
):
    serializer_class = AdminUserSerializer
    permission_classes = [
        IsAuthenticated,
        IsAdminRole,
    ]

    def get_queryset(self):
        return User.objects.all().order_by(
            "-date_joined"
        )


class AdminUserDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    serializer_class = AdminUserSerializer
    permission_classes = [
        IsAuthenticated,
        IsAdminRole,
    ]

    def get_queryset(self):
        return User.objects.all()

    def perform_destroy(self, instance):
        current_user = self.request.user

        if instance.pk == current_user.pk:
            raise ValidationError(
                "You cannot delete your own account."
            )

        if instance.is_superuser:
            raise ValidationError(
                "A superuser account cannot be deleted "
                "through this API."
            )

        instance.delete()