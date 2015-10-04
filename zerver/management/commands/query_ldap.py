from __future__ import absolute_import

import sys

from django.contrib.auth import authenticate, login, get_backends
from django.core.management.base import BaseCommand
from django.conf import settings

from django_auth_ldap.backend import LDAPBackend, _LDAPUser


# Run this on a cronjob to pick up on name changes.
def query_ldap(**options):
    email = options['email']
    for backend in get_backends():
        if isinstance(backend, LDAPBackend):
            ldap_attrs = _LDAPUser(backend, backend.django_to_ldap_username(email)).attrs
            if ldap_attrs is None:
                print "No such user found"
            else:
                for django_field, ldap_field in settings.AUTH_LDAP_USER_ATTR_MAP.items():
                    print "%s: %s" % (django_field, ldap_attrs[ldap_field])

class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('email', metavar='<email>', type=str,
                            help="email of user to query")

    def handle(self, *args, **options):
        query_ldap(**options)
