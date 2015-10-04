class zulip::voyager {
  include zulip::base
  include zulip::app_frontend
  include zulip::postgres_appdb
  include zulip::redis

  apt::source {'zulip':
    location    => 'http://ppa.launchpad.net/tabbott/zulip/ubuntu',
    release     => 'trusty',
    repos       => 'main',
    key         => '84C2BE60E50E336456E4749CE84240474E26AE47',
    key_source  => 'https://zulip.com/dist/keys/zulip.asc',
    pin         => '995',
    include_src => true,
  }

  file { "/etc/nginx/sites-available/zulip-enterprise":
    require => Package["nginx-full"],
    ensure => file,
    owner  => "root",
    group  => "root",
    mode => 644,
    source => "puppet:///modules/zulip/nginx/sites-available/zulip-enterprise",
    notify => Service["nginx"],
  }
  file { '/etc/nginx/sites-enabled/zulip-enterprise':
    require => Package["nginx-full"],
    ensure => 'link',
    target => '/etc/nginx/sites-available/zulip-enterprise',
    notify => Service["nginx"],
  }

  file { '/home/zulip/prod-static':
    ensure => 'directory',
    owner  => 'zulip',
    group  => 'zulip',
  }

  file { "/etc/cron.d/restart-zulip":
    ensure => file,
    owner  => "root",
    group  => "root",
    mode => 644,
    source => "puppet:///modules/zulip/cron.d/restart-zulip",
  }

  file { '/etc/postgresql/9.3/main/postgresql.conf.template':
    require => Package["postgresql-9.3"],
    ensure => file,
    owner  => "postgres",
    group  => "postgres",
    mode   => 644,
    source => "puppet:///modules/zulip/postgresql/postgresql.conf.template"
  }

  # We can't use the built-in $memorysize fact because it's a string with human-readable units
  $total_memory = regsubst(file('/proc/meminfo'), '^.*MemTotal:\s*(\d+) kB.*$', '\1', 'M') * 1024
  $half_memory = $total_memory / 2
  $half_memory_pages = $half_memory / 4096

  file {'/etc/sysctl.d/40-postgresql.conf':
    ensure => file,
    owner  => 'root',
    group  => 'root',
    mode   => 644,
    content =>
"kernel.shmall = $half_memory_pages
kernel.shmmax = $half_memory

# These are the defaults on newer kernels
vm.dirty_ratio = 10
vm.dirty_background_ratio = 5
"
    }

  exec { "sysctl_p":
    command   => "/sbin/sysctl -p /etc/sysctl.d/40-postgresql.conf",
    subscribe => File['/etc/sysctl.d/40-postgresql.conf'],
    refreshonly => true,
  }

  exec { 'pgtune':
    require => Package["pgtune"],
    # Let Postgres use half the memory on the machine
    command => "pgtune -T Web -M $half_memory -i /etc/postgresql/9.3/main/postgresql.conf.template -o /etc/postgresql/9.3/main/postgresql.conf",
    refreshonly => true,
    subscribe => File['/etc/postgresql/9.3/main/postgresql.conf.template']
  }

  exec { 'pg_ctlcluster 9.3 main restart':
    require => Exec["sysctl_p"],
    refreshonly => true,
    subscribe => [ Exec['pgtune'], File['/etc/sysctl.d/40-postgresql.conf'] ]
  }
}
