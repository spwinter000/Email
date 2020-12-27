from django.contrib import admin
from .models import User, Email

# Register your models here.
class UserAdmin(admin.ModelAdmin):
    list_display = ("username",)

class EmailAdmin(admin.ModelAdmin):
    list_display = ("user", "sender", "subject", "body",)
    

admin.site.register(User, UserAdmin),
admin.site.register(Email, EmailAdmin)