aws s3 cp ../ s3://duri.rocks/maps/tracks/ --recursive --acl public-read --exclude "working/*" --exclude ".*" --exclude "*.bat" --exclude "*.sh" --exclude "*.md" --exclude "LICENSE"