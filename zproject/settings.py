# Django settings for zulip project.
########################################################################
# Here's how settings for the Zulip project work:
#
# * settings.py contains non-site-specific and settings configuration
# for the Zulip Django app.
# * settings.py imports local_settings.py, and any site-specific configuration
# belongs there.  The template for local_settings.py is local_settings_template.py
########################################################################
import os
import platform
import time
import sys
import ConfigParser

from zerver.lib.db import TimeTrackingConnection

########################################################################
# INITIAL SETTINGS
########################################################################

config_file = ConfigParser.RawConfigParser()
config_file.read("/etc/zulip/zulip.conf")

# Whether this instance of Zulip is running in a production environment.
PRODUCTION = config_file.has_option('machine', 'deploy_type')
DEVELOPMENT = not PRODUCTION

secrets_file = ConfigParser.RawConfigParser()
if PRODUCTION:
    secrets_file.read("/etc/zulip/zulip-secrets.conf")
else:
    secrets_file.read("zproject/dev-secrets.conf")

def get_secret(key):
    if secrets_file.has_option('secrets', key):
        return secrets_file.get('secrets', key)
    return None

# Make this unique, and don't share it with anybody.
SECRET_KEY = get_secret("secret_key")

# A shared secret, used to authenticate different parts of the app to each other.
SHARED_SECRET = get_secret("shared_secret")

# We use this salt to hash a user's email into a filename for their user-uploaded
# avatar.  If this salt is discovered, attackers will only be able to determine
# that the owner of an email account has uploaded an avatar to Zulip, which isn't
# the end of the world.  Don't use the salt where there is more security exposure.
AVATAR_SALT = get_secret("avatar_salt")

# SERVER_GENERATION is used to track whether the server has been
# restarted for triggering browser clients to reload.
SERVER_GENERATION = int(time.time())

if not 'DEBUG' in globals():
    # Uncomment end of next line to test JS/CSS minification.
    DEBUG = DEVELOPMENT # and platform.node() != 'your-machine'

TEMPLATE_DEBUG = DEBUG
if DEBUG:
    INTERNAL_IPS = ('127.0.0.1',)

# Detect whether we're running as a queue worker; this impacts the logging configuration.
if len(sys.argv) > 2 and sys.argv[0].endswith('manage.py') and sys.argv[1] == 'process_queue':
    IS_WORKER = True
else:
    IS_WORKER = False


# This is overridden in test_settings.py for the test suites
TEST_SUITE = False
# The new user tutorial is enabled by default, but disabled for client tests.
TUTORIAL_ENABLED = True

# Import variables like secrets from the local_settings file
# Import local_settings after determining the deployment/machine type
if PRODUCTION:
    from local_settings import *
else:
    # For the Dev VM environment, we use the same settings as the
    # sample local_settings.py file, with a few exceptions.
    from local_settings_template import *
    EXTERNAL_HOST = 'localhost:9991'
    ALLOWED_HOSTS = ['localhost']
    AUTHENTICATION_BACKENDS = ('zproject.backends.DevAuthBackend',)
    # Add some of the below if you're testing other backends
    # AUTHENTICATION_BACKENDS = ('zproject.backends.EmailAuthBackend',
    #                            'zproject.backends.GoogleMobileOauth2Backend',)
    EXTERNAL_URI_SCHEME = "http://"
    EMAIL_GATEWAY_PATTERN = "%s@" + EXTERNAL_HOST
    ADMIN_DOMAIN = "zulip.com"
    NOTIFICATION_BOT = "notification-bot@zulip.com"
    ERROR_BOT = "error-bot@zulip.com"
    NEW_USER_BOT = "new-user-bot@zulip.com"
    EMAIL_GATEWAY_BOT = "emailgateway@zulip.com"

########################################################################
# DEFAULT VALUES FOR SETTINGS
########################################################################

