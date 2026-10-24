from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import (
    User,
    UserSettings,
    Address,
)


class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        min_length=6
    )

    password_confirm = serializers.CharField(
        write_only=True
    )

    class Meta:
        model = User

        fields = [
            "username",
            "email",
            "password",
            "password_confirm",
        ]

    def validate(self, attrs):

        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({
                "password_confirm":
                    "Passwords do not match."
            })

        return attrs

    def create(self, validated_data):

        validated_data.pop(
            "password_confirm"
        )

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )

        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True
    )

    def validate(self, attrs):

        email = attrs["email"]
        password = attrs["password"]

        try:
            user = User.objects.get(
                email=email
            )

        except User.DoesNotExist:
            raise serializers.ValidationError(
                "Invalid email or password."
            )

        user = authenticate(
            username=user.username,
            password=password
        )

        if user is None:
            raise serializers.ValidationError(
                "Invalid email or password."
            )

        if not user.is_active:
            raise serializers.ValidationError(
                "This account is inactive."
            )

        attrs["user"] = user
        return attrs



class ProfileSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "avatar",
            "avatar_url",
        ]
        read_only_fields = ["id", "username", "email", "avatar_url"]

    def get_avatar_url(self, obj):
        if not obj.avatar:
            return None

        url_str = str(obj.avatar)

        if url_str.startswith("http://") or url_str.startswith("https://"):
            return url_str

        request = self.context.get("request")
        if request and hasattr(obj.avatar, "url"):
            return request.build_absolute_uri(obj.avatar.url)

        return getattr(obj.avatar, "url", url_str)



class AddressSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = Address
        fields = [
            "id",
            "receiver_name",
            "phone",
            "address",
            "is_default",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class UserSettingsSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = UserSettings
        fields = [
            "email_notifications",
            "order_notifications",
            "promotional_notifications",
        ]


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(
        write_only=True
    )

    new_password = serializers.CharField(
        write_only=True
    )

    def validate_old_password(self, value):
        user = self.context["request"].user

        if not user.check_password(value):
            raise serializers.ValidationError(
                "Current password is incorrect."
            )

        return value

    def validate_new_password(self, value):
        return value