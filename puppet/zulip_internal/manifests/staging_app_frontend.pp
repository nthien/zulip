class zulip_internal::staging_app_frontend {
  include zulip_internal::base
  include zulip_internal::app_frontend

  file { "/etc/nginx/sites-available/zulip-staging":
    require => Package["nginx-full"],
    ensure => file,
    owner  => "root",
    group  => "root",
    mode => 644,
    source => "puppet:///modules/zulip_internal/nginx/sites-available/zulip-staging",
    notify => Service["nginx"],
  }
  file { '/etc/nginx/sites-enabled/zulip-staging':
    require => Package["nginx-full"],
    ensure => 'link',
    target => '/etc/nginx/sites-available/zulip-staging',
    notify => Service["nginx"],
  }
  file { "/etc/cron.d/active-user-stats":
    ensure => file,
    owner  => "root",
    group  => "root",
    mode => 644,
    source => "puppet:///modules/zulip_internal/cron.d/active-user-stats",
  }
  file { "/etc/cron.d/clearsessions":
    ensure => file,
    owner  => "root",
    group  => "root",
    mode => 644,
    source => "puppet:///modules/zulip_internal/cron.d/clearsessions",
  }

  # Staging has our Apple Push Notifications Service private key at
  # /etc/ssl/django-private/apns-dev.pem
}