# For any settings that are not defined in local_settings.py,
# we want to initialize them to sane default
DEFAULT_SETTINGS = {'TWITTER_CONSUMER_KEY': '',
                    'TWITTER_CONSUMER_SECRET': '',
                    'TWITTER_ACCESS_TOKEN_KEY': '',
                    'TWITTER_ACCESS_TOKEN_SECRET': '',
                    'EMAIL_GATEWAY_PATTERN': '',
                    'EMAIL_GATEWAY_EXAMPLE': '',
                    'EMAIL_GATEWAY_BOT': None,
                    'EMAIL_GATEWAY_LOGIN': None,
                    'EMAIL_GATEWAY_PASSWORD': None,
                    'EMAIL_GATEWAY_IMAP_SERVER': None,
                    'EMAIL_GATEWAY_IMAP_PORT': None,
                    'EMAIL_GATEWAY_IMAP_FOLDER': None,
                    'MANDRILL_API_KEY': '',
                    'S3_KEY': '',
                    'S3_SECRET_KEY': '',
                    'S3_BUCKET': '',
                    'S3_AVATAR_BUCKET': '',
                    'LOCAL_UPLOADS_DIR': None,
                    'DROPBOX_APP_KEY': '',
                    'ERROR_REPORTING': True,
                    'JWT_AUTH_KEYS': {},
                    'NAME_CHANGES_DISABLED': False,
                    'DEPLOYMENT_ROLE_NAME': "",
                    # The following bots only exist in non-VOYAGER installs
                    'ERROR_BOT': None,
                    'NEW_USER_BOT': None,
                    'NAGIOS_STAGING_SEND_BOT': None,
                    'NAGIOS_STAGING_RECEIVE_BOT': None,
                    'APNS_CERT_FILE': None,
                    'ANDROID_GCM_API_KEY': None,
                    'INITIAL_PASSWORD_SALT': None,
                    'FEEDBACK_BOT': 'feedback@zulip.com',
                    'FEEDBACK_BOT_NAME': 'Zulip Feedback Bot',
                    'API_SUPER_USERS': set(),
                    'ADMINS': '',
                    'INLINE_IMAGE_PREVIEW': True,
                    'CAMO_URI': '',
                    'ENABLE_FEEDBACK': PRODUCTION,
                    'FEEDBACK_EMAIL': None,
                    'ENABLE_GRAVATAR': True,
                    'DEFAULT_AVATAR_URI': '/static/images/default-avatar.png',
                    'AUTH_LDAP_SERVER_URI': "",
                    'EXTERNAL_URI_SCHEME': "https://",
                    'ZULIP_COM': False,
                    'ZULIP_COM_STAGING': False,
                    'STATSD_HOST': '',
                    'REMOTE_POSTGRES_HOST': '',
                    'GOOGLE_CLIENT_ID': '',
                    'DBX_APNS_CERT_FILE': None,
                    }

for setting_name, setting_val in DEFAULT_SETTINGS.iteritems():
    if not setting_name in vars():
        vars()[setting_name] = setting_val

# These are the settings that we will check that the user has filled in for
# production deployments before starting the app.  It consists of a series
# of pairs of (setting name, default value that it must be changed from)
REQUIRED_SETTINGS = [("EXTERNAL_HOST", "zulip.example.com"),
                     ("ZULIP_ADMINISTRATOR", "zulip-admin@example.com"),
                     ("ADMIN_DOMAIN", "example.com"),
                     # SECRET_KEY doesn't really need to be here, in
                     # that we set it automatically, but just in
                     # case, it seems worth having in this list
                     ("SECRET_KEY", ""),
                     ("AUTHENTICATION_BACKENDS", ()),
                     ("NOREPLY_EMAIL_ADDRESS", "noreply@example.com"),
                     ("DEFAULT_FROM_EMAIL", "Zulip <zulip@example.com>"),
                     ("ALLOWED_HOSTS", "*"),
                     ]

if ADMINS == "":
    ADMINS = (("Zulip Administrator", ZULIP_ADMINISTRATOR),)
MANAGERS = ADMINS

# Voyager is a production zulip server that is not zulip.com or
# staging.zulip.com VOYAGER is the standalone all-on-one-server
# production deployment model for based on the original Zulip
# ENTERPRISE implementation.  We expect most users of the open source
# project will be using VOYAGER=True in production.
VOYAGER = PRODUCTION and not ZULIP_COM

########################################################################
# STANDARD DJANGO SETTINGS
########################################################################

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# In a Windows environment this must be set to your system time zone.
TIME_ZONE = 'America/New_York'

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en-us'

