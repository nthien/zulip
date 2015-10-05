class zulip_internal::git {
  include zulip_internal::base

  $git_packages = [ ]
  package { $git_packages: ensure => "installed" }

  file { '/home/git/repositories/eng/zulip.git/hooks':
    ensure => 'directory',
    owner  => 'git',
    group  => 'git',
    mode   => 755,
  }

  file { '/home/git/repositories/eng/zulip.git/hooks/post-receive':
    ensure => 'link',
    target => '/home/zulip/zulip/tools/post-receive',
  }
}
