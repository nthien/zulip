from __future__ import absolute_import

from django.core.management.base import BaseCommand
from zerver.models import Subscription

class Command(BaseCommand):
    help = """One-off script to migration users' stream notification settings."""

    def handle(self, *args, **options):
        for subscription in Subscription.objects.all():
            subscription.desktop_notifications = subscription.notifications
            subscription.audible_notifications = subscription.notifications
            subscription.save(update_fields=["desktop_notifications",
                                             "audible_notifications"])