# The ID, as an integer, of the current site in the django_site database table.
# This is used so that application data can hook into specific site(s) and a
# single database can manage content for multiple sites.
#
# We set this site's domain to 'zulip.com' in populate_db.
SITE_ID = 1

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# If you set this to False, Django will not format dates, numbers and
# calendars according to the current locale.
USE_L10N = True

# If you set this to False, Django will not use timezone-aware datetimes.
USE_TZ = True

DEPLOY_ROOT = os.path.join(os.path.realpath(os.path.dirname(__file__)), '..')
TEMPLATE_DIRS = ( os.path.join(DEPLOY_ROOT, 'templates'), )

# Make redirects work properly behind a reverse proxy
USE_X_FORWARDED_HOST = True

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
    )
if PRODUCTION:
    # Template caching is a significant performance win in production.
    TEMPLATE_LOADERS = (
        ('django.template.loaders.cached.Loader',
         TEMPLATE_LOADERS),
        )

MIDDLEWARE_CLASSES = (
    # Our logging middleware should be the first middleware item.
    'zerver.middleware.TagRequests',
    'zerver.middleware.LogRequests',
    'zerver.middleware.JsonErrorHandler',
    'zerver.middleware.RateLimitMiddleware',
    'zerver.middleware.FlushDisplayRecipientCache',
    'django.middleware.common.CommonMiddleware',
    'zerver.middleware.SessionHostDomainMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
)

ANONYMOUS_USER_ID = None

AUTH_USER_MODEL = "zerver.UserProfile"

TEST_RUNNER = 'zerver.lib.test_runner.Runner'

ROOT_URLCONF = 'zproject.urls'

# Python dotted path to the WSGI application used by Django's runserver.
WSGI_APPLICATION = 'zproject.wsgi.application'

INSTALLED_APPS = [
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.staticfiles',
    'confirmation',
    'guardian',
    'pipeline',
    'zerver',
]

if not VOYAGER:
    INSTALLED_APPS += [
        'analytics',
        'zilencer',
    ]

# Base URL of the Tornado server
# We set it to None when running backend tests or populate_db.
# We override the port number when running frontend tests.
TORNADO_SERVER = 'http://localhost:9993'
RUNNING_INSIDE_TORNADO = False

########################################################################
# DATABASE CONFIGURATION
########################################################################

DATABASES = {"default": {
    'ENGINE': 'django.db.backends.postgresql_psycopg2',
    'NAME': 'zulip',
    'USER': 'zulip',
    'PASSWORD': '', # Authentication done via certificates
    'HOST': '',  # Host = '' => connect through a local socket
    'SCHEMA': 'zulip',
    'CONN_MAX_AGE': 600,
    'OPTIONS': {
        'connection_factory': TimeTrackingConnection
        },
    },
}

if DEVELOPMENT:
    LOCAL_DATABASE_PASSWORD = get_secret("local_database_password")
    DATABASES["default"].update({
            'PASSWORD': LOCAL_DATABASE_PASSWORD,
            'HOST': 'localhost'
            })
elif REMOTE_POSTGRES_HOST != '':
    DATABASES['default'].update({
            'HOST': REMOTE_POSTGRES_HOST,
            })
    DATABASES['default']['OPTIONS']['sslmode'] = 'verify-full'

########################################################################
# RABBITMQ CONFIGURATION
########################################################################

USING_RABBITMQ = True
RABBITMQ_USERNAME = 'zulip'
RABBITMQ_PASSWORD = get_secret("rabbitmq_password")

########################################################################
# CACHING CONFIGURATION
########################################################################

SESSION_ENGINE = "django.contrib.sessions.backends.cached_db"

CACHES = {
    'default': {
        'BACKEND':  'django.core.cache.backends.memcached.PyLibMCCache',
        'LOCATION': '127.0.0.1:11211',
        'TIMEOUT':  3600
    },
    'database': {
        'BACKEND':  'django.core.cache.backends.db.DatabaseCache',
        'LOCATION':  'third_party_api_results',
        # Basically never timeout.  Setting to 0 isn't guaranteed
        # to work, see https://code.djangoproject.com/ticket/9595
        'TIMEOUT': 2000000000,
        'OPTIONS': {
            'MAX_ENTRIES': 100000000,
            'CULL_FREQUENCY': 10,
        }
    },
}

