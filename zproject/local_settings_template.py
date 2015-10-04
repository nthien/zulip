# Settings for Zulip Voyager

### MANDATORY SETTINGS
#
# These settings MUST be set in production. In a development environment,
# sensible default values will be used.

# The user-accessible Zulip hostname for this installation, e.g.
# zulip.example.com
EXTERNAL_HOST = 'zulip.example.com'

# The email address for the person or team who maintain the Zulip
# Voyager installation. Will also get support emails. (e.g. zulip-admin@example.com)
ZULIP_ADMINISTRATOR = 'zulip-admin@example.com'

# The domain for your organization, e.g. example.com
ADMIN_DOMAIN = 'example.com'

# Enable at least one of the following authentication backends.
AUTHENTICATION_BACKENDS = (
#                           'zproject.backends.EmailAuthBackend', # Email and password; see SMTP setup below
#                           'zproject.backends.ZulipRemoteUserBackend', # Local SSO
#                           'zproject.backends.GoogleMobileOauth2Backend', # Google Apps, setup below
#                           'zproject.backends.ZulipLDAPAuthBackend', # LDAP, setup below
    )

# Google Oauth requires a bit of configuration; you will need to go to
# do the following:
#
# (1) Visit https://console.developers.google.com, setup an
# Oauth2 client ID that allows redirects to
# e.g. https://zulip.example.com/accounts/login/google/done/.
#
# (2) Then click into the APIs and Auth section (in the sidebar on the
# left side of the page), APIs, then under "Social APIs" click on
# "Google+ API" and click the button to enable the API.
#
# (3) put your client secret as "google_oauth2_client_secret" in
# zulip-secrets.conf, and your client ID right here:
# GOOGLE_OAUTH2_CLIENT_ID=<your client ID from Google>

# If you are using the ZulipRemoteUserBackend authentication backend,
# set this to your domain (e.g. if REMOTE_USER is "username" and the
# corresponding email address is "username@example.com", set
# SSO_APPEND_DOMAIN = "example.com")
SSO_APPEND_DOMAIN = None

# Configure the outgoing SMTP server below. The default configuration
# is prepopulated for GMail servers.  Change EMAIL_HOST for other
# hosts, or leave it unset or empty to skip sending email.  Note if
# you are using a GMail account to send outgoing email, you will
# likely need to configure that account as "less secure" here:
# https://support.google.com/accounts/answer/6010255.
#
# With the exception of reading EMAIL_HOST_PASSWORD from the Zulip
# secrets file, Zulip uses Django's standard EmailBackend, so if
# you're having issues, you may want to search for documentation on
# using your email provider with Django.
#
# A common problem you may encounter when trying to get this working
# is that some hosting providers block outgoing SMTP traffic.
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_HOST_USER = ''
# If you're using password auth, you will need to put the password in
# /etc/zulip/zulip-secrets.conf as email_password.
EMAIL_PORT = 587
EMAIL_USE_TLS = True

# The email From address to be used for automatically generated emails
DEFAULT_FROM_EMAIL = "Zulip <zulip@example.com>"
# The noreply address to be used as Reply-To for certain generated emails.
# Messages sent to this address should not be delivered anywhere.
NOREPLY_EMAIL_ADDRESS = "noreply@example.com"

# A list of strings representing the host/domain names that this
# Django site can serve. You should reset it to be a list of
# domains/IP addresses for your site. This is a security measure to
# prevent an attacker from poisoning caches and triggering password
# reset emails with links to malicious hosts by submitting requests
# with a fake HTTP Host header.
ALLOWED_HOSTS = ['*']

### OPTIONAL SETTINGS

# Controls whether session cookies expire when the browser closes
SESSION_EXPIRE_AT_BROWSER_CLOSE = False

# Session cookie expiry in seconds after the last page load
SESSION_COOKIE_AGE = 60 * 60 * 24 * 7 * 2 # 2 weeks

# Controls whether or not there is a feedback button in the UI.
ENABLE_FEEDBACK = False

# By default, the feedback button will submit feedback to the Zulip
# developers.  If you set FEEDBACK_EMAIL to be an email address
# (e.g. ZULIP_ADMINISTRATOR), feedback sent by your users will instead
# be sent to that email address.
FEEDBACK_EMAIL = ZULIP_ADMINISTRATOR

# Controls whether or not error reports are sent to Zulip.  Error
# reports are used to improve the quality of the product and do not
# include message contents; please contact Zulip support with any
# questions.
ERROR_REPORTING = True

# Controls whether or not Zulip will provide inline image preview when
# a link to an image is referenced in a message.
INLINE_IMAGE_PREVIEW = True

# By default, files uploaded by users and user avatars are stored
# directly on the Zulip server.  If file storage in Amazon S3 is
# desired, you can configure that by setting s3_key and s3_secret_key
# in /etc/zulip/zulip-secrets.conf to be the S3 access and secret keys
# that you want to use, and setting the S3_AUTH_UPLOADS_BUCKET and
# S3_AVATAR_BUCKET to be the S3 buckets you've created to store file
# uploads and user avatars, respectively.
LOCAL_UPLOADS_DIR = "/home/zulip/uploads"

