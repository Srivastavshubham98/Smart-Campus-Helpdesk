from django.db import transaction
from django.db.models import Count
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import User
from apps.accounts.permissions import IsAdminRole

from .models import (
    Department,
    Notification,
    Ticket,
    TicketActivity,
    TicketComment,
)
from .permissions import TicketPermission
from .serializers import (
    DepartmentSerializer,
    NotificationSerializer,
    TicketActivitySerializer,
    TicketCommentSerializer,
    TicketSerializer,
)


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all().order_by("name")
    serializer_class = DepartmentSerializer

    def get_permissions(self):
        if self.action in {
            "create",
            "update",
            "partial_update",
            "destroy",
        }:
            permission_classes = [
                IsAuthenticated,
                IsAdminRole,
            ]
        else:
            permission_classes = [IsAuthenticated]

        return [
            permission_class()
            for permission_class in permission_classes
        ]


class TicketViewSet(viewsets.ModelViewSet):
    serializer_class = TicketSerializer

    permission_classes = [
        IsAuthenticated,
        TicketPermission,
    ]

    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]

    filterset_fields = [
        "status",
        "priority",
        "department",
        "assigned_to",
    ]

    search_fields = [
        "title",
        "description",
        "department__name",
        "created_by__username",
        "assigned_to__username",
    ]

    ordering_fields = [
        "created_at",
        "updated_at",
        "priority",
        "status",
    ]

    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user

        queryset = Ticket.objects.select_related(
            "department",
            "created_by",
            "assigned_to",
        ).prefetch_related(
            "comments",
            "activities",
        )

        if (
            user.is_superuser
            or getattr(user, "role", None)
            == User.Role.ADMIN
        ):
            return queryset.order_by("-created_at")

        if (
            getattr(user, "role", None)
            == User.Role.STAFF
        ):
            return queryset.filter(
                assigned_to=user
            ).order_by("-created_at")

        if (
            getattr(user, "role", None)
            == User.Role.STUDENT
        ):
            return queryset.filter(
                created_by=user
            ).order_by("-created_at")

        return queryset.none()

    @transaction.atomic
    def perform_create(self, serializer):
        user = self.request.user

        ticket = serializer.save(created_by=user)

        TicketActivity.objects.create(
            ticket=ticket,
            user=user,
            action="CREATED",
        )

        admins = User.objects.filter(
            role=User.Role.ADMIN,
            is_active=True,
        )

        notifications = [
            Notification(
                recipient=admin,
                ticket=ticket,
                title="New Ticket Created",
                message=(
                    f"A new ticket '{ticket.title}' "
                    f"has been created by {user.username}."
                ),
            )
            for admin in admins
            if admin != user
        ]

        if notifications:
            Notification.objects.bulk_create(
                notifications
            )

    @transaction.atomic
    def perform_update(self, serializer):
        user = self.request.user
        ticket = serializer.instance

        if (
            not user.is_superuser
            and getattr(user, "role", None)
            == User.Role.STAFF
        ):
            allowed_fields = {"status"}
            submitted_fields = set(
                serializer.validated_data.keys()
            )

            if not submitted_fields.issubset(
                allowed_fields
            ):
                raise PermissionDenied(
                    "Staff can update only ticket status."
                )

        old_status = ticket.status
        old_assigned = ticket.assigned_to

        updated_ticket = serializer.save()

        if old_status != updated_ticket.status:
            TicketActivity.objects.create(
                ticket=updated_ticket,
                user=user,
                action="STATUS_CHANGED",
                old_value=old_status,
                new_value=updated_ticket.status,
            )

            if updated_ticket.created_by != user:
                Notification.objects.create(
                    recipient=updated_ticket.created_by,
                    ticket=updated_ticket,
                    title="Ticket Status Updated",
                    message=(
                        f"Your ticket "
                        f"'{updated_ticket.title}' status "
                        f"has been changed from "
                        f"{old_status} to "
                        f"{updated_ticket.status}."
                    ),
                )

        if old_assigned != updated_ticket.assigned_to:
            TicketActivity.objects.create(
                ticket=updated_ticket,
                user=user,
                action="ASSIGNED",
                old_value=(
                    old_assigned.username
                    if old_assigned
                    else ""
                ),
                new_value=(
                    updated_ticket.assigned_to.username
                    if updated_ticket.assigned_to
                    else ""
                ),
            )

            if (
                updated_ticket.assigned_to
                and updated_ticket.assigned_to != user
            ):
                Notification.objects.create(
                    recipient=updated_ticket.assigned_to,
                    ticket=updated_ticket,
                    title="Ticket Assigned",
                    message=(
                        "You have been assigned ticket "
                        f"#{updated_ticket.id}: "
                        f"{updated_ticket.title}"
                    ),
                )

    @action(
        detail=False,
        methods=["get"],
    )
    def dashboard(self, request):
        queryset = self.get_queryset()

        priority_data = (
            queryset
            .order_by()
            .values("priority")
            .annotate(count=Count("id"))
            .order_by("priority")
        )

        department_data = (
            queryset
            .order_by()
            .values("department__name")
            .annotate(count=Count("id"))
            .order_by("department__name")
        )

        data = {
            "total": queryset.count(),
            "open": queryset.filter(
                status=Ticket.Status.OPEN
            ).count(),
            "in_progress": queryset.filter(
                status=Ticket.Status.IN_PROGRESS
            ).count(),
            "resolved": queryset.filter(
                status=Ticket.Status.RESOLVED
            ).count(),
            "closed": queryset.filter(
                status=Ticket.Status.CLOSED
            ).count(),
            "priority": list(priority_data),
            "department": list(department_data),
        }

        return Response(data)

    @action(
        detail=True,
        methods=["get"],
        url_path="activity",
    )
    def activity(self, request, pk=None):
        ticket = self.get_object()

        activities = ticket.activities.select_related(
            "user"
        ).all()

        serializer = TicketActivitySerializer(
            activities,
            many=True,
        )

        return Response(serializer.data)

    @action(
        detail=True,
        methods=["patch"],
    )
    @transaction.atomic
    def assign(self, request, pk=None):
        ticket = self.get_object()
        user = request.user

        if (
            not user.is_superuser
            and getattr(user, "role", None)
            != User.Role.ADMIN
        ):
            raise PermissionDenied(
                "Only admin can assign tickets."
            )

        staff_id = request.data.get("assigned_to")

        if not staff_id:
            return Response(
                {
                    "detail": (
                        "assigned_to is required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            staff = User.objects.get(
                id=staff_id,
                role=User.Role.STAFF,
                is_active=True,
            )
        except User.DoesNotExist:
            return Response(
                {
                    "detail": (
                        "Active staff member not found."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        old_assigned = ticket.assigned_to
        old_status = ticket.status

        if old_assigned == staff:
            return Response(
                {
                    "detail": (
                        "Ticket is already assigned "
                        "to this staff member."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        ticket.assigned_to = staff

        if ticket.status == Ticket.Status.OPEN:
            ticket.status = Ticket.Status.IN_PROGRESS

        ticket.save(
            update_fields=[
                "assigned_to",
                "status",
                "updated_at",
            ]
        )

        TicketActivity.objects.create(
            ticket=ticket,
            user=user,
            action="ASSIGNED",
            old_value=(
                old_assigned.username
                if old_assigned
                else ""
            ),
            new_value=staff.username,
        )

        if old_status != ticket.status:
            TicketActivity.objects.create(
                ticket=ticket,
                user=user,
                action="STATUS_CHANGED",
                old_value=old_status,
                new_value=ticket.status,
            )

        Notification.objects.create(
            recipient=staff,
            ticket=ticket,
            title="Ticket Assigned",
            message=(
                "You have been assigned ticket "
                f"#{ticket.id}: {ticket.title}"
            ),
        )

        serializer = self.get_serializer(ticket)

        return Response(serializer.data)


class TicketCommentViewSet(viewsets.ModelViewSet):
    serializer_class = TicketCommentSerializer
    permission_classes = [IsAuthenticated]

    http_method_names = [
        "get",
        "post",
        "patch",
        "delete",
        "head",
        "options",
    ]

    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]

    filterset_fields = [
        "ticket",
        "author",
    ]

    search_fields = [
        "message",
        "author__username",
    ]

    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user

        queryset = TicketComment.objects.select_related(
            "ticket",
            "author",
            "ticket__created_by",
            "ticket__assigned_to",
        )

        if (
            user.is_superuser
            or getattr(user, "role", None)
            == User.Role.ADMIN
        ):
            return queryset.order_by("-created_at")

        if (
            getattr(user, "role", None)
            == User.Role.STAFF
        ):
            return queryset.filter(
                ticket__assigned_to=user
            ).order_by("-created_at")

        if (
            getattr(user, "role", None)
            == User.Role.STUDENT
        ):
            return queryset.filter(
                ticket__created_by=user
            ).order_by("-created_at")

        return queryset.none()

    @transaction.atomic
    def perform_create(self, serializer):
        ticket = serializer.validated_data["ticket"]
        user = self.request.user
        role = getattr(user, "role", None)

        if user.is_superuser or role == User.Role.ADMIN:
            pass

        elif role == User.Role.STAFF:
            if ticket.assigned_to_id != user.id:
                raise PermissionDenied(
                    "You can comment only on assigned tickets."
                )

        elif role == User.Role.STUDENT:
            if ticket.created_by_id != user.id:
                raise PermissionDenied(
                    "You can comment only on your own tickets."
                )

        else:
            raise PermissionDenied(
                "You do not have permission to comment."
            )

        comment = serializer.save(author=user)

        TicketActivity.objects.create(
            ticket=ticket,
            user=user,
            action="COMMENT_ADDED",
            new_value=comment.message,
        )

        recipient = None

        if role == User.Role.STUDENT:
            recipient = ticket.assigned_to

        elif role == User.Role.STAFF:
            recipient = ticket.created_by

        elif (
            user.is_superuser
            or role == User.Role.ADMIN
        ):
            recipient = ticket.created_by

        if recipient and recipient != user:
            Notification.objects.create(
                recipient=recipient,
                ticket=ticket,
                title="New Comment",
                message=(
                    f"{user.username} commented on "
                    f"ticket #{ticket.id}: "
                    f"{ticket.title}"
                ),
            )

    def perform_update(self, serializer):
        comment = serializer.instance
        user = self.request.user

        if (
            not user.is_superuser
            and getattr(user, "role", None)
            != User.Role.ADMIN
            and comment.author_id != user.id
        ):
            raise PermissionDenied(
                "You can edit only your own comments."
            )

        submitted_fields = set(
            serializer.validated_data.keys()
        )

        if not submitted_fields.issubset({"message"}):
            raise PermissionDenied(
                "Only the comment message can be updated."
            )

        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user

        if (
            not user.is_superuser
            and getattr(user, "role", None)
            != User.Role.ADMIN
            and instance.author_id != user.id
        ):
            raise PermissionDenied(
                "You can delete only your own comments."
            )

        instance.delete()


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    http_method_names = [
        "get",
        "patch",
        "delete",
        "head",
        "options",
    ]

    def get_queryset(self):
        return Notification.objects.filter(
            recipient=self.request.user
        ).select_related(
            "ticket",
            "recipient",
        ).order_by("-created_at")

    def perform_update(self, serializer):
        submitted_fields = set(
            serializer.validated_data.keys()
        )

        if not submitted_fields.issubset({"is_read"}):
            raise PermissionDenied(
                "Only notification read status can be updated."
            )

        serializer.save()

    @action(
        detail=True,
        methods=["patch"],
        url_path="read",
    )
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()

        if not notification.is_read:
            notification.is_read = True
            notification.save(
                update_fields=["is_read"]
            )

        serializer = self.get_serializer(
            notification
        )

        return Response(serializer.data)

    @action(
        detail=False,
        methods=["get"],
        url_path="unread-count",
    )
    def unread_count(self, request):
        count = self.get_queryset().filter(
            is_read=False
        ).count()

        return Response(
            {
                "unread_count": count,
            }
        )

    @action(
        detail=False,
        methods=["patch"],
        url_path="mark-all-read",
    )
    def mark_all_read(self, request):
        updated_count = (
            self.get_queryset()
            .filter(is_read=False)
            .update(is_read=True)
        )

        return Response(
            {
                "message": (
                    "All notifications marked as read."
                ),
                "updated_count": updated_count,
            }
        )