########################################################################
# REDIS-BASED RATE LIMITING CONFIGURATION
########################################################################

RATE_LIMITING = True
REDIS_HOST = '127.0.0.1'
REDIS_PORT = 6379

RATE_LIMITING_RULES = [
    (60, 100),     # 100 requests max every minute
    ]

########################################################################
# SECURITY SETTINGS
########################################################################

# Tell the browser to never send our cookies without encryption, e.g.
# when executing the initial http -> https redirect.
#
# Turn it off for local testing because we don't have SSL.
if PRODUCTION:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE    = True

try:
    # For get_updates hostname sharding.
    domain = config_file.get('django', 'cookie_domain')
    SESSION_COOKIE_DOMAIN = '.' + domain
    CSRF_COOKIE_DOMAIN    = '.' + domain
except ConfigParser.Error:
    # Failing here is OK
    pass

# Prevent Javascript from reading the CSRF token from cookies.  Our code gets
# the token from the DOM, which means malicious code could too.  But hiding the
# cookie will slow down some attackers.
CSRF_COOKIE_PATH = '/;HttpOnly'
CSRF_FAILURE_VIEW = 'zerver.middleware.csrf_failure'

if DEVELOPMENT:
    # Use fast password hashing for creating testing users when not
    # PRODUCTION.  Saves a bunch of time.
    PASSWORD_HASHERS = (
                'django.contrib.auth.hashers.SHA1PasswordHasher',
                'django.contrib.auth.hashers.PBKDF2PasswordHasher'
            )
    # Also we auto-generate passwords for the default users which you
    # can query using ./manage.py print_initial_password
    INITIAL_PASSWORD_SALT = get_secret("initial_password_salt")

########################################################################
# API/BOT SETTINGS
########################################################################

if "EXTERNAL_API_PATH" not in vars():
    EXTERNAL_API_PATH = EXTERNAL_HOST + "/api"
EXTERNAL_API_URI = EXTERNAL_URI_SCHEME + EXTERNAL_API_PATH

S3_KEY = get_secret("s3_key")
S3_SECRET_KEY = get_secret("s3_secret_key")

# GCM tokens are IP-whitelisted; if we deploy to additional
# servers you will need to explicitly add their IPs here:
# https://cloud.google.com/console/project/apps~zulip-android/apiui/credential
ANDROID_GCM_API_KEY = get_secret("android_gcm_api_key")

GOOGLE_OAUTH2_CLIENT_SECRET = get_secret('google_oauth2_client_secret')

DROPBOX_APP_KEY = get_secret("dropbox_app_key")

MAILCHIMP_API_KEY = get_secret("mailchimp_api_key")

# This comes from our mandrill accounts page
MANDRILL_API_KEY = get_secret("mandrill_api_key")

# Twitter API credentials
# Secrecy not required because its only used for R/O requests.
# Please don't make us go over our rate limit.
TWITTER_CONSUMER_KEY = get_secret("twitter_consumer_key")
TWITTER_CONSUMER_SECRET = get_secret("twitter_consumer_secret")
TWITTER_ACCESS_TOKEN_KEY = get_secret("twitter_access_token_key")
TWITTER_ACCESS_TOKEN_SECRET = get_secret("twitter_access_token_secret")

# These are the bots that Zulip sends automated messages as.
INTERNAL_BOTS = [ {'var_name': 'NOTIFICATION_BOT',
                   'email_template': 'notification-bot@%s',
                   'name': 'Notification Bot'},
                  {'var_name': 'EMAIL_GATEWAY_BOT',
                   'email_template': 'emailgateway@%s',
                   'name': 'Email Gateway'},
                  {'var_name': 'NAGIOS_SEND_BOT',
                   'email_template': 'nagios-send-bot@%s',
                   'name': 'Nagios Send Bot'},
                  {'var_name': 'NAGIOS_RECEIVE_BOT',
                   'email_template': 'nagios-receive-bot@%s',
                   'name': 'Nagios Receive Bot'},
                  {'var_name': 'WELCOME_BOT',
                   'email_template': 'welcome-bot@%s',
                   'name': 'Welcome Bot'} ]

INTERNAL_BOT_DOMAIN = "zulip.com"

