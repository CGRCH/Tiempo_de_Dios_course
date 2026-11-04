from django.db.models import Sum
from django.utils import timezone
from rest_framework import serializers

from core.roles import can_view_money
from payments.models import Transaction, TransactionStatus


class TransactionSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    course_title = serializers.CharField(source="course.title", read_only=True)
    amount_clp = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = (
            "external_id",
            "user_name",
            "course_title",
            "amount_clp",
            "method",
            "status",
            "created_at",
        )

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_amount_clp(self, obj):
        request = self.context.get("request")
        user = request.user if request else None
        if user and not can_view_money(user):
            return None
        return obj.amount_clp

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        user = request.user if request else None
        if user and not can_view_money(user):
            data.pop("amount_clp", None)
        return data


class RevenueDashboardSerializer:
    @staticmethod
    def build(request=None) -> dict:
        paid = Transaction.objects.filter(status=TransactionStatus.PAID)
        total = paid.aggregate(s=Sum("amount_clp"))["s"] or 0

        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_qs = paid.filter(created_at__gte=month_start)
        month_revenue = month_qs.aggregate(s=Sum("amount_clp"))["s"] or 0
        month_sales = month_qs.count()
        average_ticket = int(month_revenue / month_sales) if month_sales else 0

        month_names = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
        monthly_chart = []
        cursor = month_start
        for _ in range(12):
            prev_end = cursor
            cursor = (cursor - timezone.timedelta(days=1)).replace(day=1)
            amount = (
                paid.filter(created_at__gte=cursor, created_at__lt=prev_end).aggregate(
                    s=Sum("amount_clp")
                )["s"]
                or 0
            )
            monthly_chart.insert(
                0,
                {
                    "month": month_names[cursor.month - 1],
                    "amount_millions": round(amount / 1_000_000, 2),
                },
            )

        revenue_by_course = [
            {
                "course": row["course__title"],
                "amount_clp": row["amount"] or 0,
            }
            for row in paid.values("course__title")
            .annotate(amount=Sum("amount_clp"))
            .order_by("-amount")
        ]

        recent = TransactionSerializer(
            paid.select_related("user", "course").order_by("-created_at")[:10],
            many=True,
            context={"request": request},
        ).data

        return {
            "total_revenue_clp": total,
            "month_revenue_clp": month_revenue,
            "month_sales": month_sales,
            "average_ticket_clp": average_ticket,
            "monthly_chart": monthly_chart,
            "revenue_by_course": revenue_by_course,
            "recent_transactions": recent,
        }
