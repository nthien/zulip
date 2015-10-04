from __future__ import absolute_import

import re
from django.contrib.staticfiles.finders import FileSystemFinder

class ExcludeUnminifiedMixin(object):
    """ Excludes unminified copies of our JavaScript code, templates
    and stylesheets, so that these sources don't end up getting served
    in production. """

    def list(self, ignore_patterns):
        # We can't use ignore_patterns because the patterns are
        # applied to just the file part, not the entire path
        excluded = '^(js|styles|templates)/'

        # source-map/ should also not be included.
        # However, we work around that by moving it later,
        # in update-prod-static.

        super_class = super(ExcludeUnminifiedMixin, self)
        for path, storage in super_class.list(ignore_patterns):
            if not re.search(excluded, path):
                yield path, storage

class ZulipFinder(ExcludeUnminifiedMixin, FileSystemFinder):
    pass