# Set the realm-specific bot names
for bot in INTERNAL_BOTS:
    if not bot['var_name'] in vars():
        bot_email = bot['email_template'] % (INTERNAL_BOT_DOMAIN,)
        vars()[bot['var_name'] ] = bot_email

if EMAIL_GATEWAY_BOT not in API_SUPER_USERS:
    API_SUPER_USERS.add(EMAIL_GATEWAY_BOT)
if EMAIL_GATEWAY_PATTERN != "":
    EMAIL_GATEWAY_EXAMPLE = EMAIL_GATEWAY_PATTERN % ("support+abcdefg",)

DEPLOYMENT_ROLE_KEY = get_secret("deployment_role_key")

if PRODUCTION:
    FEEDBACK_TARGET="https://zulip.com/api"
else:
    FEEDBACK_TARGET="http://localhost:9991/api"

########################################################################
# STATSD CONFIGURATION
########################################################################

# Statsd is not super well supported; if you want to use it you'll need
# to set STATSD_HOST and STATSD_PREFIX.
if STATSD_HOST != '':
    INSTALLED_APPS += ['django_statsd']
    STATSD_PORT = 8125
    STATSD_CLIENT = 'django_statsd.clients.normal'

########################################################################
# CAMO HTTPS CACHE CONFIGURATION
########################################################################

if CAMO_URI != '':
    # This needs to be synced with the Camo installation
    CAMO_KEY = get_secret("camo_key")

########################################################################
# STATIC CONTENT AND MINIFICATION SETTINGS
########################################################################

STATIC_URL = '/static/'

# ZulipStorage is a modified version of PipelineCachedStorage,
# and, like that class, it inserts a file hash into filenames
# to prevent the browser from using stale files from cache.
#
# Unlike PipelineStorage, it requires the files to exist in
# STATIC_ROOT even for dev servers.  So we only use
# ZulipStorage when not DEBUG.

# This is the default behavior from Pipeline, but we set it
# here so that urls.py can read it.
PIPELINE = not DEBUG

if DEBUG:
    STATICFILES_STORAGE = 'pipeline.storage.PipelineStorage'
    STATICFILES_FINDERS = (
        'django.contrib.staticfiles.finders.AppDirectoriesFinder',
    )
    if PIPELINE:
        STATIC_ROOT = 'prod-static/serve'
    else:
        STATIC_ROOT = 'static/'
else:
    STATICFILES_STORAGE = 'zerver.storage.ZulipStorage'
    STATICFILES_FINDERS = (
        'zerver.finders.ZulipFinder',
    )
    if PRODUCTION:
        STATIC_ROOT = '/home/zulip/prod-static'
    else:
        STATIC_ROOT = 'prod-static/serve'

# We want all temporary uploaded files to be stored on disk.
FILE_UPLOAD_MAX_MEMORY_SIZE = 0

STATICFILES_DIRS = ['static/']
STATIC_HEADER_FILE = 'zerver/static_header.txt'

# To use minified files in dev, set PIPELINE = True.  For the full
# cache-busting behavior, you must also set DEBUG = False.
#
# You will need to run update-prod-static after changing
# static files.

PIPELINE_CSS = {
    'activity': {
        'source_filenames': ('styles/activity.css',),
        'output_filename':  'min/activity.css'
    },
    'portico': {
        'source_filenames': (
            'third/zocial/zocial.css',
            'styles/portico.css',
            'styles/pygments.css',
            'styles/thirdparty-fonts.css',
            'styles/fonts.css',
        ),
        'output_filename': 'min/portico.css'
    },
    # Two versions of the app CSS exist because of QTBUG-3467
    'app-fontcompat': {
        'source_filenames': (
            'third/bootstrap-notify/css/bootstrap-notify.css',
            'third/spectrum/spectrum.css',
            'styles/zulip.css',
            'styles/pygments.css',
            'styles/thirdparty-fonts.css',
            # We don't want fonts.css on QtWebKit, so its omitted here
        ),
        'output_filename': 'min/app-fontcompat.css'
    },
    'app': {
        'source_filenames': (
            'third/bootstrap-notify/css/bootstrap-notify.css',
            'third/spectrum/spectrum.css',
            'third/jquery-perfect-scrollbar/css/perfect-scrollbar.css',
            'styles/zulip.css',
            'styles/pygments.css',
            'styles/thirdparty-fonts.css',
            'styles/fonts.css',
        ),
        'output_filename': 'min/app.css'
    },
    'common': {
        'source_filenames': (
            'third/bootstrap/css/bootstrap.css',
            'third/bootstrap/css/bootstrap-btn.css',
            'third/bootstrap/css/bootstrap-responsive.css',
        ),
        'output_filename': 'min/common.css'
    },
}

