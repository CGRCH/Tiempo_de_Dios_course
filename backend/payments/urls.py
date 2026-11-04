from django.urls import path

from payments.views import ExportTransactionsCSVView, RevenueDashboardView, TransactionListView

urlpatterns = [
    path("admin/revenue/", RevenueDashboardView.as_view()),
    path("admin/transactions/", TransactionListView.as_view()),
    path("admin/transactions/export/", ExportTransactionsCSVView.as_view()),
]
