from django.contrib import admin

from tickets.models import SupportTicket, TicketReply


class ReplyInline(admin.TabularInline):
    model = TicketReply
    extra = 0


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ("subject", "user", "priority", "status", "created_at")
    inlines = [ReplyInline]
