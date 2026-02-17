current_hash=$(git rev-parse --short HEAD 2> /dev/null | sed "s/\(.*\)/\1/")
current_repository="$(git config --get remote.origin.url | sed -e 's/\.git$//g')/commit/$(git rev-parse HEAD)"
export REPOSITORY_URL=$current_repository
export COMMIT_REF=$current_hash

npx @11ty/eleventy --serve --quiet