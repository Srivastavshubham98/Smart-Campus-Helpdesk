from rest_framework.permissions import BasePermission, SAFE_METHODS


class TicketPermission(BasePermission):
    """
    Ticket permissions:

    ADMIN:
        Full access to every ticket.

    STAFF:
        Can view assigned tickets.
        Can partially update assigned tickets.

    STUDENT:
        Can only view their own tickets.
    """

    message = "You do not have permission to perform this action."

    def has_permission(self, request, view):
        user = request.user

        return bool(
            user
            and user.is_authenticated
            and getattr(user, "role", None)
            in {"ADMIN", "STAFF", "STUDENT"}
        )

    def has_object_permission(self, request, view, obj):
        user = request.user
        role = getattr(user, "role", None)

        if role == "ADMIN":
            return True

        if role == "STAFF":
            if obj.assigned_to_id != user.id:
                return False

            return request.method in (*SAFE_METHODS, "PATCH")

        if role == "STUDENT":
            return (
                obj.created_by_id == user.id
                and request.method in SAFE_METHODS
            )

        return False