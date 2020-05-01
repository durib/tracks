#!/bin/bash

aws s3 cp ./ s3://duri.rocks/maps/tracks/ \
    --recursive \
    --acl public-read \
    --exclude "*" \
    --include "index.html" \
    --include "js/*.js" \
    --include "css/*.css" \
    --include "data/*.geojson" \
    