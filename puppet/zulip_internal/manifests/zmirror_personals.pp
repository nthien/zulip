class zulip_internal::zmirror_personals {
  include zulip_internal::base
  include zulip::supervisor

  $zmirror_packages = [# Packages needed to run the mirror
                       "libzephyr4-krb5",
                       "zephyr-clients",
                       "krb5-config",
                       "krb5-user",
                       "krb5-clients",
                       "debathena-kerberos-config",
                       "debathena-zephyr-config",
                       # Packages needed to build pyzephyr
                       "libzephyr-dev",
                       "comerr-dev",
                       "python-dev",
                       "cython",
                       ]
  package { $zmirror_packages: ensure => "installed" }

  apt::source {'debathena':
    location    => 'http://debathena.mit.edu/apt',
    release     => 'wheezy',
    repos       => 'debathena debathena-config',
    key         => 'D1CD49BDD30B677273A75C66E4EE62700D8A9E8F',
    key_source  => 'https://debathena.mit.edu/apt/debathena-archive.asc',
    include_src => true,
  }
  file { ['/home/zulip/api-keys', '/home/zulip/zephyr_sessions', '/home/zulip/ccache',
          '/home/zulip/mirror_status']:
    ensure     => directory,
    mode       => 644,
    owner      => "zulip",
    group      => "zulip",
  }

  file { "/etc/cron.d/test_zephyr_personal_mirrors":
    ensure => file,
    owner  => "root",
    group  => "root",
    mode => 644,
    source => "puppet:///modules/zulip_internal/cron.d/test_zephyr_personal_mirrors",
  }

  # TODO: Do the rest of our setup, which includes at least:
  # Building patched libzephyr4-krb5 from davidben's roost branch and installing that
  #  (to add ZLoadSession/ZDumpSession).
  # Building python-zephyr after cloning it from https://github.com/ebroder/python-zephyr
  #  (patched with tabbott's branch to add dump_session and load_session using the above)
}