JS_SPECS = {
    'common': {
        'source_filenames': (
            'third/jquery/jquery-1.7.2.js',
            'third/underscore/underscore.js',
            'js/blueslip.js',
            'third/bootstrap/js/bootstrap.js',
            'js/common.js',
            ),
        'output_filename':  'min/common.js'
    },
    'signup': {
        'source_filenames': (
            'js/signup.js',
            'third/jquery-validate/jquery.validate.js',
            ),
        'output_filename':  'min/signup.js'
    },
    'initial_invite': {
        'source_filenames': (
            'third/jquery-validate/jquery.validate.js',
            'js/initial_invite.js',
            ),
        'output_filename':  'min/initial_invite.js'
    },
    'api': {
        'source_filenames': ('js/api.js',),
        'output_filename':  'min/api.js'
    },
    'app_debug': {
        'source_filenames': ('js/debug.js',),
        'output_filename':  'min/app_debug.js'
    },
    'app': {
        'source_filenames': [
            'third/bootstrap-notify/js/bootstrap-notify.js',
            'third/html5-formdata/formdata.js',
            'third/jquery-validate/jquery.validate.js',
            'third/jquery-form/jquery.form.js',
            'third/jquery-filedrop/jquery.filedrop.js',
            'third/jquery-caret/jquery.caret.1.02.js',
            'third/xdate/xdate.dev.js',
            'third/spin/spin.js',
            'third/jquery-mousewheel/jquery.mousewheel.js',
            'third/jquery-throttle-debounce/jquery.ba-throttle-debounce.js',
            'third/jquery-idle/jquery.idle.js',
            'third/jquery-autosize/jquery.autosize.js',
            'third/jquery-perfect-scrollbar/js/perfect-scrollbar.js',
            'third/lazyload/lazyload.js',
            'third/spectrum/spectrum.js',
            'third/winchan/winchan.js',
            'third/sockjs/sockjs-0.3.4.js',
            'third/handlebars/handlebars.runtime.js',
            'third/marked/lib/marked.js',
            'templates/compiled.js',
            'js/feature_flags.js',
            'js/loading.js',
            'js/util.js',
            'js/dict.js',
            'js/localstorage.js',
            'js/channel.js',
            'js/setup.js',
            'js/muting.js',
            'js/muting_ui.js',
            'js/viewport.js',
            'js/rows.js',
            'js/unread.js',
            'js/stream_list.js',
            'js/filter.js',
            'js/narrow.js',
            'js/reload.js',
            'js/compose_fade.js',
            'js/fenced_code.js',
            'js/echo.js',
            'js/socket.js',
            'js/compose.js',
            'js/stream_color.js',
            'js/admin.js',
            'js/stream_data.js',
            'js/subs.js',
            'js/message_edit.js',
            'js/condense.js',
            'js/resize.js',
            'js/floating_recipient_bar.js',
            'js/ui.js',
            'js/click_handlers.js',
            'js/scroll_bar.js',
            'js/gear_menu.js',
            'js/copy_and_paste.js',
            'js/popovers.js',
            'js/typeahead_helper.js',
            'js/search_suggestion.js',
            'js/search.js',
            'js/composebox_typeahead.js',
            'js/navigate.js',
            'js/hotkey.js',
            'js/favicon.js',
            'js/notifications.js',
            'js/hashchange.js',
            'js/invite.js',
            'js/message_list_view.js',
            'js/message_list.js',
            'js/message_flags.js',
            'js/alert_words.js',
            'js/alert_words_ui.js',
            'js/people.js',
            'js/message_store.js',
            'js/server_events.js',
            'js/zulip.js',
            'js/activity.js',
            'js/colorspace.js',
            'js/timerender.js',
            'js/tutorial.js',
            'js/templates.js',
            'js/avatar.js',
            'js/settings.js',
            'js/tab_bar.js',
            'js/emoji.js',
            'js/referral.js',
            'js/custom_markdown.js',
            'js/bot_data.js',
        ],
        'output_filename': 'min/app.js'
    },
    'activity': {
        'source_filenames': (
            'third/sorttable/sorttable.js',
        ),
        'output_filename': 'min/activity.js'
    },
    # We also want to minify sockjs separately for the sockjs iframe transport
    'sockjs': {
        'source_filenames': ('third/sockjs/sockjs-0.3.4.js',),
        'output_filename': 'min/sockjs-0.3.4.min.js'
    },
}

