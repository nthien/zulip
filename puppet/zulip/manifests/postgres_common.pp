class zulip::postgres_common {
  $postgres_packages = [# The database itself
                        "postgresql-9.3",
                        # tools for database setup
                        "pgtune",
                        # tools for database monitoring
                        "ptop",
                        # Python modules used in our monitoring/worker threads
                        "python-gevent",
                        "python-tz",
                        "python-dateutil",
                        # our dictionary
                        "hunspell-en-us",
                        ]
  define safepackage ( $ensure = present ) {
    if !defined(Package[$title]) {
      package { $title: ensure => $ensure }
    }
  }
  safepackage { $postgres_packages: ensure => "installed" }

  exec { "disable_logrotate":
    command => "/usr/bin/dpkg-divert --rename --divert /etc/logrotate.d/postgresql-common.disabled --add /etc/logrotate.d/postgresql-common",
    creates => '/etc/logrotate.d/postgresql-common.disabled',
  }
}
