from rest_framework import serializers

from tickets.models import SupportTicket, TicketReply


class TicketReplySerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.get_full_name", read_only=True)

    class Meta:
        model = TicketReply
        fields = ("id", "author_name", "message", "created_at")


class SupportTicketSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.get_full_name", read_only=True)
    replies = TicketReplySerializer(many=True, read_only=True)

    class Meta:
        model = SupportTicket
        fields = (
            "id",
            "subject",
            "body",
            "priority",
            "status",
            "user_name",
            "created_at",
            "replies",
        )
