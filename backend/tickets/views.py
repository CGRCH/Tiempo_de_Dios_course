from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsAdministracion
from courses.models import Course, CourseStatus
from tickets.models import SupportTicket, TicketReply, TicketStatus
from tickets.serializers import SupportTicketSerializer, TicketReplySerializer
from users.models import User


class MyTicketsView(generics.ListCreateAPIView):
    serializer_class = SupportTicketSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SupportTicket.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TicketInboxView(generics.ListAPIView):
    serializer_class = SupportTicketSerializer
    permission_classes = [IsAuthenticated, IsAdministracion]
    queryset = SupportTicket.objects.select_related("user").all()


class TicketReplyView(APIView):
    permission_classes = [IsAuthenticated, IsAdministracion]

    def post(self, request, pk):
        ticket = SupportTicket.objects.get(pk=pk)
        reply = TicketReply.objects.create(
            ticket=ticket,
            author=request.user,
            message=request.data.get("message", ""),
        )
        ticket.status = request.data.get("status", TicketStatus.IN_PROGRESS)
        ticket.save(update_fields=["status"])
        return Response(TicketReplySerializer(reply).data)


class SupportStatsView(APIView):
    permission_classes = [IsAuthenticated, IsAdministracion]

    def get(self, request):
        open_count = SupportTicket.objects.exclude(status=TicketStatus.CLOSED).count()
        pending_courses = Course.objects.filter(status=CourseStatus.REVIEW).count()
        active_users = User.objects.filter(is_active=True).count()
        return Response(
            {
                "active_users": active_users,
                "open_tickets": open_count,
                "courses_pending": pending_courses,
                "avg_response_time": "2 h 10 min",
            }
        )