app_srcs = JS_SPECS['app']['source_filenames']

PIPELINE_JS = {}  # Now handled in tools/minify-js
PIPELINE_JS_COMPRESSOR  = None

PIPELINE_CSS_COMPRESSOR = 'pipeline.compressors.yui.YUICompressor'
PIPELINE_YUI_BINARY     = '/usr/bin/env yui-compressor'

########################################################################
# LOGGING SETTINGS
########################################################################

ZULIP_PATHS = [
    ("SERVER_LOG_PATH", "/var/log/zulip/server.log"),
    ("ERROR_FILE_LOG_PATH", "/var/log/zulip/errors.log"),
    ("MANAGEMENT_LOG_PATH", "/var/log/zulip/manage.log"),
    ("WORKER_LOG_PATH", "/var/log/zulip/workers.log"),
    ("PERSISTENT_QUEUE_FILENAME", "/home/zulip/tornado/event_queues.pickle"),
    ("JSON_PERSISTENT_QUEUE_FILENAME", "/home/zulip/tornado/event_queues.json"),
    ("EMAIL_MIRROR_LOG_PATH", "/var/log/zulip/email-mirror.log"),
    ("EMAIL_DELIVERER_LOG_PATH", "/var/log/zulip/email-deliverer.log"),
    ("LDAP_SYNC_LOG_PATH", "/var/log/zulip/sync_ldap_user_data.log"),
    ("QUEUE_ERROR_DIR", "/var/log/zulip/queue_error"),
    ("STATS_DIR", "/home/zulip/stats"),
    ("DIGEST_LOG_PATH", "/var/log/zulip/digest.log"),
    ]

# The Event log basically logs most significant database changes,
# which can be useful for debugging.
if VOYAGER:
    EVENT_LOG_DIR = None
else:
    ZULIP_PATHS.append(("EVENT_LOG_DIR", "/home/zulip/logs/event_log"))

for (var, path) in ZULIP_PATHS:
    if DEVELOPMENT:
        # if DEVELOPMENT, store these files in the Zulip checkout
        path = os.path.basename(path)
    vars()[var] = path

ZULIP_WORKER_TEST_FILE = '/tmp/zulip-worker-test-file'


if IS_WORKER:
    FILE_LOG_PATH = WORKER_LOG_PATH
else:
    FILE_LOG_PATH = SERVER_LOG_PATH

LOGGING = {
    'version': 1,
    'disable_existing_loggers': True,
    'formatters': {
        'default': {
            'format': '%(asctime)s %(levelname)-8s %(message)s'
        }
    },
    'filters': {
        'ZulipLimiter': {
            '()': 'zerver.lib.logging_util.ZulipLimiter',
        },
        'EmailLimiter': {
            '()': 'zerver.lib.logging_util.EmailLimiter',
        },
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        },
        'nop': {
            '()': 'zerver.lib.logging_util.ReturnTrue',
        },
        'require_really_deployed': {
            '()': 'zerver.lib.logging_util.RequireReallyDeployed',
        },
    },
    'handlers': {
        'zulip_admins': {
            'level':     'ERROR',
            'class':     'zerver.handlers.AdminZulipHandler',
            # For testing the handler delete the next line
            'filters':   ['ZulipLimiter', 'require_debug_false', 'require_really_deployed'],
            'formatter': 'default'
        },
        'console': {
            'level':     'DEBUG',
            'class':     'logging.StreamHandler',
            'formatter': 'default'
        },
        'file': {
            'level':       'DEBUG',
            'class':       'logging.handlers.TimedRotatingFileHandler',
            'formatter':   'default',
            'filename':    FILE_LOG_PATH,
            'when':        'D',
            'interval':    7,
            'backupCount': 100000000,
        },
        'errors_file': {
            'level':       'WARNING',
            'class':       'logging.handlers.TimedRotatingFileHandler',
            'formatter':   'default',
            'filename':    ERROR_FILE_LOG_PATH,
            'when':        'D',
            'interval':    7,
            'backupCount': 100000000,
        },
    },
    'loggers': {
        '': {
            'handlers': ['console', 'file', 'errors_file'],
            'level':    'INFO',
            'propagate': False,
        },
        'django': {
            'handlers': (['zulip_admins'] if ERROR_REPORTING else [])
                        + ['console', 'file', 'errors_file'],
            'level':    'INFO',
            'propagate': False,
        },
        'zulip.requests': {
            'handlers': ['console', 'file', 'errors_file'],
            'level':    'INFO',
            'propagate': False,
        },
        'zulip.management': {
            'handlers': ['file', 'errors_file'],
            'level':    'INFO',
            'propagate': False,
        },
        ## Uncomment the following to get all database queries logged to the console
        # 'django.db': {
        #     'handlers': ['console'],
        #     'level': 'DEBUG',
        #     'propagate': False,
        # },
    }
}