# Controls whether name changes are completely disabled for this installation
# This is useful in settings where you're syncing names from an integrated LDAP/Active Directory
NAME_CHANGES_DISABLED = False

# Controls whether users who have not uploaded an avatar will receive an avatar
# from gravatar.com.
ENABLE_GRAVATAR = True

# To override the default avatar image if ENABLE_GRAVATAR is False, place your
# custom default avatar image at /home/zulip/local-static/default-avatar.png
# and uncomment the following line.
#DEFAULT_AVATAR_URI = '/local-static/default-avatar.png'

### TWITTER INTEGRATION

# Zulip supports showing inline Tweet previews when a tweet is linked
# to in a message.  To support this, Zulip must have access to the
# Twitter API via OAuth.  To obtain the various access tokens needed
# below, you must register a new application under your Twitter
# account by doing the following:
#
# 1. Log in to http://dev.twitter.com.
# 2. In the menu under your username, click My Applications. From this page, create a new application.
# 3. Click on the application you created and click "create my access token".
# 4. Fill in the values for twitter_consumer_key, twitter_consumer_secret, twitter_access_token_key,
#    and twitter_access_token_secret in /etc/zulip/zulip-secrets.conf.

### EMAIL GATEWAY INTEGRATION

# The email gateway provides, for each stream, an email address that
# you can send email to in order to have the email's content be posted
# to that stream.  Emails received at the per-stream email address
# will be converted into a Zulip message

# There are two ways to make use of local email mirroring:
#  1. Local delivery: A MTA runs locally and passes mail directly to Zulip
#  2. Polling: Checks an IMAP inbox every minute for new messages.

# A Puppet manifest for local delivery via Postfix is available in
# puppet/zulip/manifests/postfix_localmail.pp. To use the manifest, add it to
# puppet_classes in /etc/zulip/zulip.conf. This manifest assumes you'll receive
# mail addressed to the hostname of your Zulip server.
#
# Users of other mail servers will need to configure it to pass mail to the
# email mirror; see `python manage.py email-mirror --help` for details.

# The email address pattern to use for auto-generated stream emails
# The %s will be replaced with a unique token, and the resulting email
# must be delivered to the EMAIL_GATEWAY_IMAP_FOLDER of the
# EMAIL_GATEWAY_LOGIN account below, or piped in to the email-mirror management
# command as indicated above.
#
# Example: zulip+%s@example.com
EMAIL_GATEWAY_PATTERN = ""


# The following options are relevant if you're using mail polling.
#
# A sample cron job for mail polling is available at puppet/zulip/files/cron.d/email-mirror
#
# The Zulip username of the bot that the email pattern should post as.
# Example: emailgateway@example.com
EMAIL_GATEWAY_BOT = ""

# Configuration of the email mirror mailbox
# The IMAP login and password
EMAIL_GATEWAY_LOGIN = ""
EMAIL_GATEWAY_PASSWORD = ""
# The IMAP server & port to connect to
EMAIL_GATEWAY_IMAP_SERVER = ""
EMAIL_GATEWAY_IMAP_PORT = 993
# The IMAP folder name to check for emails. All emails sent to EMAIL_GATEWAY_PATTERN above
# must be delivered to this folder
EMAIL_GATEWAY_IMAP_FOLDER = "INBOX"

### LDAP integration configuration
# Zulip supports retrieving information about users via LDAP, and
# optionally using LDAP as an authentication mechanism.  For using
# LDAP authentication, you will need to enable the
# zproject.backends.ZulipLDAPAuthBackend auth backend in
# AUTHENTICATION_BACKENDS above.

import ldap
from django_auth_ldap.config import LDAPSearch, GroupOfNamesType

# URI of your LDAP server. If set, LDAP is used to prepopulate a user's name in
# Zulip. Example: "ldaps://ldap.example.com"
AUTH_LDAP_SERVER_URI = ""

# This DN and password will be used to bind to your server. If unset, anonymous
# binds are performed.
AUTH_LDAP_BIND_DN = ""
AUTH_LDAP_BIND_PASSWORD = ""

# Specify the search base and the property to filter on that corresponds to the
# username.
AUTH_LDAP_USER_SEARCH = LDAPSearch("ou=users,dc=example,dc=com",
    ldap.SCOPE_SUBTREE, "(uid=%(user)s)")

# If the value of a user's "uid" (or similar) property is not their email
# address, specify the domain to append here.
LDAP_APPEND_DOMAIN = ADMIN_DOMAIN

# This map defines how to populate attributes of a Zulip user from LDAP.
AUTH_LDAP_USER_ATTR_MAP = {
# Populate the Django user's name from the LDAP directory.
    "full_name": "cn",
}

CAMO_URI = ''
