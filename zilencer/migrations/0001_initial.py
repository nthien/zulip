# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('zerver', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Deployment',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('is_active', models.BooleanField(default=True)),
                ('api_key', models.CharField(max_length=32, null=True)),
                ('base_api_url', models.CharField(max_length=128)),
                ('base_site_url', models.CharField(max_length=128)),
                ('realms', models.ManyToManyField(related_name=b'_deployments', to='zerver.Realm')),
            ],
            options={
            },
            bases=(models.Model,),
        ),
    ]
