#!/bin/bash

echo "[default]"  >> /etc/s3config/s3.cfg
echo "host_base = eu-central-1.linodeobjects.com"  >> /etc/s3config/s3.cfg
echo "host_bucket = %(bucket)s.eu-central-1.linodeobjects.com"  >> /etc/s3config/s3.cfg
echo "access_key =  $S3_ACESS_KEY"  >> /etc/s3config/s3.cfg
echo "secret_key =  $S3_SECRET_KEY"  >> /etc/s3config/s3.cfg