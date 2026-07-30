from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied

from apps.accounts.models import User

from .models import (
    Department,
    Notification,
    Ticket,
    TicketActivity,
    TicketComment,
)


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = [
            "id",
            "name",
            "description",
        ]
        read_only_fields = ["id"]


class TicketCommentSerializer(serializers.ModelSerializer):
    author = serializers.CharField(
        source="author.username",
        read_only=True,
    )

    author_id = serializers.IntegerField(
        source="author.id",
        read_only=True,
    )

    class Meta:
        model = TicketComment
        fields = [
            "id",
            "ticket",
            "author",
            "author_id",
            "message",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "author",
            "author_id",
            "created_at",
        ]

    def validate_message(self, value):
        message = value.strip()

        if not message:
            raise serializers.ValidationError(
                "Comment message cannot be empty."
            )

        return message


class TicketSerializer(serializers.ModelSerializer):
    created_by = serializers.CharField(
        source="created_by.username",
        read_only=True,
    )

    created_by_id = serializers.IntegerField(
        source="created_by.id",
        read_only=True,
    )

    assigned_to_username = serializers.CharField(
        source="assigned_to.username",
        read_only=True,
        allow_null=True,
    )

    department_name = serializers.CharField(
        source="department.name",
        read_only=True,
    )

    comments = TicketCommentSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Ticket

        fields = [
            "id",
            "title",
            "description",
            "department",
            "department_name",
            "created_by",
            "created_by_id",
            "assigned_to",
            "assigned_to_username",
            "priority",
            "status",
            "attachment",
            "created_at",
            "updated_at",
            "comments",
        ]

        read_only_fields = [
            "id",
            "created_by",
            "created_by_id",
            "created_at",
            "updated_at",
        ]

    def validate_title(self, value):
        title = value.strip()

        if not title:
            raise serializers.ValidationError(
                "Ticket title cannot be empty."
            )

        return title

    def validate_description(self, value):
        description = value.strip()

        if not description:
            raise serializers.ValidationError(
                "Ticket description cannot be empty."
            )

        return description

    def validate_assigned_to(self, value):
        if value is None:
            return value

        if (
            value.role != User.Role.STAFF
            or not value.is_active
        ):
            raise serializers.ValidationError(
                "Ticket can be assigned only to an active staff member."
            )

        return value

    def validate(self, attrs):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            return attrs

        user = request.user
        role = getattr(user, "role", None)
        is_creating = self.instance is None

        if is_creating:
            if (
                not user.is_superuser
                and role == User.Role.STAFF
            ):
                raise PermissionDenied(
                    "Staff members cannot create tickets."
                )

            if role == User.Role.STUDENT:
                attrs["assigned_to"] = None
                attrs["status"] = Ticket.Status.OPEN

        return attrs


class TicketActivitySerializer(
    serializers.ModelSerializer
):
    user = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    user_id = serializers.IntegerField(
        source="user.id",
        read_only=True,
    )

    class Meta:
        model = TicketActivity

        fields = [
            "id",
            "user",
            "user_id",
            "action",
            "old_value",
            "new_value",
            "created_at",
        ]

        read_only_fields = fields


class NotificationSerializer(
    serializers.ModelSerializer
):
    ticket_title = serializers.CharField(
        source="ticket.title",
        read_only=True,
    )

    class Meta:
        model = Notification

        fields = [
            "id",
            "ticket",
            "ticket_title",
            "title",
            "message",
            "is_read",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "ticket",
            "ticket_title",
            "title",
            "message",
            "created_at",
        ]