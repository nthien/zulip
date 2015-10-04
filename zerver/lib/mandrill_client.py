import mandrill
from django.conf import settings

MAIL_CLIENT = None

def get_mandrill_client():
    if settings.MANDRILL_API_KEY == '' or settings.DEVELOPMENT or settings.VOYAGER:
        return None

    global MAIL_CLIENT
    if not MAIL_CLIENT:
        MAIL_CLIENT = mandrill.Mandrill(settings.MANDRILL_API_KEY)

    return MAIL_CLIENT

