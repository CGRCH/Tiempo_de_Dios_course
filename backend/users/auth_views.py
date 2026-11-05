from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class BlockedUserTokenSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        if getattr(self.user, "is_blocked", False):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("Cuenta suspendida.")
        return data


class TokenObtainPairBlockedView(TokenObtainPairView):
    serializer_class = BlockedUserTokenSerializer
