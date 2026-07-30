from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    DepartmentViewSet,
    TicketViewSet,
    TicketCommentViewSet,
    NotificationViewSet
)

router = DefaultRouter()
router.register("departments", DepartmentViewSet)
router.register("tickets", TicketViewSet, basename="ticket")
router.register("comments",TicketCommentViewSet,basename="comment")
router.register("notifications",NotificationViewSet,basename="notification")
urlpatterns = [
    path("", include(router.urls)),
]