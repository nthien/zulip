from __future__ import absolute_import

from zerver.lib.statistics import seconds_usage_between

from optparse import make_option
from django.core.management.base import BaseCommand
from zerver.models import UserProfile
import datetime
from django.utils.timezone import utc

def analyze_activity(options):
    day_start = datetime.datetime.strptime(options["date"], "%Y-%m-%d").replace(tzinfo=utc)
    day_end = day_start + datetime.timedelta(days=options["duration"])

    user_profile_query = UserProfile.objects.all()
    if options["realm"]:
        user_profile_query = user_profile_query.filter(realm__domain=options["realm"])

    print "Per-user online duration:\n"
    total_duration = datetime.timedelta(0)
    for user_profile in user_profile_query:
        duration = seconds_usage_between(user_profile, day_start, day_end)

        if duration == datetime.timedelta(0):
            continue

        total_duration += duration
        print "%-*s%s" % (37, user_profile.email, duration, )

    print "\nTotal Duration:                      %s" % (total_duration,)
    print "\nTotal Duration in minutes:           %s" % (total_duration.total_seconds() / 60.,)
    print "Total Duration amortized to a month: %s" % (total_duration.total_seconds() * 30. / 60.,)

class Command(BaseCommand):
    help = """Report analytics of user activity on a per-user and realm basis.

This command aggregates user activity data that is collected by each user using Zulip. It attempts
to approximate how much each user has been using Zulip per day, measured by recording each 15 minute
period where some activity has occurred (mouse move or keyboard activity).

It will correctly not count server-initiated reloads in the activity statistics.

The duration flag can be used to control how many days to show usage duration for

Usage: python manage.py analyze_user_activity [--realm=zulip.com] [--date=2013-09-10] [--duration=1]

By default, if no date is selected 2013-09-10 is used. If no realm is provided, information
is shown for all realms"""

    option_list = BaseCommand.option_list + (
        make_option('--realm', action='store'),
        make_option('--date', action='store', default="2013-09-06"),
        make_option('--duration', action='store', default=1, type=int, help="How many days to show usage information for"),
        )

    def handle(self, *args, **options):
        analyze_activity(options)