TEMPLATE_CONTEXT_PROCESSORS = (
    'zerver.context_processors.add_settings',
    'zerver.context_processors.add_metrics',
)

ACCOUNT_ACTIVATION_DAYS=7

LOGIN_REDIRECT_URL='/'

# Client-side polling timeout for get_events, in milliseconds.
# We configure this here so that the client test suite can override it.
# We already kill the connection server-side with heartbeat events,
# but it's good to have a safety.  This value should be greater than
# (HEARTBEAT_MIN_FREQ_SECS + 10)
POLL_TIMEOUT = 90 * 1000

# iOS App IDs
ZULIP_IOS_APP_ID = 'com.zulip.Zulip'
DBX_IOS_APP_ID = 'com.dropbox.Zulip'

########################################################################
# SSO AND LDAP SETTINGS
########################################################################

USING_APACHE_SSO = ('zproject.backends.ZulipRemoteUserBackend' in AUTHENTICATION_BACKENDS)

if (len(AUTHENTICATION_BACKENDS) == 1 and
    AUTHENTICATION_BACKENDS[0] == "zproject.backends.ZulipRemoteUserBackend"):
    HOME_NOT_LOGGED_IN = "/accounts/login/sso"
    ONLY_SSO = True
else:
    HOME_NOT_LOGGED_IN = '/login'
    ONLY_SSO = False
AUTHENTICATION_BACKENDS += ('guardian.backends.ObjectPermissionBackend',)
AUTHENTICATION_BACKENDS += ('zproject.backends.ZulipDummyBackend',)

POPULATE_PROFILE_VIA_LDAP = bool(AUTH_LDAP_SERVER_URI)

if POPULATE_PROFILE_VIA_LDAP and \
       not 'zproject.backends.ZulipLDAPAuthBackend' in AUTHENTICATION_BACKENDS:
    AUTHENTICATION_BACKENDS += ('zproject.backends.ZulipLDAPUserPopulator',)
else:
    POPULATE_PROFILE_VIA_LDAP = 'zproject.backends.ZulipLDAPAuthBackend' in AUTHENTICATION_BACKENDS or POPULATE_PROFILE_VIA_LDAP

########################################################################
# EMAIL SETTINGS
########################################################################

# If an email host is not specified, fail silently and gracefully
if not EMAIL_HOST and PRODUCTION:
    EMAIL_BACKEND = 'django.core.mail.backends.dummy.EmailBackend'
elif DEVELOPMENT:
    # In the dev environment, emails are printed to the run-dev.py console.
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
else:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'

EMAIL_HOST_PASSWORD = get_secret('email_password')

########################################################################
# MISC SETTINGS
########################################################################

if PRODUCTION:
    # Filter out user data
    DEFAULT_EXCEPTION_REPORTER_FILTER = 'zerver.filters.ZulipExceptionReporterFilter'

# This is a debugging option only
PROFILE_ALL_REQUESTS = False

CROSS_REALM_BOT_EMAILS = set(('feedback@zulip.com', 'notification-bot@zulip.com'))
