#!/bin/bash

if [[ $STAGE = "dev" ]]; then
    echo "uploading assets to test folder"
    s3cmd -P -c /etc/s3config/s3.cfg sync -r /usr/share/nginx/html/ s3://w3champions.wc3.tools/test/site/ --delete-removed
else
echo "uploading assets to prod folder"
    s3cmd -P -c /etc/s3config/s3.cfg sync -r /usr/share/nginx/html/ s3://w3champions.wc3.tools/prod/site/ --delete-removed
fi