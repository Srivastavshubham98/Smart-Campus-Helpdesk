from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):

    def validate(self, attrs):
        data = super().validate(attrs)

        data["user"] = {
            "id": self.user.id,
            "username": self.user.username,
            "email": self.user.email,
            "first_name": self.user.first_name,
            "last_name": self.user.last_name,
            "role": self.user.role,
        }

        return data


class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "role"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
    )

    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "password_confirm",
        ]

        read_only_fields = ["id"]

    def validate_email(self, value):
        if value and User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        return value

    def validate(self, attrs):
        attrs["username"] = attrs["username"].strip()
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {
                    "password_confirm": "Passwords do not match."
                }
            )

        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            role=User.Role.STUDENT,
            password=validated_data["password"],
        )

        return user
class AdminUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=False,
        validators=[validate_password],
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_active",
            "password",
        ]

        read_only_fields = ["id"]
    def validate_email(self, value):
        return value.strip().lower()

    def validate_role(self, value):
        allowed_roles = [
            User.Role.STUDENT,
            User.Role.STAFF,
            User.Role.ADMIN,
        ]

        if value not in allowed_roles:
            raise serializers.ValidationError(
                "Invalid user role."
            )

        return value

    def create(self, validated_data):
        password = validated_data.pop("password", None)

        if not password:
            raise serializers.ValidationError(
                {"password": "Password is required."}
            )

        user = User.objects.create_user(
            password=password,
            **validated_data,
        )

        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)

        for field, value in validated_data.items():
            setattr(instance, field, value)

        if password:
            instance.set_password(password)

        instance.save()

        return instance
class ProfileSerializer(serializers.ModelSerializer):
    current_password = serializers.CharField(
        write_only=True,
        required=False,
    )

    new_password = serializers.CharField(
        write_only=True,
        required=False,
        validators=[validate_password],
    )

    new_password_confirm = serializers.CharField(
        write_only=True,
        required=False,
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "current_password",
            "new_password",
            "new_password_confirm",
        ]

        read_only_fields = [
            "id",
            "role",
        ]

    def validate_email(self, value):
        value = value.strip().lower()

        user = self.instance

        if (
            User.objects.filter(email__iexact=value)
            .exclude(id=user.id)
            .exists()
        ):
            raise serializers.ValidationError(
                "An account with this email already exists."
            )

        return value

    def validate(self, attrs):
        current_password = attrs.get("current_password")
        new_password = attrs.get("new_password")
        new_password_confirm = attrs.get(
            "new_password_confirm"
        )

        password_fields_used = any(
            [
                current_password,
                new_password,
                new_password_confirm,
            ]
        )

        if password_fields_used:
            if not current_password:
                raise serializers.ValidationError(
                    {
                        "current_password": (
                            "Current password is required."
                        )
                    }
                )

            if not new_password:
                raise serializers.ValidationError(
                    {
                        "new_password": (
                            "New password is required."
                        )
                    }
                )

            if not new_password_confirm:
                raise serializers.ValidationError(
                    {
                        "new_password_confirm": (
                            "Please confirm the new password."
                        )
                    }
                )

            if not self.instance.check_password(
                current_password
            ):
                raise serializers.ValidationError(
                    {
                        "current_password": (
                            "Current password is incorrect."
                        )
                    }
                )

            if new_password != new_password_confirm:
                raise serializers.ValidationError(
                    {
                        "new_password_confirm": (
                            "New passwords do not match."
                        )
                    }
                )

        return attrs

    def update(self, instance, validated_data):
        validated_data.pop("current_password", None)
        new_password = validated_data.pop(
            "new_password",
            None,
        )
        validated_data.pop(
            "new_password_confirm",
            None,
        )

        for field, value in validated_data.items():
            if isinstance(value, str):
                value = value.strip()
            setattr(instance, field, value)