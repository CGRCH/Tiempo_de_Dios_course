from django.urls import path

from tickets.views import MyTicketsView, SupportStatsView, TicketInboxView, TicketReplyView

urlpatterns = [
    path("me/tickets/", MyTicketsView.as_view()),
    path("admin/tickets/", TicketInboxView.as_view()),
    path("admin/tickets/<int:pk>/reply/", TicketReplyView.as_view()),
    path("admin/support-stats/", SupportStatsView.as_view()),
]
