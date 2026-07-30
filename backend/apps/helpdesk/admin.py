from django.contrib import admin
from .models import Department, Ticket, TicketComment, TicketActivity,Notification


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "department",
        "created_by",
        "assigned_to",
        "priority",
        "status",
        "created_at",
    )

    list_filter = (
        "status",
        "priority",
        "department",
    )

    search_fields = (
        "title",
        "description",
    )

@admin.register(TicketComment)
class TicketCommentAdmin(admin.ModelAdmin):
    list_display = (
        "ticket",
        "author",
        "created_at",
    )

    list_filter = (
        "created_at",
    )

    search_fields = (
        "ticket__title",
        "author__username",
        "message",
    )

@admin.register(TicketActivity)
class TicketActivityAdmin(admin.ModelAdmin):
    list_display = (
        "ticket",
        "user",
        "action",
        "created_at",
    )

    list_filter = (
        "action",
        "created_at",
    )

    search_fields = (
        "ticket__title",
        "user__username",
    )


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        "recipient",
        "ticket",
        "title",
        "is_read",
        "created_at",
    )

    list_filter = (
        "is_read",
        "created_at",
    )

    search_fields = (
        "recipient__username",
        "title",
    )