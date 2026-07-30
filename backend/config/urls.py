from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),

    # Login, registration and user APIs
    path("api/accounts/", include("apps.accounts.urls")),

    # Tickets, departments, comments, dashboard APIs
    path("api/helpdesk/", include("apps.helpdesk.urls")),
]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )