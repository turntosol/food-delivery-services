import os

from django.contrib.auth import get_user_model

import time

from django.conf import settings

from rest_framework import (
    status,
    viewsets,
)

from rest_framework.decorators import action

from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)

from rest_framework.response import Response

from rest_framework_simplejwt.serializers import (
    TokenRefreshSerializer
)

from rest_framework_simplejwt.tokens import (
    RefreshToken
)

from supabase import create_client

from .models import (
    UserSettings,
    Address,
)

from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    ProfileSerializer,
    AddressSerializer,
    UserSettingsSerializer,
    ChangePasswordSerializer,
)

supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

User = get_user_model()

class AuthViewSet(
    viewsets.GenericViewSet
):
    def get_permissions(self):
        if self.action in [
            "register",
            "login",
            "refresh",
        ]:
            return [AllowAny()]

        return [IsAuthenticated()]

    @action(
        detail=False,
        methods=["post"],
        url_path="register"
    )

    def register(
        self,
        request
    ):
        serializer = RegisterSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = serializer.save()

        return Response(
            {
                "message":
                    "Registration successful.",

                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                }
            },
            status=status.HTTP_201_CREATED
        )

    @action(
        detail=False,
        methods=["post"],
        url_path="login"
    )

    def login(
        self,
        request
    ):
        serializer = LoginSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = serializer.validated_data[
            "user"
        ]

        refresh = RefreshToken.for_user(
            user
        )

        return Response({
            "message": "Login successful.",

            "access": str(refresh.access_token),

            "refresh": str(refresh),

            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "phone": user.phone,
            }
        })

    @action(
        detail=False,
        methods=["post"],
        url_path="refresh"
    )

    def refresh(
        self,
        request
    ):
        serializer = TokenRefreshSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        return Response(
            serializer.validated_data
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="me"
    )

    def me(
        self,
        request
    ):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone": user.phone,
            "avatar":
                (
                    request.build_absolute_uri(
                        user.avatar.url
                    )

                    if user.avatar
                    else None
                ),
        })


class AccountViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @action(detail=False, methods=["get", "patch"], url_path="profile")
    def profile(self, request):
        user = request.user

        if request.method == "GET":
            serializer = ProfileSerializer(
                user,
                context={"request": request}
            )
            return Response(serializer.data, status=status.HTTP_200_OK)

        if "avatar" in request.FILES and user.avatar:
            user.avatar.delete(save=False)

        serializer = ProfileSerializer(
            user,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        user.refresh_from_db()
        response_serializer = ProfileSerializer(
            user,
            context={"request": request}
        )
        return Response(response_serializer.data, status=status.HTTP_200_OK)

    @action(
        detail=False,
        methods=["patch", "post"],
        url_path="change-avatar",
        parser_classes=[MultiPartParser, FormParser],
    )
    def change_avatar(self, request):
        user = request.user
        avatar_file = request.FILES.get("avatar")

        if not avatar_file:
            return Response(
                {"avatar": ["Vui lòng chọn file ảnh."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if avatar_file.size > 5 * 1024 * 1024:
            return Response(
                {"avatar": ["Dung lượng ảnh vượt quá 5MB."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        valid_extensions = [".jpg", ".jpeg", ".png", ".webp"]
        ext = os.path.splitext(avatar_file.name)[1].lower()
        if ext not in valid_extensions:
            return Response(
                {"avatar": ["Chỉ chấp nhận JPG, JPEG, PNG hoặc WEBP."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Đặt tên file theo user ID và timestamp để tránh trùng/ghi đè nhầm
            file_name = f"user_{user.id}_{int(time.time())}{ext}"
            file_bytes = avatar_file.read()
            content_type = avatar_file.content_type or "image/jpeg"

            # Upload buffer trực tiếp lên Supabase
            supabase.storage.from_(settings.SUPABASE_AVATAR_BUCKET).upload(
                path=file_name,
                file=file_bytes,
                file_options={"content-type": content_type, "upsert": "true"},
            )

            # Lấy public URL
            avatar_url = supabase.storage.from_(
                settings.SUPABASE_AVATAR_BUCKET
            ).get_public_url(file_name)

            # Lưu link cloud vào database
            user.avatar = avatar_url
            user.save(update_fields=["avatar", "updated_at"])

            return Response(
                {
                    "message": "Avatar updated successfully.",
                    "avatar_url": avatar_url,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"detail": f"Supabase error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get", "patch"], url_path="settings")
    def user_settings(self, request):
        settings_obj, _ = UserSettings.objects.get_or_create(
            user=request.user
        )

        if request.method == "GET":
            serializer = UserSettingsSerializer(settings_obj)
            return Response(serializer.data, status=status.HTTP_200_OK)

        serializer = UserSettingsSerializer(
            settings_obj,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="change-password")
    def change_password(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])

        return Response(
            {"message": "Password changed successfully."},
            status=status.HTTP_200_OK,
        )

    
class AddressViewSet(
    viewsets.ModelViewSet
):
    serializer_class = AddressSerializer
    permission_classes = [
        IsAuthenticated
    ]

    def get_queryset(self):
        return Address.objects.filter(
            user=self.request.user
        )

    def perform_create(
        self,
        serializer
    ):
        has_address = Address.objects.filter(
            user=self.request.user
        ).exists()

        serializer.save(
            user=self.request.user,
            is_default=not has_address
        )

    def perform_update(
        self,
        serializer
    ):
        instance = serializer.instance
        is_default = serializer.validated_data.get(
            "is_default",
            instance.is_default
        )

        if is_default:
            Address.objects.filter(
                user=self.request.user
            ).exclude(
                id=instance.id
            ).update(
                is_default=False
            )

        serializer.save()

    @action(
        detail=True,
        methods=["patch"],
        url_path="default"
    )

    def set_default(
        self,
        request,
        pk=None
    ):

        address = self.get_object()
        Address.objects.filter(
            user=request.user
        ).update(
            is_default=False
        )

        address.is_default = True
        address.save(
            update_fields=[
                "is_default"
            ]
        )

        serializer = self.get_serializer(
            address
        )

        return Response(
            serializer.data
        )